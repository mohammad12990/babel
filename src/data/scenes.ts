// src/data/scenes.ts
//
// Single source of truth for the 8-scene cinematic timeline.
// Camera positions are placeholder world-space coordinates matching the
// storyboard's camera language (dolly / rise / fly-through / drift).
// Replace `position` / `lookAt` values once real environment scale is set
// by the Blender/GLTF pipeline — the interpolation system does not change.

export type Vec3 = [number, number, number];

export interface CameraKeyframe {
  /** 0..1 progress through the scene's scroll range */
  progress: number;
  position: Vec3;
  lookAt: Vec3;
  fov?: number;
}

export interface OnScreenText {
  /** 0..1 progress at which this text becomes visible */
  at: number;
  /** 0..1 progress at which this text fades out (defaults to at + 0.15) */
  until?: number;
  heading?: string;
  subtext?: string;
}

export interface SceneDefinition {
  id: string;
  index: number; // 1-based, matches "03 / 08" chapter indicator
  title: string;
  /** relative scroll length — taller = more scroll distance = slower pacing */
  scrollLengthVh: number;
  cameraKeyframes: CameraKeyframe[];
  onScreenText: OnScreenText[];
  /** ids of hotspots (see hotspots.ts) active in this scene */
  hotspotIds: string[];
  ambienceTrack: string;
  /** true if this scene owns a free-roam interaction (map, slider) after its intro plays */
  hasFreeInteraction?: boolean;
  transitionOut?: "continuous" | "threshold" | "rise" | "fly-through" | "descend" | "match";
}

