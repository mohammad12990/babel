"use client";

// src/components/SceneTextOverlay.tsx
//
// Renders the sparse on-screen text defined per scene (scenes.ts).
// Deliberately dumb: no more than one heading + one subtext visible at
// once, per the "2-3 sentences max" creative direction rule.

import { useScrollState } from "@/components/ScrollController";
import { getSceneById } from "@/data/scenes";

export function SceneTextOverlay() {
  const { activeSceneId, sceneProgress } = useScrollState();
  const scene = getSceneById(activeSceneId);
  if (!scene) return null;

  const visible = scene.onScreenText.find((t) => {
    const until = t.until ?? t.at + 0.15;
    return sceneProgress >= t.at && sceneProgress <= until;
  });

  if (!visible) return null;

  return (
    <div className="scene-text-overlay">
      {visible.heading && <h1 className="scene-text-heading">{visible.heading}</h1>}
      {visible.subtext && <p className="scene-text-subtext">{visible.subtext}</p>}
    </div>
  );
}
