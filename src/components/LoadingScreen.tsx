"use client";

import { useProgress } from "@react-three/drei";

export function LoadingScreen({ visible }: { visible: boolean }) {
  const { progress } = useProgress();

  if (!visible) return null;

  return (
    <div className="loading-screen" aria-live="polite">
      <div className="loading-screen-title">ENTER BABYLON</div>
      <div className="loading-screen-bar">
        <div className="loading-screen-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-screen-hint">Preparing the journey to 605 BCE</div>
    </div>
  );
}
