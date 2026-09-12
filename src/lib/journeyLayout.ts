import * as THREE from "three";

// Cinematic layout in scene units: river west, gate east. Not survey coordinates.
export const RIVER_X = -40;
export const ROAD_X = 20;
export const GATE_Z = -116;
export const WATER_Y = 0.16;
export const ROAD_Y = 1.46;
// Door placement is measured against the supplied model's front arch.
// Leaves swing into the open forecourt, clear of the vaulted passage.
export const GATE_DOOR_Z = GATE_Z - 5.05;
export const GATE_DOOR_HALF_WIDTH = 3.94;
export const GATE_OPEN_START = 0.06;
export const GATE_OPEN_END = 0.4;
export const GATE_ENTER_START = 0.48;
export const GATE_ENTRY_END_Z = GATE_Z - 43;
export const SUN_DIRECTION = new THREE.Vector3(-0.56, 0.091, -0.79).normalize();

export const riverCenterAt = (z: number) => RIVER_X + Math.sin((z + 22) * 0.018) * 1.55;
export const riverHalfWidthAt = (z: number) => 12.5 + Math.sin(z * 0.043) * 0.35 + Math.sin(z * 0.11) * 0.14;

// The bank path and camera share these points; no separate look-at spline.
export const ACCESS_POINTS: [number, number, number][] = [
  [-27.1, 0.48, 46],
  [-23, 0.82, 38],
  [-16, 1.15, 28],
  [-5, 1.4, 16],
  [7, ROAD_Y, 2],
  [16, ROAD_Y, -14],
  [ROAD_X, ROAD_Y, -30],
  [ROAD_X, ROAD_Y, -42],
];
export const accessCurve = new THREE.CatmullRomCurve3(ACCESS_POINTS.map((point) => new THREE.Vector3(...point)), false, "centripetal");

export function bankHeightAt(distanceFromEdge: number, z: number) {
  const distances = [-0.45, 1.2, 4, 9, 20, 40, 140];
  const heights = [-0.12, 0.3, 0.7, 1.08, 1.27, 1.3, 1.3];
  let height = 1.3;
  for (let i = 0; i < distances.length - 1; i++) {
    if (distanceFromEdge <= distances[i + 1]) {
      const t = THREE.MathUtils.clamp((distanceFromEdge - distances[i]) / (distances[i + 1] - distances[i]), 0, 1);
      height = THREE.MathUtils.lerp(heights[i], heights[i + 1], t);
      break;
    }
  }
  return height + Math.sin(z * 0.08) * Math.sin(distanceFromEdge * 0.24) * 0.08;
}

export const cameraCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(riverCenterAt(112), 3.45, 112),
  new THREE.Vector3(riverCenterAt(86), 3.4, 86),
  new THREE.Vector3(riverCenterAt(65) + 0.8, 3.3, 65),
  new THREE.Vector3(-34, 3.1, 55),
  ...ACCESS_POINTS.map(([x, y, z]) => new THREE.Vector3(x, Math.max(3.1, y + 2.25), z)),
  new THREE.Vector3(ROAD_X, 4.45, -64),
  new THREE.Vector3(ROAD_X, 5.1, -76),
], false, "centripetal");
cameraCurve.arcLengthDivisions = 500;
const gateLookAt = new THREE.Vector3(ROAD_X, 12.8, GATE_Z);

export function sampleJourney(progress: number, position: THREE.Vector3, lookAt: THREE.Vector3, portrait = false) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  // Arc-length sampling keeps speed consistent through the single bank turn.
  cameraCurve.getPointAt(p, position);
  const reveal = THREE.MathUtils.smoothstep(p, 0.68, 1);
  cameraCurve.getPointAt(Math.min(1, p + 18 / cameraCurve.getLength()), lookAt);
  lookAt.y = position.y - 0.18;
  lookAt.lerp(gateLookAt, reveal);
  // Portrait framing pulls back only once the camera is centered on the road.
  if (portrait) position.z += 32 * reveal;
  return reveal;
}

export function gateOpeningAt(progress: number) {
  return THREE.MathUtils.smootherstep(progress, GATE_OPEN_START, GATE_OPEN_END);
}

export function sampleGateEntry(progress: number, position: THREE.Vector3, lookAt: THREE.Vector3, portrait = false) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  sampleJourney(1, position, lookAt, portrait);
  const travel = THREE.MathUtils.smootherstep(p, GATE_ENTER_START, 1);
  // Hold the arrival composition while the doors open, then travel straight
  // through the real arch to the paved space beyond the model's rear wall.
  position.y = THREE.MathUtils.lerp(position.y, ROAD_Y + 2.2, travel);
  position.z = THREE.MathUtils.lerp(position.z, GATE_ENTRY_END_Z, travel);
  const lowerGaze = THREE.MathUtils.smootherstep(p, GATE_ENTER_START, 0.82);
  lookAt.y = THREE.MathUtils.lerp(12.8, ROAD_Y + 2.3, lowerGaze);
  lookAt.z = THREE.MathUtils.lerp(GATE_Z, position.z - 32, lowerGaze);
  return travel;
}
