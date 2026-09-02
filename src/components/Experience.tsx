"use client";

// src/components/Experience.tsx
//
// Top-level assembly. Renders:
//   1. A tall DOM scroll track with one <section data-scene-section> per
//      scene (this is what ScrollController measures).
//   2. A single fixed-position <Canvas> layered behind it holding the
//      3D world — the canvas never scrolls, only the camera moves.
//   3. The persistent UI chrome (chapter nav, text overlay, badges).

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { ScrollController, useScrollState } from "@/components/ScrollController";
import { CameraRig } from "@/components/CameraRig";
import { SceneManager } from "@/components/SceneManager";
import { ChapterNavigation } from "@/components/ChapterNavigation";
import { SceneTextOverlay } from "@/components/SceneTextOverlay";
import { AudioManager } from "@/components/AudioManager";
import { TransitionOverlay } from "@/components/TransitionOverlay";
import { SCENES } from "@/data/scenes";

function ScrollTrack() {
  return (
    <>
      {SCENES.map((scene) => (
        <section
          key={scene.id}
          data-scene-section
          data-scene-id={scene.id}
          style={{ height: `${scene.scrollLengthVh}vh` }}
        />
      ))}
    </>
  );
}

function IntroGate({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="intro-gate">
      <h1 className="intro-gate-title">ENTER BABYLON</h1>
      <p className="intro-gate-subtitle">
        A cinematic journey to Babylon under Nebuchadnezzar II, c. 605–562 BCE.
      </p>
      <button className="intro-gate-button" onClick={onBegin}>
        Begin the journey
      </button>
      <p className="intro-gate-note">Best experienced with sound on.</p>
    </div>
  );
}

export function Experience() {
  const [started, setStarted] = useState(false);

  return (
    <ScrollController>
      {!started && <IntroGate onBegin={() => setStarted(true)} />}

      <div className="canvas-layer" aria-hidden={!started}>
        <Canvas
          camera={{ position: [0, 4, 40], fov: 42, near: 0.1, far: 1000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
        >
          <color attach="background" args={["#0e0d0b"]} />
          <fog attach="fog" args={["#16294D", 30, 140]} />
          <ambientLight intensity={0.35} color="#E8DFC8" />
          <directionalLight
            position={[20, 30, 10]}
            intensity={1.4}
            color="#C9A227"
            castShadow
          />
          <CameraRig />
          <SceneManager />
        </Canvas>
      </div>

      {started && (
        <>
          <ChapterNavigation />
          <SceneTextOverlay />
          <AudioManager />
          <TransitionOverlay />
        </>
      )}

      <div className="scroll-track" style={{ visibility: started ? "visible" : "hidden" }}>
        <ScrollTrack />
      </div>
    </ScrollController>
  );
}