export const SCENES: SceneDefinition[] = [
  {
    id: "approach",
    index: 1,
    title: "APPROACHING BABYLON",
    scrollLengthVh: 220,
    cameraKeyframes: [
      { progress: 0, position: [0, 6, 60], lookAt: [0, 3, 0], fov: 42 },
      { progress: 0.55, position: [1.2, 4.6, 40], lookAt: [0, 4, -28], fov: 40 },
      { progress: 1, position: [0, 3.7, 23], lookAt: [0, 5.2, -48], fov: 37 },
    ],
    onScreenText: [
      { at: 0.05, until: 0.35, heading: "BABYLON" },
      {
        at: 0.4,
        until: 0.7,
        subtext: "A city that once stood at the heart of the ancient world.",
      },
    ],
    hotspotIds: [],
    ambienceTrack: "riverbank_dusk",
    transitionOut: "continuous",
  },
  {
    id: "ishtar-gate",
    index: 2,
    title: "THE ISHTAR GATE",
    scrollLengthVh: 240,
    cameraKeyframes: [
      { progress: 0, position: [0, 4.2, 18], lookAt: [0, 7.4, -20], fov: 42 },
      { progress: 0.55, position: [-0.45, 4.7, 1.5], lookAt: [0, 9.2, -20], fov: 43 },
      { progress: 0.82, position: [0.25, 5.35, -7.8], lookAt: [0, 10.8, -20], fov: 45 },
      { progress: 1, position: [0, 5.25, -12.7], lookAt: [0, 7.6, -20], fov: 47 },
    ],
    onScreenText: [{ at: 0.02, until: 0.22, heading: "02 / 08 — THE ISHTAR GATE" }],
    hotspotIds: ["glazed-bricks", "gate-lions", "gate-bulls", "gate-dragons"],
    ambienceTrack: "gate_threshold",
    transitionOut: "threshold",
  },
  {
    id: "processional-way",
    index: 3,
    title: "PROCESSIONAL WAY",
    scrollLengthVh: 260,
    cameraKeyframes: [
      { progress: 0, position: [0, 1.7, 0], lookAt: [0, 1.7, -12], fov: 45 },
      { progress: 1, position: [0, 1.8, -46], lookAt: [0, 1.8, -60], fov: 45 },
    ],
    onScreenText: [
      {
        at: 0.5,
        until: 0.75,
        subtext:
          "The Processional Way carried Babylon's most sacred festival, the Akitu, from the palace to the temple of Marduk.",
      },
    ],
    hotspotIds: ["daily-life-note"],
    ambienceTrack: "market_spatial",
    transitionOut: "rise",
  },
  {
    id: "babylon-map",
    index: 4,
    title: "THE HEART OF BABYLON",
    scrollLengthVh: 200,
    cameraKeyframes: [
      { progress: 0, position: [0, 6, -46], lookAt: [0, 1, -46], fov: 45 },
      { progress: 1, position: [0, 70, -70], lookAt: [0, 0, -70], fov: 50 },
    ],
    onScreenText: [],
    hotspotIds: [
      "map-ishtar-gate",
      "map-processional-way",
      "map-etemenanki",
      "map-esagila",
      "map-royal-palace",
      "map-euphrates",
    ],
    ambienceTrack: "city_hum",
    hasFreeInteraction: true,
    transitionOut: "fly-through",
  },
  {
    id: "etemenanki",
    index: 5,
    title: "ETEMENANKI",
    scrollLengthVh: 280,
    cameraKeyframes: [
      { progress: 0, position: [30, 2, -88], lookAt: [30, 12, -88], fov: 48 },
      { progress: 0.33, position: [30, 18, -86], lookAt: [30, 24, -86], fov: 44 },
      { progress: 0.66, position: [30, 34, -84], lookAt: [30, 38, -84], fov: 42 },
      { progress: 1, position: [30, 48, -82], lookAt: [30, 50, -82], fov: 38 },
    ],
    onScreenText: [
      { at: 0.1, until: 0.28, subtext: "A stepped tower rising seven levels above the city." },
      { at: 0.38, until: 0.56, subtext: "Its summit sanctuary was dedicated to the god Marduk." },
      {
        at: 0.66,
        until: 0.84,
        subtext:
          "Later tradition would remember this tower differently — as the Tower of Babel.",
      },
    ],
    hotspotIds: ["ziggurat-function", "tower-of-babel-tradition"],
    ambienceTrack: "wind_ascending",
    transitionOut: "descend",
  },
  {
    id: "nebuchadnezzar",
    index: 6,
    title: "NEBUCHADNEZZAR II",
    scrollLengthVh: 240,
    cameraKeyframes: [
      { progress: 0, position: [-30, 3, -70], lookAt: [-30, 3, -82], fov: 42 },
      { progress: 1, position: [-30, 3.5, -98], lookAt: [-30, 4, -108], fov: 38 },
    ],
    onScreenText: [
      {
        at: 0.15,
        until: 0.45,
        subtext:
          "Under Nebuchadnezzar II, Babylon became one of the monumental cities of the ancient world.",
      },
    ],
    hotspotIds: ["nebuchadnezzar-contributions", "royal-seal"],
    ambienceTrack: "palace_interior",
    transitionOut: "match",
  },
  {
    id: "gardens",
    index: 7,
    title: "THE HANGING GARDENS",
    scrollLengthVh: 300,
    cameraKeyframes: [
      { progress: 0, position: [-30, 15, -112], lookAt: [-30, 20, -122], fov: 44 },
      { progress: 1, position: [-27, 16, -108], lookAt: [-28, 19, -120], fov: 44 },
    ],
    onScreenText: [
      { at: 0.55, until: 0.62, heading: "BUT DID THEY ACTUALLY EXIST HERE?" },
      {
        at: 0.65,
        until: 0.95,
        subtext:
          "The Hanging Gardens are counted among the wonders of the ancient world — yet no confirmed archaeological trace has been found at Babylon itself.",
      },
    ],
    hotspotIds: ["gardens-existence-debate", "nineveh-hypothesis"],
    ambienceTrack: "water_cascade",
    transitionOut: "match",
  },
  {
    id: "babylon-today",
    index: 8,
    title: "BABYLON TODAY",
    scrollLengthVh: 200,
    cameraKeyframes: [
      { progress: 0, position: [0, 70, -70], lookAt: [0, 0, -70], fov: 50 },
      { progress: 1, position: [0, 70, -70], lookAt: [0, 0, -70], fov: 50 },
    ],
    onScreenText: [
      {
        at: 0.6,
        until: 0.85,
        subtext: "What remains of Babylon is only a fragment of the city that once stood here.",
      },
      { at: 0.88, subtext: "Explore the evidence. Understand the reconstruction." },
    ],
    hotspotIds: ["site-today"],
    ambienceTrack: "desert_wind_present",
    hasFreeInteraction: true,
  },
];

export const getSceneById = (id: string): SceneDefinition | undefined =>
  SCENES.find((s) => s.id === id);
