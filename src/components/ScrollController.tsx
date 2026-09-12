"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { HOLD_DURATION_SECONDS, JOURNEY_SCENES, resolveJourneyProgress } from "@/lib/journeyTimeline";

export interface ScrollState {
  activeSceneId: string;
  activeSceneIndex: number;
  sceneProgress: number;
  globalProgress: number;
  isHoldMode: boolean;
  isHolding: boolean;
}

const initialState: ScrollState = {
  activeSceneId: JOURNEY_SCENES[0].id,
  activeSceneIndex: JOURNEY_SCENES[0].index,
  sceneProgress: 0,
  globalProgress: 0,
  isHoldMode: false,
  isHolding: false,
};

const ScrollContext = createContext<ScrollState>(initialState);

export const useScrollState = () => useContext(ScrollContext);

export function ScrollController({
  children,
  interactionEnabled = false,
}: {
  children: ReactNode;
  interactionEnabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const holdProgress = useRef(0);
  const holding = useRef(false);
  const [isHoldMode, setIsHoldMode] = useState(false);
  const [state, setState] = useState<ScrollState>(initialState);

  const updateProgress = useCallback((progress: number) => {
    holdProgress.current = Math.min(1, Math.max(0, progress));
    const next = resolveJourneyProgress(holdProgress.current);
    setState((previous) => ({
      ...previous,
      ...next,
      isHoldMode,
      isHolding: holding.current,
    }));
  }, [isHoldMode]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px) and (pointer: coarse)");
    const sync = () => setIsHoldMode(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setState((previous) => ({ ...previous, isHoldMode }));
    document.documentElement.classList.toggle("mobile-hold-experience", isHoldMode && interactionEnabled);
    if (isHoldMode && interactionEnabled) window.scrollTo({ top: 0, behavior: "instant" });
    return () => document.documentElement.classList.remove("mobile-hold-experience");
  }, [interactionEnabled, isHoldMode]);

  useEffect(() => {
    if (isHoldMode || !interactionEnabled) return;
    const gsap = require("gsap").gsap;
    const ScrollTrigger = require("gsap/ScrollTrigger").ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self: { progress: number }) => updateProgress(self.progress),
    });
    ScrollTrigger.refresh();
    return () => trigger.kill();
  }, [isHoldMode, interactionEnabled, updateProgress]);

  useEffect(() => {
    if (!isHoldMode || !interactionEnabled) return;
    let frame = 0;
    let previousTime = performance.now();

    const advance = (time: number) => {
      const delta = Math.min(48, time - previousTime);
      previousTime = time;
      if (holding.current && holdProgress.current < 1) {
        const nextProgress = Math.min(1, holdProgress.current + delta / (1000 * HOLD_DURATION_SECONDS));
        if (nextProgress >= 1) holding.current = false;
        updateProgress(nextProgress);
      }
      frame = requestAnimationFrame(advance);
    };

    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [interactionEnabled, isHoldMode, updateProgress]);

  const startHolding = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isHoldMode || !interactionEnabled || holdProgress.current >= 1) return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    holding.current = true;
    setState((previous) => ({ ...previous, isHolding: true }));
  };

  const stopHolding = (event?: ReactPointerEvent<HTMLDivElement>) => {
    if (!holding.current) return;
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    holding.current = false;
    setState((previous) => ({ ...previous, isHolding: false }));
  };

  useEffect(() => {
    const pause = () => {
      holding.current = false;
      setState((previous) => ({ ...previous, isHolding: false }));
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ ...state, isHoldMode, isHolding: state.isHolding }),
    [isHoldMode, state]
  );

  return (
    <div
      ref={containerRef}
      id="scroll-root"
      className={isHoldMode ? "hold-mode" : undefined}
      onPointerDown={startHolding}
      onPointerUp={stopHolding}
      onPointerCancel={stopHolding}
      onLostPointerCapture={stopHolding}
      onContextMenu={(event) => {
        if (isHoldMode && interactionEnabled) event.preventDefault();
      }}
    >
      <ScrollContext.Provider value={contextValue}>{children}</ScrollContext.Provider>
    </div>
  );
}
