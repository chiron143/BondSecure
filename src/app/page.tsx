import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Download,
  Film,
  Globe,
  Landmark,
  ListChecks,
  Scale,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import { aiPrivacyLine, isPaidTier } from "@/lib/content/privacy";
import { SOURCES } from "@/lib/content/sources";
import { VOICES } from "@/lib/content/voices";

// Example only (Sample Rooms is not a real operator). Mirrors what the app produces.
const EXAMPLE_FINDINGS = [
  { t: "00:08", room: "Bedroom", item: "Wall beside light switch", note: "Two dark scuff marks, about 10 cm long", tag: "Damaged" },
  { t: "00:21", room: "Bedroom", item: "Desk", note: "Front left corner chipped, bare wood showing", tag: "Damaged" },
  { t: "00:36", room: "Bedroom", item: "Window blind", note: "Two slats bent near the bottom", tag: "Damaged" },
  { t: "00:42", room: "Ensuite", item: "Floor tile by door", note: "Small chip in one tile corner", tag: "Damaged" },
];

const EXAMPLE_LETTER = `Dear Sample Rooms,

I paid a security deposit of $802.00 on 2 February 2026 for my room at Room 12, 100 Example Street, Surry Hills NSW 2010. My occupancy ended on 20 August 2026.

Under the occupancy principles in the Boarding Houses Act 2012 (NSW), a security deposit must be refunded within 14 days after the resident leaves, less only permitted deductions. That date was 3 September 2026, which is now 36 days ago.

I request that you refund $802.00 to me in full by 16 October 2026…`;

const boardingSource = SOURCES.find((s) => s.id === "boarding-deposit")!;

