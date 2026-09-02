"use client";

import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { AtmosphericDust, InstancedPalms, Water } from "@/components/world/WorldKit";

function RiverBoat({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + position[2]) * 0.05;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.55 + position[0]) * 0.012;
  });

  return (
    <group ref={ref} position={position}>
      <mesh scale={[1.8, 0.22, 3.8]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#3f2417" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 2.8, 6]} />
        <meshStandardMaterial color="#3a2518" roughness={1} />
      </mesh>
      <mesh position={[0.42, 1.35, 0]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[0.95, 2.2]} />
        <meshStandardMaterial color="#cdbb93" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RiverReeds({ side = 1 }: { side?: number }) {
  const blades = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: side * (10.6 + Math.random() * 6),
        z: 30 - i * 2.3 + (Math.random() - 0.5) * 3,
        h: 0.7 + Math.random() * 1.5,
      })),
    [side]
  );

  return (
    <group>
      {blades.map((r, i) => (
        <mesh key={i} position={[r.x, r.h / 2, r.z]} rotation={[0, 0, (Math.random() - 0.5) * 0.1]}>
          <cylinderGeometry args={[0.025, 0.045, r.h, 4]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#84713d" : "#58643b"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function BabylonSkyline() {
  const towers = [-36, -27, -18, -9, 0, 9, 18, 27, 36];
  return (
    <group position={[0, 0, -72]}>
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[92, 6.8, 5]} />
        <meshStandardMaterial color="#8f5634" roughness={0.98} />
      </mesh>
      {towers.map((x, i) => {
        const h = i === 4 ? 14 : 9 + (i % 3) * 1.8;
        return (
          <group key={x} position={[x, 0, i % 2 ? 0.4 : -0.3]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[7.2, h, 6.4]} />
              <meshStandardMaterial color={i % 2 ? "#9d613a" : "#a46b42"} roughness={0.96} />
            </mesh>
            {Array.from({ length: 5 }, (_, c) => (
              <mesh key={c} position={[-2.8 + c * 1.4, h + 0.55, 0]}>
                <boxGeometry args={[0.8, 1.1, 5.7]} />
                <meshStandardMaterial color="#8f5634" roughness={1} />
              </mesh>
            ))}
          </group>
        );
      })}
      <group position={[29, 0, -9]}>
        {[0, 1, 2, 3].map((level) => (
          <mesh key={level} position={[0, 2.4 + level * 3.3, 0]}>
            <boxGeometry args={[16 - level * 2.8, 3.2, 13 - level * 2.2]} />
            <meshStandardMaterial color="#87563a" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function ApproachScene({ progress }: { progress: number }) {
  return (
    <group>
      <Sky
        distance={450000}
        sunPosition={[-80, 22, -120]}
        inclination={0.49}
        azimuth={0.18}
        turbidity={8.5}
        rayleigh={2.2}
        mieCoefficient={0.007}
        mieDirectionalG={0.82}
      />

      <hemisphereLight args={["#d9b37a", "#3a2519", 1.15]} />
      <directionalLight position={[-35, 22, 30]} intensity={2.2} color="#ffbd72" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-24, -0.38, -34]}>
        <planeGeometry args={[48, 205, 1, 1]} />
        <meshStandardMaterial color="#8b633d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, -0.38, -34]}>
        <planeGeometry args={[48, 205, 1, 1]} />
        <meshStandardMaterial color="#9b7045" roughness={1} />
      </mesh>

      <Water position={[0, -0.16, -34]} size={[21, 205]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, -34]}>
        <planeGeometry args={[20.2, 205]} />
        <meshPhysicalMaterial
          color="#30586a"
          roughness={0.2}
          metalness={0.04}
          transparent
          opacity={0.5}
          clearcoat={0.45}
          clearcoatRoughness={0.22}
        />
      </mesh>

      <InstancedPalms count={44} area={[74, 150]} center={[0, 0, -34]} />
      <RiverReeds side={-1} />
      <RiverReeds side={1} />
      <RiverBoat position={[-3.7, 0.03, 8]} />
      <RiverBoat position={[4.4, 0.03, -27]} />

      <BabylonSkyline />
      <AtmosphericDust count={260} spread={[105, 30, 155]} position={[0, 5, -40]} />

      <mesh position={[-62, 18, -120]}>
        <sphereGeometry args={[4.2, 24, 24]} />
        <meshBasicMaterial color="#ffd08a" toneMapped={false} />
      </mesh>

      <fog attach="fog" args={["#b9865d", 42 - progress * 4, 175 - progress * 20]} />
    </group>
  );
}
