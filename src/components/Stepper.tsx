import { Check, FileText, ScanSearch, Video } from "lucide-react";

// The three steps of Bond Secure, shown on the home page and at the top of each flow.
// Move-in day covers steps 1 and 2; step 3 happens months later if the bond isn't returned.
export const STEPS = [
  { title: "Film your room", detail: "Upload a walk-through video", Icon: Video },
  { title: "Check the AI report", detail: "Every defect, timestamped, with a still", Icon: ScanSearch },
  { title: "Claim your bond", detail: "Demand letter, claim pack and NCAT kit", Icon: FileText },
] as const;

/** `current` is 1-based; steps before it show as done. Omit it to show all steps neutrally. */
export default function Stepper({ current, compact = false }: { current?: 1 | 2 | 3 | 4; compact?: boolean }) {
  return (
    <ol className={`grid gap-3 ${compact ? "grid-cols-3" : "sm:grid-cols-3"}`} aria-label="Steps">
      {STEPS.map(({ title, detail, Icon }, i) => {
        const n = i + 1;
        const done = current !== undefined && n < current;
        const active = current === n;
        return (
          <li
            key={title}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              active ? "border-accent bg-accent-soft" : done ? "border-line bg-card" : "border-line bg-card/60"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                done || active ? "bg-accent text-accent-ink" : "bg-paper text-muted"
              }`}
            >
              {done ? <Check className="h-5 w-5" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className={`block text-xs font-semibold uppercase tracking-wider ${active ? "text-accent" : "text-muted"}`}>
                Step {n}{done && !compact ? " · done" : ""}
              </span>
              <span className={`block font-semibold leading-tight ${compact ? "hidden text-sm sm:block" : ""}`}>{title}</span>
              {!compact && <span className="block text-sm text-muted">{detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
