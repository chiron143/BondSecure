"use client";

import Link from "next/link";
import { useState } from "react";
import type { Parties } from "@/lib/content/letters";
import { applyFindings } from "@/lib/evidence/apply";
import { prepareFiles } from "@/lib/evidence/browser";
import { FIELD_LABEL, type EvidenceExtraction, type EvidenceFinding } from "@/lib/evidence/types";
import { formatDate } from "@/lib/rules/dates";
import type { CaseFacts } from "@/lib/rules/types";

const MONEY = new Set(["amountPaid", "weeklyRent", "amountRefunded"]);
const DATES = new Set(["datePaid", "moveOutDate"]);

function show(f: EvidenceFinding): string {
  if (MONEY.has(f.field)) return `$${f.value}`;
  if (DATES.has(f.field) && /^\d{4}-\d{2}-\d{2}$/.test(f.value)) return formatDate(f.value);
  if (f.field === "agreementRefundDays") return `${f.value} days`;
  if (f.field === "agreementType") return f.value === "occupancy_agreement" ? "Occupancy agreement or licence" : "Residential tenancy agreement";
  return f.value;
}

export default function EvidenceReader({
  onApply,
}: {
  onApply: (facts: Partial<CaseFacts>, parties: Partial<Parties>) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvidenceExtraction | null>(null);
  const [use, setUse] = useState<boolean[]>([]);
  const [applied, setApplied] = useState(false);

  async function read(forceDemo = false) {
    setBusy(true);
    setError("");
    setApplied(false);
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

  return (
    <div className="card mt-6 border-accent/40 bg-accent-soft/40">
      <p className="font-semibold">Have receipts, emails or your agreement? Let AI fill this in.</p>
      <p className="mt-1 text-sm text-muted">
        Add screenshots or photos of your payment receipt, your agreement or terms, and their emails. We&apos;ll read the
        amounts, dates and names, show you exactly where we found each one, and you choose what to use. We don&apos;t keep your
        files. <Link className="underline" href="/privacy">How your data is handled</Link>
      </p>
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="field mt-4 bg-card"
        aria-label="Receipts, emails or agreement"
        onChange={(e) => { setFiles(Array.from(e.target.files ?? []).slice(0, 8)); setResult(null); }}
      />
      {error && (
        <div className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <p className="font-semibold">That didn&apos;t work: {error}</p>
          <button className="mt-1 underline" onClick={() => read(true)}>Show a demo result instead</button>
        </div>
      )}
      <button className="btn-ghost mt-3 w-full" disabled={!files.length || busy} onClick={() => read()}>
        {busy ? "Reading your documents…" : files.length ? `Read ${files.length} file${files.length === 1 ? "" : "s"}` : "Choose files first"}
      </button>

      {result && (
        <div className="mt-5">
          {result.demo && (
            <p className="mb-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">Demo mode: these are example findings, not read from your files.</p>
          )}
          {result.findings.length === 0 ? (
            <p className="text-sm text-muted">We couldn&apos;t find amounts, dates or names in those files. Fill in the form below yourself.</p>
          ) : (
            <>
              <p className="text-sm font-semibold">What we found. Untick anything that&apos;s wrong.</p>
              <ul className="mt-2 space-y-2">
                {result.findings.map((f, n) => (
                  <li key={`${f.field}-${n}`}>
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-card p-3 text-sm">
                      <input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={use[n] ?? false} onChange={(e) => setUse((u) => u.map((x, i) => (i === n ? e.target.checked : x)))} />
                      <span>
                        <span className="text-muted">{FIELD_LABEL[f.field] ?? f.field}: </span>
                        <span className="font-semibold">{show(f)}</span>
                        <span className="block text-xs text-muted">&ldquo;{f.quote}&rdquo; · {f.document}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button className="btn-primary mt-3 w-full" onClick={apply}>
                {applied ? "Added. Check the answers below" : "Use these in my answers"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
