import * as THREE from "three";

// World-space sediment avoids stretching wall-brick UVs over the bank.
export function makeGroundMaterial(wet = false) {
  const material = new THREE.MeshStandardMaterial({
    color: wet ? "#675647" : "#b49b76",
    roughness: wet ? 0.72 : 1,
    vertexColors: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vGroundWorld;\n${shader.vertexShader}`
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGroundWorld = (modelMatrix * vec4(position, 1.0)).xyz;");
    shader.fragmentShader = `varying vec3 vGroundWorld;
      float groundHash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float groundNoise(vec2 p) {
        vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(groundHash(i),groundHash(i+vec2(1,0)),f.x),mix(groundHash(i+vec2(0,1)),groundHash(i+vec2(1,1)),f.x),f.y);
      }
      ${shader.fragmentShader}`.replace("#include <color_fragment>", `#include <color_fragment>
        float patches = groundNoise(vGroundWorld.xz * 0.14) * 0.6 + groundNoise(vGroundWorld.xz * 0.69) * 0.4;
        float grain = groundNoise(vGroundWorld.xz * 11.0);
        float grainFade = 1.0 - smoothstep(0.03, 0.3, length(fwidth(vGroundWorld.xz)));
        diffuseColor.rgb *= 0.82 + patches * 0.28 + (grain - 0.5) * 0.1 * grainFade;
      `);
  };
  material.customProgramCacheKey = () => "babylon-sediment-v1";
  return material;
}
