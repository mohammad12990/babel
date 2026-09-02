"use client";

import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AtmosphericDust, InstancedPalms } from "@/components/world/WorldKit";

const seeded = (seed: number) => {
  const value = Math.sin(seed * 713.73) * 43758.5453;
  return value - Math.floor(value);
};

function RiverSurface() {
  const geometry = useRef<THREE.PlaneGeometry>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const basePositions = useRef<Float32Array | null>(null);

  useFrame(({ clock }) => {
    if (!geometry.current) return;
    const attribute = geometry.current.attributes.position as THREE.BufferAttribute;
    if (!basePositions.current) basePositions.current = new Float32Array(attribute.array as Float32Array);
    const base = basePositions.current;
    for (let i = 0; i < attribute.count; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const ripple =
        Math.sin(y * 0.23 + clock.elapsedTime * 0.62) * 0.032 +
        Math.sin(x * 0.9 - clock.elapsedTime * 0.4) * 0.018;
      attribute.setZ(i, ripple);
    }
    attribute.needsUpdate = true;
    geometry.current.computeVertexNormals();
    if (material.current) {
      material.current.emissiveIntensity = 0.055 + Math.sin(clock.elapsedTime * 0.45) * 0.01;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -35]} receiveShadow>
      <planeGeometry ref={geometry} args={[22, 210, 24, 150]} />
      <meshPhysicalMaterial
        ref={material}
        color="#174761"
        emissive="#102f47"
        roughness={0.16}
        metalness={0.03}
        clearcoat={0.92}
        clearcoatRoughness={0.12}
        envMapIntensity={1.25}
      />
    </mesh>
  );
}

function RiverBoat({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.58 + position[2]) * 0.045;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.42 + position[0]) * 0.014;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh scale={[1.9, 0.22, 3.7]} castShadow>
        <sphereGeometry args={[1, 18, 10]} />
        <meshStandardMaterial color="#2f1d14" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 3.15, 7]} />
        <meshStandardMaterial color="#3a2518" roughness={1} />
      </mesh>
      <mesh position={[0.54, 1.46, 0]} rotation={[0, 0, -0.15]} castShadow>
        <planeGeometry args={[1.15, 2.5]} />
        <meshStandardMaterial color="#d2bc8e" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function InstancedReeds({ side }: { side: -1 | 1 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const reeds = useMemo(
    () =>
      Array.from({ length: 110 }, (_, index) => ({
        x: side * (11.3 + seeded(index + side * 17) * 5.8),
        z: 45 - seeded(index + 222 + side) * 155,
        height: 0.65 + seeded(index + 467) * 1.55,
        lean: (seeded(index + 681) - 0.5) * 0.12,
      })),
    [side]
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    reeds.forEach((reed, index) => {
      if (!ref.current) return;
      dummy.position.set(reed.x, reed.height / 2, reed.z);
      dummy.rotation.set(0, seeded(index + 909) * Math.PI, reed.lean);
      dummy.scale.set(1, reed.height, 1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(index, dummy.matrix);
      ref.current.setColorAt(index, new THREE.Color(index % 5 === 0 ? "#9a813f" : "#5f6d3d"));
    });
    if (!ref.current) return;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [reeds]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, reeds.length]}>
      <cylinderGeometry args={[0.018, 0.04, 1, 5]} />
      <meshStandardMaterial vertexColors roughness={1} />
    </instancedMesh>
  );
}

