"use client";

// src/components/HistoricalBadge.tsx
//
// The single visual implementation of the four-tier certainty system.
// Every info card that shows a historical claim must render this badge —
// no free-floating claim text without it. See HISTORICAL ACCURACY STRATEGY.

import type { Certainty } from "@/data/hotspots";

const CONFIG: Record<Certainty, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "var(--color-gold)" },
  probable: { label: "Probable", color: "var(--color-sand)" },
  hypothetical: { label: "Hypothetical", color: "var(--color-clay)" },
  disputed: { label: "Disputed", color: "var(--color-clay-dark)" },
};

export function HistoricalBadge({ certainty }: { certainty: Certainty }) {
  const { label, color } = CONFIG[certainty];
  return (
    <span className="historical-badge" style={{ borderColor: color, color }}>
      <span className="historical-badge-dot" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
