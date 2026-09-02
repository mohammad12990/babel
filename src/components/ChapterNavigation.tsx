"use client";

// src/components/ChapterNavigation.tsx
//
// The only persistent chrome in the entire experience. Numbering is
// justified here — the content genuinely is an 8-step sequence — unlike
// a generic "01/02/03" applied to non-sequential content.

import { useScrollState } from "@/components/ScrollController";
import { SCENES } from "@/data/scenes";

export function ChapterNavigation() {
  const { activeSceneId, activeSceneIndex } = useScrollState();
  const scene = SCENES.find((s) => s.id === activeSceneId) ?? SCENES[0];

  return (
    <nav className="chapter-nav" aria-label="Chapter progress">
      <span className="chapter-nav-index">
        {String(activeSceneIndex).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
      </span>
      <span className="chapter-nav-title">{scene.title}</span>
      <div className="chapter-nav-track">
        {SCENES.map((s) => (
          <span
            key={s.id}
            className={
              "chapter-nav-tick" + (s.index === activeSceneIndex ? " chapter-nav-tick-active" : "")
            }
          />
        ))}
      </div>
    </nav>
  );
}
