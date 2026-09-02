"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";

export function CameraRig() {
  const { camera, size } = useThree();
  const { globalProgress } = useScrollState();
  const currentPosition = useRef(new THREE.Vector3(0, 4.4, 82));
  const currentLookAt = useRef(new THREE.Vector3(0, 3.4, 28));
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  const positionPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 4.4, 82),
          new THREE.Vector3(-0.8, 3.75, 58),
          new THREE.Vector3(0.7, 3.2, 31),
          new THREE.Vector3(-0.35, 3.05, 2),
          new THREE.Vector3(0.3, 3.45, -24),
          new THREE.Vector3(-0.15, 4.35, -42),
          new THREE.Vector3(0, 5.15, -55),
        ],
        false,
        "catmullrom",
        0.22
      ),
    []
  );

  const lookPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 3.2, 26),
          new THREE.Vector3(0, 3.5, -5),
          new THREE.Vector3(0, 4.5, -38),
          new THREE.Vector3(0, 7.3, -72),
          new THREE.Vector3(0, 10.7, -105),
        ],
        false,
        "catmullrom",
        0.28
      ),
    []
  );

  useFrame(({ pointer }, delta) => {
    const progress = THREE.MathUtils.smootherstep(globalProgress, 0, 1);
    positionPath.getPointAt(progress, targetPosition.current);
    lookPath.getPointAt(progress, targetLookAt.current);

    const portrait = size.width / size.height < 0.74;
    const arrival = THREE.MathUtils.smoothstep(progress, 0.55, 1);
    if (portrait) targetPosition.current.z += arrival * 12;

    targetPosition.current.x += pointer.x * 0.32 * arrival;
    targetPosition.current.y += pointer.y * 0.12 * arrival;
    targetLookAt.current.x += pointer.x * 0.48 * arrival;
    targetLookAt.current.y += pointer.y * 0.18 * arrival;

    const damping = 1 - Math.exp(-delta * 4.8);
    currentPosition.current.lerp(targetPosition.current, damping);
    currentLookAt.current.lerp(targetLookAt.current, damping);
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const startFov = portrait ? 56 : 44;
      const endFov = portrait ? 61 : 48;
      const targetFov = THREE.MathUtils.lerp(startFov, endFov, arrival);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, damping);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
