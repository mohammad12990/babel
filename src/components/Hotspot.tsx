"use client";

// src/components/Hotspot.tsx
//
// A single interactive marker placed inside a 3D scene (via <Html> from
// drei) that opens a small classified info card on click. Kept
// deliberately minimal — one line of body copy, one badge, one source
// list — per the "never turn the page into a museum wall of text" rule.

import { useState } from "react";
import { Html } from "@react-three/drei";
import type { Vec3 } from "@/data/scenes";
import { HOTSPOTS } from "@/data/hotspots";
import { HistoricalBadge } from "@/components/HistoricalBadge";
import { requestCameraOverride } from "@/lib/cameraOverride";

export function Hotspot({ id, position }: { id: string; position: Vec3 }) {
  const [open, setOpen] = useState(false);
  const entry = HOTSPOTS[id];
  if (!entry) return null;

  return (
    <Html position={position} center distanceFactor={12} zIndexRange={[10, 0]}>
      <div className="hotspot">
        <button
          className="hotspot-marker"
          aria-label={entry.label}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            if (id.startsWith("map-")) requestCameraOverride(id);
            setOpen((v) => !v);
          }}
        >
          <span className="hotspot-marker-dot" />
        </button>

        {open && (
          <div className="hotspot-card" role="dialog">
            <div className="hotspot-card-header">
              <span className="hotspot-card-label">{entry.label}</span>
              <HistoricalBadge certainty={entry.certainty} />
            </div>
            <p className="hotspot-card-body">{entry.body}</p>
            <p className="hotspot-card-note">{entry.certaintyNote}</p>
          </div>
        )}
      </div>
    </Html>
  );
}
