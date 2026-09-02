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

**Placeholder (intentionally, to be swapped later):**
- All 3D geometry in `src/components/scenes/*.tsx` is primitive
  boxes/cylinders/planes standing in for the real GLTF assets listed in the
  3D ASSET PLAN. Swap the `<mesh>` blocks for `<primitive object={gltf.scene}>`
  once Blender exports exist — the camera/scroll/hotspot systems do not
  need to change.
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
This pass replaces the original primitive-only presentation with reusable procedural environment systems: atmospheric dust, animated water, instanced palms/crowds, relief motifs, denser city massing, improved Ishtar Gate, Processional Way, Etemenanki, palace, Gardens uncertainty blend, aligned Past/Present comparison, cinematic transition veil, and map camera overrides. These remain intentionally GLTF-replaceable; final museum-quality hero assets/textures belong to the Blender/GLTF production pass.
