"use client";

// src/components/SceneManager.tsx
//
// Decides which <Scene*> components are mounted at any moment:
//   - the active scene always renders
//   - the next scene preloads once the active scene crosses ~70% progress
//   - any scene more than one step away from active is unmounted
// This is the only file that should ever need editing to change the
// preload/dispose thresholds mentioned in the Technical Architecture plan.

import { Suspense, useMemo } from "react";
import { useScrollState } from "@/components/ScrollController";
import { SCENES } from "@/data/scenes";

import { ApproachScene } from "@/components/scenes/ApproachScene";
import { IshtarGateScene } from "@/components/scenes/IshtarGateScene";
import { ProcessionalWayScene } from "@/components/scenes/ProcessionalWayScene";
import { BabylonMapScene } from "@/components/scenes/BabylonMapScene";
import { EtemenankiScene } from "@/components/scenes/EtemenankiScene";
import { NebuchadnezzarScene } from "@/components/scenes/NebuchadnezzarScene";
import { GardensScene } from "@/components/scenes/GardensScene";
import { ModernBabylonScene } from "@/components/scenes/ModernBabylonScene";

const SCENE_COMPONENTS: Record<string, React.ComponentType<{ progress: number }>> = {
  approach: ApproachScene,
  "ishtar-gate": IshtarGateScene,
  "processional-way": ProcessionalWayScene,
  "babylon-map": BabylonMapScene,
  etemenanki: EtemenankiScene,
  nebuchadnezzar: NebuchadnezzarScene,
  gardens: GardensScene,
  "babylon-today": ModernBabylonScene,
};

const PRELOAD_THRESHOLD = 0.7;

export function SceneManager() {
  const { activeSceneId, sceneProgress } = useScrollState();

  const activeIndex = SCENES.findIndex((s) => s.id === activeSceneId);

  const mountedSceneIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeIndex === -1) return [SCENES[0].id];

    ids.add(SCENES[activeIndex].id);

    // Preload the next scene once we're most of the way through this one.
    if (sceneProgress >= PRELOAD_THRESHOLD && SCENES[activeIndex + 1]) {
      ids.add(SCENES[activeIndex + 1].id);
    }

    // Keep the previous scene mounted briefly for crossfade/match-cut scenes.
    if (sceneProgress <= 0.05 && SCENES[activeIndex - 1]) {
      ids.add(SCENES[activeIndex - 1].id);
    }

    return Array.from(ids);
  }, [activeIndex, sceneProgress]);

  return (
    <Suspense fallback={null}>
      {mountedSceneIds.map((id) => {
        const Component = SCENE_COMPONENTS[id];
        if (!Component) return null;
        const isActive = id === activeSceneId;
        return (
          <group key={id} visible={isActive}>
            <Component progress={isActive ? sceneProgress : id === SCENES[activeIndex + 1]?.id ? 0 : 1} />
          </group>
        );
      })}
    </Suspense>
  );
}
