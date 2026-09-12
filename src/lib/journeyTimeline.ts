import { SCENES } from "@/data/scenes";

// Keep scroll, touch, chapter labels and animation on the same timeline.
export const JOURNEY_SCENES = SCENES.slice(0, 3);
export const JOURNEY_LENGTH_VH = JOURNEY_SCENES.reduce((sum, scene) => sum + scene.scrollLengthVh, 0);
export const ARRIVAL_PROGRESS = (JOURNEY_SCENES[0].scrollLengthVh + JOURNEY_SCENES[1].scrollLengthVh) / JOURNEY_LENGTH_VH;
// The existing two chapters retain their twenty-second touch duration.
export const HOLD_DURATION_SECONDS = 20 / ARRIVAL_PROGRESS;

export function resolveJourneyProgress(progress: number) {
  const globalProgress = Math.min(1, Math.max(0, progress));
  const distance = globalProgress * JOURNEY_LENGTH_VH;
  let start = 0;
  for (const scene of JOURNEY_SCENES) {
    const end = start + scene.scrollLengthVh;
    if (globalProgress < end / JOURNEY_LENGTH_VH || scene === JOURNEY_SCENES[JOURNEY_SCENES.length - 1]) {
      return {
        activeSceneId: scene.id,
        activeSceneIndex: scene.index,
        sceneProgress: Math.min(1, Math.max(0, (distance - start) / scene.scrollLengthVh)),
        globalProgress,
      };
    }
    start = end;
  }
  throw new Error("The journey must contain at least one chapter.");
}

export const getApproachProgress = (progress: number) => Math.min(1, Math.max(0, progress / ARRIVAL_PROGRESS));
export const getGateEntryProgress = (progress: number) => Math.min(1, Math.max(0, (progress - ARRIVAL_PROGRESS) / (1 - ARRIVAL_PROGRESS)));
