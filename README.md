# ENTER BABYLON — Technical Scaffold

Working Next.js + TypeScript + React Three Fiber + GSAP scaffold implementing
the architecture defined in the project plan: `SceneManager`, `CameraRig`,
`ScrollController`, `AudioManager`, `ChapterNavigation`, and the
`HistoricalBadge` classification system (Confirmed / Probable /
Hypothetical / Disputed).

## What's real vs. placeholder

**Real (production-shape) systems:**
- Scroll-driven camera timeline (`ScrollController` + `CameraRig` +
  `src/lib/cameraPath.ts`) — one continuous pinned-scroll experience, not
  separate pages, per the "single cinematic timeline" requirement.
- Scene preload/dispose logic (`SceneManager`) — mounts the active scene,
  preloads the next at 70% progress, unmounts anything else.
- The historical-accuracy content pipeline (`src/data/hotspots.ts` →
  `<HistoricalBadge>`) — every claim in the current 8 scenes is already
  written and classified with real sources.
- Audio crossfade skeleton (`AudioManager`) — logic is complete; only the
  actual `.mp3` ambience files are missing (drop them in `/public/audio/`).
- Full design-token CSS system (`globals.css`) matching the palette and
  typography defined in the creative direction.

**Visual production status:**
- Scenes 01–02 now have their first cinematic production pass: animated
  Euphrates water, instanced river vegetation, layered Babylon skyline,
  filmic lighting, a rebuilt glazed-brick Ishtar Gate, baked brick variation,
  instanced reliefs, and a camera path that ends at the closed gate.
- Scenes 03–08 still use procedural placeholder geometry that can later be
  replaced by GLTF assets without changing the camera/scroll/hotspot systems.
- No Draco/KTX2 compression pipeline yet (nothing to compress until real
  assets exist).

## Running it

```bash
npm install
npm run dev
```

Requires network access to Google Fonts at build time (Fraunces + Inter via
`next/font/google`). If your environment blocks that, swap to local font
files in `src/app/layout.tsx`.

## Next steps toward full implementation

1. Replace placeholder geometry scene-by-scene, starting with the two Hero
   Assets (Ishtar Gate, Etemenanki) since they're referenced by both
   `IshtarGateScene` and `NebuchadnezzarScene`/`BabylonMapScene`.
2. Add real ambience audio files.
3. Implement the wireframe/blueprint transition in `GardensScene` as a
   proper custom shader (currently a two-mesh opacity crossfade stand-in).
4. Add LOD switching and Draco/KTX2 loading once real assets land.

## Visual Production V1 additions
This pass replaces the original primitive-only presentation with reusable
procedural environment systems. The first milestone is Scenes 01–02; later
milestones cover the remaining scene pairs and their correction passes.
