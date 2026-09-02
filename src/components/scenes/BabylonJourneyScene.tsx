"use client";

import { Sky, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";

const seeded = (seed: number) => {
  const value = Math.sin(seed * 917.37) * 43758.5453;
  return value - Math.floor(value);
};

function makeBankGeometry(side: -1 | 1) {
  const segments = 84;
  const columns = 4;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    const t = zIndex / segments;
    const z = THREE.MathUtils.lerp(108, -118, t);
    const irregularity = Math.sin(t * 31) * 0.55 + Math.sin(t * 71) * 0.18;
    const riverEdge = 9.6 + irregularity;
    const widths = [riverEdge, riverEdge + 4.2, 27, 52];
    const heights = [-0.22, 0.35 + irregularity * 0.18, 1.1, 2.15 + Math.sin(t * 17) * 0.22];

    for (let column = 0; column < columns; column += 1) {
      positions.push(widths[column] * side, heights[column], z);
      uvs.push(column / (columns - 1) * 4, t * 16);
    }
  }

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const a = row * columns + column;
      const b = a + columns;
      if (side === 1) indices.push(a, b, a + 1, b, b + 1, a + 1);
      else indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFrondGeometry() {
  const segments = 9;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = t * 4.6;
    const y = Math.sin(t * Math.PI) * 0.42 - Math.pow(t, 1.65) * 1.5;
    const width = THREE.MathUtils.lerp(0.33, 0.025, t);
    positions.push(x, y, -width, x, y, width);
    uvs.push(t, 0, t, 1);
    if (index < segments) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function River() {
  const material = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 4]} receiveShadow>
      <planeGeometry args={[20.5, 220, 42, 180]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite
        uniforms={{
          uTime: { value: 0 },
          uDeep: { value: new THREE.Color("#123a4d") },
          uLight: { value: new THREE.Color("#a56f49") },
        }}
        vertexShader={`
          uniform float uTime;
          varying float vWave;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            float wave = sin(p.y * 0.34 + uTime * 0.72) * 0.09;
            wave += sin(p.x * 1.18 - p.y * 0.12 - uTime * 0.48) * 0.035;
            p.z += wave;
            vWave = wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uDeep;
          uniform vec3 uLight;
          varying float vWave;
          varying vec2 vUv;
          void main() {
            float shimmer = pow(max(0.0, sin(vUv.y * 430.0 + uTime * 1.5) * 0.5 + 0.5), 13.0);
            shimmer *= 0.13 + smoothstep(0.1, 0.9, vUv.x) * 0.08;
            vec3 color = mix(uDeep, uLight, 0.2 + vWave * 1.8 + shimmer);
            gl_FragColor = vec4(color, 0.96);
          }
        `}
      />
    </mesh>
  );
}

function RiverBanks({ material }: { material: THREE.Material }) {
  const left = useMemo(() => makeBankGeometry(-1), []);
  const right = useMemo(() => makeBankGeometry(1), []);

  useEffect(() => () => {
    left.dispose();
    right.dispose();
  }, [left, right]);

  return (
    <group>
      <mesh geometry={left} material={material} receiveShadow />
      <mesh geometry={right} material={material} receiveShadow />
    </group>
  );
}

