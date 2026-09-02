// src/lib/cameraPath.ts
//
// Pure interpolation helpers for the CameraRig. No React, no Three.js
// side effects — kept testable in isolation.

import type { CameraKeyframe, Vec3 } from "@/data/scenes";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Cubic ease-in-out — every camera transition in this project uses this,
 *  never linear (see CAMERA PLAN: "no motion is ever linear"). */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export interface ResolvedCamera {
  position: Vec3;
  lookAt: Vec3;
  fov: number;
}

/**
 * Given a sorted list of keyframes and a 0..1 scene progress value,
 * find the surrounding pair and interpolate between them with easing.
 */
export function resolveCameraAtProgress(
  keyframes: CameraKeyframe[],
  progress: number
): ResolvedCamera {
  const p = Math.min(1, Math.max(0, progress));

  if (keyframes.length === 0) {
    return { position: [0, 2, 10], lookAt: [0, 0, 0], fov: 45 };
  }
  if (keyframes.length === 1) {
    const k = keyframes[0];
    return { position: k.position, lookAt: k.lookAt, fov: k.fov ?? 45 };
  }

  let start = keyframes[0];
  let end = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].progress && p <= keyframes[i + 1].progress) {
      start = keyframes[i];
      end = keyframes[i + 1];
      break;
    }
  }

  const span = end.progress - start.progress || 1;
  const localT = easeInOutCubic((p - start.progress) / span);

  return {
    position: lerpVec3(start.position, end.position, localT),
    lookAt: lerpVec3(start.lookAt, end.lookAt, localT),
    fov: lerp(start.fov ?? 45, end.fov ?? 45, localT),
  };
}