function BabylonHorizon() {
  const towers = [-45, -34, -23, -12, 0, 12, 23, 34, 45];
  return (
    <group position={[0, 0, -55]}>
      <mesh position={[0, 3.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[112, 6.5, 6]} />
        <meshStandardMaterial color="#895235" roughness={0.98} />
      </mesh>
      {towers.map((x, index) => {
        const height = x === 0 ? 12.5 : 8.2 + (index % 3) * 1.15;
        return (
          <group key={x} position={[x, 0, index % 2 ? 0.55 : -0.4]}>
            <mesh position={[0, height / 2, 0]} castShadow>
              <boxGeometry args={[8.2, height, 7.4]} />
              <meshStandardMaterial color={index % 2 ? "#9a603d" : "#a36a43"} roughness={0.95} />
            </mesh>
            {Array.from({ length: 5 }, (_, tooth) => (
              <mesh key={tooth} position={[-3.15 + tooth * 1.58, height + 0.55, 0]}>
                <boxGeometry args={[0.82, 1.15, 6.7]} />
                <meshStandardMaterial color="#7f4b31" roughness={1} />
              </mesh>
            ))}
          </group>
        );
      })}

      <group position={[0, 0, 3.8]}>
        <mesh position={[-5.1, 7.4, 0]}>
          <boxGeometry args={[7.2, 14.8, 5.8]} />
          <meshStandardMaterial color="#163e70" roughness={0.36} metalness={0.03} />
        </mesh>
        <mesh position={[5.1, 7.4, 0]}>
          <boxGeometry args={[7.2, 14.8, 5.8]} />
          <meshStandardMaterial color="#163e70" roughness={0.36} metalness={0.03} />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[4, 5.5, 5.8]} />
          <meshStandardMaterial color="#153762" roughness={0.4} />
        </mesh>
      </group>

      <group position={[31, 0, -8]}>
        {[0, 1, 2, 3].map((level) => (
          <mesh key={level} position={[0, 2.1 + level * 3, 0]}>
            <boxGeometry args={[17 - level * 3, 2.9, 14 - level * 2.25]} />
            <meshStandardMaterial color={level % 2 ? "#805238" : "#936044"} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RiverBanks() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-34, -0.5, -35]} receiveShadow>
        <planeGeometry args={[46, 210, 1, 1]} />
        <meshStandardMaterial color="#8e633c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[34, -0.5, -35]} receiveShadow>
        <planeGeometry args={[46, 210, 1, 1]} />
        <meshStandardMaterial color="#a17243" roughness={1} />
      </mesh>
      <mesh position={[-14.2, -1.2, -35]} scale={[5.2, 1.4, 105]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#765333" roughness={1} />
      </mesh>
      <mesh position={[14.2, -1.2, -35]} scale={[5.2, 1.4, 105]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#89613b" roughness={1} />
      </mesh>
    </group>
  );
}

export function ApproachScene({ progress }: { progress: number }) {
  return (
    <group>
      <Sky
        distance={450000}
        sunPosition={[-80, 17, -125]}
        inclination={0.49}
        azimuth={0.18}
        turbidity={10.5}
        rayleigh={2.5}
        mieCoefficient={0.009}
        mieDirectionalG={0.86}
      />

      <hemisphereLight args={["#efc88c", "#2d1a12", 1.05]} />
      <directionalLight position={[-38, 24, 28]} intensity={2.5} color="#ffc077" castShadow />

      <RiverBanks />
      <RiverSurface />
      <InstancedPalms count={50} area={[84, 165]} center={[0, 0, -38]} />
      <InstancedReeds side={-1} />
      <InstancedReeds side={1} />
      <RiverBoat position={[-3.8, 0.02, 10]} scale={0.88} />
      <RiverBoat position={[4.5, 0.01, -25]} scale={0.7} />

      <BabylonHorizon />
      <AtmosphericDust count={310} spread={[112, 29, 165]} position={[0, 4, -38]} />

      <mesh position={[-70, 15.5, -130]}>
        <sphereGeometry args={[4.7, 28, 28]} />
        <meshBasicMaterial color="#ffd18b" toneMapped={false} />
      </mesh>
      <mesh position={[0, 7.5, -116]}>
        <planeGeometry args={[170, 32]} />
        <meshBasicMaterial color="#dba36e" transparent opacity={0.1 + progress * 0.05} depthWrite={false} />
      </mesh>

      <fog attach="fog" args={["#b47d56", 40 - progress * 5, 150 - progress * 20]} />
    </group>
  );
}
