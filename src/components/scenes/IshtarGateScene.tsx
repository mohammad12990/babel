"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Hotspot } from "@/components/Hotspot";
import { AtmosphericDust } from "@/components/world/WorldKit";

function makeBrickTexture(base: [number, number, number], mortar: [number, number, number]) {
  const size = 192;
  const data = new Uint8Array(size * size * 4);
  const brickWidth = 32;
  const brickHeight = 16;

  for (let y = 0; y < size; y += 1) {
    const row = Math.floor(y / brickHeight);
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const localX = (x + offset) % brickWidth;
      const localY = y % brickHeight;
      const isMortar = localX < 2 || localY < 2;
      const noise = Math.sin(x * 0.21 + y * 0.43) * 7 + Math.sin(x * 0.73 - y * 0.17) * 3;
      const source = isMortar ? mortar : base;
      data[index] = THREE.MathUtils.clamp(source[0] + (isMortar ? 0 : noise), 0, 255);
      data[index + 1] = THREE.MathUtils.clamp(source[1] + (isMortar ? 0 : noise * 0.65), 0, 255);
      data[index + 2] = THREE.MathUtils.clamp(source[2] + (isMortar ? 0 : noise * 0.45), 0, 255);
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 7);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function useGateMaterials() {
  const materials = useMemo(() => {
    const blueMap = makeBrickTexture([22, 73, 126], [12, 38, 70]);
    const clayMap = makeBrickTexture([132, 77, 45], [86, 48, 31]);
    blueMap.repeat.set(4, 8);
    clayMap.repeat.set(5, 5);

    return {
      blue: new THREE.MeshPhysicalMaterial({
        map: blueMap,
        color: "#2a65a3",
        roughness: 0.29,
        metalness: 0.04,
        clearcoat: 0.58,
        clearcoatRoughness: 0.25,
      }),
      blueDark: new THREE.MeshStandardMaterial({
        map: blueMap.clone(),
        color: "#174477",
        roughness: 0.4,
        metalness: 0.02,
      }),
      clay: new THREE.MeshStandardMaterial({
        map: clayMap,
        color: "#a56843",
        roughness: 0.94,
      }),
      gold: new THREE.MeshPhysicalMaterial({
        color: "#d4a64b",
        roughness: 0.33,
        metalness: 0.18,
        clearcoat: 0.28,
      }),
      door: new THREE.MeshStandardMaterial({
        color: "#3a2117",
        roughness: 0.78,
        metalness: 0.04,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
    },
    [materials]
  );

  return materials;
}

function Material({ material }: { material: THREE.Material }) {
  return <primitive object={material} attach="material" />;
}

function Battlements({
  width,
  y,
  z,
  material,
}: {
  width: number;
  y: number;
  z: number;
  material: THREE.Material;
}) {
  const count = Math.max(3, Math.floor(width / 1.45));
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[-width / 2 + 0.72 + index * 1.45, y, z]} castShadow>
          <boxGeometry args={[0.82, 1.35, 6.5]} />
          <Material material={material} />
        </mesh>
      ))}
    </group>
  );
}

