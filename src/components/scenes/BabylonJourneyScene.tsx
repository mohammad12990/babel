"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";
import { getApproachProgress } from "@/lib/journeyTimeline";

import { IshtarGateModel } from "@/components/world/IshtarGateModel";
import { River } from "@/components/world/River";
import { BabylonSky } from "@/components/world/BabylonSky";
import { HORIZON_COLOR } from "@/components/world/atmosphereShader";
import { makeGroundMaterial } from "@/components/world/groundMaterial";
import { RIVER_X, ROAD_X, GATE_Z, SUN_DIRECTION, ACCESS_POINTS, riverCenterAt, riverHalfWidthAt, bankHeightAt } from "@/lib/journeyLayout";
export { RIVER_X, ROAD_X, GATE_Z } from "@/lib/journeyLayout";

type BabylonMaterials = {
  blue: THREE.MeshPhysicalMaterial;
  blueDark: THREE.MeshPhysicalMaterial;
  mud: THREE.MeshStandardMaterial;
  wetMud: THREE.MeshStandardMaterial;
  city: THREE.MeshStandardMaterial;
  mudDark: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  gold: THREE.MeshPhysicalMaterial;
  ivory: THREE.MeshPhysicalMaterial;
  wood: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
};

const seeded = (seed: number) => {
  const value = Math.sin(seed * 917.37) * 43758.5453;
  return value - Math.floor(value);
};


