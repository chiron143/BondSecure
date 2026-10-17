"use client";

import { Check, FileText, Loader2, Quote, Sparkles, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Parties } from "@/lib/content/letters";
import { applyFindings } from "@/lib/evidence/apply";
import { prepareFiles } from "@/lib/evidence/browser";
import { FIELD_LABEL, type EvidenceExtraction, type EvidenceFinding } from "@/lib/evidence/types";
import { formatDate } from "@/lib/rules/dates";
import type { CaseFacts } from "@/lib/rules/types";

const MONEY = new Set(["amountPaid", "weeklyRent", "amountRefunded"]);
const DATES = new Set(["datePaid", "moveOutDate"]);
const MAX_FILES = 8;

// What the AI is doing while it reads, shown one line at a time so the wait feels alive.
const READING_STEPS = [
  "Looking for the amount you paid",
  "Finding the dates",
  "Checking the refund promise in the terms",
  "Reading what they told you",
  "Copying the exact words as proof",
];

function show(f: EvidenceFinding): string {
  if (MONEY.has(f.field)) return `$${f.value}`;
  if (DATES.has(f.field) && /^\d{4}-\d{2}-\d{2}$/.test(f.value)) return formatDate(f.value);
  if (f.field === "agreementRefundDays") return `${f.value} days`;
  if (f.field === "agreementType") return f.value === "occupancy_agreement" ? "Occupancy agreement or licence" : "Residential tenancy agreement";
  return f.value;
}

/** Small previews of the chosen files (images as thumbnails, PDFs as an icon). */
function usePreviews(files: File[]) {
  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);
  return previews;
}

function Thumb({ url, name, scanning }: { url?: string; name: string; scanning?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground">
          <FileText className="size-6" aria-hidden />
        </div>
      )}
      {scanning &&
        (reduce ? (
          <div className="absolute inset-0 bg-primary/15" aria-hidden />
        ) : (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-5 bg-gradient-to-b from-transparent via-primary/60 to-transparent"
            initial={{ top: "-20%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.15 }}
          />
        ))}
    </div>
  );
}