export default function Home() {
  const paid = isPaidTier();
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-navy-ink">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-navy-line px-3 py-1 text-xs font-semibold uppercase tracking-wider text-navy-muted">
            <Globe className="h-3.5 w-3.5" aria-hidden /> For international students renting in NSW
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Bond not back? Find out which law they&apos;ve broken, and demand it back today.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-navy-muted">
            Answer a few plain questions, or drop in your receipt and their emails. Tested NSW rules tell you which law applies
            and exactly how many days late they are. You get a formal demand letter and a claim pack with your evidence,
            explained in your language.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/recover" className="btn-primary bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
              Get my bond back <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="/move-in" className="btn border border-navy-line bg-white/5 text-white hover:bg-white/10">
              <Upload className="h-5 w-5" aria-hidden /> Moving in? Protect your bond first
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {[
              { Icon: BadgeCheck, text: "100% free, no account" },
              { Icon: ShieldCheck, text: paid ? "Video deleted after analysis" : "No database, nothing kept by us" },
              { Icon: Scale, text: "Every rule linked to its NSW source" },
            ].map(({ Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-navy-line">
                <Icon className="h-4 w-4 text-emerald-400" aria-hidden /> {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-xs text-navy-muted">
            {aiPrivacyLine()}{" "}
            <Link href="/privacy" className="underline">How your data is handled</Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Steps: the headline job */}
        <section className="-mt-6 rounded-2xl border border-line bg-card p-3 shadow-sm sm:p-4">
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              { Icon: ListChecks, t: "Answer a few questions", d: "Or let AI read your receipt and emails. You confirm every answer." },
              { Icon: Scale, t: "See where you stand", d: "Which law, the legal deadline and how late they are, with sources." },
              { Icon: Send, t: "Send the demand", d: "A formal letter, a claim pack and an NCAT kit if they still don't pay." },
            ].map(({ Icon, t, d }, i) => (
              <li key={t} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-accent">Step {i + 1}</span>
                  <span className="block font-semibold leading-tight">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Workspace example */}
        <section className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">What you get</h2>
            <span className="rounded-full bg-warn-soft px-3 py-1 text-xs font-semibold text-warn">Example · sample data</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {/* First: the legal position, the headline job */}
            <div className="card flex flex-col">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Landmark className="h-4 w-4" aria-hidden /> Your legal position
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-warn px-3 py-1.5 text-sm font-bold text-white dark:text-slate-950">
                  <AlertTriangle className="h-4 w-4" aria-hidden /> 36 days overdue
                </span>
                <span className="font-display text-2xl font-bold tracking-tight">$802 owed</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-paper p-3">
                  <dt className="flex items-center gap-1.5 text-muted"><CalendarClock className="h-4 w-4" aria-hidden /> Due back</dt>
                  <dd className="mt-0.5 font-semibold">3 September 2026</dd>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <dt className="flex items-center gap-1.5 text-muted"><Scale className="h-4 w-4" aria-hidden /> Law</dt>
                  <dd className="mt-0.5 font-semibold">
                    <a className="underline" href={boardingSource.url}>Boarding Houses Act 2012</a>
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex-1 rounded-xl border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                  <span className="text-sm font-semibold">Demand letter</span>
                  <CopyButton text={EXAMPLE_LETTER} />
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap p-3 font-sans text-sm text-muted">{EXAMPLE_LETTER}</pre>
              </div>
              <Link href="/recover" className="btn-primary mt-4">
                <Download className="h-5 w-5" aria-hidden /> Make my own claim pack
              </Link>
            </div>
            {/* Second: move-in evidence makes the claim stronger */}
            <div className="card">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Film className="h-4 w-4" aria-hidden /> Even stronger: proof from move-in day
              </p>
              <ol className="mt-4 space-y-3">
                {EXAMPLE_FINDINGS.map((f) => (
                  <li key={f.t} className="flex gap-3">
                    <div className="relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-300 to-slate-500 text-white dark:from-slate-700 dark:to-slate-900">
                      <Film className="h-5 w-5 opacity-70" aria-hidden />
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 font-mono text-[10px]">{f.t}</span>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">
                        <span className="font-mono text-accent">{f.t}</span> · {f.room}: {f.item}
                      </p>
                      <p className="text-muted">{f.note}</p>
                      <span className="mt-1 inline-block rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">{f.tag}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted">
                Each still is taken from your own video at that second. You confirm every line before the PDF is made.
              </p>
            </div>

          </div>
        </section>

        {/* Follow-on: protect the next room */}
        <section className="mb-12 grid gap-6 rounded-2xl bg-navy p-6 text-navy-ink sm:p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Moving into a new room?</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Make sure this never happens again.</h2>
            <p className="mt-3 text-navy-muted">
              Film a 2-minute walk-through on day one and say what you see. AI lists every mark with the second it appears and a
              still from your video. Keep the PDF: if your bond isn&apos;t returned, upload it here and it goes straight into your
              claim.
            </p>
          </div>
          <Link href="/move-in" className="btn-primary bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            <Film className="h-5 w-5" aria-hidden /> Record my move-in report
          </Link>
        </section>

        {/* Evidence of the problem */}
        <section className="pb-12">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">This happens to international students all the time</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "1 in 2",
                d: "international students rent in the private market, compared with about 1 in 3 other Australians.",
                s: "Reserve Bank of Australia, July 2025 (survey of 70,000+ students)",
              },
              {
                n: "6,800",
                d: "bond disputes reached the NSW tribunal in 2024: 1 in 4 private rental cases. Most tenants face it alone, without a lawyer.",
                s: "Law and Justice Foundation of NSW, June 2025",
              },
              {
                n: "6",
                d: "residents of one Sydney student building, our founder included, promised their deposit back “within 15 days” and still waiting weeks later.",
                s: "Our own building, October 2026",
              },
            ].map((x) => (
              <div key={x.n} className="card">
                <p className="font-display text-5xl font-bold tracking-tight text-accent">{x.n}</p>
                <p className="mt-3 text-[15px]">{x.d}</p>
                <p className="mt-2 text-xs text-muted">{x.s}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            Earlier research found international students often have no receipt, no written agreement and no record of the
            room&apos;s condition.{" "}
            <Link href="/sources" className="underline">Sources</Link>
          </p>
          {VOICES.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {VOICES.map((v) => (
                <figure key={v.quote} className="card">
                  <blockquote className="text-lg">&ldquo;{v.quote}&rdquo;</blockquote>
                  <figcaption className="mt-2 text-sm text-muted">{v.who}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold">Built for how students actually rent</h2>
            <p className="mt-2 text-[15px] text-muted">
              Paid your deposit to a building manager? Living in student accommodation run by a company? Bond never lodged
              with Fair Trading? Those are the cases other tools skip, and the ones we start with. Your result can be
              explained in Chinese, Hindi, Nepali, Vietnamese and 8 more languages.
            </p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold">Honest about what it is</h2>
            <p className="mt-2 text-[15px] text-muted">
              Legal information, not legal advice. Which law applies and every deadline are worked out by tested rules, not
              AI, and each rule links to its official source. When your situation is unclear, we tell you to call a free
              legal service instead of guessing. <Link href="/how-it-decides" className="underline">See how it decides</Link>, including
              the tricky cases.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
