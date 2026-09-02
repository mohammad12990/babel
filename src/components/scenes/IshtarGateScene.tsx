"use client";

import * as THREE from "three";
import { Hotspot } from "@/components/Hotspot";
import { AtmosphericDust } from "@/components/world/WorldKit";

function Battlements({ width, y, z = 0 }: { width: number; y: number; z?: number }) {
  const count = Math.max(3, Math.floor(width / 1.45));
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 0.72 + i * 1.45, y, z]}>
          <boxGeometry args={[0.8, 1.2, 4.9]} />
          <meshStandardMaterial color="#153e72" roughness={0.35} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

function GoldBand({ y, width, z = 2.72 }: { y: number; width: number; z?: number }) {
  return (
    <mesh position={[0, y, z]}>
      <boxGeometry args={[width, 0.22, 0.12]} />
      <meshStandardMaterial color="#c89b3c" roughness={0.3} metalness={0.28} />
    </mesh>
  );
}

function RosetteRow({ y, width, z = 2.83 }: { y: number; width: number; z?: number }) {
  const n = Math.floor(width / 1.7);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 0.9 + i * 1.7, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.07, 6, 12]} />
          <meshStandardMaterial color="#d3ab53" roughness={0.4} metalness={0.18} />
        </mesh>
      ))}
    </group>
  );
}

function AnimalRelief({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <group position={[x, y, 2.9]} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <meshStandardMaterial color="#d0a34a" roughness={0.42} />
      </mesh>
      <mesh position={[0.43, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.14, 0.55, 4, 8]} />
        <meshStandardMaterial color="#d0a34a" roughness={0.42} />
      </mesh>
      <mesh position={[0.8, 0.22, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#d0a34a" roughness={0.42} />
      </mesh>
      {[-0.22, 0.22].map((lx) => (
        <mesh key={lx} position={[lx, -0.53, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.55, 5]} />
          <meshStandardMaterial color="#d0a34a" roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

function GateTower({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 9.3, 0]}>
        <boxGeometry args={[8.2, 18.6, 5.5]} />
        <meshStandardMaterial color="#154477" roughness={0.32} metalness={0.05} />
      </mesh>
      <Battlements width={8.2} y={19.15} />
      {[3.3, 7.2, 11.1, 15].map((y) => (
        <group key={y}>
          <GoldBand y={y} width={7.9} />
          <RosetteRow y={y + 0.55} width={7.3} />
        </group>
      ))}
      {[4.9, 8.8, 12.7, 16.6].map((y, i) => (
        <AnimalRelief key={y} x={i % 2 ? 1.0 : -1.0} y={y} flip={x > 0} />
      ))}
    </group>
  );
}

function SideWall({ x }: { x: number }) {
  return (
    <group position={[x, 0, -1.1]}>
      <mesh position={[0, 5.4, 0]}>
        <boxGeometry args={[12, 10.8, 5]} />
        <meshStandardMaterial color="#9d613c" roughness={0.93} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-5.1 + i * 1.7, 11.25, 0]}>
          <boxGeometry args={[0.9, 1.2, 4.5]} />
          <meshStandardMaterial color="#8c5536" roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

export function IshtarGateScene({ progress }: { progress: number }) {
  return (
    <group position={[0, 0, -20]}>
      <hemisphereLight args={["#d7b27c", "#24170f", 0.9]} />
      <directionalLight position={[-16, 23, 18]} intensity={2.1} color="#ffc477" />
      <pointLight position={[0, 5, 10]} intensity={0.7} distance={35} color="#d99854" />

      <AtmosphericDust count={190} spread={[48, 24, 45]} position={[0, 5, 2]} />

      <GateTower x={-7.1} />
      <GateTower x={7.1} />

      <mesh position={[0, 14.8, 0]}>
        <boxGeometry args={[6.8, 6.8, 5.5]} />
        <meshStandardMaterial color="#174778" roughness={0.32} metalness={0.04} />
      </mesh>
      <Battlements width={6.8} y={18.8} />
      <GoldBand y={12.05} width={6.5} />
      <GoldBand y={17.1} width={6.5} />
      <RosetteRow y={17.65} width={6.1} />

      <mesh position={[0, 6, 2.45]}>
        <boxGeometry args={[5.7, 12, 0.45]} />
        <meshStandardMaterial color="#17120e" roughness={0.98} />
      </mesh>

      <group position={[0, 5.5, 2.72]}>
        <mesh position={[-1.45, 0, 0]}>
          <boxGeometry args={[2.75, 10.5, 0.38]} />
          <meshStandardMaterial color="#4d2d1f" roughness={0.88} />
        </mesh>
        <mesh position={[1.45, 0, 0]}>
          <boxGeometry args={[2.75, 10.5, 0.38]} />
          <meshStandardMaterial color="#4d2d1f" roughness={0.88} />
        </mesh>
        {[-2.2, -0.75, 0.75, 2.2].map((x) => (
          <mesh key={x} position={[x, 0, 0.24]}>
            <boxGeometry args={[0.09, 10.1, 0.08]} />
            <meshStandardMaterial color="#a76b35" metalness={0.28} roughness={0.52} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 11.05, 2.9]} rotation={[0, 0, 0]}>
        <torusGeometry args={[3.05, 0.34, 10, 40, Math.PI]} />
        <meshStandardMaterial color="#c99c45" roughness={0.36} metalness={0.16} />
      </mesh>

      <SideWall x={-17.2} />
      <SideWall x={17.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 7]}>
        <planeGeometry args={[42, 34]} />
        <meshStandardMaterial color="#6e5542" roughness={0.82} />
      </mesh>

      <Hotspot id="glazed-bricks" position={[-7.2, 6.2, 3.2]} />
      <Hotspot id="gate-lions" position={[7.2, 5.2, 3.2]} />
      <Hotspot id="gate-bulls" position={[-7.2, 10.8, 3.2]} />
      <Hotspot id="gate-dragons" position={[7.2, 14.6, 3.2]} />

      <fog attach="fog" args={["#9b6b48", 26 - progress * 3, 95 - progress * 12]} />
    </group>
  );
}
