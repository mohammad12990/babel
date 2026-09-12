"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { WATER_Y, riverCenterAt, riverHalfWidthAt } from "@/lib/journeyLayout";
import { atmosphereGLSL, atmosphereUniforms } from "./atmosphereShader";
import { useBabylonSkyTexture } from "./BabylonSky";

function makeRiverGeometry() {
  const rows = 256, columns = 24;
  const positions: number[] = [], shores: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const z = THREE.MathUtils.lerp(170, -420, row / rows);
    const center = riverCenterAt(z), halfWidth = riverHalfWidthAt(z);
    for (let column = 0; column <= columns; column++) {
      const across = column / columns;
      // Reflector expects a local XY plane; rotate the mesh into world XZ.
      positions.push(center + (across * 2 - 1) * halfWidth, -z, 0);
      shores.push(Math.min(across, 1 - across) * halfWidth * 2);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column, b = a + columns + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("shoreDistance", new THREE.Float32BufferAttribute(shores, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  uniform float uTime;
  uniform mat4 textureMatrix;
  attribute float shoreDistance;
  varying vec3 vWorldPosition;
  varying vec4 vReflectionCoord;
  varying float vShoreDistance;
  void main() {
    vec3 displaced = position;
    vec2 worldXZ = vec2(position.x, -position.y);
    float shoreDamping = smoothstep(0.0, 1.8, shoreDistance);
    // Only long waves displace vertices; small ripples are shaded per pixel.
    displaced.z += (sin(worldXZ.y * 0.24 - uTime * 0.65) * 0.024
      + sin(dot(worldXZ, vec2(0.4, 0.1)) + uTime * 0.48) * 0.018) * shoreDamping;
    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
    vReflectionCoord = textureMatrix * vec4(displaced, 1.0);
    vShoreDistance = shoreDistance;
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  ${atmosphereGLSL}
  uniform sampler2D tDiffuse;
  uniform float uReflectionReady;
  uniform vec3 uDeepWater;
  uniform vec3 uShallowWater;
  varying vec3 vWorldPosition;
  varying vec4 vReflectionCoord;
  varying float vShoreDistance;

  vec2 waveSlope(vec2 p, vec2 direction, float frequency, float amplitude, float speed, float footprint) {
    float phase = dot(p, direction) * frequency + uTime * speed;
    // Fade subpixel wave frequencies, preventing distant shimmer and moire.
    float filtering = 1.0 - smoothstep(0.65, 2.6, footprint * frequency);
    return direction * cos(phase) * amplitude * frequency * filtering;
  }

  void main() {
    vec2 p = vWorldPosition.xz;
    float footprint = max(length(dFdx(p)), length(dFdy(p)));
    float modulation = skyNoise(p * vec2(0.18, 0.09) + vec2(0.0, -uTime * 0.045));
    p += vec2(modulation * 0.7, skyNoise(p * 0.12 + 9.0) * 0.6);
    vec2 slope = waveSlope(p, vec2(0.22, 0.975), 0.75, 0.030, -0.62, footprint);
    slope += waveSlope(p, vec2(-0.8, 0.6), 1.8, 0.020, 0.83, footprint);
    slope += waveSlope(p, vec2(0.62, 0.785), 4.7, 0.012, -1.12, footprint);
    slope += waveSlope(p, vec2(-0.35, 0.937), 9.4, 0.006, -1.46, footprint);
    slope += waveSlope(p, vec2(0.91, 0.415), 17.8, 0.002, 1.74, footprint);
    slope *= mix(0.35, 1.0, smoothstep(0.0, 1.4, vShoreDistance));
    vec3 normal = normalize(vec3(-slope.x, 1.0, -slope.y));
    vec3 toEye = cameraPosition - vWorldPosition;
    vec3 viewDirection = normalize(toEye);
    float eyeDistance = length(toEye);
    float fresnel = 0.025 + 0.975 * pow(1.0 - max(dot(normal, viewDirection), 0.0), 5.0);

    vec2 projected = vReflectionCoord.xy / max(vReflectionCoord.w, 0.0001);
    vec2 distortion = normal.xz * (0.009 + 0.06 / max(eyeDistance, 4.0));
    vec2 reflectionUv = projected + distortion;
    vec3 reflected = texture2D(tDiffuse, clamp(reflectionUv, 0.002, 0.998)).rgb;
    float edge = min(min(reflectionUv.x, 1.0 - reflectionUv.x), min(reflectionUv.y, 1.0 - reflectionUv.y));
    float valid = smoothstep(0.0, 0.04, edge) * step(0.0, vReflectionCoord.w) * uReflectionReady;
    vec3 reflection = mix(skyGradient(reflect(-viewDirection, normal)), reflected, valid);

    float depth = smoothstep(0.1, 3.8, vShoreDistance);
    vec3 body = mix(uShallowWater, uDeepWater, depth);
    body *= 0.94 + modulation * 0.12;
    // Turbid river water: darker depth, earthy shallows, clear grazing reflections.
    vec3 color = mix(body, reflection, 0.13 + fresnel * 0.82);
    float sunlight = max(dot(reflect(-uSunDirection, normal), viewDirection), 0.0);
    float glint = pow(sunlight, 180.0) * 0.7 + pow(sunlight, 32.0) * 0.035;
    color += uSunColor * glint * (0.7 + modulation * 0.3);
    float shoreline = (1.0 - smoothstep(0.03, 0.32, vShoreDistance));
    color = mix(color, body * 0.86, shoreline * 0.36);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    // Three supplies fogColor in the current output space, as for the banks.
    #include <fog_fragment>
  }
`;

export function River() {
  const skyTexture = useBabylonSkyTexture();
  const gl = useThree((state) => state.gl);
  const compact = useThree((state) => state.size.width < 700);
  const river = useMemo(() => {
    const geometry = makeRiverGeometry();
    const reflector = new Reflector(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      multisample: 0,
      clipBias: 0.002,
      shader: {
        name: "Euphrates water",
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          ...atmosphereUniforms(),
          uSkyMap: { value: skyTexture },
          color: { value: new THREE.Color() },
          tDiffuse: { value: null },
          textureMatrix: { value: new THREE.Matrix4() },
          uReflectionReady: { value: 0 },
          uDeepWater: { value: new THREE.Color("#365c54") },
          uShallowWater: { value: new THREE.Color("#828269") },
        },
        vertexShader,
        fragmentShader,
      },
    });
    reflector.name = "Euphrates river";
    reflector.position.y = WATER_Y;
    reflector.rotation.x = -Math.PI / 2;
    const material = reflector.material as THREE.ShaderMaterial;
    material.fog = true;
    if (!gl.extensions.has("EXT_color_buffer_float")) {
      reflector.getRenderTarget().texture.type = THREE.UnsignedByteType;
    }
    const capture = reflector.onBeforeRender.bind(reflector);
    const lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
    const lastRotation = new THREE.Quaternion();
    let lastCaptureTime = -1;
    reflector.onBeforeRender = (renderer, scene, camera, ...rest) => {
      // Preserve mapping during movement; reuse the reflection when at rest.
      const now = material.uniforms.uTime.value as number;
      const moved = lastPosition.distanceToSquared(camera.position) > 0.0001
        || lastRotation.angleTo(camera.quaternion) > 0.001;
      if (!moved && now - lastCaptureTime < 1 / 24) return;
      capture(renderer, scene, camera, ...rest);
      material.uniforms.uReflectionReady.value = 1;
      lastPosition.copy(camera.position);
      lastRotation.copy(camera.quaternion);
      lastCaptureTime = now;
    };
    return reflector;
  }, [gl, skyTexture]);

  useEffect(() => {
    const target = river.getRenderTarget();
    target.setSize(compact ? 512 : 768, compact ? 512 : 768);
  }, [compact, river]);
  useFrame(({ clock }) => {
    (river.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });
  useEffect(() => () => { river.geometry.dispose(); river.dispose(); }, [river]);

  return <primitive object={river} dispose={null} />;
}
