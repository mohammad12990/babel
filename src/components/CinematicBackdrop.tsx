"use client";

import { getImageProps } from "next/image";
import { useScrollState } from "@/components/ScrollController";

const SCENE_MEDIA = {
  approach: {
    desktop: "/images/approach-desktop.webp",
    mobile: "/images/approach-mobile.webp",
    alt: "Ancient Babylon seen across the Euphrates at golden hour",
  },
  "ishtar-gate": {
    desktop: "/images/gate-desktop.webp",
    mobile: "/images/gate-mobile.webp",
    alt: "A reconstructed Ishtar Gate at golden hour",
  },
} as const;

type ReleasedSceneId = keyof typeof SCENE_MEDIA;

function ResponsiveSceneImage({
  sceneId,
  priority,
}: {
  sceneId: ReleasedSceneId;
  priority: boolean;
}) {
  const media = SCENE_MEDIA[sceneId];
  const desktop = getImageProps({
    src: media.desktop,
    alt: media.alt,
    width: 2400,
    height: 1600,
    sizes: "100vw",
    quality: 90,
    priority,
  }).props;
  const mobile = getImageProps({
    src: media.mobile,
    alt: media.alt,
    width: 1080,
    height: 1920,
    sizes: "100vw",
    quality: 90,
    priority,
  }).props;

  return (
    <picture>
      <source media="(max-width: 700px)" srcSet={mobile.srcSet} />
      <img {...desktop} className="cinematic-backdrop-image" />
    </picture>
  );
}

export function CinematicBackdrop() {
  const { activeSceneId, sceneProgress } = useScrollState();
  const sceneId: ReleasedSceneId =
    activeSceneId === "ishtar-gate" ? "ishtar-gate" : "approach";
  const scale =
    sceneId === "approach"
      ? 1.015 + sceneProgress * 0.055
      : 1.005 + sceneProgress * 0.095;
  const translateY =
    sceneId === "approach" ? sceneProgress * -0.7 : sceneProgress * 0.35;

  return (
    <div
      key={sceneId}
      className={`cinematic-backdrop cinematic-backdrop-${sceneId}`}
      style={{
        "--backdrop-scale": scale,
        "--backdrop-y": `${translateY}%`,
      } as React.CSSProperties}
    >
      <ResponsiveSceneImage sceneId={sceneId} priority={sceneId === "approach"} />
      <div className="cinematic-backdrop-grade" />
      {sceneId === "ishtar-gate" && sceneProgress > 0.9 && (
        <div className="milestone-end" aria-live="polite">
          <span>THE GATE AWAITS</span>
          <small>03 / 08 — THE THRESHOLD</small>
        </div>
      )}
    </div>
  );
}