function makeBankGeometry(side: -1 | 1) {
  const rows = 196;
  const offsets = [-0.45, 1.2, 4, 9, 20, 40, 80, 140, 260];
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const wet = new THREE.Color("#756858"), dry = new THREE.Color("#ffffff");
  for (let row = 0; row <= rows; row++) {
    const z = THREE.MathUtils.lerp(170, -420, row / rows);
    offsets.forEach((distance) => {
      positions.push(riverCenterAt(z) + side * (riverHalfWidthAt(z) + distance), bankHeightAt(distance, z), z);
      const color = wet.clone().lerp(dry, THREE.MathUtils.smoothstep(distance, 0.4, 8));
      colors.push(color.r, color.g, color.b);
    });
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < offsets.length - 1; column++) {
      const a = row * offsets.length + column, b = a + offsets.length;
      if (side === 1) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeRibbonGeometry(points: THREE.Vector3[], width: number, segments = 72) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.3);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
    positions.push(point.x - side.x, point.y, point.z - side.z);
    positions.push(point.x + side.x, point.y, point.z + side.z);
    uvs.push(0, t * 8, 1, t * 8);
    if (index < segments) {
      const a = index * 2;
      indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
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
  const positions: number[] = [], indices: number[] = [];
  // Separate tapered leaflets create a date-palm silhouette, instead of ribbons.
  for (let i = 0; i < 19; i++) {
    const t = i / 19, next = (i + 0.7) / 19;
    const y = Math.sin(t * Math.PI) * 0.45 - t * t * 1.4;
    const yn = Math.sin(next * Math.PI) * 0.45 - next * next * 1.4;
    const length = Math.sin((t * 0.82 + 0.15) * Math.PI) * 0.84;
    for (const side of [-1, 1]) {
      const start = positions.length / 3;
      positions.push(t * 4.8, y, 0, t * 4.8 + 0.42, y - 0.13, length * side, next * 4.8, yn, 0);
      indices.push(start, start + 1, start + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeAnimalReliefGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.28, 0.08);
  shape.bezierCurveTo(-1.08, 0.54, -0.5, 0.68, 0.18, 0.6);
  shape.lineTo(0.64, 0.52);
  shape.lineTo(0.83, 0.86);
  shape.lineTo(1.1, 0.95);
  shape.lineTo(1.25, 0.76);
  shape.lineTo(1.1, 0.55);
  shape.lineTo(0.84, 0.43);
  shape.lineTo(0.62, 0.02);
  shape.lineTo(0.7, -0.62);
  shape.lineTo(0.39, -0.62);
  shape.lineTo(0.17, -0.05);
  shape.lineTo(-0.46, -0.05);
  shape.lineTo(-0.68, -0.62);
  shape.lineTo(-1, -0.62);
  shape.lineTo(-0.9, -0.02);
  shape.bezierCurveTo(-1.18, 0.04, -1.38, 0.34, -1.48, 0.62);
  shape.lineTo(-1.6, 0.55);
  shape.bezierCurveTo(-1.55, 0.27, -1.43, 0.13, -1.28, 0.08);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 5,
  });
  geometry.center();
  return geometry;
}

function RiverBanks() {
  const west = useMemo(() => makeBankGeometry(-1), []);
  const east = useMemo(() => makeBankGeometry(1), []);
  const material = useMemo(() => makeGroundMaterial(), []);
  useEffect(() => () => { west.dispose(); east.dispose(); material.dispose(); }, [east, west, material]);
  return <group><mesh geometry={west} material={material} receiveShadow /><mesh geometry={east} material={material} receiveShadow /></group>;
}

function PalmGrove() {
  const palmCount = 42;
  const leavesPerPalm = 11;
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const fronds = useRef<THREE.InstancedMesh>(null);
  const frondGeometry = useMemo(() => makeFrondGeometry(), []);
  const palms = useMemo(
    () => Array.from({ length: palmCount }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      let z = 118 - seeded(index + 28) * 272;
      if (side === 1 && z < 62 && z > -42) z = 80 + seeded(index + 22) * 35;
      return {
        x: riverCenterAt(z) + side * (riverHalfWidthAt(z) + 7 + seeded(index + 81) * 18),
        z,
        height: 0.72 + seeded(index + 177) * 0.66,
        twist: seeded(index + 251) * Math.PI * 2,
        lean: (seeded(index + 349) - 0.5) * 0.1,
      };
    }),
    []
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    palms.forEach((palm, palmIndex) => {
      const trunkHeight = 7.8 * palm.height;
      if (trunks.current) {
        const baseY = bankHeightAt(Math.abs(palm.x - riverCenterAt(palm.z)) - riverHalfWidthAt(palm.z), palm.z);
        dummy.position.set(palm.x, baseY + trunkHeight / 2, palm.z);
        dummy.rotation.set(palm.lean, palm.twist, -palm.lean * 0.55);
        dummy.scale.set(palm.height, palm.height, palm.height);
        dummy.updateMatrix();
        trunks.current.setMatrixAt(palmIndex, dummy.matrix);
        trunks.current.setColorAt(palmIndex, new THREE.Color(palmIndex % 3 === 0 ? "#7f553c" : "#533422"));
      }
      if (crowns.current) {
        dummy.position.set(palm.x, trunkHeight + 1.05, palm.z);
        dummy.rotation.set(0, palm.twist, 0);
        dummy.scale.setScalar(palm.height);
        dummy.updateMatrix();
        crowns.current.setMatrixAt(palmIndex, dummy.matrix);
      }
      for (let leafIndex = 0; leafIndex < leavesPerPalm; leafIndex += 1) {
        if (!fronds.current) continue;
        const instance = palmIndex * leavesPerPalm + leafIndex;
        dummy.position.set(palm.x, trunkHeight + 1.25, palm.z);
        dummy.rotation.set(
          (seeded(instance + 477) - 0.5) * 0.2,
          palm.twist + (leafIndex / leavesPerPalm) * Math.PI * 2,
          (seeded(instance + 581) - 0.5) * 0.2
        );
        dummy.scale.setScalar(palm.height * (0.84 + seeded(instance + 644) * 0.28));
        dummy.updateMatrix();
        fronds.current.setMatrixAt(instance, dummy.matrix);
        fronds.current.setColorAt(instance, new THREE.Color(instance % 4 === 0 ? "#657342" : "#314b35"));
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
        <cylinderGeometry args={[0.16, 0.34, 7.8, 10, 7]} />
        <meshStandardMaterial vertexColors roughness={0.96} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, palmCount]} castShadow>
        <sphereGeometry args={[0.55, 10, 8]} />
        <meshStandardMaterial color="#3c5238" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={fronds} args={[frondGeometry, undefined, palmCount * leavesPerPalm]} castShadow>
        <meshStandardMaterial vertexColors roughness={0.92} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function ReedsAndStones() {
  const reeds = useRef<THREE.InstancedMesh>(null);
  const stones = useRef<THREE.InstancedMesh>(null);
  const reedCount = 250;
  const stoneCount = 82;

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let index = 0; index < reedCount; index += 1) {
      if (!reeds.current) break;
      const side = index % 2 === 0 ? -1 : 1;
      let z = 125 - seeded(index + 122) * 290;
      if (side === 1 && z > 36 && z < 58) z -= 26;
      const height = 0.55 + seeded(index + 31) * 1.45;
      dummy.position.set(riverCenterAt(z) + side * (riverHalfWidthAt(z) + seeded(index + 73) * 2.8), height / 2, z);
      dummy.rotation.set(0, seeded(index + 178) * Math.PI, (seeded(index + 205) - 0.5) * 0.2);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      reeds.current.setMatrixAt(index, dummy.matrix);
      reeds.current.setColorAt(index, new THREE.Color(index % 5 === 0 ? "#b39851" : "#607044"));
    }
    for (let index = 0; index < stoneCount; index += 1) {
      if (!stones.current) break;
      const side = index % 2 === 0 ? -1 : 1;
      const z = 121 - seeded(index + 466) * 285;
      const scale = 0.2 + seeded(index + 388) * 0.68;
      dummy.position.set(riverCenterAt(z) + side * (riverHalfWidthAt(z) + 1.2 + seeded(index + 421) * 6), bankHeightAt(1.2 + seeded(index + 421) * 6, z) + scale * 0.22, z);
      dummy.rotation.set(seeded(index + 501), seeded(index + 543) * Math.PI, seeded(index + 577));
      dummy.scale.set(scale * 1.45, scale * 0.72, scale);
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
        <cylinderGeometry args={[0.017, 0.036, 1, 5]} />
        <meshStandardMaterial vertexColors roughness={1} />
      </instancedMesh>
      <instancedMesh ref={stones} args={[undefined, undefined, stoneCount]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#79634d" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RiverCoracle({
  position,
  scale = 1,
  rotationY = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  const boat = useRef<THREE.Group>(null);
  const hull = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.12), new THREE.Vector2(0.8, -0.12),
    new THREE.Vector2(1.23, 0.04), new THREE.Vector2(1.48, 0.28),
    new THREE.Vector2(1.55, 0.5), new THREE.Vector2(1.44, 0.5),
    new THREE.Vector2(1.28, 0.3), new THREE.Vector2(0.92, 0.2), new THREE.Vector2(0, 0.2),
  ], 40), []);
  useEffect(() => () => hull.dispose(), [hull]);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    const t = clock.elapsedTime, x = position[0], z = position[2];
    // Match riverWave so crests do not pass through the coracle's inner floor.
    const wave = Math.sin(z * 0.16 + t * 0.55) * 0.065
      + Math.sin(x * 0.72 - z * 0.055 - t * 0.48) * 0.035
      + Math.sin(x * 2.05 + z * 0.48 + t * 0.94) * 0.018
      + Math.sin(x * 3.8 - z * 0.28 - t * 1.15) * 0.009;
    boat.current.position.y = position[1] + wave;
    boat.current.rotation.z = Math.sin(clock.elapsedTime * 0.43 + position[0]) * 0.016;
  });
  return (
    <group ref={boat} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial color="#5a3a22" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.51, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.53, 0.1, 8, 36]} />
        <meshStandardMaterial color="#87623a" roughness={0.91} />
      </mesh>
      {[
        [1.34, 0.28],
        [1.12, 0.03],
      ].map(([radius, y]) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[radius, 0.026, 5, 32]} />
          <meshStandardMaterial color="#b28a51" roughness={1} />
        </mesh>
      ))}
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} position={[0, 0.55, z]} castShadow>
          <boxGeometry args={[2.55, 0.09, 0.1]} />
          <meshStandardMaterial color="#765032" roughness={0.94} />
        </mesh>
      ))}
      <group position={[0.08, 0.72, 0.04]} rotation={[0, -0.22, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 3.45, 8]} />
          <meshStandardMaterial color="#4b3020" roughness={0.92} />
        </mesh>
        <mesh position={[1.83, 0, 0]} rotation={[0, 0, -0.14]} castShadow>
          <boxGeometry args={[0.62, 0.34, 0.07]} />
          <meshStandardMaterial color="#66452a" roughness={0.95} />
        </mesh>
      </group>
      {[
        [-0.44, 0.62, 0.02],
        [0.18, 0.64, -0.14],
        [0.55, 0.6, 0.22],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} scale={[0.38, 0.28, 0.34]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={index === 1 ? "#b28e58" : "#967342"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CityDistrict({ material }: { material: THREE.Material }) {
  const buildings = useMemo(() => Array.from({ length: 78 }, (_, index) => {
    const zone = index % 3;
    const z = 116 - seeded(index + 113) * 300;
    const height = 3.8 + seeded(index + 29) * 9.2;
    let x: number;
    if (zone === 0) x = -72 - seeded(index + 71) * 40;
    else if (zone === 1) x = 46 + seeded(index + 181) * 70;
    else x = 48 + seeded(index + 203) * 36;
    return {
      x,
      y: 1.25 + height / 2,
      z,
      sx: 4.8 + seeded(index + 227) * 8.2,
      sy: height,
      sz: 5 + seeded(index + 269) * 9,
      rotation: (seeded(index + 301) - 0.5) * 0.12,
    };
  }), []);
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
      mesh.current.setColorAt(index, new THREE.Color(index % 4 === 0 ? "#8d6548" : "#aa7954"));
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }
  }, [buildings]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]} material={material} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function CitadelAndPalaces({ materials }: { materials: BabylonMaterials }) {
  const towers = [-29, -19, -9, 1];
  const blocks: Array<[number, number, number, number, number, number]> = [
    [-20, 8.2, -42, 14, 14, 24],
    [-1, 7.2, -43, 17, 12, 22],
    [9, 6.1, -71, 11, 10, 20],
    [-19, 5.8, -79, 15, 9, 16],
  ];
  return (
    <group>
      <mesh position={[-11, 5.4, -52]} castShadow receiveShadow>
        <boxGeometry args={[38, 10.8, 76, 2, 2, 4]} />
        <primitive object={materials.mud} attach="material" />
      </mesh>
      <mesh position={[-11, 6.35, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[36, 12.7, 7]} />
        <primitive object={materials.mudDark} attach="material" />
      </mesh>
      {towers.map((x, index) => (
        <group key={x} position={[x, 0, -10.5]}>
          <mesh position={[0, 7.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.5, 14.8, 9]} />
            <primitive object={materials.mud} attach="material" />
          </mesh>
          <mesh position={[0, 15.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[4.5, 1.15, 4.5]} />
            <primitive object={materials.mudDark} attach="material" />
          </mesh>
          {index % 2 === 0 && (
            <mesh position={[0, 7.2, 4.56]}>
              <boxGeometry args={[1.25, 2.4, 0.16]} />
              <primitive object={materials.wood} attach="material" />
            </mesh>
          )}
        </group>
      ))}
      {blocks.map(([x, y, z, sx, sy, sz], index) => (
        <mesh key={index} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[sx, sy, sz]} />
          <primitive object={index % 2 ? materials.mudDark : materials.mud} attach="material" />
        </mesh>
      ))}
      <mesh position={[-11, 11.35, -49]} castShadow>
        <boxGeometry args={[36, 0.55, 69]} />
        <primitive object={materials.mudDark} attach="material" />
      </mesh>
    </group>
  );
}

function AccessRoute({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => makeRibbonGeometry(ACCESS_POINTS.map((point) => new THREE.Vector3(...point)), 7.6), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} receiveShadow />;
}

function DefensiveCanal() {
  const geometry = useMemo(() => makeRibbonGeometry([
    new THREE.Vector3(-29, 0.1, -3),
    new THREE.Vector3(-21, 0.08, -5),
    new THREE.Vector3(-12, 0.08, -6),
    new THREE.Vector3(-2, 0.08, -6),
  ], 6.2, 38), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshPhysicalMaterial color="#315f68" roughness={0.2} metalness={0.05} clearcoat={0.7} clearcoatRoughness={0.15} />
    </mesh>
  );
}

function MerlonRow({ width, depth, y, material }: { width: number; depth: number; y: number; material: THREE.Material }) {
  const count = Math.floor(width / 1.45);
  const bases = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      const x = -width / 2 + 0.72 + index * 1.45;
      if (bases.current) {
        dummy.position.set(x, y, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bases.current.setMatrixAt(index, dummy.matrix);
      }
      if (caps.current) {
        dummy.position.set(x, y + 0.83, 0);
        dummy.rotation.set(0, Math.PI / 4, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        caps.current.setMatrixAt(index, dummy.matrix);
      }
    }
    [bases.current, caps.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [count, width, y]);

  return (
    <group>
      <instancedMesh ref={bases} args={[undefined, material, count]} castShadow>
        <boxGeometry args={[0.84, 1.15, depth]} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, material, count]} castShadow>
        <boxGeometry args={[0.58, 0.58, depth * 0.72]} />
      </instancedMesh>
    </group>
  );
}

