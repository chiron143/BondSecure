"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleHelp,
  Copy,
  Download,
  FileSignature,
  FileText,
  FileX,
  Globe,
  GraduationCap,
  Home,
  Languages,
  ListOrdered,
  Mail,
  MapPin,
  MessageSquareHeart,
  User,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChoiceCards, Field, HeroBand, Question, SectionCard, type ChoiceOpt } from "@/components/bold";
import { ShimmerAction } from "@/components/ShimmerLink";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Progress } from "@/components/ui/progress";
import { FEEDBACK_URL } from "@/lib/content/feedback";
import { buildDemandLetter, type Parties } from "@/lib/content/letters";
import { LANGUAGES } from "@/lib/content/languages";
import { DISCLAIMER, HELP_CONTACTS } from "@/lib/content/sources";
import { moveInFitsCase } from "@/lib/movein/usable";
import { buildClaimPackPdf } from "@/lib/pdf/claimPack";
import { downloadPdf } from "@/lib/pdf/layout";
import { addDays, formatDate, todayIso } from "@/lib/rules/dates";
import { buildVerdict } from "@/lib/rules/engine";
import { EXAMPLE_CASES, EXAMPLE_PARTIES } from "@/lib/rules/examples";
import { PATH_LABEL, explain } from "@/lib/rules/explain";
import type { Agreement, CaseFacts, Residents, Who, YesNoUnsure } from "@/lib/rules/types";
import { useStore } from "@/lib/store";
import AbnFinder from "./AbnFinder";
import EvidenceReader from "./EvidenceReader";
import HowWeDecided from "./HowWeDecided";
import MoveInUpload from "./MoveInUpload";

const STATE: ChoiceOpt<"NSW" | "other">[] = [
  { v: "NSW", label: "Yes, NSW", Icon: MapPin },
  { v: "other", label: "No, another state", Icon: Globe },
];
const WHO: ChoiceOpt<Who>[] = [
  { v: "operator", label: "A company that runs rooms", hint: "Student accommodation, co-living, a building manager", Icon: Building2 },
  { v: "real_estate_agent", label: "A real estate agent", Icon: BadgeCheck },
  { v: "private_landlord", label: "A private landlord", Icon: UserRound },
  { v: "university", label: "My university or college", Icon: GraduationCap },
  { v: "head_tenant", label: "Another tenant who lives there", Icon: Users },
  { v: "live_in_owner", label: "The owner, who lives there too", Icon: Home },
  { v: "not_sure", label: "I'm not sure", Icon: CircleHelp },
];
const AGREEMENT: ChoiceOpt<Agreement>[] = [
  { v: "residential_tenancy_agreement", label: "A residential tenancy agreement", hint: "The standard NSW lease", Icon: FileSignature },
  { v: "occupancy_agreement", label: "An occupancy agreement, licence or house rules", Icon: FileText },
  { v: "nothing_written", label: "Nothing written", Icon: FileX },
  { v: "not_sure", label: "I'm not sure", Icon: CircleHelp },
];
const RESIDENTS: ChoiceOpt<Residents>[] = [
  { v: "5_or_more", label: "5 or more people", Icon: Users },
  { v: "under_5", label: "Fewer than 5", Icon: User },
  { v: "not_sure", label: "I'm not sure", Icon: CircleHelp },
];
const LODGED: ChoiceOpt<YesNoUnsure>[] = [
  { v: "yes", label: "Yes, I got a bond number", Icon: CheckCircle2 },
  { v: "no", label: "No, nothing from Fair Trading", Icon: XCircle },
  { v: "not_sure", label: "I'm not sure", Icon: CircleHelp },
];

