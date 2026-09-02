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
import { Suspense, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { ScrollController, useScrollState } from "@/components/ScrollController";
import { CameraRig } from "@/components/CameraRig";
import { ChapterNavigation } from "@/components/ChapterNavigation";
import { SceneTextOverlay } from "@/components/SceneTextOverlay";
import { AudioManager } from "@/components/AudioManager";
import { BabylonJourneyScene } from "@/components/scenes/BabylonJourneyScene";
import { SCENES } from "@/data/scenes";

function ScrollTrack() {
  return (
    <>
      {SCENES.slice(0, 2).map((scene) => (
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
      <p className="intro-gate-kicker">AN INTERACTIVE ARCHAEOLOGICAL JOURNEY</p>
      <h1 className="intro-gate-title">ENTER BABYLON</h1>
      <p className="intro-gate-subtitle">
        Travel the Euphrates toward the city that shaped an ancient world.
      </p>
      <button
        className="intro-gate-button"
        onClick={() => {
          window.scrollTo({ top: 0 });
          onBegin();
        }}
      >
        Enter the city
      </button>
      <p className="intro-gate-note">Babylon · 605–562 BCE</p>
    </div>
  );
}

function InteractionCue() {
  const { isHoldMode, isHolding, globalProgress } = useScrollState();

  if (isHoldMode) {
    return (
      <div className={"hold-cue" + (isHolding ? " hold-cue-active" : "")} aria-hidden="true">
        <span className="hold-cue-ring" style={{ "--hold-progress": globalProgress } as CSSProperties} />
        <span>{isHolding ? "MOVING FORWARD" : "HOLD TO MOVE"}</span>
      </div>
    );
  }

  return (
    <div className="scroll-cue" aria-hidden="true">
      <span>SCROLL TO APPROACH</span>
      <i />
    </div>
  );
}

function ArrivalMoment() {
  const { activeSceneIndex, sceneProgress } = useScrollState();
  if (activeSceneIndex !== 2 || sceneProgress < 0.82) return null;
  const opacity = Math.min(1, (sceneProgress - 0.82) / 0.12);
  return (
    <div className="milestone-end" style={{ opacity }}>
      <span>THE GATE AWAITS</span>
      <small>03 / 08 — THE THRESHOLD</small>
    </div>
  );
}

export function Experience() {
  const [started, setStarted] = useState(false);

  return (
    <ScrollController interactionEnabled={started}>
      {!started && <IntroGate onBegin={() => setStarted(true)} />}

      <div className="canvas-layer" aria-hidden={!started}>
        <Canvas
          shadows
          camera={{ position: [-40, 4.25, 112], fov: 45, near: 0.1, far: 720 }}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
          dpr={[1, 1.8]}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.98;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.setClearColor(0x98725d, 1);
          }}
        >
          <Suspense fallback={null}>
            <BabylonJourneyScene />
            <CameraRig />
          </Suspense>
        </Canvas>
      </div>

      {started && (
        <>
          <div className="cinematic-vignette" aria-hidden="true" />
          <div className="cinematic-grain" aria-hidden="true" />
          <header className="experience-header">
            <span className="experience-brand">ENTER BABYLON</span>
            <span className="experience-era">605–562 BCE</span>
          </header>
          <InteractionCue />
          <ChapterNavigation />
          <SceneTextOverlay />
          <ArrivalMoment />
          <AudioManager />
        </>
      )}

      <div className="scroll-track" style={{ visibility: started ? "visible" : "hidden" }}>
        <ScrollTrack />
      </div>
    </ScrollController>
  );
}