function RoadMerlons({ material }: { material: THREE.Material }) {
  const countPerSide = 13;
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
      const side = sideIndex === 0 ? -1 : 1;
      for (let index = 0; index < countPerSide; index += 1) {
        const instance = sideIndex * countPerSide + index;
        dummy.position.set(ROAD_X + side * 11.2, 9.78, -22 - index * 7.25);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.current?.setMatrixAt(instance, dummy.matrix);
      }
    }
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={mesh} args={[undefined, material, countPerSide * 2]} castShadow>
      <boxGeometry args={[3.4, 1.1, 3.85]} />
    </instancedMesh>
  );
}

function RoadLionFriezes({ materials }: { materials: BabylonMaterials }) {
  const geometry = useMemo(() => makeAnimalReliefGeometry(), []);
  const countPerSide = 12;
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let index = 0; index < countPerSide; index += 1) {
      const z = -26 - index * 6.8;
      if (left.current) {
        dummy.position.set(ROAD_X - 9.78, 3.2, z);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.scale.set(0.82, 0.82, 0.82);
        dummy.updateMatrix();
        left.current.setMatrixAt(index, dummy.matrix);
      }
      if (right.current) {
        dummy.position.set(ROAD_X + 9.78, 3.2, z);
        dummy.rotation.set(0, -Math.PI / 2, 0);
        dummy.scale.set(-0.82, 0.82, 0.82);
        dummy.updateMatrix();
        right.current.setMatrixAt(index, dummy.matrix);
      }
    }
    [left.current, right.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <instancedMesh ref={left} args={[geometry, materials.ivory, countPerSide]} castShadow />
      <instancedMesh ref={right} args={[geometry, materials.gold, countPerSide]} castShadow />
    </group>
  );
}

