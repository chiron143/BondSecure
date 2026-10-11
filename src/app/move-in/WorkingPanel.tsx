"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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

  return (
    <div className="rounded-xl border border-line bg-paper p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Making your report</p>
        <span className="font-mono text-sm text-muted">{elapsed}</span>
      </div>
      <ol className="mt-3 space-y-2 text-sm">
        {STAGES.map((s, i) => (
          <li key={s.match} className={`flex items-center gap-2 ${i > current ? "text-muted" : ""}`}>
            {i < current ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            ) : i === current ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className={i === current ? "font-semibold" : ""}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">
        {secs > 180
          ? "Taking longer than usual: Google's AI is busy, so we're trying another model. Keep this page open."
          : "This takes a minute or two because the AI checks every second of your video carefully. Keep this page open."}
      </p>
    </div>
  );
}