function PalmGrove() {
  const palmCount = 26;
  const leavesPerPalm = 10;
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const fronds = useRef<THREE.InstancedMesh>(null);
  const frondGeometry = useMemo(() => makeFrondGeometry(), []);
  const palms = useMemo(
    () =>
      Array.from({ length: palmCount }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const z = 91 - seeded(index + 28) * 171;
        return {
          x: side * (12.8 + seeded(index + 81) * 18),
          z,
          height: 0.76 + seeded(index + 177) * 0.58,
          twist: seeded(index + 251) * Math.PI * 2,
          lean: (seeded(index + 349) - 0.5) * 0.09,
        };
      }),
    []
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    palms.forEach((palm, palmIndex) => {
      const trunkHeight = 7.4 * palm.height;
      if (trunks.current) {
        dummy.position.set(palm.x, trunkHeight / 2, palm.z);
        dummy.rotation.set(palm.lean, palm.twist, -palm.lean * 0.55);
        dummy.scale.set(palm.height, palm.height, palm.height);
        dummy.updateMatrix();
        trunks.current.setMatrixAt(palmIndex, dummy.matrix);
        trunks.current.setColorAt(
          palmIndex,
          new THREE.Color(palmIndex % 3 === 0 ? "#795038" : "#5a3827")
        );
      }

      if (crowns.current) {
        dummy.position.set(palm.x, trunkHeight + 0.1, palm.z);
        dummy.rotation.set(0, palm.twist, 0);
        dummy.scale.setScalar(palm.height);
        dummy.updateMatrix();
        crowns.current.setMatrixAt(palmIndex, dummy.matrix);
      }

      for (let leafIndex = 0; leafIndex < leavesPerPalm; leafIndex += 1) {
        if (!fronds.current) continue;
        const instance = palmIndex * leavesPerPalm + leafIndex;
        dummy.position.set(palm.x, trunkHeight + 0.28, palm.z);
        dummy.rotation.set(
          (seeded(instance + 477) - 0.5) * 0.16,
          palm.twist + (leafIndex / leavesPerPalm) * Math.PI * 2,
          (seeded(instance + 581) - 0.5) * 0.18
        );
        dummy.scale.setScalar(palm.height * (0.84 + seeded(instance + 644) * 0.28));
        dummy.updateMatrix();
        fronds.current.setMatrixAt(instance, dummy.matrix);
        fronds.current.setColorAt(
          instance,
          new THREE.Color(instance % 4 === 0 ? "#55633a" : "#304735")
        );
      }
    });

    [trunks.current, crowns.current, fronds.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [palms]);

  useEffect(() => () => frondGeometry.dispose(), [frondGeometry]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, palmCount]} castShadow>
        <cylinderGeometry args={[0.17, 0.33, 7.4, 9, 5]} />
        <meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, palmCount]} castShadow>
        <sphereGeometry args={[0.55, 9, 7]} />
        <meshStandardMaterial color="#42513a" roughness={0.94} />
      </instancedMesh>
      <instancedMesh
        ref={fronds}
        args={[frondGeometry, undefined, palmCount * leavesPerPalm]}
        castShadow
      >
        <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function ReedsAndStones() {
  const reeds = useRef<THREE.InstancedMesh>(null);
  const stones = useRef<THREE.InstancedMesh>(null);
  const reedCount = 180;
  const stoneCount = 62;

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let index = 0; index < reedCount; index += 1) {
      if (!reeds.current) break;
      const side = index % 2 === 0 ? -1 : 1;
      const height = 0.65 + seeded(index + 31) * 1.3;
      dummy.position.set(side * (9.5 + seeded(index + 73) * 2.8), height / 2, 96 - seeded(index + 122) * 190);
      dummy.rotation.set(0, seeded(index + 178) * Math.PI, (seeded(index + 205) - 0.5) * 0.18);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      reeds.current.setMatrixAt(index, dummy.matrix);
      reeds.current.setColorAt(index, new THREE.Color(index % 5 === 0 ? "#a38a4c" : "#617044"));
    }
    for (let index = 0; index < stoneCount; index += 1) {
      if (!stones.current) break;
      const side = index % 2 === 0 ? -1 : 1;
      const scale = 0.18 + seeded(index + 388) * 0.72;
      dummy.position.set(side * (10.7 + seeded(index + 421) * 14), 0.05 + scale * 0.22, 93 - seeded(index + 466) * 192);
      dummy.rotation.set(seeded(index + 501), seeded(index + 543) * Math.PI, seeded(index + 577));
      dummy.scale.set(scale * 1.4, scale * 0.7, scale);
      dummy.updateMatrix();
      stones.current.setMatrixAt(index, dummy.matrix);
    }
    [reeds.current, stones.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, []);

  return (
    <group>
      <instancedMesh ref={reeds} args={[undefined, undefined, reedCount]} castShadow>
        <cylinderGeometry args={[0.018, 0.035, 1, 5]} />
        <meshStandardMaterial vertexColors roughness={1} />
      </instancedMesh>
      <instancedMesh ref={stones} args={[undefined, undefined, stoneCount]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#78614c" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RiverBoat({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const boat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    boat.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.7 + position[2]) * 0.055;
    boat.current.rotation.z = Math.sin(clock.elapsedTime * 0.48 + position[0]) * 0.018;
  });

  return (
    <group ref={boat} position={position} scale={scale}>
      <mesh scale={[1.2, 0.22, 2.8]} castShadow>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color="#3e2518" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 2.8, 7]} />
        <meshStandardMaterial color="#3a2518" roughness={1} />
      </mesh>
      <mesh position={[0.42, 1.4, 0]} rotation={[0, 0, -0.12]} castShadow>
        <planeGeometry args={[0.95, 2.15]} />
        <meshStandardMaterial color="#cdb98e" roughness={0.92} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function makeAnimalReliefGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.05, 0.12);
  shape.lineTo(-0.8, 0.52);
  shape.lineTo(-0.18, 0.64);
  shape.lineTo(0.42, 0.58);
  shape.lineTo(0.73, 0.9);
  shape.lineTo(1.04, 0.84);
  shape.lineTo(1.18, 0.63);
  shape.lineTo(0.83, 0.45);
  shape.lineTo(0.65, 0.12);
  shape.lineTo(0.68, -0.55);
  shape.lineTo(0.43, -0.55);
  shape.lineTo(0.25, 0.02);
  shape.lineTo(-0.45, 0.02);
  shape.lineTo(-0.62, -0.55);
  shape.lineTo(-0.87, -0.55);
  shape.lineTo(-0.8, 0.02);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.13,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 1,
  });
  geometry.center();
  return geometry;
}

