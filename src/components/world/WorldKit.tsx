"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const seeded = (seed: number) => {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
};

export function AtmosphericDust({
  count = 180,
  spread: [sx, sy, sz] = [70, 24, 90],
  position = [0, 10, -35] as [number, number, number],
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      points[i * 3] = (seeded(i + 11) - 0.5) * sx;
      points[i * 3 + 1] = seeded(i + 71) * sy;
      points[i * 3 + 2] = (seeded(i + 131) - 0.5) * sz;
    }
    return points;
  }, [count, sx, sy, sz]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f1d6aa"
        size={0.065}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Water({
  position = [0, 0, 0] as [number, number, number],
  size = [26, 180] as [number, number],
  rotation = 0,
}) {
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.emissiveIntensity = 0.055 + Math.sin(clock.elapsedTime * 0.55) * 0.012;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, rotation]} position={position}>
      <planeGeometry args={size} />
      <meshPhysicalMaterial
        ref={material}
        color="#173f56"
        emissive="#102b42"
        roughness={0.18}
        metalness={0.04}
        clearcoat={0.8}
        clearcoatRoughness={0.16}
      />
    </mesh>
  );
}

export function InstancedPalms({
  count = 24,
  area = [60, 90] as [number, number],
  center = [0, 0, -25] as [number, number, number],
}) {
  const group = useRef<THREE.Group>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crownsA = useRef<THREE.InstancedMesh>(null);
  const crownsB = useRef<THREE.InstancedMesh>(null);
  const transforms = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const side = i % 2 ? -1 : 1;
        const scale = 0.72 + seeded(i + 207) * 0.62;
        return {
          x: center[0] + side * (area[0] * 0.2 + seeded(i + 17) * area[0] * 0.3),
          z: center[2] + (seeded(i + 87) - 0.5) * area[1],
          scale,
          twist: seeded(i + 144) * Math.PI,
        };
      }),
    [area, center, count]
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    transforms.forEach((item, index) => {
      if (trunks.current) {
        dummy.position.set(item.x, 3.25 * item.scale, item.z);
        dummy.rotation.set(0, item.twist, (seeded(index + 300) - 0.5) * 0.045);
        dummy.scale.set(item.scale, item.scale, item.scale);
        dummy.updateMatrix();
        trunks.current.setMatrixAt(index, dummy.matrix);
        trunks.current.setColorAt(index, new THREE.Color(index % 3 === 0 ? "#6f4528" : "#52331f"));
      }
      const crownY = 6.48 * item.scale;
      if (crownsA.current) {
        dummy.position.set(item.x, crownY, item.z);
        dummy.rotation.set(0, item.twist, 0);
        dummy.scale.set(2.8 * item.scale, 0.42 * item.scale, 2.25 * item.scale);
        dummy.updateMatrix();
        crownsA.current.setMatrixAt(index, dummy.matrix);
        crownsA.current.setColorAt(index, new THREE.Color(index % 4 === 0 ? "#4c673f" : "#304d34"));
      }
      if (crownsB.current) {
        dummy.position.set(item.x, crownY - 0.28, item.z);
        dummy.rotation.set(0, item.twist + Math.PI / 2, Math.PI);
        dummy.scale.set(2.5 * item.scale, 0.36 * item.scale, 2.75 * item.scale);
        dummy.updateMatrix();
        crownsB.current.setMatrixAt(index, dummy.matrix);
        crownsB.current.setColorAt(index, new THREE.Color(index % 5 === 0 ? "#6f7943" : "#3c5b37"));
      }
    });
    [trunks, crownsA, crownsB].forEach((mesh) => {
      if (!mesh.current) return;
      mesh.current.instanceMatrix.needsUpdate = true;
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });
  }, [transforms]);

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.0018;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.15, 0.28, 6.5, 7]} />
        <meshStandardMaterial vertexColors roughness={0.98} />
      </instancedMesh>
      <instancedMesh ref={crownsA} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[1, 1.25, 9]} />
        <meshStandardMaterial vertexColors roughness={0.92} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={crownsB} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[1, 1.1, 9]} />
        <meshStandardMaterial vertexColors roughness={0.92} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

export function LightweightCrowd({ count = 28, length = 85 }: { count?: number; length?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const transforms = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i % 2 ? -1 : 1) * (1.6 + seeded(i + 32) * 2.5),
        z: -5 - seeded(i + 94) * length,
        scale: 0.75 + seeded(i + 151) * 0.45,
      })),
    [count, length]
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    transforms.forEach((item, index) => {
      if (!ref.current) return;
      dummy.position.set(item.x, 1.05 * item.scale, item.z);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(index, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.22, 1.15, 3, 6]} />
      <meshStandardMaterial color="#c8ad82" roughness={1} />
    </instancedMesh>
  );
}

export function Crenellations({
  width = 16,
  y = 14,
  z = 0,
  color = "#173f78",
}: {
  width?: number;
  y?: number;
  z?: number;
  color?: string;
}) {
  const count = Math.floor(width / 1.5);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 0.75 + i * 1.5, y, z]}>
          <boxGeometry args={[0.8, 1.1, 3.8]} />
          <meshStandardMaterial color={color} roughness={0.48} />
        </mesh>
      ))}
    </group>
  );
}

export function ReliefMotifs({ width = 10, y = 5, z = 2.08 }: { width?: number; y?: number; z?: number }) {
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 1 + i * (width / 5), y + (i % 2) * 1.6, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.1, 5, 8]} />
          <meshStandardMaterial color="#c9a227" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}
