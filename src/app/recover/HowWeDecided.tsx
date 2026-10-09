"use client";

import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, Phone, Scale } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/rules/dates";
import { PATH_LABEL, type Explanation } from "@/lib/rules/explain";
import type { Verdict } from "@/lib/rules/types";

// The working behind the verdict, so a student (or a judge) can check it: the path, the
// reasons, the rules and their sources with the date we checked them, what would change
// if a "not sure" answer went the other way, and when to talk to a person instead.
export default function HowWeDecided({ v, ex, t }: { v: Verdict; ex: Explanation; t: (s: string) => string }) {
  const sure = v.confidence === "likely" && ex.whatIfs.length === 0 && v.path !== "REFER";
  return (
    <section className="card mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Scale className="h-5 w-5 text-accent" aria-hidden /> How we decided
        </h2>
        {sure ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Clear from your answers
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Not certain: check before you act
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted">Path</p>
      <p className="font-semibold">{t(PATH_LABEL[v.path])}</p>

      <p className="mt-3 text-sm text-muted">Because</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">{v.because.map((b) => <li key={b}>{t(b)}</li>)}</ul>

      {ex.whatIfs.length > 0 && (
        <div className="mt-4 rounded-xl bg-warn-soft p-4 text-sm text-warn">
          <p className="font-semibold">{t("This depends on something you weren't sure about:")}</p>
          <ul className="mt-2 space-y-1.5">
            {ex.whatIfs.map((w) => (
              <li key={w.path}>
                {t(w.condition)} → <span className="font-semibold">{t(PATH_LABEL[w.path])}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
        <BookOpen className="h-4 w-4" aria-hidden /> Rules used (NSW, as checked on the date shown)
      </p>
      <ul className="mt-1 space-y-2">
        {ex.sources.map((s) => (
          <li key={s.id} className="rounded-xl bg-paper p-3 text-sm">
            <p>{s.rule}</p>
            <a className="mt-1 inline-flex items-center gap-1 text-xs text-muted underline" href={s.url}>
              {s.source} · checked {formatDate(s.checked)} <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      {ex.checkWithAService && (
        <div className="mt-4 rounded-xl border border-warn/40 p-4 text-sm">
          <p className="font-semibold">{t("Check with a free legal service before you send anything.")}</p>
          <p className="mt-1 text-muted">
            Redfern Legal Centre has an international student service:{" "}
            <a className="inline-flex items-center gap-1 font-semibold text-ink underline" href="tel:+61296987277">
              <Phone className="h-3.5 w-3.5" aria-hidden /> (02) 9698 7277
            </a>
            . Take this page and your receipts.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Decided by tested rules written in plain code, not by AI. <Link className="underline" href="/how-it-decides">See how it decides</Link>
      </p>
    </section>
  );
}
