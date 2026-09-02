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
import * as THREE from "three";
import { ScrollController } from "@/components/ScrollController";
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

export function Experience() {
  const [started, setStarted] = useState(false);

  return (
    <ScrollController>
      {!started && <IntroGate onBegin={() => setStarted(true)} />}

      <div className="canvas-layer" aria-hidden={!started}>
        <Canvas
          camera={{ position: [0, 4, 40], fov: 42, near: 0.1, far: 1000 }}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
          dpr={[1, 1.65]}
          shadows="soft"
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={["#2b211c"]} />
          <fog attach="fog" args={["#846449", 42, 170]} />
          <ambientLight intensity={0.24} color="#e7c89a" />
          <hemisphereLight args={["#e4bd86", "#251a14", 0.62]} />
          <directionalLight position={[-25, 30, 35]} intensity={1.65} color="#f0a85f" />
          <CameraRig />
          <SceneManager />
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
          <div className="scroll-cue" aria-hidden="true">
            <span>SCROLL TO APPROACH</span>
            <i />
          </div>
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
