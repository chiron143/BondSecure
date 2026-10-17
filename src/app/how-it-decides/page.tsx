import { AlertTriangle, ArrowRight, CheckCircle2, Scale } from "lucide-react";
import Link from "next/link";
import { HeroBand } from "@/components/bold";
import ShimmerLink from "@/components/ShimmerLink";
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
    <div>
      <HeroBand>
        <p className="inline-flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-300 uppercase">
          <Scale className="size-4" aria-hidden /> How it decides
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
          Tested rules,{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">not AI.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy-muted">
          Which law applies, and whether a deadline has passed, is decided by fixed rules written in plain code, with
          automated tests. AI never makes this decision. The rules below were checked against official NSW sources on 9 and 10
          October 2026. NSW only. This is legal information, not legal advice.
        </p>
      </HeroBand>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-3xl font-black tracking-tight">The questions, in the order we ask them</h2>
      <p className="mt-1 text-muted-foreground">The first question that matches decides the path.</p>
      <ol className="mt-6 ml-4 space-y-4 border-l-2 border-border pl-6 sm:ml-0 sm:pl-8">
        {STEPS.map((s, i) => (
          <li key={s.q} className="relative rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-6">
            <span className="absolute top-5 -left-[2.65rem] grid size-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-display text-sm font-black text-white ring-4 ring-background sm:-left-[3.15rem]">
              {i + 1}
            </span>
            <p className="text-lg font-extrabold">{s.q}</p>
            <p className="mt-2 flex gap-2 rounded-2xl bg-primary-soft p-3 text-[15px] font-medium">
              <ArrowRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden /> {s.then}
            </p>
            {s.sources.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
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

      <h2 className="mt-14 font-display text-3xl font-black tracking-tight">When you&apos;re not sure</h2>
      <p className="mt-3 rounded-3xl border-2 border-warn/30 bg-warn-soft p-5 text-[15px] leading-relaxed text-warn">
        Every question has a &quot;not sure&quot; answer. When you use it, we run the rules again with each possible answer
        and show you where that would lead. If the answer could change, or the rules can&apos;t place you safely, we tell you
        to call a free legal service (Redfern Legal Centre, (02) 9698 7277) before you send anything.
      </p>

      <h2 className="mt-14 font-display text-3xl font-black tracking-tight">Worked examples</h2>
      <p className="mt-1 text-muted-foreground">
        Each result below is produced by running the rules on this page, not written by hand. Sample names only.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {EXAMPLE_CASES.map((c) => {
          const f = { ...c.facts, moveOutDate: "2026-08-20" };
          const r = classify(f);
          const ex = explain(f);
          return (
            <div key={c.id} className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${c.kind === "typical" ? "bg-primary-soft text-primary" : "bg-warn-soft text-warn"}`}>
                  {c.kind}
                </span>
                <span className="font-extrabold">{c.label}</span>
              </div>
              <p className="mt-3 rounded-2xl bg-muted p-3 text-[15px]">
                <span className="text-muted-foreground">Result: </span>
                <span className="font-bold">{PATH_LABEL[r.path]}</span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                {ex.checkWithAService ? (
                  <><AlertTriangle className="h-4 w-4 text-warn" aria-hidden /> <span className="text-warn">Not certain: tells you to get free advice first</span></>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> <span className="text-primary">Clear from the answers</span></>
                )}
              </p>
              {ex.whatIfs.length > 0 && (
                <ul className="mt-2 text-sm text-muted-foreground">
                  {ex.whatIfs.map((w) => <li key={w.path}>{w.condition} → {PATH_LABEL[w.path]}</li>)}
                </ul>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Why it matters: {c.lesson}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-14 font-display text-3xl font-black tracking-tight">Known limits</h2>
      <ul className="mt-4 list-disc space-y-2 rounded-3xl border border-border bg-card p-6 pl-10 text-[15px] text-muted-foreground shadow-xl shadow-slate-900/5">
        <li>Business-day deadlines skip weekends but not public holidays, so we say &quot;about&quot; and the real date can be a day or two later.</li>
        <li>Renting from another tenant may really be a sub-tenancy under the Residential Tenancies Act; we flag it as uncertain.</li>
        <li>The boarding-house test relies on your estimate of how many people live there.</li>
        <li>No lawyer has reviewed these rules yet.</li>
      </ul>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ShimmerLink href="/recover">Check your own situation <ArrowRight className="size-5" aria-hidden /></ShimmerLink>
        <Link className="text-sm font-semibold underline" href="/sources">All sources</Link>
      </div>
      </div>
    </div>
  );
}
