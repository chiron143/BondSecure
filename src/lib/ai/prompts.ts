// Prompt and JSON schema for the move-in video analysis.
// The schema matches MoveInAnalysis in src/lib/movein/types.ts exactly.

export const MOVE_IN_PROMPT = `You are helping a renter in New South Wales, Australia document the condition of their room on move-in day, so they can prove later what was already there.

Watch the whole video and listen to the narration. The renter may point out problems out loud ("small chip on the tile", "fan doesn't work"); treat what they say as evidence too.

For each room, list the items visible (walls, floor/carpet, ceiling, windows, blinds/curtains, doors, wardrobe, desk, bed, lights, power points, appliances, bathroom fixtures, etc.).
For each item:
- condition: one of good, wear, dirty, damaged, not_working
- note: what's wrong in plain, specific words a tribunal member can picture (size, location, colour). For "good" items say "No visible damage".
- t: the time in seconds where the item, or the problem, is seen most clearly
- source: visual, narration, or both
- confidence: high, medium, or low. Use low if the footage is blurry, dark, or too fast to be sure.

Rules:
- Only report what you can actually see or hear. Never guess at damage you can't see.
- Prefer listing a real problem over listing every perfect item, but include the main items in each room even if they're fine.
- In "refilm", list any parts that were too dark, blurry or fast to judge, so the renter can film them again.
Return JSON only.`;

export const MOVE_IN_SCHEMA = {
  type: "object",
  properties: {
    rooms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          room: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                condition: { type: "string", enum: ["good", "wear", "dirty", "damaged", "not_working"] },
                note: { type: "string" },
                t: { type: "number" },
                source: { type: "string", enum: ["visual", "narration", "both"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["item", "condition", "note", "t", "source", "confidence"],
            },
          },
        },
        required: ["room", "items"],
      },
    },
    refilm: { type: "array", items: { type: "string" } },
  },
  required: ["rooms", "refilm"],
} as const;
