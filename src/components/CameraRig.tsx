"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollState } from "@/components/ScrollController";
import { useJourneyMotion } from "@/components/JourneyMotion";
import { sampleGateEntry, sampleJourney } from "@/lib/journeyLayout";
import { ARRIVAL_PROGRESS, getApproachProgress, getGateEntryProgress } from "@/lib/journeyTimeline";

export function CameraRig() {
  const { camera, size } = useThree();
  const { isHoldMode } = useScrollState();
  const progress = useJourneyMotion();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame(({ pointer }) => {
    const portrait = size.width / size.height < 0.74;
    const p = progress.current;
    const entry = getGateEntryProgress(p);
    const reveal = sampleJourney(getApproachProgress(p), targetPosition.current, targetLookAt.current, portrait);
    const travel = p > ARRIVAL_PROGRESS
      ? sampleGateEntry(entry, targetPosition.current, targetLookAt.current, portrait)
      : 0;
    // Touch position must not steer the camera while holding to advance.
    if (!isHoldMode) {
      targetLookAt.current.x += pointer.x * 0.2 * reveal * (1 - travel);
      targetLookAt.current.y += pointer.y * 0.1 * reveal * (1 - travel);
    }
    camera.position.copy(targetPosition.current);
    camera.lookAt(targetLookAt.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = THREE.MathUtils.lerp(portrait ? 59 : 46, portrait ? 64 : 49, reveal);
      const entryFov = THREE.MathUtils.lerp(fov, portrait ? 66 : 52, travel);
      if (camera.fov !== entryFov) {
        camera.fov = entryFov;
        camera.updateProjectionMatrix();
      }
    }
  }, -1);
  return null;
}
