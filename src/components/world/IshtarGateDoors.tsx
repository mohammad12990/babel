"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useJourneyMotion } from "@/components/JourneyMotion";
import { getGateEntryProgress } from "@/lib/journeyTimeline";
import { GATE_DOOR_HALF_WIDTH, GATE_DOOR_Z, GATE_Z, gateOpeningAt } from "@/lib/journeyLayout";

function makeLeaf(side: number) {
  const width = GATE_DOOR_HALF_WIDTH - 0.015;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.04);
  shape.lineTo(-side * width, 0.04);
  // A curved timber crown fits beneath the supplied arch. This animated
  // reconstruction is an added asset; the user's GLB is never modified.
  for (let i = 20; i >= 0; i--) {
    const u = width * i / 20;
    const x = GATE_DOOR_HALF_WIDTH - u;
    const y = 11 + Math.sqrt(Math.max(0, GATE_DOOR_HALF_WIDTH ** 2 - x ** 2));
    shape.lineTo(-side * u, y);
  }
  shape.closePath();
  const wood = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 1, steps: 1 });
  wood.translate(0, 0, -0.12);

  const fittings: THREE.BufferGeometry[] = [];
  for (const y of [1.4, 3.6, 6.1, 8.6, 10.1]) {
    // Bronze bands on both faces remain visible after the gate swings open.
    for (const face of [-1, 1]) {
      fittings.push(new THREE.BoxGeometry(width - 0.06, 0.17, 0.075).translate(-side * width / 2, y, face * 0.17));
      for (let i = 0; i < 6; i++) {
        fittings.push(new THREE.SphereGeometry(0.054, 6, 4).translate(-side * (0.16 + (width - 0.32) * i / 5), y, face * 0.22));
      }
    }
  }
  for (const y of [1.4, 6.1, 10.1]) {
    fittings.push(new THREE.CylinderGeometry(0.12, 0.12, 0.54, 10).translate(0, y, 0));
  }
  fittings.push(new THREE.TorusGeometry(0.24, 0.043, 6, 18).translate(-side * (width - 0.53), 5.05, 0.27));
  const metal = mergeGeometries(fittings)!;
  fittings.forEach((geometry) => geometry.dispose());
  return { wood, metal };
}

function DoorLeaf({ side, woodMaterial, bronzeMaterial }: {
  side: number;
  woodMaterial: THREE.MeshStandardMaterial;
  bronzeMaterial: THREE.MeshStandardMaterial;
}) {
  const pivot = useRef<THREE.Group>(null);
  const progress = useJourneyMotion();
  const geometry = useMemo(() => makeLeaf(side), [side]);
  useEffect(() => () => { geometry.wood.dispose(); geometry.metal.dispose(); }, [geometry]);
  useFrame(() => {
    if (pivot.current) pivot.current.rotation.y = side * Math.PI / 2 * gateOpeningAt(getGateEntryProgress(progress.current));
  });
  return (
    <group ref={pivot} position={[side * GATE_DOOR_HALF_WIDTH, 0, GATE_DOOR_Z - GATE_Z]}>
      <mesh geometry={geometry.wood} material={woodMaterial} castShadow receiveShadow />
      <mesh geometry={geometry.metal} material={bronzeMaterial} castShadow receiveShadow />
    </group>
  );
}

export function IshtarGateDoors() {
  const materials = useMemo(() => {
    const wood = new THREE.MeshStandardMaterial({ color: "#68482e", roughness: 0.87 });
    // Subtle grain and board seams without extra textures or separate meshes.
    wood.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vTimberPosition;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTimberPosition = position;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vTimberPosition;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float across = abs(vTimberPosition.x) * 2.0;
          float edge = min(fract(across), 1.0 - fract(across));
          float seam = smoothstep(0.007, max(0.018, fwidth(across) * 1.2), edge);
          float grain = sin(vTimberPosition.x * 75.0 + sin(vTimberPosition.y * 0.72) * 2.1);
          float grainFade = 1.0 - smoothstep(0.2, 1.1, fwidth(vTimberPosition.x * 75.0));
          float board = 0.91 + 0.1 * fract(sin(floor(across) * 12.9898) * 43758.5453);
          diffuseColor.rgb *= (0.77 + 0.23 * seam) * board * (1.0 + grain * grainFade * 0.045);
        `);
    };
    wood.customProgramCacheKey = () => "ishtar-timber-v1";
    const bronze = new THREE.MeshStandardMaterial({ color: "#8f794b", roughness: 0.6, metalness: 0.58 });
    return { wood, bronze };
  }, []);
  useEffect(() => () => { materials.wood.dispose(); materials.bronze.dispose(); }, [materials]);
  return <group>{[-1, 1].map((side) => <DoorLeaf key={side} side={side} woodMaterial={materials.wood} bronzeMaterial={materials.bronze} />)}</group>;
}
