"use client";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GATE_Z, ROAD_X, ROAD_Y } from "@/lib/journeyLayout";
import { IshtarGateDoors } from "@/components/world/IshtarGateDoors";

export function IshtarGateModel() {
  const { scene } = useGLTF("/models/ishtar-gate.glb");
  const gl = useThree((state) => state.gl);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const materials = new Map<THREE.Material, THREE.Material>();
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      const prepare = (source: THREE.Material) => {
        if (!materials.has(source)) {
          const material = source.clone();
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = 0;
            material.roughness = 0.62;
            if (material.map) material.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
          }
          materials.set(source, material);
        }
        return materials.get(source)!;
      };
      object.material = Array.isArray(object.material) ? object.material.map(prepare) : prepare(object.material);
    });
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const scale = 27.2 / (box.max.y - box.min.y);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    // Preserve the model's authored root matrix and orientation.
    wrapper.position.set(-(box.min.x + box.max.x) / 2 * scale, -box.min.y * scale, -box.max.z * scale);
    wrapper.scale.setScalar(scale);
    return { wrapper, materials: [...materials.values()] };
  }, [gl, scene]);

  useEffect(() => () => model.materials.forEach((material) => material.dispose()), [model]);
  return (
    <group position={[ROAD_X, ROAD_Y - 0.05, GATE_Z]}>
      <primitive object={model.wrapper} dispose={null} />
      <IshtarGateDoors />
    </group>
  );
}