function ProcessionalWay({ materials }: { materials: BabylonMaterials }) {
  // Extend the existing paving through the full 24.5-unit-deep gate and
  // past the new camera endpoint; there is no floor seam at the threshold.
  const roadLength = 185;
  const roadCenterZ = -122.5;
  const wallCenterZ = (-20 + GATE_Z) / 2;
  const wallLength = Math.abs(GATE_Z + 20);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_X, 1.44, roadCenterZ]} receiveShadow>
        <planeGeometry args={[16.8, roadLength, 10, 64]} />
        <primitive object={materials.stone} attach="material" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[ROAD_X + side * 11.2, 5.25, wallCenterZ]} castShadow receiveShadow>
            <boxGeometry args={[3.3, 8, wallLength]} />
            <primitive object={materials.mud} attach="material" />
          </mesh>
          <mesh position={[ROAD_X + side * 9.52, 3.5, wallCenterZ]} castShadow>
            <boxGeometry args={[0.2, 4.8, wallLength - 2]} />
            <primitive object={materials.blueDark} attach="material" />
          </mesh>
          <mesh position={[ROAD_X + side * 9.38, 5.92, wallCenterZ]}>
            <boxGeometry args={[0.13, 0.24, wallLength - 2]} />
            <primitive object={materials.gold} attach="material" />
          </mesh>
        </group>
      ))}
      <RoadMerlons material={materials.mudDark} />
      <RoadLionFriezes materials={materials} />
      {[-1, 1].map((side) => (
        <group key={`inner-${side}`}>
          <mesh position={[ROAD_X + side * 11.2, 4.05, GATE_Z - 63]} castShadow receiveShadow>
            <boxGeometry args={[3.3, 5.5, 75]} />
            <primitive object={materials.mud} attach="material" />
          </mesh>
          <mesh position={[ROAD_X + side * 9.52, 3.35, GATE_Z - 63]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 4.1, 75]} />
            <primitive object={materials.blueDark} attach="material" />
          </mesh>
          <mesh position={[ROAD_X + side * 9.38, 5.43, GATE_Z - 63]}>
            <boxGeometry args={[0.13, 0.18, 75]} />
            <primitive object={materials.gold} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Atmosphere() {
  const scene = useThree((state) => state.scene);
  const { globalProgress } = useScrollState();
  useEffect(() => {
    const fog = new THREE.Fog(HORIZON_COLOR, 75, 285);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene]);
  useFrame(() => {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const reveal = THREE.MathUtils.smoothstep(getApproachProgress(globalProgress), 0.22, 0.9);
    scene.fog.near = THREE.MathUtils.lerp(75, 105, reveal);
    scene.fog.far = THREE.MathUtils.lerp(285, 380, reveal);
  });
  return null;
}

export function BabylonJourneyScene() {
  const gl = useThree((state) => state.gl);
  const textures = useTexture([
    "/textures/babylon-blue-brick.webp",
    "/textures/babylon-blue-brick-bump.webp",
    "/textures/babylon-mud-brick.webp",
    "/textures/babylon-mud-brick-bump.webp",
  ]) as THREE.Texture[];
  const [blueMap, blueBump, mudMap, mudBump] = textures;

  useEffect(() => {
    const anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    [blueMap, blueBump].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3.2, 6.5);
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    });
    [mudMap, mudBump].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5.5, 5.5);
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    });
    blueMap.colorSpace = THREE.SRGBColorSpace;
    mudMap.colorSpace = THREE.SRGBColorSpace;
  }, [blueBump, blueMap, gl, mudBump, mudMap]);

  const materials = useMemo<BabylonMaterials>(() => ({
    blue: new THREE.MeshPhysicalMaterial({
      map: blueMap,
      bumpMap: blueBump,
      bumpScale: 0.2,
      color: "#356db2",
      roughness: 0.25,
      metalness: 0.015,
      clearcoat: 0.62,
      clearcoatRoughness: 0.2,
    }),
    blueDark: new THREE.MeshPhysicalMaterial({
      map: blueMap,
      bumpMap: blueBump,
      bumpScale: 0.15,
      color: "#214f89",
      roughness: 0.34,
      clearcoat: 0.44,
      clearcoatRoughness: 0.24,
    }),
    mud: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.24,
      color: "#a77a57",
      roughness: 0.93,
    }),
    wetMud: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.14,
      color: "#5c4939",
      roughness: 0.63,
      metalness: 0.01,
    }),
    city: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.2,
      color: "#a77a57",
      roughness: 0.95,
      vertexColors: true,
    }),
    mudDark: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.21,
      color: "#82593f",
      roughness: 0.97,
    }),
    stone: new THREE.MeshStandardMaterial({
      map: mudMap,
      bumpMap: mudBump,
      bumpScale: 0.11,
      color: "#c3a276",
      roughness: 0.82,
    }),
    gold: new THREE.MeshPhysicalMaterial({ color: "#e2b54f", roughness: 0.3, metalness: 0.08, clearcoat: 0.52 }),
    ivory: new THREE.MeshPhysicalMaterial({ color: "#ead8a8", roughness: 0.38, clearcoat: 0.35 }),
    wood: new THREE.MeshStandardMaterial({ color: "#402417", roughness: 0.78, metalness: 0.015 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#9b7639", roughness: 0.35, metalness: 0.5 }),
  }), [blueBump, blueMap, mudBump, mudMap]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  return (
    <group>
      <BabylonSky />
      <color attach="background" args={["#91b3cc"]} />
      <hemisphereLight args={["#d5e6f2", "#79614a", 1.6]} />
      <directionalLight
        position={SUN_DIRECTION.clone().multiplyScalar(130)}
        intensity={2.55}
        color="#ffe0b2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
        shadow-camera-near={1}
        shadow-camera-far={330}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={90}
        shadow-camera-bottom={-55}
      />
      <directionalLight position={[72, 34, 48]} intensity={0.48} color="#c7d8de" />
      <pointLight position={[ROAD_X, 17, GATE_Z + 12]} intensity={3.2} distance={90} color="#d9984f" />
      <River />
      <RiverBanks />
      <PalmGrove />
      <ReedsAndStones />
      <RiverCoracle position={[RIVER_X - 4.8, 0.18, 34]} scale={0.78} rotationY={-0.18} />
      <RiverCoracle position={[RIVER_X + 4.6, 0.16, -43]} scale={0.66} rotationY={0.24} />
      <CityDistrict material={materials.city} />
      <CitadelAndPalaces materials={materials} />
      <AccessRoute material={materials.stone} />
      <DefensiveCanal />
      <ProcessionalWay materials={materials} />
      <IshtarGateModel />
      <Atmosphere />
    </group>
  );
}
