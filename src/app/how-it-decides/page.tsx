import { AlertTriangle, ArrowRight, CheckCircle2, Scale } from "lucide-react";
import Link from "next/link";
import { SOURCES } from "@/lib/content/sources";
import { formatDate } from "@/lib/rules/dates";
import { classify } from "@/lib/rules/engine";
import { EXAMPLE_CASES } from "@/lib/rules/examples";
import { PATH_LABEL, explain } from "@/lib/rules/explain";

export const metadata = { title: "How it decides · Bond Secure" };

// The decision order below mirrors classify() in src/lib/rules/engine.ts, top to bottom.
// If you change the engine, change this list (and the tests) with it.
const STEPS: { q: string; then: string; sources: string[] }[] = [
  { q: "Was the place outside NSW?", then: "Get free legal advice (each state has different rules).", sources: [] },
  {
    q: "Was it a university or college residence?",
    then: "Get free legal advice. Colleges are mostly excluded from the tenancy laws, with exceptions.",
    sources: ["lodgers"],
  },
  {
    q: "Did NSW Fair Trading give you a bond number?",
    then: PATH_LABEL.A_LODGED_BOND + ". This applies whatever kind of place it was.",
    sources: ["rbo-claim", "rbo-dispute"],
  },
  {
    q: "Did you sign a standard NSW residential tenancy agreement, or rent from a private landlord or agent without an occupancy agreement?",
    then: PATH_LABEL.B_UNLODGED_BOND + ". The agreement decides, even in a building run by a company.",
    sources: ["rta-lodgement", "rta-bond-max"],
  },
  {
    q: "Does a business rent out rooms there?",
    then: "5 or more residents: " + PATH_LABEL.C_BOARDING_HOUSE + ". Fewer than 5: lodger. Not sure: boarding house, with the lodger answer shown as the alternative.",
    sources: ["boarding-definition", "boarding-deposit"],
  },
  {
    q: "Does the owner, or another tenant, live there and rent you a room?",
    then: "Lodger. With another tenant it's uncertain (you might be a sub-tenant), so we say to get advice.",
    sources: ["lodgers"],
  },
  { q: "None of the above, or too unclear?", then: PATH_LABEL.REFER + ".", sources: [] },
];

const src = (id: string) => SOURCES.find((s) => s.id === id)!;

export default function HowItDecides() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
        <Scale className="h-7 w-7 text-accent" aria-hidden /> How Bond Secure decides
      </h1>
      <p className="mt-3 text-muted">
        Which law applies, and whether a deadline has passed, is decided by fixed rules written in plain code, with
        automated tests. AI never makes this decision. The rules below were checked against official NSW sources on 9 and 10
        October 2026. NSW only. This is legal information, not legal advice.
      </p>

      <h2 className="mt-8 text-xl font-semibold">The questions, in the order we ask them</h2>
      <p className="mt-1 text-sm text-muted">The first question that matches decides the path.</p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.q} className="card">
            <p className="text-sm font-semibold text-accent">Step {i + 1}</p>
            <p className="mt-1 font-semibold">{s.q}</p>
            <p className="mt-1 flex gap-2 text-[15px]">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden /> {s.then}
            </p>
            {s.sources.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Source:{" "}
                {s.sources.map((id, n) => (
                  <span key={id}>
                    {n > 0 && "; "}
                    <a className="underline" href={src(id).url}>{src(id).source}</a> (checked {formatDate(src(id).checked)})
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-xl font-semibold">When you&apos;re not sure</h2>
      <p className="mt-2 text-[15px] text-muted">
        Every question has a &quot;not sure&quot; answer. When you use it, we run the rules again with each possible answer
        and show you where that would lead. If the answer could change, or the rules can&apos;t place you safely, we tell you
        to call a free legal service (Redfern Legal Centre, (02) 9698 7277) before you send anything.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Worked examples</h2>
      <p className="mt-1 text-sm text-muted">
        Each result below is produced by running the rules on this page, not written by hand. Sample names only.
      </p>
      <div className="mt-4 space-y-3">
        {EXAMPLE_CASES.map((c) => {
          const f = { ...c.facts, moveOutDate: "2026-08-20" };
          const r = classify(f);
          const ex = explain(f);
          return (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.kind === "typical" ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"}`}>
                  {c.kind}
                </span>
                <span className="font-semibold">{c.label}</span>
              </div>
              <p className="mt-2 text-[15px]">
                <span className="text-muted">Result: </span>
                <span className="font-semibold">{PATH_LABEL[r.path]}</span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                {ex.checkWithAService ? (
                  <><AlertTriangle className="h-4 w-4 text-warn" aria-hidden /> <span className="text-warn">Not certain: tells you to get free advice first</span></>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-accent" aria-hidden /> <span className="text-accent">Clear from the answers</span></>
                )}
              </p>
              {ex.whatIfs.length > 0 && (
                <ul className="mt-2 text-sm text-muted">
                  {ex.whatIfs.map((w) => <li key={w.path}>{w.condition} → {PATH_LABEL[w.path]}</li>)}
                </ul>
              )}
              <p className="mt-2 text-sm text-muted">Why it matters: {c.lesson}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Known limits</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted">
        <li>Business-day deadlines skip weekends but not public holidays, so we say &quot;about&quot; and the real date can be a day or two later.</li>
        <li>Renting from another tenant may really be a sub-tenancy under the Residential Tenancies Act; we flag it as uncertain.</li>
        <li>The boarding-house test relies on your estimate of how many people live there.</li>
        <li>No lawyer has reviewed these rules yet.</li>
      </ul>

      <p className="mt-8 text-sm">
        <Link className="underline" href="/recover">Check your own situation</Link> ·{" "}
        <Link className="underline" href="/sources">All sources</Link>
      </p>
    </div>
  );
}
