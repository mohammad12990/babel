import * as THREE from "three";
import { SUN_DIRECTION } from "@/lib/journeyLayout";

// Linear-light colors shared by the visible sky and the river's fallback.
export const HORIZON_COLOR = "#c3c7c8";
export const SKY_ROTATION = 2 * Math.PI * (0.61 - 0.5) - Math.atan2(SUN_DIRECTION.z, SUN_DIRECTION.x);
export function atmosphereUniforms() {
  return {
    uTime: { value: 0 },
    uSkyMap: { value: null as THREE.Texture | null },
    uSkyRotation: { value: SKY_ROTATION },
    uSunColor: { value: new THREE.Color("#ffe0ac") },
    uSunDirection: { value: SUN_DIRECTION.clone() },
  };
}

export const atmosphereGLSL = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uSkyMap;
  uniform float uSkyRotation;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;

  float skyHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float skyNoise(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(skyHash(cell), skyHash(cell + vec2(1, 0)), f.x),
      mix(skyHash(cell + vec2(0, 1)), skyHash(cell + vec2(1, 1)), f.x), f.y);
  }

  vec3 skyRadiance(vec3 direction) {
    float longitude = atan(direction.z, direction.x) + uSkyRotation;
    vec2 skyUv = vec2(fract(longitude / 6.28318530718 + 0.5),
      asin(clamp(direction.y, -1.0, 1.0)) / 3.14159265359 + 0.5);
    return texture2D(uSkyMap, skyUv).rgb * 0.78;
  }

  vec3 skyGradient(vec3 direction) {
    return skyRadiance(direction);
  }
`;
