// Shape of the move-in analysis. Gemini must return exactly this (see src/lib/ai/prompts.ts),
// and demo mode returns the same shape, so the UI never knows the difference.

export type Condition = "good" | "wear" | "dirty" | "damaged" | "not_working";

export interface AnalysedItem {
  item: string; // e.g. "Wall beside light switch"
  condition: Condition;
  note: string; // what's wrong, in plain words, e.g. "Two scuff marks about 10cm long"
  t: number; // seconds into the video where it's clearest
  source: "visual" | "narration" | "both";
  confidence: "high" | "medium" | "low";
}

export interface AnalysedRoom {
  room: string; // e.g. "Bedroom", "Ensuite bathroom"
  items: AnalysedItem[];
}

export interface MoveInAnalysis {
  rooms: AnalysedRoom[];
  /** Anything the model wants the student to film again (too dark, too fast) */
  refilm: string[];
}

/** One line of the final report, after the student has reviewed it. */
export interface ReportItem extends AnalysedItem {
  id: string;
  room: string;
  frame?: string; // JPEG data URL grabbed from the student's own video at `t`
  status: "pending" | "confirmed" | "removed";
}

export interface MoveInReport {
  propertyAddress: string;
  tenantName: string;
  moveInDate: string; // ISO date
  video: {
    name: string;
    sizeBytes: number;
    durationSec: number;
    lastModified: string; // ISO datetime from the file, a hint for when it was filmed
    sha256: string; // fingerprint of the exact video file, so it can't be swapped later
  };
  items: ReportItem[];
  createdAt: string; // ISO datetime
  demo: boolean;
}
