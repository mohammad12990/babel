"use client";

import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { atmosphereGLSL, atmosphereUniforms } from "./atmosphereShader";

export function useBabylonSkyTexture() {
  const compact = useThree((state) => state.size.width < 700);
  const texture = useTexture(`/textures/babylon-sky-${compact ? 2048 : 4096}.webp`);
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

export function BabylonSky() {
  const skyTexture = useBabylonSkyTexture();
  const material = useMemo(() => new THREE.ShaderMaterial({
    name: "Babylon morning atmosphere",
    uniforms: { ...atmosphereUniforms(), uSkyMap: { value: skyTexture } },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        // Direction-only projection: no sky parallax as either camera moves.
        vec4 clip = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
        gl_Position = clip.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDirection;
      ${atmosphereGLSL}
      void main() {
        gl_FragColor = vec4(skyRadiance(normalize(vDirection)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
  }), [skyTexture]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 24]} />
    </mesh>
  );
}
