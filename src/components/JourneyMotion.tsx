"use client";

import { createContext, useContext, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useScrollState } from "@/components/ScrollController";

const MotionContext = createContext<MutableRefObject<number> | null>(null);

export function JourneyMotion({ children }: { children: ReactNode }) {
  const { globalProgress } = useScrollState();
  const progress = useRef(globalProgress);
  // Update once, before the camera and doors. Reverse scrolling must never
  // close a door around a camera that is still moving through the threshold.
  useFrame((_, delta) => {
    const damping = 1 - Math.exp(-Math.min(delta, 0.1) * 6);
    progress.current += (globalProgress - progress.current) * damping;
    if (Math.abs(globalProgress - progress.current) < 0.000001) progress.current = globalProgress;
  }, -2);
  return <MotionContext.Provider value={progress}>{children}</MotionContext.Provider>;
}

export function useJourneyMotion() {
  const progress = useContext(MotionContext);
  if (!progress) throw new Error("Journey animation requires JourneyMotion.");
  return progress;
}
