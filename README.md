# ENTER BABYLON — Technical Scaffold

## Gate opening and entry — 12 September 2026

The third chapter is now playable. At the end of the river/arrival route,
the camera holds its existing composition as two timber leaves open with
scroll. After a short pause it travels through the supplied Ishtar Gate
model and exits onto continuous paving behind the gate. Portrait and
landscape share the same centerline. Touch uses the existing hold gesture;
the first two chapters retain their previous twenty-second duration.

Doors and camera sample one smoothed progress value. Reverse scrolling
retraces the passage before closing the gate. The added leaves pivot into
the forecourt, in front of the model's arch, rather than cutting through
the vaulted roof. Timber seams and merged bronze fittings use four draw
calls in total. The supplied GLB and the river/sky assets are unchanged.
The animated doors and surrounding paving/walls are illustrative additions,
not a claim to an archaeologically established door mechanism.

Validation: production build, TypeScript, the existing approach checks and
`node scripts/check-gate-entry.mjs`. The entry check samples 1,001 poses per
format, checks the opening/entry sequence, reverse scrubbing and chapter
continuity, and ray-tests a 1.2-unit-wide camera corridor against the actual
production GLB and conservative door envelopes. The cloud browser could
not open the local preview, so full-scene appearance and touch performance
still need review on a graphics-capable device.

## River and sky update — 12 September 2026

The river now captures the actual sky, boats and banks with a planar reflection
pass, with per-pixel ripples, Fresnel reflectance and softer shallow edges.
Fine wave frequencies fade at a distance to reduce aliasing. Reflection targets
are capped at 512 px on mobile and 768 px on desktop, with no multisampling;
stationary views reuse captures between updates. The original river course and
camera route are preserved.

The sky uses a photographed CC0 Poly Haven panorama, compressed to 70 KB at 2K
for mobile and 197 KB at 4K for desktop. See `public/textures/ATTRIBUTION.md`.
Its sun orientation matches the directional light and water highlights. Sky and
water share the panorama; haze and the screen vignette are lighter.

Validation: production build and TypeScript checks pass. Both water and sky
vertex/fragment shaders compile and link under OpenGL ES 3.2 (Mesa EGL), and
the sky shader has been rendered separately at the starting camera. The existing
camera invariants pass for both formats. The cloud browser reports WebGL
unavailable, so full-scene appearance, frame rate and touch interaction still
need review on a graphics-capable device. Gate entry was implemented in the
subsequent update above.

## Previous review — 11 September 2026

Work continues on `improve/river-sky`, from the 4 September boat update.
The supplied Hassan Hadi Ishtar Gate model is now integrated, with its original
geometry and UVs. Its 14 embedded textures were resized and compressed: the
41.3 MB source is a 3.9 MB web asset. Credit and CC BY 4.0 licensing are available
from the entry screen and `public/models/ATTRIBUTION.md`.

The riverbanks now use continuous sediment terrain and a damp shoreline;
palms use individual leaflets. The camera follows the same bank route as the
access path, clears the citadel, and frames the gate differently in portrait.
Rounded coracle hulls have an inner floor above the waterline. Water and sky
share their sun direction; river fog now matches the land's distance haze.
The flat rectangular mist curtains have been removed.

At this review, only the approach and gate-arrival chapters were playable.
The opening/entry chapter has since been added in the update above.
Scene units and surrounding buildings are an illustrative reconstruction,
not an archaeological survey.

Validation: `npm run build`, `npm run typecheck`, and
`node scripts/check-journey.cjs`. The geometry check samples 1,001 positions
for each format, checking terrain clearance, route alignment, forward motion,
palace clearance and gate framing. Source/optimized geometry buffers were
also compared byte for byte, and every optimized texture decoded successfully.
The cloud preview cannot create a WebGL context, so the finished 3D rendering
and touch flow still require a check on a graphics-capable browser.

The entry screen waits for the scene's assets and reports loading/graphics
failure without allowing the journey to start in a blank canvas.

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
- Scene 03 now opens the doors and passes through the supplied gate model
  in the same continuous world. The route ends just inside the city.
- Scenes 04–08 still use procedural placeholder geometry that can later be
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