function DecorativeBands({ material }: { material: THREE.Material }) {
  const rows = [3.35, 7.45, 11.55, 15.65, 19.75];
  return (
    <group>
      {[-8.7, 8.7].flatMap((towerX) =>
        rows.map((y) => (
          <mesh key={`${towerX}-${y}`} position={[towerX, y, 3.72]} castShadow>
            <boxGeometry args={[9.6, 0.24, 0.2]} />
            <Material material={material} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Rosettes({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => {
    const result: Array<[number, number, number]> = [];
    for (const towerX of [-8.7, 8.7]) {
      for (const y of [4.1, 8.2, 12.3, 16.4, 20.5]) {
        for (let i = 0; i < 5; i += 1) result.push([towerX - 3.4 + i * 1.7, y, 3.9]);
      }
    }
    return result;
  }, []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    placements.forEach((position, index) => {
      if (!ref.current) return;
      dummy.position.set(...position);
      dummy.rotation.set(0, 0, index % 2 ? Math.PI / 4 : 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(index, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, placements.length]} castShadow>
      <torusGeometry args={[0.25, 0.065, 6, 12]} />
      <Material material={material} />
    </instancedMesh>
  );
}

function AnimalReliefs({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.1, 0.35);
    shape.lineTo(-0.55, 0.72);
    shape.lineTo(0.3, 0.68);
    shape.lineTo(0.72, 1.02);
    shape.lineTo(1.02, 0.98);
    shape.lineTo(1.2, 0.72);
    shape.lineTo(0.82, 0.55);
    shape.lineTo(0.6, 0.12);
    shape.lineTo(0.62, -0.62);
    shape.lineTo(0.38, -0.62);
    shape.lineTo(0.24, 0.02);
    shape.lineTo(-0.45, 0.03);
    shape.lineTo(-0.6, -0.62);
    shape.lineTo(-0.84, -0.62);
    shape.lineTo(-0.76, 0.08);
    shape.lineTo(-1.18, 0.12);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 1,
    });
  }, []);
  const placements = useMemo(
    () =>
      [-8.7, 8.7].flatMap((towerX) =>
        [5.65, 9.75, 13.85, 17.95].map((y, index) => ({
          position: [towerX + (index % 2 ? 1.35 : -1.25), y, 3.93] as [number, number, number],
          flip: towerX > 0 ? -1 : 1,
        }))
      ),
    []
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    placements.forEach((item, index) => {
      if (!ref.current) return;
      dummy.position.set(...item.position);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.88 * item.flip, 0.88, 0.88);
      dummy.updateMatrix();
      ref.current.setMatrixAt(index, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [placements]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <instancedMesh ref={ref} args={[geometry, material, placements.length]} castShadow />
  );
}

function Door({ door, gold }: { door: THREE.Material; gold: THREE.Material }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-1.73, 6.15, 3.84]} castShadow>
        <boxGeometry args={[3.38, 12.3, 0.52]} />
        <Material material={door} />
      </mesh>
      <mesh position={[1.73, 6.15, 3.84]} castShadow>
        <boxGeometry args={[3.38, 12.3, 0.52]} />
        <Material material={door} />
      </mesh>
      {[-2.65, -1.75, -0.86, 0.86, 1.75, 2.65].map((x) => (
        <mesh key={x} position={[x, 6.15, 4.14]}>
          <boxGeometry args={[0.07, 11.75, 0.07]} />
          <Material material={gold} />
        </mesh>
      ))}
      <mesh position={[0, 11.25, 4.18]}>
        <torusGeometry args={[3.45, 0.3, 10, 48, Math.PI]} />
        <Material material={gold} />
      </mesh>
      <mesh position={[0, 5.8, 4.18]}>
        <boxGeometry args={[0.13, 11.3, 0.1]} />
        <Material material={gold} />
      </mesh>
      <mesh position={[0, 5.5, 4.3]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <Material material={gold} />
      </mesh>
    </group>
  );
}

function Avenue({ clay, blue, gold }: { clay: THREE.Material; blue: THREE.Material; gold: THREE.Material }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 21]} receiveShadow>
        <planeGeometry args={[24, 54]} />
        <Material material={clay} />
      </mesh>
      {[-13.4, 13.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.3, 20]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 4.6, 55]} />
            <Material material={blue} />
          </mesh>
          <mesh position={[x + (x < 0 ? 1.65 : -1.65), 2.6, 20]}>
            <boxGeometry args={[0.14, 0.22, 54]} />
            <Material material={gold} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function IshtarGateScene({ progress }: { progress: number }) {
  const materials = useGateMaterials();

  return (
    <group position={[0, 0, -20]}>
      <hemisphereLight args={["#e2bd82", "#1f1713", 0.92]} />
      <directionalLight
        position={[-18, 25, 22]}
        intensity={2.8}
        color="#ffc47b"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 9, 13]} intensity={1.15} distance={42} color="#d89450" />
      <pointLight position={[-17, 7, 8]} intensity={0.55} distance={30} color="#587fc1" />

      <Avenue clay={materials.clay} blue={materials.blueDark} gold={materials.gold} />
      <AtmosphericDust count={230} spread={[54, 27, 58]} position={[0, 3, 5]} />

      {[-8.7, 8.7].map((x) => (
        <group key={x}>
          <mesh position={[x, 12.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.4, 24.5, 7.6]} />
            <Material material={materials.blue} />
          </mesh>
          <Battlements width={10.4} y={25.15} z={0} material={materials.blue} />
        </group>
      ))}

      <mesh position={[0, 18.9, 0]} castShadow>
        <boxGeometry args={[7.2, 11.2, 7.6]} />
        <Material material={materials.blue} />
      </mesh>
      <Battlements width={7.2} y={25.15} z={0} material={materials.blue} />

      <DecorativeBands material={materials.gold} />
      <Rosettes material={materials.gold} />
      <AnimalReliefs material={materials.gold} />
      <Door door={materials.door} gold={materials.gold} />

      {[-22.4, 22.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 6.4, -1.05]} castShadow receiveShadow>
            <boxGeometry args={[17, 12.8, 6.8]} />
            <Material material={materials.clay} />
          </mesh>
          <Battlements width={17} y={13.45} z={-1.05} material={materials.clay} />
        </group>
      ))}

      <mesh position={[0, 0.08, 3.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[48, 70]} />
        <meshStandardMaterial color="#73523b" roughness={0.9} transparent opacity={0.25} />
      </mesh>

      <Hotspot id="glazed-bricks" position={[-9.7, 6.3, 4.25]} />
      <Hotspot id="gate-lions" position={[9.8, 5.8, 4.25]} />
      <Hotspot id="gate-bulls" position={[-7.5, 13.9, 4.25]} />
      <Hotspot id="gate-dragons" position={[8.2, 18, 4.25]} />

      <fog attach="fog" args={["#8e6248", 24 - progress * 4, 88 - progress * 18]} />
    </group>
  );
}
