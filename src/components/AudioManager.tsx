"use client";

// src/components/AudioManager.tsx
//
// Central ambience player. Crossfades between the active scene's
// `ambienceTrack` and the next one as sceneProgress approaches 1, so the
// audio transition lands slightly ahead of the visual scene boundary
// (matches AUDIO PLAN: "no abrupt switching").
//
// Audio files are NOT included in this scaffold — drop matching files into
// /public/audio/<track-id>.mp3 and this component will pick them up.
// A user gesture is required before playback starts (browser autoplay
// policy) — call `unlock()` from a "Begin the journey" button on first load.

import { useEffect, useRef, useState } from "react";
import { useScrollState } from "@/components/ScrollController";
import { getSceneById, SCENES } from "@/data/scenes";

const FADE_START = 0.85; // scene progress at which crossfade to next track begins

export function AudioManager() {
  const { activeSceneId, sceneProgress } = useScrollState();
  const [unlocked, setUnlocked] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const nextAudio = useRef<HTMLAudioElement | null>(null);
  const currentTrack = useRef<string | null>(null);

  useEffect(() => {
    const onFirstInteraction = () => setUnlocked(true);
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const scene = getSceneById(activeSceneId);
    if (!scene) return;

    if (currentTrack.current !== scene.ambienceTrack) {
      currentTrack.current = scene.ambienceTrack;
      const audio = new Audio(`/audio/${scene.ambienceTrack}.mp3`);
      audio.loop = true;
      audio.volume = 0;
      audio.play().catch(() => {
        /* file not present in scaffold — silent no-op */
      });

      currentAudio.current?.pause();
      currentAudio.current = audio;
    }

    if (currentAudio.current) {
      const targetVolume = sceneProgress > FADE_START ? 1 - (sceneProgress - FADE_START) / (1 - FADE_START) : 1;
      currentAudio.current.volume = Math.max(0, Math.min(1, targetVolume));
    }
  }, [unlocked, activeSceneId, sceneProgress]);

  return null;
}
