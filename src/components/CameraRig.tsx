"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";
import { GATE_Z, RIVER_X, ROAD_X } from "@/components/scenes/BabylonJourneyScene";

export function CameraRig() {
  const { camera, size } = useThree();
  const { globalProgress } = useScrollState();
  const currentPosition = useRef(new THREE.Vector3(RIVER_X, 4.25, 112));
  const currentLookAt = useRef(new THREE.Vector3(RIVER_X, 2.8, 66));
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  const positionPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(RIVER_X, 4.25, 112),
    new THREE.Vector3(RIVER_X - 0.8, 3.8, 88),
    new THREE.Vector3(RIVER_X + 0.5, 3.45, 63),
    new THREE.Vector3(RIVER_X + 1.5, 3.3, 44),
    new THREE.Vector3(-28, 3.35, 34),
    new THREE.Vector3(-13, 3.5, 26),
    new THREE.Vector3(4, 3.7, 20),
    new THREE.Vector3(ROAD_X, 3.95, 10),
    new THREE.Vector3(ROAD_X, 4.25, -23),
    new THREE.Vector3(ROAD_X, 4.75, -52),
    new THREE.Vector3(ROAD_X, 5.35, -78),
  ], false, "centripetal", 0.28), []);

  const lookPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(RIVER_X, 2.8, 66),
    new THREE.Vector3(RIVER_X, 2.9, 44),
    new THREE.Vector3(RIVER_X + 4, 3, 30),
    new THREE.Vector3(-24, 3.2, 25),
    new THREE.Vector3(-5, 3.4, 19),
    new THREE.Vector3(ROAD_X, 4.2, -8),
    new THREE.Vector3(ROAD_X, 5.7, -44),
    new THREE.Vector3(ROAD_X, 8.8, -82),
    new THREE.Vector3(ROAD_X, 12.6, GATE_Z),
  ], false, "centripetal", 0.28), []);

  useFrame(({ pointer }, delta) => {
    const progress = THREE.MathUtils.smootherstep(globalProgress, 0, 1);
    positionPath.getPointAt(progress, targetPosition.current);
    lookPath.getPointAt(progress, targetLookAt.current);

    const portrait = size.width / size.height < 0.74;
    const roadArrival = THREE.MathUtils.smoothstep(progress, 0.52, 1);
    if (portrait) targetPosition.current.z += roadArrival * 11;

    targetPosition.current.x += pointer.x * 0.22 * roadArrival;
    targetPosition.current.y += pointer.y * 0.1 * roadArrival;
    targetLookAt.current.x += pointer.x * 0.35 * roadArrival;
    targetLookAt.current.y += pointer.y * 0.14 * roadArrival;

    const damping = 1 - Math.exp(-delta * 4.7);
    currentPosition.current.lerp(targetPosition.current, damping);
    currentLookAt.current.lerp(targetLookAt.current, damping);
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const startFov = portrait ? 59 : 45;
      const endFov = portrait ? 62 : 49;
      const targetFov = THREE.MathUtils.lerp(startFov, endFov, roadArrival);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, damping);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
