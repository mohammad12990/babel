"use client";

import { Sky, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";

export const RIVER_X = -40;
export const ROAD_X = 20;
export const GATE_Z = -116;

type BabylonMaterials = {
  blue: THREE.MeshPhysicalMaterial;
  blueDark: THREE.MeshPhysicalMaterial;
  mud: THREE.MeshStandardMaterial;
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

const riverCenterAt = (z: number) => RIVER_X + Math.sin((z + 22) * 0.018) * 1.55;

function makeRiverGeometry() {
  const rows = 150;
  const columns = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const z = THREE.MathUtils.lerp(132, -176, t);
    const center = riverCenterAt(z);
    for (let column = 0; column <= columns; column += 1) {
      const across = column / columns;
      positions.push(center + THREE.MathUtils.lerp(-12.5, 12.5, across), 0.16, z);
      uvs.push(across, t * 9);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeBankGeometry(side: -1 | 1) {
  const rows = 112;
  const columns = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const z = THREE.MathUtils.lerp(135, -180, t);
    const center = riverCenterAt(z);
    const rough = Math.sin(t * 37) * 0.38 + Math.sin(t * 91) * 0.14;
    const riverEdge = 12.25 + rough;
    const offsets = [riverEdge, riverEdge + 2.5, riverEdge + 7, riverEdge + 17, riverEdge + 36, riverEdge + 82];
    const heights = [-0.06, 0.22, 0.68, 1.03, 1.18, 1.3];
    for (let column = 0; column < columns; column += 1) {
      positions.push(center + offsets[column] * side, heights[column] + rough * 0.09, z);
      uvs.push((column / (columns - 1)) * 7, t * 24);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const a = row * columns + column;
      const b = a + columns;
      if (side === 1) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
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
  const segments = 11;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = t * 4.8;
    const y = Math.sin(t * Math.PI) * 0.46 - Math.pow(t, 1.55) * 1.58;
    const width = THREE.MathUtils.lerp(0.36, 0.018, t);
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

function River() {
  const geometry = useMemo(() => makeRiverGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshPhysicalMaterial
        color="#1f6379"
        roughness={0.16}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.12}
        reflectivity={0.8}
        transparent
        opacity={0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RiverBanks({ material }: { material: THREE.Material }) {
  const west = useMemo(() => makeBankGeometry(-1), []);
  const east = useMemo(() => makeBankGeometry(1), []);
  useEffect(() => () => {
    west.dispose();
    east.dispose();
  }, [east, west]);
  return (
    <group>
      <mesh geometry={west} material={material} receiveShadow />
      <mesh geometry={east} material={material} receiveShadow />
    </group>
  );
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
      const z = 118 - seeded(index + 28) * 272;
      const eastRouteGap = side === 1 && z < 44 && z > -22;
      return {
        x: riverCenterAt(z) + side * (16 + seeded(index + 81) * (eastRouteGap ? 9 : 20)),
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
        dummy.position.set(palm.x, trunkHeight / 2, palm.z);
        dummy.rotation.set(palm.lean, palm.twist, -palm.lean * 0.55);
        dummy.scale.set(palm.height, palm.height, palm.height);
        dummy.updateMatrix();
        trunks.current.setMatrixAt(palmIndex, dummy.matrix);
        trunks.current.setColorAt(palmIndex, new THREE.Color(palmIndex % 3 === 0 ? "#7f553c" : "#533422"));
      }
      if (crowns.current) {
        dummy.position.set(palm.x, trunkHeight + 0.08, palm.z);
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
      const z = 125 - seeded(index + 122) * 290;
      const height = 0.55 + seeded(index + 31) * 1.45;
      dummy.position.set(riverCenterAt(z) + side * (12.4 + seeded(index + 73) * 3.2), height / 2, z);
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
      dummy.position.set(riverCenterAt(z) + side * (13.2 + seeded(index + 421) * 8), scale * 0.3, z);
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

function RiverBoat({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const boat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    boat.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.66 + position[2]) * 0.055;
    boat.current.rotation.z = Math.sin(clock.elapsedTime * 0.43 + position[0]) * 0.016;
  });
  return (
    <group ref={boat} position={position} scale={scale}>
      <mesh scale={[1.22, 0.23, 2.95]} castShadow>
        <sphereGeometry args={[1, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.61]} />
        <meshStandardMaterial color="#3a2216" roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.36, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.065, 2.85, 8]} />
        <meshStandardMaterial color="#352117" roughness={1} />
      </mesh>
      <mesh position={[0.44, 1.42, 0]} rotation={[0, 0, -0.13]} castShadow>
        <planeGeometry args={[0.98, 2.2, 2, 2]} />
        <meshStandardMaterial color="#d2c098" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
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
  const towers = [-29, -19, -9, 1, 11];
  const blocks: Array<[number, number, number, number, number, number]> = [
    [-20, 8.2, -42, 14, 14, 24],
    [-1, 7.2, -43, 17, 12, 22],
    [9, 6.1, -71, 11, 10, 20],
    [-19, 5.8, -79, 15, 9, 16],
  ];
  return (
    <group>
      <mesh position={[-8, 5.4, -52]} castShadow receiveShadow>
        <boxGeometry args={[43, 10.8, 76, 2, 2, 4]} />
        <primitive object={materials.mud} attach="material" />
      </mesh>
      <mesh position={[-8, 6.35, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[44, 12.7, 7]} />
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
      <mesh position={[-8, 11.35, -49]} castShadow>
        <boxGeometry args={[41, 0.55, 69]} />
        <primitive object={materials.mudDark} attach="material" />
      </mesh>
    </group>
  );
}

function AccessRoute({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => makeRibbonGeometry([
    new THREE.Vector3(-27, 1.35, 50),
    new THREE.Vector3(-24, 1.38, 40),
    new THREE.Vector3(-17, 1.4, 29),
    new THREE.Vector3(-5, 1.42, 17),
    new THREE.Vector3(7, 1.44, 4),
    new THREE.Vector3(15, 1.45, -8),
    new THREE.Vector3(ROAD_X, 1.46, -20),
  ], 8.4), []);
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
  const roadLength = 132;
  const roadCenterZ = (20 + GATE_Z) / 2;
  const wallCenterZ = (-20 + GATE_Z) / 2;
  const wallLength = Math.abs(GATE_Z + 20);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_X, 1.34, roadCenterZ]} receiveShadow>
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
    </group>
  );
}

function GateFacade({ z, scale = 1, materials }: { z: number; scale?: number; materials: BabylonMaterials }) {
  const animalGeometry = useMemo(() => makeAnimalReliefGeometry(), []);
  const goldReliefs = useRef<THREE.InstancedMesh>(null);
  const ivoryReliefs = useRef<THREE.InstancedMesh>(null);
  const reliefs = useMemo(() => {
    const placements: Array<{ position: [number, number, number]; gold: boolean; flip: boolean }> = [];
    for (const towerX of [-10.4, 10.4]) {
      for (let row = 0; row < 6; row += 1) {
        for (let column = 0; column < 2; column += 1) {
          placements.push({
            position: [towerX - 1.55 + column * 3.1, 4.3 + row * 3.65, 5.04],
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
      dummy.scale.set(relief.flip ? -0.78 : 0.78, 0.78, 0.78);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    [goldReliefs.current, ivoryReliefs.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [reliefs]);
  useEffect(() => () => animalGeometry.dispose(), [animalGeometry]);

  return (
    <group position={[0, 0, z]} scale={scale}>
      {[-10.4, 10.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 13.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[9.4, 27, 10]} />
            <primitive object={materials.blue} attach="material" />
          </mesh>
          <mesh position={[x, 27.7, 0.1]} castShadow>
            <boxGeometry args={[9.9, 0.8, 10.4]} />
            <primitive object={materials.gold} attach="material" />
          </mesh>
          <group position={[x, 0, 0]}>
            <MerlonRow width={9.4} depth={9.5} y={29} material={materials.blue} />
          </group>
        </group>
      ))}
      <mesh position={[0, 19.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.5, 8.4, 8.8]} />
        <primitive object={materials.blue} attach="material" />
      </mesh>
      <mesh position={[0, 23.52, 0.15]} castShadow>
        <boxGeometry args={[11.8, 0.7, 9.15]} />
        <primitive object={materials.gold} attach="material" />
      </mesh>
      <MerlonRow width={11.5} depth={8.4} y={25.1} material={materials.blue} />
      <mesh position={[0, 10.6, 4.47]} castShadow>
        <torusGeometry args={[5.25, 0.68, 14, 72, Math.PI]} />
        <primitive object={materials.gold} attach="material" />
      </mesh>
      {[-5.25, 5.25].map((x) => (
        <mesh key={x} position={[x, 5.35, 4.47]} castShadow>
          <boxGeometry args={[1.34, 10.7, 0.42]} />
          <primitive object={materials.gold} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 10.6, 4.71]} castShadow>
        <torusGeometry args={[4.55, 0.18, 10, 72, Math.PI]} />
        <primitive object={materials.ivory} attach="material" />
      </mesh>
      {[-4.55, 4.55].map((x) => (
        <mesh key={x} position={[x, 5.3, 4.71]} castShadow>
          <boxGeometry args={[0.36, 10.6, 0.18]} />
          <primitive object={materials.ivory} attach="material" />
        </mesh>
      ))}
      <group position={[0, 0, 4.31]}>
        {[-2.15, 2.15].map((x) => (
          <mesh key={x} position={[x, 5.3, 0]} castShadow>
            <boxGeometry args={[4.12, 10.6, 0.58]} />
            <primitive object={materials.wood} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 10.55, 0]} castShadow>
          <circleGeometry args={[4.15, 56, 0, Math.PI]} />
          <primitive object={materials.wood} attach="material" />
        </mesh>
        {[-3.2, -2.15, -1.08, 0, 1.08, 2.15, 3.2].map((x) => (
          <mesh key={x} position={[x, 5.55, 0.34]} castShadow>
            <boxGeometry args={[0.085, 10.25, 0.09]} />
            <primitive object={materials.bronze} attach="material" />
          </mesh>
        ))}
        {[2.4, 5.45, 8.5].map((y) => (
          <mesh key={y} position={[0, y, 0.36]} castShadow>
            <boxGeometry args={[8.05, 0.22, 0.11]} />
            <primitive object={materials.bronze} attach="material" />
          </mesh>
        ))}
      </group>
      {[-10.4, 10.4].flatMap((x) => [2.5, 6.15, 9.8, 13.45, 17.1, 20.75, 24.4].map((y) => (
        <mesh key={`${x}-${y}`} position={[x, y, 5.06]} castShadow>
          <boxGeometry args={[8.55, 0.19, 0.15]} />
          <primitive object={materials.gold} attach="material" />
        </mesh>
      )))}
      <instancedMesh ref={goldReliefs} args={[animalGeometry, materials.gold, reliefs.filter((r) => r.gold).length]} castShadow />
      <instancedMesh ref={ivoryReliefs} args={[animalGeometry, materials.ivory, reliefs.filter((r) => !r.gold).length]} castShadow />
    </group>
  );
}

function IshtarGate({ materials }: { materials: BabylonMaterials }) {
  return (
    <group position={[ROAD_X, 1.35, GATE_Z]}>
      <GateFacade z={0} materials={materials} />
      <GateFacade z={-15} scale={1.09} materials={materials} />
      {[-15.9, 15.9].map((x) => (
        <group key={x}>
          <mesh position={[x, 11.2, -7.5]} castShadow receiveShadow>
            <boxGeometry args={[5.7, 22.4, 15]} />
            <primitive object={materials.blueDark} attach="material" />
          </mesh>
          <mesh position={[x, 22.75, -7.5]} castShadow>
            <boxGeometry args={[6, 0.7, 15.4]} />
            <primitive object={materials.gold} attach="material" />
          </mesh>
        </group>
      ))}
      {[-38, 38].map((x) => (
        <group key={x}>
          <mesh position={[x, 7.1, -2.5]} castShadow receiveShadow>
            <boxGeometry args={[37, 14.2, 10]} />
            <primitive object={materials.mud} attach="material" />
          </mesh>
          <group position={[x, 0, -2.5]}>
            <MerlonRow width={37} depth={9.4} y={14.9} material={materials.mudDark} />
          </group>
        </group>
      ))}
    </group>
  );
}

function MovingMist() {
  const { globalProgress } = useScrollState();
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  useFrame(({ clock }) => {
    const fade = 1 - THREE.MathUtils.smoothstep(globalProgress, 0.38, 0.9);
    materials.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = fade * (0.13 + index * 0.035) * (0.86 + Math.sin(clock.elapsedTime * 0.17 + index) * 0.14);
    });
  });
  return (
    <group>
      {[-54, -82, -106].map((z, index) => (
        <mesh key={z} position={[ROAD_X, 7 + index * 1.7, z]}>
          <planeGeometry args={[72 + index * 16, 20 + index * 5]} />
          <meshBasicMaterial
            ref={(material) => { materials.current[index] = material; }}
            color="#d1b18e"
            transparent
            opacity={0.18}
            depthWrite={false}
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
    const fog = new THREE.Fog("#aa8d73", 28, 112);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene]);
  useFrame(() => {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const reveal = THREE.MathUtils.smoothstep(globalProgress, 0.22, 0.9);
    scene.fog.near = THREE.MathUtils.lerp(25, 42, reveal);
    scene.fog.far = THREE.MathUtils.lerp(108, 238, reveal);
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
      <Sky
        distance={450000}
        sunPosition={[-96, 28, -92]}
        inclination={0.49}
        azimuth={0.16}
        turbidity={8.6}
        rayleigh={2.15}
        mieCoefficient={0.0065}
        mieDirectionalG={0.86}
      />
      <color attach="background" args={["#806f67"]} />
      <hemisphereLight args={["#e8cfaa", "#251c19", 1.05]} />
      <directionalLight
        position={[-72, 56, 38]}
        intensity={2.55}
        color="#ffd093"
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
      <pointLight position={[ROAD_X, 17, GATE_Z + 12]} intensity={3.2} distance={90} color="#d9984f" />
      <River />
      <RiverBanks material={materials.mud} />
      <PalmGrove />
      <ReedsAndStones />
      <RiverBoat position={[RIVER_X - 3.2, 0.02, 55]} scale={0.82} />
      <RiverBoat position={[RIVER_X + 4.1, 0.01, -26]} scale={0.66} />
      <CityDistrict material={materials.city} />
      <CitadelAndPalaces materials={materials} />
      <AccessRoute material={materials.stone} />
      <DefensiveCanal />
      <ProcessionalWay materials={materials} />
      <IshtarGate materials={materials} />
      <MovingMist />
      <Atmosphere />
    </group>
  );
}
