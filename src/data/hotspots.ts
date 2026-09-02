// src/data/hotspots.ts
//
// Every historical claim shown to the user passes through this file.
// `certainty` drives the visual badge rendered by <HistoricalBadge>.
// Do not add narrative copy elsewhere that bypasses this classification —
// see HISTORICAL ACCURACY STRATEGY in the project plan.

export type Certainty = "confirmed" | "probable" | "hypothetical" | "disputed";

export interface HotspotEntry {
  id: string;
  /** short label shown on the hotspot marker itself */
  label: string;
  /** 1-3 sentence body shown in the info card */
  body: string;
  certainty: Certainty;
  /** short plain-language reason for the certainty rating */
  certaintyNote: string;
  sources: string[];
}

export const HOTSPOTS: Record<string, HotspotEntry> = {
  "glazed-bricks": {
    id: "glazed-bricks",
    label: "Glazed Brick Façade",
    body: "The gate's surface is built from fired mudbrick coated in a blue-glazed silicate finish, a technique requiring precise kiln control at monumental scale.",
    certainty: "confirmed",
    certaintyNote: "Excavated bricks and full reconstructed panels survive.",
    sources: [
      "Koldewey excavations, Babylon (1899–1917)",
      "Pergamon Museum, Berlin — reconstructed Ishtar Gate",
    ],
  },
  "gate-lions": {
    id: "gate-lions",
    label: "Lions of Ishtar",
    body: "Striding lions in relief line the Processional Way approach, associated with the goddess Ishtar.",
    certainty: "confirmed",
    certaintyNote: "Multiple original relief panels recovered intact.",
    sources: ["Koldewey excavations, Babylon", "Pergamon Museum collection records"],
  },
  "gate-bulls": {
    id: "gate-bulls",
    label: "Bulls of Adad",
    body: "Aurochs figures on the gate represent Adad, god of storms — alternating with the mušḫuššu dragon in the brick relief program.",
    certainty: "confirmed",
    certaintyNote: "Directly attested in the recovered relief panels.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "gate-dragons": {
    id: "gate-dragons",
    label: "Mušḫuššu Dragon",
    body: "A composite creature — serpent head, lion forelegs, eagle hind claws — representing the god Marduk, Babylon's patron deity.",
    certainty: "confirmed",
    certaintyNote: "Recurs consistently across the gate's surviving relief panels.",
    sources: ["Koldewey excavations, Babylon", "Pergamon Museum collection records"],
  },
  "daily-life-note": {
    id: "daily-life-note",
    label: "Life on the Processional Way",
    body: "Merchants, livestock, and cart traffic likely filled the street outside festival periods, based on administrative and legal texts from the period.",
    certainty: "probable",
    certaintyNote: "Inferred from cuneiform administrative records, not direct depiction.",
    sources: ["Neo-Babylonian administrative archives (various, British Museum & Vorderasiatisches Museum)"],
  },
  "map-ishtar-gate": {
    id: "map-ishtar-gate",
    label: "Ishtar Gate",
    body: "The monumental northern entrance to the inner city, dedicated to Ishtar.",
    certainty: "confirmed",
    certaintyNote: "Location and structure directly excavated.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "map-processional-way": {
    id: "map-processional-way",
    label: "Processional Way",
    body: "The ceremonial road linking the Ishtar Gate to the Esagila temple complex.",
    certainty: "confirmed",
    certaintyNote: "Route and paving directly excavated.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "map-etemenanki": {
    id: "map-etemenanki",
    label: "Etemenanki",
    body: "The great ziggurat of Babylon, 'the foundation of heaven and earth.'",
    certainty: "confirmed",
    certaintyNote: "Foundation and base dimensions excavated; superstructure is reconstructed.",
    sources: ["Koldewey excavations, Babylon", "Esagila Tablet (BM 45688)"],
  },
  "map-esagila": {
    id: "map-esagila",
    label: "Esagila",
    body: "The main temple of Marduk, chief god of Babylon.",
    certainty: "confirmed",
    certaintyNote: "Location and foundations excavated.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "map-royal-palace": {
    id: "map-royal-palace",
    label: "Southern Palace",
    body: "The principal royal residence, expanded under Nebuchadnezzar II.",
    certainty: "confirmed",
    certaintyNote: "Foundations and throne room excavated.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "map-euphrates": {
    id: "map-euphrates",
    label: "Euphrates River",
    body: "The river bisected the city, crossed by a bridge on stone piers.",
    certainty: "confirmed",
    certaintyNote: "River course and bridge piers excavated.",
    sources: ["Koldewey excavations, Babylon"],
  },
  "ziggurat-function": {
    id: "ziggurat-function",
    label: "A Stepped Sanctuary",
    body: "Etemenanki served as the earthly foundation connecting the city to Marduk's temple above — the physical base for Babylon's central religious ritual.",
    certainty: "confirmed",
    certaintyNote: "Function attested directly in Neo-Babylonian temple texts.",
    sources: ["Esagila Tablet (BM 45688)"],
  },
  "tower-of-babel-tradition": {
    id: "tower-of-babel-tradition",
    label: "A Later Story",
    body: "Centuries later, the Hebrew Bible and Greek writers described a tower at Babylon linked to the confusion of languages. This is a literary tradition, not an archaeological record of Etemenanki itself.",
    certainty: "disputed",
    certaintyNote:
      "The link between Etemenanki and the Tower of Babel narrative is a later literary association, not an excavated fact.",
    sources: ["Genesis 11:1–9 (literary source, not archaeological)", "Herodotus, Histories, Book I (5th c. BCE eyewitness account, written ~150 years after Nebuchadnezzar II)"],
  },
  "nebuchadnezzar-contributions": {
    id: "nebuchadnezzar-contributions",
    label: "A Reign of Monumental Building",
    body: "Royal inscriptions credit Nebuchadnezzar II with rebuilding the Ishtar Gate, paving the Processional Way, restoring temples, and strengthening the city's double walls.",
    certainty: "confirmed",
    certaintyNote: "Directly attested in his own royal building inscriptions.",
    sources: ["Nebuchadnezzar II building inscriptions (East India House Inscription and others)"],
  },
  "royal-seal": {
    id: "royal-seal",
    label: "Royal Seal Impression",
    body: "Cylinder seals like this were rolled onto clay to authenticate royal and administrative documents.",
    certainty: "confirmed",
    certaintyNote: "A well-attested administrative practice with many surviving examples.",
    sources: ["Vorderasiatisches Museum, Berlin — Neo-Babylonian seal collection"],
  },
  "gardens-existence-debate": {
    id: "gardens-existence-debate",
    label: "An Unresolved Question",
    body: "Ancient Greek writers describe a spectacular terraced garden at Babylon. No inscription of Nebuchadnezzar II mentions it, and no confirmed archaeological remains of the gardens have been identified at the Babylon site.",
    certainty: "disputed",
    certaintyNote:
      "Described only in later Greek sources; absent from contemporary Babylonian royal inscriptions.",
    sources: [
      "Diodorus Siculus, Bibliotheca Historica (1st c. BCE, citing earlier lost sources)",
      "Strabo, Geography, Book XVI",
    ],
  },
  "nineveh-hypothesis": {
    id: "nineveh-hypothesis",
    label: "The Nineveh Hypothesis",
    body: "Some scholars argue the gardens described by Greek writers actually stood at Nineveh, built by the Assyrian king Sennacherib, and were later misattributed to Babylon.",
    certainty: "hypothetical",
    certaintyNote:
      "A serious scholarly proposal, notably by Stephanie Dalley, but not a scholarly consensus.",
    sources: ["Stephanie Dalley, The Mystery of the Hanging Garden of Babylon (2013)"],
  },
  "site-today": {
    id: "site-today",
    label: "Babylon Archaeological Site",
    body: "The ruins of Babylon lie near Hillah, Iraq. The site was inscribed as a UNESCO World Heritage Site in 2019.",
    certainty: "confirmed",
    certaintyNote: "Current, verifiable site status.",
    sources: ["UNESCO World Heritage List, 'Babylon' (inscribed 2019)"],
  },
};

export const getHotspots = (ids: string[]): HotspotEntry[] =>
  ids.map((id) => HOTSPOTS[id]).filter(Boolean);
