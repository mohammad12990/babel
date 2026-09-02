"use client";

// src/components/ScrollController.tsx
//
// Owns the DOM scroll surface: one pinned section per scene, each sized by
// `scrollLengthVh`. Emits { activeSceneIndex, progress } so CameraRig and
// SceneManager can react without re-implementing scroll math themselves.
//
// Architecture note: this is deliberately the ONLY place that touches
// ScrollTrigger directly. Scene components never register their own
// triggers — they read progress from context instead. This keeps the
// "one continuous timeline, not separate pages" requirement enforceable
// in one file.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SCENES } from "@/data/scenes";

gsapRegister();

function gsapRegister() {
  if (typeof window === "undefined") return;
  // Registered lazily so this file stays import-safe during SSR.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gsap = require("gsap").gsap;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ScrollTrigger = require("gsap/ScrollTrigger").ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollState {
  activeSceneId: string;
  activeSceneIndex: number; // matches SceneDefinition.index (1-based)
  /** progress 0..1 within the active scene only */
  sceneProgress: number;
  /** progress 0..1 across the entire experience — drives preload look-ahead */
  globalProgress: number;
}

const ScrollContext = createContext<ScrollState>({
  activeSceneId: SCENES[0].id,
  activeSceneIndex: 1,
  sceneProgress: 0,
  globalProgress: 0,
});

export const useScrollState = () => useContext(ScrollContext);

export function ScrollController({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollState>({
    activeSceneId: SCENES[0].id,
    activeSceneIndex: 1,
    sceneProgress: 0,
    globalProgress: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const gsap = require("gsap").gsap;
    const ScrollTrigger = require("gsap/ScrollTrigger").ScrollTrigger;

    const triggers: any[] = [];
    const sectionEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene-section]")
    );

    sectionEls.forEach((el, i) => {
      const scene = SCENES[i];
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self: any) => {
          setState((prev) => ({
            ...prev,
            activeSceneId: scene.id,
            activeSceneIndex: scene.index,
            sceneProgress: self.progress,
          }));
        },
        onToggle: (self: any) => {
          if (self.isActive) {
            setState((prev) => ({
              ...prev,
              activeSceneId: scene.id,
              activeSceneIndex: scene.index,
            }));
          }
        },
      });
      triggers.push(trigger);
    });

    // Global progress across the whole page, used for scene preload/dispose.
    const globalTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self: any) => {
        setState((prev) => ({ ...prev, globalProgress: self.progress }));
      },
    });
    triggers.push(globalTrigger);

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} id="scroll-root">
      <ScrollContext.Provider value={state}>{children}</ScrollContext.Provider>
    </div>
  );
}
