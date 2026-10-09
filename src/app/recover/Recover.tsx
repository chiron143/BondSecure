"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildDemandLetter, type Parties } from "@/lib/content/letters";
import { LANGUAGES } from "@/lib/content/languages";
import { DISCLAIMER, HELP_CONTACTS } from "@/lib/content/sources";
import { moveInFitsCase } from "@/lib/movein/usable";
import { buildClaimPackPdf } from "@/lib/pdf/claimPack";
import { downloadPdf } from "@/lib/pdf/layout";
import { addDays, formatDate, todayIso } from "@/lib/rules/dates";
import { buildVerdict } from "@/lib/rules/engine";
import type { Agreement, CaseFacts, Residents, Who, YesNoUnsure } from "@/lib/rules/types";
import { useStore } from "@/lib/store";
import AbnFinder from "./AbnFinder";
import EvidenceReader from "./EvidenceReader";

type Opt<T extends string> = { v: T; label: string; hint?: string };

const WHO: Opt<Who>[] = [
  { v: "operator", label: "A company that runs rooms", hint: "Student accommodation, co-living, a building manager" },
  { v: "real_estate_agent", label: "A real estate agent" },
  { v: "private_landlord", label: "A private landlord" },
  { v: "university", label: "My university or college" },
  { v: "head_tenant", label: "Another tenant who lives there" },
  { v: "live_in_owner", label: "The owner, who lives there too" },
  { v: "not_sure", label: "I'm not sure" },
];
const AGREEMENT: Opt<Agreement>[] = [
  { v: "residential_tenancy_agreement", label: "A residential tenancy agreement", hint: "The standard NSW lease" },
  { v: "occupancy_agreement", label: "An occupancy agreement, licence or house rules" },
  { v: "nothing_written", label: "Nothing written" },
  { v: "not_sure", label: "I'm not sure" },
];
const RESIDENTS: Opt<Residents>[] = [
  { v: "5_or_more", label: "5 or more people" },
  { v: "under_5", label: "Fewer than 5" },
  { v: "not_sure", label: "I'm not sure" },
];
const LODGED: Opt<YesNoUnsure>[] = [
  { v: "yes", label: "Yes, I got a bond number" },
  { v: "no", label: "No, nothing from Fair Trading" },
  { v: "not_sure", label: "I'm not sure" },
];

function Choice<T extends string>({ name, opts, value, onChange }: { name: string; opts: Opt<T>[]; value?: T; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opts.map((o) => (
        <label key={o.v} className={`cursor-pointer rounded-xl border p-3 text-[15px] ${value === o.v ? "border-accent bg-accent-soft" : "border-line bg-card"}`}>
          <input type="radio" name={name} className="sr-only" checked={value === o.v} onChange={() => onChange(o.v)} />
          <span className="font-medium">{o.label}</span>
          {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
        </label>
      ))}
    </div>
  );
}

const EXAMPLE: { facts: CaseFacts; parties: Parties } = {
  facts: {
    state: "NSW",
    who: "operator",
    agreement: "occupancy_agreement",
    residents: "5_or_more",
    bondLodged: "no",
    amountPaid: 802,
    weeklyRent: 401,
    datePaid: "2026-02-02",
    moveOutDate: addDays(todayIso(), -50),
    agreementRefundDays: 15,
    reasonGiven: "It's still being processed",
  },
  parties: {
    studentName: "Priya Sharma",
    studentEmail: "priya@example.com",
    propertyAddress: "Room 12, 100 Example Street, Surry Hills NSW 2010",
    landlordName: "Sample Rooms",
  },
};

