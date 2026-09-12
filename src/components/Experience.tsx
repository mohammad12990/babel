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
import { Component, Suspense, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";
import { ScrollController, useScrollState } from "@/components/ScrollController";
import { CameraRig } from "@/components/CameraRig";
import { ChapterNavigation } from "@/components/ChapterNavigation";
import { SceneTextOverlay } from "@/components/SceneTextOverlay";
import { AudioManager } from "@/components/AudioManager";
import { BabylonJourneyScene } from "@/components/scenes/BabylonJourneyScene";
import { JourneyMotion } from "@/components/JourneyMotion";
import { JOURNEY_SCENES } from "@/lib/journeyTimeline";
import { GATE_OPEN_END } from "@/lib/journeyLayout";

function ScrollTrack() {
  return (
    <>
      {JOURNEY_SCENES.map((scene) => (
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

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

function IntroGate({ onBegin, ready, failed }: { onBegin: () => void; ready: boolean; failed: boolean }) {
  return (
    <div className="intro-gate">
      <p className="intro-gate-kicker">AN INTERACTIVE ARCHAEOLOGICAL JOURNEY</p>
      <h1 className="intro-gate-title">ENTER BABYLON</h1>
      <p className="intro-gate-subtitle">
        Travel the Euphrates toward the city that shaped an ancient world.
      </p>
      <button
        className="intro-gate-button"
        disabled={!ready || failed}
        onClick={() => {
          window.scrollTo({ top: 0 });
          onBegin();
        }}
      >
        {failed ? "3D unavailable" : ready ? "Enter the city" : "Preparing the journey…"}
      </button>
      {failed && <p role="alert" className="scene-error">The 3D scene could not load. Check your connection and try a browser with graphics acceleration enabled.</p>}
      <p className="intro-gate-note">Babylon · 605–562 BCE</p>
      <a className="model-credit" href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer">Ishtar Gate model · Hassan Hadi · CC BY 4.0</a>
    </div>
  );
}

function InteractionCue() {
  const { isHoldMode, isHolding, globalProgress, activeSceneIndex, sceneProgress } = useScrollState();
  if (globalProgress >= 0.995) return null;
  const atGate = activeSceneIndex === 3;
  const opening = atGate && sceneProgress < GATE_OPEN_END;

  if (isHoldMode) {
    return (
      <div className={"hold-cue" + (isHolding ? " hold-cue-active" : "")} aria-hidden="true">
        <span className="hold-cue-ring" style={{ "--hold-progress": globalProgress } as CSSProperties} />
        <span>{opening ? (isHolding ? "OPENING THE GATE" : "HOLD TO OPEN THE GATE") : isHolding ? "MOVING FORWARD" : atGate ? "HOLD TO ENTER" : "HOLD TO MOVE"}</span>
      </div>
    );
  }

  return (
    <div className="scroll-cue" aria-hidden="true">
      <span>{opening ? "SCROLL TO OPEN THE GATE" : atGate ? "SCROLL TO ENTER" : "SCROLL TO APPROACH"}</span>
      <i />
    </div>
  );
}

function ArrivalMoment() {
  const { activeSceneIndex, sceneProgress } = useScrollState();
  if (activeSceneIndex !== 3 || sceneProgress < 0.94) return null;
  const opacity = Math.min(1, (sceneProgress - 0.94) / 0.06);
  return (
    <div className="milestone-end" style={{ opacity }}>
      <span>WITHIN BABYLON</span>
      <small>03 / 08 — THROUGH THE GATE</small>
    </div>
  );
}

export function Experience() {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setStarted(false); }, []);

  return (
    <ScrollController interactionEnabled={started}>
      {!started && <IntroGate onBegin={() => setStarted(true)} ready={ready} failed={failed} />}

      <div className="canvas-layer" aria-hidden={!started}>
        <SceneBoundary onError={onError}>
        <Canvas
          shadows
          camera={{ position: [-40, 4.25, 112], fov: 45, near: 0.1, far: 720 }}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
          dpr={[1, 1.6]}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.98;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.setClearColor(0x98725d, 1);
          }}
        >
          <Suspense fallback={null}>
            <JourneyMotion>
              <BabylonJourneyScene />
              <CameraRig />
              <SceneReady onReady={onReady} />
            </JourneyMotion>
          </Suspense>
        </Canvas>
        </SceneBoundary>
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
