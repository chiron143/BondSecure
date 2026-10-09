// Demo mode: a canned analysis used when there's no Gemini key, or when ?demo=1 is set.
// Timestamps are stored as fractions of the video, so it lines up with whatever video
// you upload. Label anything shown from this as "demo" (the UI does).

import type { MoveInAnalysis } from "./types";

const DEMO: { room: string; items: { item: string; condition: MoveInAnalysis["rooms"][0]["items"][0]["condition"]; note: string; at: number; source: "visual" | "narration" | "both" }[] }[] = [
  {
    room: "Bedroom",
    items: [
      { item: "Wall beside light switch", condition: "damaged", note: "Two dark scuff marks, roughly 10 cm long", at: 0.08, source: "both" },
      { item: "Carpet near desk", condition: "dirty", note: "Faded brown stain about the size of a hand", at: 0.18, source: "both" },
      { item: "Desk", condition: "damaged", note: "Front left corner chipped, bare wood showing", at: 0.27, source: "visual" },
      { item: "Window blind", condition: "damaged", note: "Two slats bent near the bottom", at: 0.36, source: "narration" },
      { item: "Wardrobe door", condition: "not_working", note: "Right door hinge loose, door sags and doesn't close flush", at: 0.45, source: "both" },
      { item: "Bed frame and mattress", condition: "good", note: "No visible damage", at: 0.52, source: "visual" },
    ],
  },
  {
    room: "Ensuite bathroom",
    items: [
      { item: "Shower silicone", condition: "dirty", note: "Black mould along the bottom seal", at: 0.64, source: "both" },
      { item: "Floor tile by door", condition: "damaged", note: "Small chip in one tile corner", at: 0.73, source: "visual" },
      { item: "Exhaust fan", condition: "not_working", note: "Fan doesn't turn on (said in narration)", at: 0.81, source: "narration" },
      { item: "Mirror and vanity", condition: "good", note: "No visible damage", at: 0.9, source: "visual" },
    ],
  },
];

export function demoAnalysis(durationSec: number): MoveInAnalysis {
  const d = Math.max(durationSec, 1);
  return {
    rooms: DEMO.map((r) => ({
      room: r.room,
      items: r.items.map((i) => ({
        item: i.item,
        condition: i.condition,
        note: i.note,
        t: Math.round(i.at * d * 10) / 10,
        source: i.source,
        confidence: i.source === "narration" ? "medium" : "high",
      })),
    })),
    refilm: ["The bathroom ceiling was too dark to see clearly. Film it again with the light on."],
  };
}