export default function Recover() {
  const store = useStore();
  const [facts, setFacts] = useState<Partial<CaseFacts>>(store.facts ?? { state: "NSW" });
  const [parties, setParties] = useState<Partial<Parties>>(
    store.parties ?? { propertyAddress: store.moveIn?.propertyAddress, studentName: store.moveIn?.tenantName },
  );
  const [showVerdict, setShowVerdict] = useState(Boolean(store.facts));
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState("en");
  const [translated, setTranslated] = useState<Record<string, Map<string, string>>>({});
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  const f = (patch: Partial<CaseFacts>) => setFacts((x) => ({ ...x, ...patch }));
  const p = (patch: Partial<Parties>) => setParties((x) => ({ ...x, ...patch }));

  const complete =
    facts.state && facts.who && facts.agreement && facts.residents && facts.bondLodged && facts.amountPaid && facts.moveOutDate &&
    parties.studentName && parties.propertyAddress && parties.landlordName;

  const result = useMemo(() => {
    if (!complete || !showVerdict) return null;
    const verdict = buildVerdict(facts as CaseFacts);
    const letter = buildDemandLetter(facts as CaseFacts, verdict, parties as Parties, moveInFitsCase(store.moveIn, facts as CaseFacts));
    return { verdict, letter };
  }, [complete, showVerdict, facts, parties, store.moveIn]);

  if (result) {
    const { verdict: v, letter } = result;
    // Everything a student reads to understand their situation, but never the letter.
    const explanation = [
      v.title, v.summary, ...v.because, ...v.flags, ...v.nextSteps, ...v.getHelpIf,
      ...v.deadlines.flatMap((d) => [d.label, d.note ?? ""]),
    ].filter(Boolean);
    const map = translated[lang];
    const t = (s: string) => map?.get(s) ?? s;

    async function translate(code: string) {
      setLang(code);
      setTranslateError("");
      if (code === "en" || translated[code]) return;
      setTranslating(true);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: code, texts: explanation }),
        });
        const out = await res.json().catch(() => ({ error: `The server said ${res.status}.` }));
        if (out.error) throw new Error(out.error);
        setTranslated((x) => ({ ...x, [code]: new Map(explanation.map((s, n) => [s, out.translations[n]])) }));
      } catch (e) {
        setTranslateError((e as Error).message);
        setLang("en");
      } finally {
        setTranslating(false);
      }
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button className="text-sm text-muted underline" onClick={() => setShowVerdict(false)}>← Change my answers</button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Read this in</span>
            <select className="field w-auto py-1.5 text-sm" value={lang} disabled={translating} onChange={(e) => translate(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
          </label>
        </div>
        {translating && <p className="mt-3 text-sm text-muted">Translating…</p>}
        {translateError && <p className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">Couldn&apos;t translate: {translateError}</p>}
        {lang !== "en" && map && (
          <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm">
            Translated by AI to help you understand. The English version is the one that counts, and your letter stays in English
            because that&apos;s what the landlord and NCAT read.{" "}
            <button className="underline" onClick={() => setLang("en")}>Show English</button>
          </p>
        )}
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-accent">{v.lawName ?? "Your situation"} · {v.confidence}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{t(v.title)}</h1>
        <p className="mt-4 text-lg">{t(v.summary)}</p>
        <p className="mt-4 font-serif text-3xl font-semibold text-accent">
          {v.amountOwed.toLocaleString("en-AU", { style: "currency", currency: "AUD" })} <span className="text-base font-normal text-muted">owed to you</span>
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold">Why we think this</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{v.because.map((b) => <li key={b}>{t(b)}</li>)}</ul>
          </div>
          <div className="card">
            <h2 className="font-semibold">Deadlines</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {v.deadlines.map((d) => (
                <li key={d.label}>
                  <span className="text-muted">{t(d.label)}</span>
                  {d.dueDate && <span className="block font-semibold">{formatDate(d.dueDate)}{d.daysOverdue ? <span className="text-warn"> · {d.daysOverdue} days ago</span> : null}</span>}
                  {d.note && <span className="block text-xs text-muted">{t(d.note)}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {v.flags.length > 0 && (
          <div className="mt-4 rounded-2xl bg-warn-soft p-5 text-sm text-warn">
            <ul className="list-disc space-y-1 pl-5">{v.flags.map((x) => <li key={x}>{t(x)}</li>)}</ul>
          </div>
        )}

        <div className="card mt-4">
          <h2 className="font-semibold">What to do, in order</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px]">{v.nextSteps.map((s) => <li key={s}>{t(s)}</li>)}</ol>
        </div>

        <div className="card mt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Your letter <span className="text-xs font-normal text-muted">(English, as sent)</span></h2>
            <button className="btn-ghost py-2 text-sm" onClick={() => { navigator.clipboard.writeText(`${letter.subject}\n\n${letter.body}`); setCopied(true); }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-sm font-semibold">Subject: {letter.subject}</p>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-paper p-4 font-sans text-sm">{letter.body}</pre>
          <p className="mt-2 text-xs text-muted">Send it by email so it&apos;s dated. Add your bank details if you want them to pay by transfer.</p>
        </div>

        <div className="card mt-4">
          <h2 className="font-semibold">Your evidence</h2>
          {store.moveIn && !moveInFitsCase(store.moveIn, facts as CaseFacts) ? (
            <p className="mt-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
              Your saved move-in report is dated {formatDate(store.moveIn.moveInDate)}, after you moved out, so it can&apos;t be
              evidence for this room and isn&apos;t included. Use your own move-in photos instead.
            </p>
          ) : store.moveIn ? (
            <p className="mt-2 text-sm">
              ✓ Your move-in report from {formatDate(store.moveIn.moveInDate)} ({store.moveIn.items.filter((i) => i.status === "confirmed" && i.condition !== "good").length} existing problems) goes into your claim pack.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">No move-in report yet. Use your own move-in and move-out photos, and next time <Link className="underline" href="/move-in">record your room on day one</Link>.</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="btn-primary"
            onClick={async () => {
              store.setCase(facts as CaseFacts, parties as Parties);
              downloadPdf(
                await buildClaimPackPdf({ facts: facts as CaseFacts, verdict: v, parties: parties as Parties, letter, moveIn: store.moveIn }),
                `bond-claim-pack-${todayIso()}.pdf`,
              );
            }}
          >
            Download my claim pack (PDF)
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-line p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Get free help first if: {v.getHelpIf.map(t).join("; ")}.</p>
          <ul className="mt-2 space-y-1">{HELP_CONTACTS.map((c) => <li key={c.name}><a className="underline" href={c.url}>{c.name}</a>: {c.detail}</li>)}</ul>
          <p className="mt-3 text-xs">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">Didn&apos;t get your bond back?</h1>
      <p className="mt-3 text-muted">A few questions to work out which rules apply to you. Answer &quot;not sure&quot; whenever you&apos;re not sure.</p>
      <button className="mt-3 text-sm underline" onClick={() => { setFacts(EXAMPLE.facts); setParties(EXAMPLE.parties); }}>
        Fill in an example case
      </button>

      <EvidenceReader
        onApply={(found, who) => {
          setFacts((x) => ({ ...x, ...found }));
          setParties((x) => ({ ...x, ...who }));
        }}
      />

      <div className="card mt-6 space-y-7">
        <div>
          <p className="label">Was the place in New South Wales?</p>
          <Choice name="state" value={facts.state} onChange={(state) => f({ state })} opts={[{ v: "NSW", label: "Yes, NSW" }, { v: "other", label: "No, another state" }]} />
        </div>
        <div>
          <p className="label">Who did you rent from?</p>
          <Choice name="who" opts={WHO} value={facts.who} onChange={(who) => f({ who })} />
        </div>
        <div>
          <p className="label">What did you sign?</p>
          <Choice name="agreement" opts={AGREEMENT} value={facts.agreement} onChange={(agreement) => f({ agreement })} />
        </div>
        <div>
          <p className="label">How many people lived there, not counting the owner or manager?</p>
          <Choice name="residents" opts={RESIDENTS} value={facts.residents} onChange={(residents) => f({ residents })} />
        </div>
        <div>
          <p className="label">Did NSW Fair Trading or Rental Bonds Online ever email or text you a bond number?</p>
          <Choice name="lodged" opts={LODGED} value={facts.bondLodged} onChange={(bondLodged) => f({ bondLodged })} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="paid">Bond or deposit paid ($)</label>
            <input id="paid" type="number" min={0} className="field" value={facts.amountPaid ?? ""} onChange={(e) => f({ amountPaid: Number(e.target.value) || undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="rent">Rent per week ($)</label>
            <input id="rent" type="number" min={0} className="field" value={facts.weeklyRent ?? ""} onChange={(e) => f({ weeklyRent: Number(e.target.value) || undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="datePaid">Date you paid it</label>
            <input id="datePaid" type="date" className="field" value={facts.datePaid ?? ""} onChange={(e) => f({ datePaid: e.target.value || undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="out">Date you moved out and returned keys</label>
            <input id="out" type="date" className="field" value={facts.moveOutDate ?? ""} onChange={(e) => f({ moveOutDate: e.target.value || undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="refunded">Already refunded to you ($)</label>
            <input id="refunded" type="number" min={0} className="field" value={facts.amountRefunded ?? ""} onChange={(e) => f({ amountRefunded: Number(e.target.value) || undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="promise">Refund period in their terms (days, if any)</label>
            <input id="promise" type="number" min={0} className="field" value={facts.agreementRefundDays ?? ""} onChange={(e) => f({ agreementRefundDays: Number(e.target.value) || undefined })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="reason">What did they tell you, if anything?</label>
          <input id="reason" className="field" value={facts.reasonGiven ?? ""} onChange={(e) => f({ reasonGiven: e.target.value })} placeholder="e.g. &quot;still being processed&quot;, &quot;cleaning fee&quot;" />
        </div>

        <hr className="border-line" />
        <p className="font-semibold">For your letter</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sn">Your full name</label>
            <input id="sn" className="field" value={parties.studentName ?? ""} onChange={(e) => p({ studentName: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="se">Your email</label>
            <input id="se" type="email" className="field" value={parties.studentEmail ?? ""} onChange={(e) => p({ studentEmail: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="pa">Address of the place</label>
            <input id="pa" className="field" value={parties.propertyAddress ?? ""} onChange={(e) => p({ propertyAddress: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ln">Who you paid (name you know them by)</label>
            <input id="ln" className="field" value={parties.landlordName ?? ""} onChange={(e) => p({ landlordName: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ll">Their company name (optional)</label>
            <input id="ll" className="field" value={parties.landlordLegalName ?? ""} onChange={(e) => p({ landlordLegalName: e.target.value || undefined })} placeholder="From their ABN, e.g. Example Pty Ltd" />
            <AbnFinder tradingName={parties.landlordName} onPick={(landlordLegalName) => p({ landlordLegalName })} />
          </div>
        </div>

        <button className="btn-primary w-full" disabled={!complete} onClick={() => setShowVerdict(true)}>
          Show me where I stand
        </button>
      </div>
    </div>
  );
}