function ReadingPanel({ previews }: { previews: { file: File; url?: string }[] }) {
  const reduce = useReducedMotion();
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const secs = (now - started) / 1000;
  const step = READING_STEPS[Math.floor(secs / 2.2) % READING_STEPS.length];
  // Eases towards 92% so it always looks like it's moving, without pretending to know when it ends.
  const progress = Math.round(92 * (1 - Math.exp(-secs / 9)));

  return (
    <div className="mt-4 rounded-xl border border-primary/30 bg-card p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          Reading {previews.length} file{previews.length === 1 ? "" : "s"}
        </p>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {Math.floor(secs / 60)}:{String(Math.floor(secs % 60)).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {previews.map((p) => (
          <Thumb key={p.file.name + p.file.size} url={p.url} name={p.file.name} scanning />
        ))}
      </div>

      <div className="mt-3 h-6 overflow-hidden text-sm text-muted-foreground">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={reduce ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: -12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="size-3.5 text-primary" aria-hidden /> {step}…
          </motion.p>
        </AnimatePresence>
      </div>
      <Progress value={progress} className="mt-2 h-1.5" aria-label="Reading progress" />

      <div className="mt-4 space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-border p-3">
            <Skeleton className="size-4 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {secs > 25 ? "Google's AI is busy, so this is taking a bit longer. Hang tight." : "This usually takes 5 to 20 seconds."}
      </p>
    </div>
  );
}

export default function EvidenceReader({
  onApply,
}: {
  onApply: (facts: Partial<CaseFacts>, parties: Partial<Parties>) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvidenceExtraction | null>(null);
  const [use, setUse] = useState<boolean[]>([]);
  const [applied, setApplied] = useState(false);
  const previews = usePreviews(files);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    setFiles((cur) => [...cur, ...incoming].slice(0, MAX_FILES));
    setResult(null);
    setError("");
  }

  async function read(forceDemo = false) {
    setBusy(true);
    setError("");
    setApplied(false);
    setResult(null);
    try {
      const prepared = await prepareFiles(files);
      const demo = forceDemo || new URLSearchParams(window.location.search).has("demo");
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: prepared, demo }),
      });
      const out = await res.json().catch(() => ({ error: `The server said ${res.status}.` }));
      if (out.error) throw new Error(out.error);
      const extraction = out as EvidenceExtraction;
      setResult(extraction);
      setUse(extraction.findings.map(() => true));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!result) return;
    const { facts, parties } = applyFindings(result.findings.filter((_, n) => use[n]));
    onApply(facts, parties);
    setApplied(true);
  }

  const picked = use.filter(Boolean).length;

  return (
    <div className="card relative overflow-hidden border-primary/40">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <p className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-4 text-primary" aria-hidden /> Have receipts, emails or your agreement? Let AI fill this in.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll read the amounts, dates and names, show you exactly where we found each one, and you choose what to use.
        We don&apos;t keep your files. <Link className="underline" href="/privacy">How your data is handled</Link>
      </p>

      {/* Drop zone */}
      {!busy && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging ? "border-primary bg-primary-soft" : "border-input bg-card hover:border-primary/60"
          }`}
        >
          <UploadCloud className={`size-7 ${dragging ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
          <span className="text-sm font-semibold">Drop receipts, terms or emails here</span>
          <span className="text-xs text-muted-foreground">or tap to choose · photos, screenshots or PDFs · up to {MAX_FILES}</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            aria-label="Receipts, emails or agreement"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
      )}

      {/* Chosen files */}
      {!busy && files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {previews.map((p, i) => (
              <motion.li
                key={p.file.name + p.file.size}
                layout={!reduce}
                initial={reduce ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reduce ? undefined : { scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-border bg-card py-1 pr-2 pl-1"
              >
                <Thumb url={p.url} name={p.file.name} />
                <span className="max-w-32 truncate text-xs">{p.file.name}</span>
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${p.file.name}`}
                  onClick={() => { setFiles((cur) => cur.filter((_, n) => n !== i)); setResult(null); }}
                >
                  <X className="size-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-warn" role="alert">
          <p className="font-semibold">That didn&apos;t work: {error}</p>
          <button className="mt-1 underline" onClick={() => read(true)}>Show a demo result instead</button>
        </div>
      )}

      {busy ? (
        <ReadingPanel previews={previews} />
      ) : (
        <Button size="lg" className="mt-3 h-11 w-full" disabled={!files.length} onClick={() => read()}>
          <Sparkles aria-hidden />
          {files.length ? `Read ${files.length} file${files.length === 1 ? "" : "s"}` : "Choose files first"}
        </Button>
      )}

      {result && (
        <div className="mt-5">
          {result.demo && (
            <p className="mb-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">Demo mode: these are example findings, not read from your files.</p>
          )}
          {result.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">We couldn&apos;t find amounts, dates or names in those files. Fill in the form below yourself.</p>
          ) : (
            <>
              <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                <span>Found {result.findings.length} facts. Untick anything that&apos;s wrong.</span>
                <Badge variant="secondary">{picked} selected</Badge>
              </p>
              <motion.ul
                className="mt-2 space-y-2"
                initial={reduce ? false : "hidden"}
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              >
                {result.findings.map((f, n) => (
                  <motion.li
                    key={`${f.field}-${n}`}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors ${
                        use[n] ? "border-primary/40 bg-primary-soft/50" : "border-border bg-card opacity-70"
                      }`}
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={use[n] ?? false}
                        onCheckedChange={(v) => setUse((u) => u.map((x, i) => (i === n ? v === true : x)))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-muted-foreground">{FIELD_LABEL[f.field] ?? f.field}: </span>
                        <span className="font-semibold">{show(f)}</span>
                        <span className="mt-1.5 flex items-start gap-1.5 border-l-2 border-primary/40 pl-2 text-xs text-muted-foreground">
                          <Quote className="mt-0.5 size-3 shrink-0" aria-hidden />
                          <span>
                            {f.quote} <Badge variant="outline" className="ml-1 align-middle text-[10px]">{f.document}</Badge>
                          </span>
                        </span>
                      </span>
                    </label>
                  </motion.li>
                ))}
              </motion.ul>
              <Button size="lg" className="mt-3 h-11 w-full" onClick={apply} disabled={!picked}>
                {applied ? <><Check aria-hidden /> Added. Check the answers below</> : `Use these ${picked} in my answers`}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
