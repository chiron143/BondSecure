"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

// Testers got stuck waiting for the analysis with only a spinner to look at. This shows
// each stage, how long it's been, and what to expect.
const STAGES = [
  { match: "Opening", label: "Open your video" },
  { match: "Fingerprinting", label: "Fingerprint the file, so it proves which video it was" },
  { match: "Preparing", label: "Start a secure upload" },
  { match: "Uploading", label: "Upload to Google's Gemini AI" },
  { match: "Watching", label: "AI watches every second and listens (usually 1 to 2 minutes)" },
  { match: "Taking stills", label: "Take stills from your video" },
];

export default function WorkingPanel({ status, startedAt }: { status: string; startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const current = STAGES.reduce((at, s, i) => (status.includes(s.match) ? i : at), 0);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  // Stage-based progress, so the bar only moves when something actually finished.
  const progress = Math.round(((current + 0.5) / STAGES.length) * 100);

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-5" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-lg font-extrabold">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden /> Making your report
        </p>
        <span className="rounded-xl bg-muted px-3 py-1 font-mono text-2xl font-bold tabular-nums">{elapsed}</span>
      </div>
      <Progress value={progress} className="mt-4 h-2" aria-label="Report progress" />
      <ol className="mt-4 space-y-1.5">
        {STAGES.map((s, i) => (
          <li
            key={s.match}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
              i === current ? "bg-primary-soft font-bold" : i > current ? "text-muted-foreground" : ""
            }`}
          >
            {i < current ? (
              <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden />
            ) : i === current ? (
              <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
            ) : (
              <Circle className="size-5 shrink-0" aria-hidden />
            )}
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        {secs > 180
          ? "Taking longer than usual: Google's AI is busy, so we're trying another model. Keep this page open."
          : "This takes a minute or two because the AI checks every second of your video carefully. Keep this page open."}
      </p>
    </div>
  );
}
