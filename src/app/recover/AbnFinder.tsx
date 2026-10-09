"use client";

import { useState } from "react";
import { abrAbnUrl, abrSearchUrl, formatAbn, legalNameWithAbn, type AbnMatch } from "@/lib/abn/abn";

// Finds the operator's legal entity name on the ABN register, so the letter and the
// NCAT application name the right company. The student picks the match; we never guess.
export default function AbnFinder({ tradingName, onPick }: { tradingName?: string; onPick: (legalName: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<AbnMatch[] | null>(null);
  const [note, setNote] = useState("");
  const [offline, setOffline] = useState(false);

  async function search(query = q) {
    if (query.trim().length < 2) return;
    setBusy(true);
    setNote("");
    try {
      const out = await fetch(`/api/abn?q=${encodeURIComponent(query.trim())}`).then((r) => r.json());
      if (out.configured === false) {
        setOffline(true);
        setMatches(null);
        return;
      }
      if (out.error) throw new Error(out.error);
      setMatches(out.matches ?? []);
      if (!out.matches?.length) setNote(out.message || "No businesses found with that name. Try the name on your receipt or invoice.");
    } catch (e) {
      setOffline(true);
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pick(m: AbnMatch) {
    if (m.legalName) return onPick(legalNameWithAbn(m));
    setBusy(true);
    try {
      // A name search can return a trading name; the details give the registered entity.
      const out = await fetch(`/api/abn?q=${m.abn}`).then((r) => r.json());
      onPick(legalNameWithAbn(out.matches?.[0] ?? m));
    } catch {
      onPick(legalNameWithAbn(m));
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="mt-1.5 text-xs underline"
        onClick={() => { const start = tradingName?.trim() ?? ""; setOpen(true); setQ(start); if (start) search(start); }}
      >
        Find it on the ABN register
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm">
      <p className="text-muted">Search by the name on your receipt, invoice or website, or paste their ABN.</p>
      <div className="mt-2 flex gap-2">
        <input className="field py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())} aria-label="Business name or ABN" />
        <button type="button" className="btn-ghost py-2 text-sm" disabled={busy || q.trim().length < 2} onClick={() => search()}>
          {busy ? "…" : "Search"}
        </button>
      </div>

      {offline && (
        <p className="mt-3">
          {note && <span className="block text-warn">{note}</span>}
          <a className="font-semibold underline" href={abrSearchUrl(q || tradingName || "")} target="_blank" rel="noreferrer">
            Search the ABN register ↗
          </a>{" "}
          <span className="text-muted">then copy the &quot;Entity name&quot; and ABN into the box above.</span>
        </p>
      )}

      {matches && matches.length > 0 && (
        <ul className="mt-3 space-y-2">
          {matches.map((m) => (
            <li key={`${m.abn}-${m.name}`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card p-2.5">
              <span>
                <span className="font-semibold">{m.legalName ?? m.name}</span>
                <span className="block text-xs text-muted">
                  ABN {formatAbn(m.abn)} · {[m.state, m.postcode].filter(Boolean).join(" ") || "—"} · {m.active ? "active" : "cancelled"} ·{" "}
                  <a className="underline" href={abrAbnUrl(m.abn)} target="_blank" rel="noreferrer">check</a>
                </span>
              </span>
              <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-xs" disabled={busy} onClick={() => pick(m)}>Use this</button>
            </li>
          ))}
        </ul>
      )}
      {matches && !matches.length && note && <p className="mt-3 text-muted">{note}</p>}
      <p className="mt-2 text-xs text-muted">Pick the one that matches the company you paid. If you&apos;re not sure, leave it blank: the letter still works.</p>
    </div>
  );
}