export default function Recover() {
  const store = useStore();
  const reduce = useReducedMotion();
  const [facts, setFacts] = useState<Partial<CaseFacts>>(store.facts ?? { state: "NSW" });
  const [parties, setParties] = useState<Partial<Parties>>(
    store.parties ?? { propertyAddress: store.moveIn?.propertyAddress, studentName: store.moveIn?.tenantName },
  );
  const [showVerdict, setShowVerdict] = useState(Boolean(store.facts));
  const [copied, setCopied] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [lang, setLang] = useState("en");
  const [translated, setTranslated] = useState<Record<string, Map<string, string>>>({});
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  const f = (patch: Partial<CaseFacts>) => setFacts((x) => ({ ...x, ...patch }));
  const p = (patch: Partial<Parties>) => setParties((x) => ({ ...x, ...patch }));

  // Every answer the rules need, in the order it appears on the page (id = where to scroll).
  const required: { id: string; label: string; ok: unknown }[] = [
    { id: "q-state", label: "Was it in NSW?", ok: facts.state },
    { id: "q-who", label: "Who did you rent from?", ok: facts.who },
    { id: "q-agreement", label: "What did you sign?", ok: facts.agreement },
    { id: "q-residents", label: "How many people lived there?", ok: facts.residents },
    { id: "q-lodged", label: "Did you get a bond number?", ok: facts.bondLodged },
    { id: "paid", label: "Bond or deposit paid", ok: facts.amountPaid },
    { id: "out", label: "Date you moved out", ok: facts.moveOutDate },
    { id: "sn", label: "Your full name", ok: parties.studentName?.trim() },
    { id: "pa", label: "Address of the place", ok: parties.propertyAddress?.trim() },
    { id: "ln", label: "Who you paid", ok: parties.landlordName?.trim() },
  ];
  const missing = required.filter((r) => !r.ok);
  const complete = missing.length === 0;
  const answered = required.length - missing.length;
  const flag = (id: string) => triedSubmit && missing.some((m) => m.id === id);

  function submit() {
    if (complete) {
      window.scrollTo({ top: 0 });
      return setShowVerdict(true);
    }
    setTriedSubmit(true);
    // Take them to the first thing still missing.
    const el = document.getElementById(missing[0].id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
  }

  const result = useMemo(() => {
    if (!complete || !showVerdict) return null;
    const verdict = buildVerdict(facts as CaseFacts);
    const letter = buildDemandLetter(facts as CaseFacts, verdict, parties as Parties, moveInFitsCase(store.moveIn, facts as CaseFacts));
    return { verdict, letter };
  }, [complete, showVerdict, facts, parties, store.moveIn]);

  if (result) {
    const { verdict: v, letter } = result;
    // Everything a student reads to understand their situation, but never the letter.
    const ex = explain(facts as CaseFacts);
    const explanation = [
      v.title, v.summary, ...v.because, ...v.flags, ...v.nextSteps, ...v.getHelpIf,
      ...v.deadlines.flatMap((d) => [d.label, d.note ?? ""]),
      PATH_LABEL[v.path], ...ex.whatIfs.flatMap((w) => [w.condition, PATH_LABEL[w.path]]),
      "This depends on something you weren't sure about:", "Check with a free legal service before you send anything.",
    ].filter(Boolean);
    const map = translated[lang];
    const t = (s: string) => map?.get(s) ?? s;

    // Only a refund deadline (the legal one, or the date their own terms promised) belongs in the
    // headline. A missed bond-lodgement date is shown in Deadlines, not as "overdue".
    const late = v.deadlines.find(
      (d) => (d.daysOverdue ?? 0) > 0 && (d.label.startsWith("Legal deadline to refund") || d.label.includes("promised")),
    );
    const unsure = ex.checkWithAService;

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

    const rise = (delay = 0) =>
      reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const } };

    return (
      <div>
        <HeroBand tone={late && !unsure ? "red" : "emerald"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-muted hover:text-white" onClick={() => setShowVerdict(false)}>
              <ArrowLeft className="size-4" aria-hidden /> Change my answers
            </button>
            <label className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-1 pl-3 text-sm ring-1 ring-white/15 backdrop-blur">
              <Languages className="size-4 text-emerald-300" aria-hidden />
              <span className="text-navy-muted">Read this in</span>
              <select
                className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white outline-none"
                value={lang}
                disabled={translating}
                onChange={(e) => translate(e.target.value)}
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </label>
          </div>
          {translating && <p className="mt-3 text-sm text-navy-muted">Translating…</p>}
          {translateError && <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">Couldn&apos;t translate: {translateError}</p>}
          {lang !== "en" && map && (
            <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm text-navy-ink">
              Translated by AI to help you understand. The English version is the one that counts, and your letter stays in English
              because that&apos;s what the landlord and NCAT read.{" "}
              <button className="underline" onClick={() => setLang("en")}>Show English</button>
            </p>
          )}

          {late && (
            <motion.div {...rise(0.05)} className="mt-8">
              <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${unsure ? "bg-amber-400/15 text-amber-200" : "bg-red-500/20 text-red-200"}`}>
                <AlertTriangle className="size-3.5" aria-hidden /> {unsure ? "Refund possibly overdue" : "Refund overdue"}
              </p>
              <p className="mt-3 font-display leading-none font-black tracking-tighter text-white">
                <NumberTicker value={late.daysOverdue ?? 0} className="text-7xl tracking-tighter text-white sm:text-9xl" />
                <span className="ml-3 text-3xl font-extrabold text-white/80 sm:text-5xl">days late</span>
              </p>
            </motion.div>
          )}
          <motion.p {...rise(0.15)} className="mt-8 text-sm font-bold tracking-wider text-emerald-300 uppercase">
            {v.lawName ?? "Your situation"} · {v.confidence}
          </motion.p>
          <motion.h1 {...rise(0.2)} className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight text-balance text-white sm:text-5xl">
            {t(v.title)}
          </motion.h1>
          <motion.p {...rise(0.3)} className="mt-4 max-w-2xl text-lg text-navy-muted">{t(v.summary)}</motion.p>
          <motion.p {...rise(0.4)} className="mt-6 inline-flex items-baseline gap-2 rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/15 backdrop-blur">
            <span className="font-display text-4xl font-black tracking-tight text-emerald-300 sm:text-5xl">
              $<NumberTicker value={v.amountOwed} decimalPlaces={v.amountOwed % 1 ? 2 : 0} delay={0.3} className="text-emerald-300" />
            </span>
            <span className="text-base font-semibold text-navy-muted">owed to you</span>
          </motion.p>
        </HeroBand>

        <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
          <HowWeDecided v={v} ex={ex} t={t} />

          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
              <CalendarClock className="size-5 text-primary" aria-hidden /> Deadlines
            </h2>
            <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
              {v.deadlines.map((d) => (
                <li key={d.label} className="relative">
                  <span className={`absolute top-1.5 -left-[27px] size-3 rounded-full ring-4 ring-card ${d.daysOverdue ? "bg-warn" : "bg-primary"}`} aria-hidden />
                  <p className="text-sm text-muted-foreground">{t(d.label)}</p>
                  {d.dueDate && (
                    <p className="font-bold">
                      {formatDate(d.dueDate)}
                      {d.daysOverdue ? <span className="ml-2 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">{d.daysOverdue} days ago</span> : null}
                    </p>
                  )}
                  {d.note && <p className="text-xs text-muted-foreground">{t(d.note)}</p>}
                </li>
              ))}
            </ol>
          </section>

          {v.flags.length > 0 && (
            <div className="rounded-3xl border-2 border-warn/30 bg-warn-soft p-6 text-sm text-warn">
              <p className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4" aria-hidden /> Also worth knowing</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">{v.flags.map((x) => <li key={x}>{t(x)}</li>)}</ul>
            </div>
          )}

          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
              <ListOrdered className="size-5 text-primary" aria-hidden /> What to do, in order
            </h2>
            <ol className="mt-4 space-y-3">
              {v.nextSteps.map((s, i) => (
                <li key={s} className="flex gap-3 text-[15px]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">{i + 1}</span>
                  <span className="pt-0.5">{t(s)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
                <Mail className="size-5 text-primary" aria-hidden /> Your letter <span className="text-xs font-semibold text-muted-foreground">(English, as sent)</span>
              </h2>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-bold hover:border-primary"
                onClick={() => { navigator.clipboard.writeText(`${letter.subject}\n\n${letter.body}`); setCopied(true); }}
              >
                {copied ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-bold">Subject: {letter.subject}</p>
              <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-paper p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap">{letter.body}</pre>
              <p className="mt-3 text-xs text-muted-foreground">Send it by email so it&apos;s dated. Add your bank details if you want them to pay by transfer.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5">
            <h2 className="font-display text-xl font-extrabold tracking-tight">Your evidence</h2>
            {store.moveIn && !moveInFitsCase(store.moveIn, facts as CaseFacts) ? (
              <p className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">
                Your saved move-in report is dated {formatDate(store.moveIn.moveInDate)}, after you moved out, so it can&apos;t be
                evidence for this room and isn&apos;t included. Upload the right report below, or use your own move-in photos.
              </p>
            ) : store.moveIn ? (
              <p className="mt-3 flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Your move-in report from {formatDate(store.moveIn.moveInDate)} ({store.moveIn.items.filter((i) => i.status === "confirmed" && i.condition !== "good").length} existing problems) goes into your claim pack.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No move-in report loaded. Use your own move-in and move-out photos, or upload the report below. Next time,{" "}
                <Link className="underline" href="/move-in">record your room on day one</Link>.
              </p>
            )}
          </section>
          {(!store.moveIn || !moveInFitsCase(store.moveIn, facts as CaseFacts)) && <MoveInUpload />}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <ShimmerAction
              className="w-full sm:w-auto"
              onClick={async () => {
                store.setCase(facts as CaseFacts, parties as Parties);
                downloadPdf(
                  await buildClaimPackPdf({ facts: facts as CaseFacts, verdict: v, parties: parties as Parties, letter, moveIn: store.moveIn }),
                  `bond-claim-pack-${todayIso()}.pdf`,
                );
              }}
            >
              <Download className="size-5" aria-hidden /> Download my claim pack (PDF)
            </ShimmerAction>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3.5 text-sm font-bold hover:border-primary"
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquareHeart className="size-4 text-primary" aria-hidden /> Give feedback (2 min)
            </a>
          </div>

          <div className="rounded-3xl border border-border p-6 text-sm text-muted-foreground">
            <p className="font-bold text-ink">Get free help first if: {v.getHelpIf.map(t).join("; ")}.</p>
            <ul className="mt-2 space-y-1">{HELP_CONTACTS.map((c) => <li key={c.name}><a className="underline" href={c.url}>{c.name}</a>: {c.detail}</li>)}</ul>
            <p className="mt-3 text-xs">{DISCLAIMER}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroBand>
        <p className="text-sm font-bold tracking-wider text-emerald-300 uppercase">Bond not back?</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
          Let&apos;s get your{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">money back.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-navy-muted">
          A few questions to work out which rules apply to you. Answer &quot;not sure&quot; whenever you&apos;re not sure. About 3 minutes.
        </p>
        <div className="mt-6">
          <p className="text-xs font-bold tracking-wider text-navy-muted uppercase">Or try an example case</p>
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {EXAMPLE_CASES.map((c) => (
              <button
                key={c.id}
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-left text-sm font-medium whitespace-nowrap text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 sm:shrink sm:whitespace-normal"
                onClick={() => {
                  setFacts({ ...c.facts, moveOutDate: addDays(todayIso(), -50) });
                  setParties(EXAMPLE_PARTIES);
                  setShowVerdict(true);
                  window.scrollTo({ top: 0 });
                }}
              >
                <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${c.kind === "typical" ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"}`}>
                  {c.kind}
                </span>
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-navy-muted">Examples use sample names. &quot;Sample Rooms&quot; is not a real operator.</p>
        </div>
      </HeroBand>

      {/* Sticky progress */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
          <Progress value={(answered / required.length) * 100} className="h-2 flex-1" aria-label="Answers completed" />
          <span className="shrink-0 text-sm font-bold tabular-nums">
            {answered} of {required.length} answered
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <SectionCard n={1} title="Start with your documents" hint="Optional, but it fills in most of the answers for you.">
          <EvidenceReader
            onApply={(found, who) => {
              setFacts((x) => ({ ...x, ...found }));
              setParties((x) => ({ ...x, ...who }));
            }}
          />
          <MoveInUpload
            onLoaded={(r) =>
              setParties((x) => ({ ...x, propertyAddress: x.propertyAddress || r.propertyAddress, studentName: x.studentName || r.tenantName }))
            }
          />
        </SectionCard>

        <SectionCard n={2} title="About the place" hint="These decide which law applies. Not sure? Say so.">
          <Question id="q-state" label="Was the place in New South Wales?" flagged={flag("q-state")}>
            <ChoiceCards name="state" value={facts.state} onChange={(state) => f({ state })} opts={STATE} />
          </Question>
          <Question id="q-who" label="Who did you rent from?" flagged={flag("q-who")}>
            <ChoiceCards name="who" opts={WHO} value={facts.who} onChange={(who) => f({ who })} />
          </Question>
          <Question id="q-agreement" label="What did you sign?" flagged={flag("q-agreement")}>
            <ChoiceCards name="agreement" opts={AGREEMENT} value={facts.agreement} onChange={(agreement) => f({ agreement })} />
          </Question>
          <Question id="q-residents" label="How many people lived there, not counting the owner or manager?" flagged={flag("q-residents")}>
            <ChoiceCards name="residents" opts={RESIDENTS} value={facts.residents} onChange={(residents) => f({ residents })} cols={3} />
          </Question>
          <Question id="q-lodged" label="Did NSW Fair Trading or Rental Bonds Online ever email or text you a bond number?" flagged={flag("q-lodged")}>
            <ChoiceCards name="lodged" opts={LODGED} value={facts.bondLodged} onChange={(bondLodged) => f({ bondLodged })} cols={3} />
          </Question>
        </SectionCard>

        <SectionCard n={3} title="The money and the dates">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="paid" label="Bond or deposit paid ($)" type="number" min={0} inputMode="decimal" flagged={flag("paid")} value={facts.amountPaid ?? ""} onChange={(e) => f({ amountPaid: Number(e.target.value) || undefined })} />
            <Field id="rent" label="Rent per week ($)" type="number" min={0} inputMode="decimal" value={facts.weeklyRent ?? ""} onChange={(e) => f({ weeklyRent: Number(e.target.value) || undefined })} />
            <Field id="datePaid" label="Date you paid it" type="date" value={facts.datePaid ?? ""} onChange={(e) => f({ datePaid: e.target.value || undefined })} />
            <Field id="out" label="Date you moved out and returned keys" type="date" flagged={flag("out")} value={facts.moveOutDate ?? ""} onChange={(e) => f({ moveOutDate: e.target.value || undefined })} />
            <Field id="refunded" label="Already refunded to you ($)" type="number" min={0} inputMode="decimal" value={facts.amountRefunded ?? ""} onChange={(e) => f({ amountRefunded: Number(e.target.value) || undefined })} />
            <Field id="promise" label="Refund period in their terms (days, if any)" type="number" min={0} inputMode="numeric" value={facts.agreementRefundDays ?? ""} onChange={(e) => f({ agreementRefundDays: Number(e.target.value) || undefined })} />
            <Field id="reason" className="sm:col-span-2" label="What did they tell you, if anything?" value={facts.reasonGiven ?? ""} onChange={(e) => f({ reasonGiven: e.target.value })} placeholder={'e.g. "still being processed", "cleaning fee"'} />
          </div>
        </SectionCard>

        <SectionCard n={4} title="For your letter">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="sn" label="Your full name" flagged={flag("sn")} value={parties.studentName ?? ""} onChange={(e) => p({ studentName: e.target.value })} />
            <Field id="se" label="Your email" type="email" value={parties.studentEmail ?? ""} onChange={(e) => p({ studentEmail: e.target.value })} />
            <Field id="pa" className="sm:col-span-2" label="Address of the place" flagged={flag("pa")} value={parties.propertyAddress ?? ""} onChange={(e) => p({ propertyAddress: e.target.value })} />
            <Field id="ln" label="Who you paid (name you know them by)" flagged={flag("ln")} value={parties.landlordName ?? ""} onChange={(e) => p({ landlordName: e.target.value })} />
            <div>
              <Field id="ll" label="Their company name (optional)" value={parties.landlordLegalName ?? ""} onChange={(e) => p({ landlordLegalName: e.target.value || undefined })} placeholder="From their ABN, e.g. Example Pty Ltd" />
              <AbnFinder tradingName={parties.landlordName} onPick={(landlordLegalName) => p({ landlordLegalName })} />
            </div>
          </div>
        </SectionCard>

        {triedSubmit && !complete && (
          <div className="rounded-3xl border-2 border-warn/30 bg-warn-soft p-5 text-sm text-warn" role="alert">
            <p className="font-bold">Answer {missing.length === 1 ? "this one" : `these ${missing.length}`} first:</p>
            <ul className="mt-1 list-disc pl-5">
              {missing.map((m) => (
                <li key={m.id}>
                  <button type="button" className="underline" onClick={() => document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ShimmerAction className="w-full py-5 text-lg" onClick={submit}>
          Show me where I stand {complete && <CheckCircle2 className="size-5" aria-hidden />}
        </ShimmerAction>
      </div>
    </div>
  );
}