function MerlonRow({
  width,
  depth,
  y,
  material,
}: {
  width: number;
  depth: number;
  y: number;
  material: THREE.Material;
}) {
  const count = Math.floor(width / 1.55);
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <group key={index} position={[-width / 2 + 0.78 + index * 1.55, y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.88, 1.25, depth]} />
            <primitive object={material} attach="material" />
          </mesh>
          <mesh position={[0, 0.92, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.64, 0.64, depth * 0.72]} />
            <primitive object={material} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function IshtarGate({ materials }: { materials: Record<string, THREE.Material> }) {
  const animalGeometry = useMemo(() => makeAnimalReliefGeometry(), []);
  const goldReliefs = useRef<THREE.InstancedMesh>(null);
  const ivoryReliefs = useRef<THREE.InstancedMesh>(null);
  const reliefs = useMemo(() => {
    const placements: Array<{ position: [number, number, number]; gold: boolean; flip: boolean }> = [];
    for (const towerX of [-10.8, 10.8]) {
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 2; column += 1) {
          placements.push({
            position: [towerX - 1.65 + column * 3.3, 5.2 + row * 4.25, 5.14],
            gold: (row + column + (towerX > 0 ? 1 : 0)) % 2 === 0,
            flip: towerX > 0,
          });
        }
      }
    }
    return placements;
  }, []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    let goldIndex = 0;
    let ivoryIndex = 0;
    reliefs.forEach((relief) => {
      const mesh = relief.gold ? goldReliefs.current : ivoryReliefs.current;
      if (!mesh) return;
      const index = relief.gold ? goldIndex++ : ivoryIndex++;
      dummy.position.set(...relief.position);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(relief.flip ? -0.86 : 0.86, 0.86, 0.86);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    [goldReliefs.current, ivoryReliefs.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [reliefs]);

  useEffect(() => () => animalGeometry.dispose(), [animalGeometry]);

  return (
    <group position={[0, 0, -105]}>
      <mesh position={[-10.8, 14.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 28.4, 10]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>
      <mesh position={[10.8, 14.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 28.4, 10]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>

      <mesh position={[-8.15, 11.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.7, 23.6, 8.4]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>
      <mesh position={[8.15, 11.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.7, 23.6, 8.4]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>
      <mesh position={[0, 19.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.6, 7.8, 8.4]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>

      <MerlonRow width={8.6} depth={7.8} y={24.25} material={materials.blue} />
      <group position={[-10.8, 0, 0]}><MerlonRow width={9.2} depth={9.2} y={29.05} material={materials.blue} /></group>
      <group position={[10.8, 0, 0]}><MerlonRow width={9.2} depth={9.2} y={29.05} material={materials.blue} /></group>

      <mesh position={[0, 10.65, 4.42]} castShadow>
        <torusGeometry args={[5.05, 0.62, 10, 64, Math.PI]} />
        <primitive object={materials.gold} attach="material" />
      </mesh>
      {[-5.05, 5.05].map((x) => (
        <mesh key={x} position={[x, 5.45, 4.42]} castShadow>
          <boxGeometry args={[1.22, 10.9, 0.34]} />
          <primitive object={materials.gold} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 10.65, 4.62]} castShadow>
        <torusGeometry args={[4.45, 0.17, 8, 64, Math.PI]} />
        <primitive object={materials.ivory} attach="material" />
      </mesh>
      {[-4.45, 4.45].map((x) => (
        <mesh key={x} position={[x, 5.35, 4.62]} castShadow>
          <boxGeometry args={[0.34, 10.7, 0.18]} />
          <primitive object={materials.ivory} attach="material" />
        </mesh>
      ))}

      <group position={[0, 0, 4.3]}>
        <mesh position={[-2.1, 5.3, 0]} castShadow>
          <boxGeometry args={[4.05, 10.6, 0.52]} />
          <primitive object={materials.wood} attach="material" />
        </mesh>
        <mesh position={[2.1, 5.3, 0]} castShadow>
          <boxGeometry args={[4.05, 10.6, 0.52]} />
          <primitive object={materials.wood} attach="material" />
        </mesh>
        <mesh position={[0, 10.55, 0]} rotation={[0, 0, 0]} castShadow>
          <circleGeometry args={[4.1, 48, 0, Math.PI]} />
          <primitive object={materials.wood} attach="material" />
        </mesh>
        {[-3.15, -2.1, -1.05, 0, 1.05, 2.1, 3.15].map((x) => (
          <mesh key={x} position={[x, 5.4, 0.3]}>
            <boxGeometry args={[0.075, 10.1, 0.08]} />
            <primitive object={materials.bronze} attach="material" />
          </mesh>
        ))}
        {[2.4, 5.5, 8.6].map((y) => (
          <mesh key={y} position={[0, y, 0.34]}>
            <boxGeometry args={[7.8, 0.2, 0.1]} />
            <primitive object={materials.bronze} attach="material" />
          </mesh>
        ))}
      </group>

      {[-10.8, 10.8].flatMap((x) => [3.1, 7.35, 11.6, 15.85, 20.1, 24.35].map((y) => (
        <mesh key={`${x}-${y}`} position={[x, y, 5.08]}>
          <boxGeometry args={[8.2, 0.22, 0.16]} />
          <primitive object={materials.gold} attach="material" />
        </mesh>
      )))}

      <instancedMesh ref={goldReliefs} args={[animalGeometry, materials.gold, reliefs.filter((r) => r.gold).length]} castShadow />
      <instancedMesh ref={ivoryReliefs} args={[animalGeometry, materials.ivory, reliefs.filter((r) => !r.gold).length]} castShadow />

      {[-29, 29].map((x) => (
        <group key={x}>
          <mesh position={[x, 7, -0.8]} castShadow receiveShadow>
            <boxGeometry args={[27, 14, 8]} />
            <primitive object={materials.mud} attach="material" />
          </mesh>
          <group position={[x, 0, -0.8]}><MerlonRow width={27} depth={7.5} y={14.65} material={materials.blueDark} /></group>
        </group>
      ))}
    </group>
  );
}

function CitySilhouette({ material }: { material: THREE.Material }) {
  const buildings = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const height = 4.2 + seeded(index + 29) * 9.5;
        return {
          x: side * (25 + seeded(index + 71) * 35),
          y: height / 2,
          z: -77 - seeded(index + 113) * 75,
          sx: 5 + seeded(index + 181) * 9,
          sy: height,
          sz: 5 + seeded(index + 227) * 9,
          rotation: (seeded(index + 301) - 0.5) * 0.18,
        };
      }),
    []
  );
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    buildings.forEach((building, index) => {
      if (!mesh.current) return;
      dummy.position.set(building.x, building.y, building.z);
      dummy.rotation.set(0, building.rotation, 0);
      dummy.scale.set(building.sx, building.sy, building.sz);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]} material={material} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function ProcessionalApproach({ materials }: { materials: Record<string, THREE.Material> }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -71]} receiveShadow>
        <planeGeometry args={[27, 70, 1, 1]} />
        <meshStandardMaterial color="#87664d" roughness={0.96} bumpMap={(materials.mud as THREE.MeshStandardMaterial).bumpMap} bumpScale={0.12} />
      </mesh>
      {[-16.5, 16.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.4, -73]} castShadow receiveShadow>
            <boxGeometry args={[4, 6.8, 68]} />
            <primitive object={materials.blueDark} attach="material" />
          </mesh>
          <mesh position={[x + (x < 0 ? 2.04 : -2.04), 4.35, -73]}>
            <boxGeometry args={[0.18, 0.28, 66]} />
            <primitive object={materials.gold} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MovingMist() {
  const { globalProgress } = useScrollState();
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);

  useFrame(({ clock }) => {
    const fade = 1 - THREE.MathUtils.smoothstep(globalProgress, 0.28, 0.78);
    materials.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = fade * (0.16 + index * 0.035) * (0.86 + Math.sin(clock.elapsedTime * 0.15 + index) * 0.14);
    });
  });

  return (
    <group>
      {[-42, -66, -88].map((z, index) => (
        <mesh key={z} position={[0, 6 + index * 1.4, z]}>
          <planeGeometry args={[64 + index * 16, 18 + index * 4]} />
          <meshBasicMaterial
            ref={(material) => { materials.current[index] = material; }}
            color="#c49b76"
            transparent
            opacity={0.2}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function Atmosphere() {
  const scene = useThree((state) => state.scene);
  const { globalProgress } = useScrollState();

  useEffect(() => {
    const fog = new THREE.Fog("#9b765d", 14, 76);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const reveal = THREE.MathUtils.smoothstep(globalProgress, 0.08, 0.74);
    scene.fog.near = THREE.MathUtils.lerp(13, 24, reveal);
    scene.fog.far = THREE.MathUtils.lerp(72, 154, reveal);
  });

  return null;
}

export function BabylonJourneyScene() {
  const textures = useTexture([
    "/textures/babylon-blue-brick.webp",
    "/textures/babylon-blue-brick-bump.webp",
    "/textures/babylon-mud-brick.webp",
    "/textures/babylon-mud-brick-bump.webp",
  ]) as THREE.Texture[];
  const [blueMap, blueBump, mudMap, mudBump] = textures;

  useEffect(() => {
    [blueMap, blueBump].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2.6, 5.5);
      texture.anisotropy = 4;
    });
    [mudMap, mudBump].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      texture.anisotropy = 4;
    });
    blueMap.colorSpace = THREE.SRGBColorSpace;
    mudMap.colorSpace = THREE.SRGBColorSpace;
  }, [blueBump, blueMap, mudBump, mudMap]);

  const materials = useMemo(() => ({
    blue: new THREE.MeshPhysicalMaterial({
      map: blueMap,
      bumpMap: blueBump,
      bumpScale: 0.18,
      color: "#315f9c",
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.52,
      clearcoatRoughness: 0.24,
    }),
    blueDark: new THREE.MeshPhysicalMaterial({
      map: blueMap,
      bumpMap: blueBump,
      bumpScale: 0.12,
      color: "#183f73",
      roughness: 0.38,
      clearcoat: 0.35,
    }),
    mud: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.22,
      color: "#9a704f",
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
    gold: new THREE.MeshPhysicalMaterial({ color: "#d4a43e", roughness: 0.3, metalness: 0.12, clearcoat: 0.42 }),
    ivory: new THREE.MeshPhysicalMaterial({ color: "#dbc695", roughness: 0.4, clearcoat: 0.3 }),
    wood: new THREE.MeshStandardMaterial({ color: "#3e2418", roughness: 0.78, metalness: 0.02 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#8d6a32", roughness: 0.38, metalness: 0.55 }),
  }), [blueBump, blueMap, mudBump, mudMap]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  return (
    <group>
      <Sky
        distance={450000}
        sunPosition={[-72, 14, -110]}
        inclination={0.49}
        azimuth={0.18}
        turbidity={10.8}
        rayleigh={2.35}
        mieCoefficient={0.0085}
        mieDirectionalG={0.87}
      />
      <color attach="background" args={["#98725d"]} />
      <hemisphereLight args={["#e8c58e", "#201815", 1.12]} />
      <directionalLight
        position={[-38, 34, 24]}
        intensity={2.7}
        color="#ffc47b"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={240}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-28}
      />
      <pointLight position={[0, 12, -89]} intensity={2.4} distance={72} color="#d58d4b" />

      <River />
      <RiverBanks material={materials.mud} />
      <PalmGrove />
      <ReedsAndStones />
      <RiverBoat position={[-3.3, 0.02, 38]} scale={0.8} />
      <RiverBoat position={[3.8, 0.01, -18]} scale={0.62} />
      <CitySilhouette material={materials.mud} />
      <ProcessionalApproach materials={materials} />
      <IshtarGate materials={materials} />
      <MovingMist />
      <Atmosphere />
    </group>
  );
}
