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
import Image from "next/image";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import HeroPhone from "@/components/home/HeroPhone";
import Reveal from "@/components/Reveal";
import ShimmerLink from "@/components/ShimmerLink";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { GridPattern } from "@/components/ui/grid-pattern";
import { aiPrivacyLine, isPaidTier } from "@/lib/content/privacy";
import { SOURCES } from "@/lib/content/sources";
import { VOICES } from "@/lib/content/voices";

// A real run: stills and the AI's own descriptions from the founder's 56-second iPhone
// video of the room they rent (10 Oct 2026). Notes are copied from the report it produced.
const REAL_FINDINGS = [
  {
    t: "00:21",
    src: "/real-run/0021-upper-wall.jpg",
    item: "Upper wall",
    note: "Extensive paint blistering, flaking, and water damage running horizontally across the upper wall above the desk",
  },
  {
    t: "00:28",
    src: "/real-run/0028-corner-mould.jpg",
    item: "Wall corner behind desk",
    note: "Black mould or moisture buildup with flaking and chipped paint near the skirting and corner",
  },
  {
    t: "00:41",
    src: "/real-run/0041-wall-by-switch.jpg",
    item: "Wall near switch and bed",
    note: "Uneven paint patches and peeled paint spots next to wall light switch and above the bed",
  },
];

const EXAMPLE_LETTER = `Dear Sample Rooms,

I paid a security deposit of $802.00 on 2 February 2026 for my room at Room 12, 100 Example Street, Surry Hills NSW 2010. My occupancy ended on 20 August 2026.

Under the occupancy principles in the Boarding Houses Act 2012 (NSW), a security deposit must be refunded within 14 days after the resident leaves, less only permitted deductions. That date was 3 September 2026, which is now 36 days ago.

I request that you refund $802.00 to me in full by 16 October 2026…`;

// From the tester feedback form (4 international students, 10-11 Oct 2026).
const TESTER_RESULTS = [
  { value: 4, decimals: 0, suffix: "/4", d: "said the move-in report found every mark they pointed at" },
  { value: 4, decimals: 0, suffix: "/4", d: "would send the demand letter it wrote" },
  { value: 9.75, decimals: 2, suffix: "", d: "out of 10 for \u201cit worked, and I\u2019d trust what it told me\u201d" },
];

const boardingSource = SOURCES.find((s) => s.id === "boarding-deposit")!;

export default function Home() {
  const paid = isPaidTier();
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-navy-ink">
        {/* Aurora glow and a faint grid behind everything */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="animate-aurora absolute -top-40 -left-32 size-[34rem] rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="animate-aurora-slow absolute top-20 -right-40 size-[30rem] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="animate-aurora absolute -bottom-48 left-1/3 size-[26rem] rounded-full bg-teal-400/15 blur-3xl [animation-delay:-6s]" />
          <GridPattern
            width={44}
            height={44}
            className="fill-white/[0.02] stroke-white/[0.06] [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur">
              <Globe className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              <AnimatedShinyText className="mx-0 max-w-none text-navy-muted [--shiny-width:120px]">
                For international students renting in NSW
              </AnimatedShinyText>
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-5xl xl:text-[3.5rem]">
              Bond not back? Find out which law they&apos;ve broken, and{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-300 bg-clip-text text-transparent">
                demand it back today.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-muted">
              Answer a few plain questions, or drop in your receipt and their emails. Tested NSW rules tell you which law applies
              and exactly how many days late they are. You get a formal demand letter and a claim pack with your evidence,
              explained in your language.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ShimmerLink href="/recover">
                Get my bond back <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </ShimmerLink>
              <Link
                href="/move-in"
                className="btn border border-white/15 bg-white/5 text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                <Upload className="h-5 w-5" aria-hidden /> Moving in? Protect your bond first
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2 text-sm">
              {[
                { Icon: BadgeCheck, text: "100% free, no account" },
                { Icon: ShieldCheck, text: paid ? "Video deleted after analysis" : "No database, nothing kept by us" },
                { Icon: Scale, text: "Every rule linked to its NSW source" },
              ].map(({ Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur">
                  <Icon className="h-4 w-4 text-emerald-400" aria-hidden /> {text}
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-xl text-xs text-navy-muted">
              {aiPrivacyLine()}{" "}
              <Link href="/privacy" className="underline">How your data is handled</Link>
            </p>
          </div>

          <HeroPhone />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Steps: the headline job */}
        <Reveal>
        <section className="relative -mt-8 rounded-2xl border border-line bg-card/90 p-3 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-4">
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              { Icon: ListChecks, t: "Answer a few questions", d: "Or let AI read your receipt and emails. You confirm every answer." },
              { Icon: Scale, t: "See where you stand", d: "Which law, the legal deadline and how late they are, with sources." },
              { Icon: Send, t: "Send the demand", d: "A formal letter, a claim pack and an NCAT kit if they still don't pay." },
            ].map(({ Icon, t, d }, i) => (
              <li
                key={t}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-line p-3 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="pointer-events-none absolute -right-2 -bottom-6 font-display text-7xl font-black text-primary/5 transition group-hover:text-primary/10" aria-hidden>
                  {i + 1}
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/30">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-primary">Step {i + 1}</span>
                  <span className="block font-semibold leading-tight">{t}</span>
                  <span className="block text-sm text-muted-foreground">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        </Reveal>

        {/* Workspace example */}
        <section className="py-16">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">What you get</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              A demand that cites the law, and proof from day one.
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {/* First: the legal position, the headline job */}
            <Reveal className="flex">
            <div className="card relative flex w-full flex-col overflow-hidden">
              <BorderBeam size={120} duration={9} colorFrom="#10b981" colorTo="#38bdf8" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Landmark className="h-4 w-4" aria-hidden /> Your legal position
                </p>
                <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">Sample case</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-warn px-3 py-1.5 text-sm font-bold text-white dark:text-slate-950">
                  <AlertTriangle className="h-4 w-4" aria-hidden /> 36 days overdue
                </span>
                <span className="font-display text-2xl font-bold tracking-tight">$802 owed</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-paper p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="h-4 w-4" aria-hidden /> Due back</dt>
                  <dd className="mt-0.5 font-semibold">3 September 2026</dd>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Scale className="h-4 w-4" aria-hidden /> Law</dt>
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
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap p-3 font-sans text-sm text-muted-foreground">{EXAMPLE_LETTER}</pre>
              </div>
              <Link href="/recover" className="btn-primary mt-4">
                <Download className="h-5 w-5" aria-hidden /> Make my own claim pack
              </Link>
            </div>
            </Reveal>
            {/* Second: move-in evidence makes the claim stronger */}
            <Reveal delay={0.1} className="flex">
            <div className="card w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Film className="h-4 w-4" aria-hidden /> Even stronger: proof from move-in day
                </p>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">Real AI run</span>
              </div>
              <ol className="mt-4 space-y-4">
                {REAL_FINDINGS.map((f) => (
                  <li key={f.t} className="group flex gap-3">
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                    <Image
                      src={f.src}
                      alt={`Still from a real move-in video at ${f.t}: ${f.note}`}
                      width={480}
                      height={360}
                      className="h-24 w-32 object-cover transition duration-500 group-hover:scale-110"
                    />
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">
                        <span className="font-mono text-primary">{f.t}</span> · {f.item}
                      </p>
                      <p className="text-muted-foreground">{f.note}</p>
                      <span className="mt-1 inline-block rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">Damaged</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                From our founder&apos;s own 56-second iPhone video of their room: the AI found every mark pointed out on camera, and each
                still is from that video at that second. You confirm every line before the PDF is made.
              </p>
            </div>
            </Reveal>

          </div>
        </section>

        {/* Follow-on: protect the next room */}
        <Reveal>
        <section className="relative isolate mb-16 grid gap-6 overflow-hidden rounded-3xl bg-navy p-6 text-navy-ink sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="animate-aurora absolute -top-24 -left-24 size-80 rounded-full bg-emerald-500/25 blur-3xl" />
            <div className="animate-aurora-slow absolute -right-20 -bottom-24 size-72 rounded-full bg-sky-500/20 blur-3xl" />
            <GridPattern width={36} height={36} className="fill-white/[0.02] stroke-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Moving into a new room?</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Make sure this never happens again.</h2>
            <p className="mt-3 text-navy-muted">
              Film a 2-minute walk-through on day one and say what you see. AI lists every mark with the second it appears and a
              still from your video. Keep the PDF: if your bond isn&apos;t returned, upload it here and it goes straight into your
              claim.
            </p>
          </div>
          <ShimmerLink href="/move-in" className="justify-self-start md:justify-self-end">
            <Film className="h-5 w-5" aria-hidden /> Record my move-in report
          </ShimmerLink>
        </section>
        </Reveal>

        {/* Evidence of the problem */}
        <section className="pb-16">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">The problem</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">This happens to international students all the time</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: <>1 in 2</>,
                k: "half",
                d: "international students rent in the private market, compared with about 1 in 3 other Australians.",
                s: "Reserve Bank of Australia, July 2025 (survey of 70,000+ students)",
              },
              {
                n: <NumberTicker value={6800} className="text-primary" />,
                k: "6800",
                d: "bond disputes reached the NSW tribunal in 2024: 1 in 4 private rental cases. Most tenants face it alone, without a lawyer.",
                s: "Law and Justice Foundation of NSW, June 2025",
              },
              {
                n: <NumberTicker value={6} className="text-primary" />,
                k: "6",
                d: "residents of one Sydney student building, our founder included, promised their deposit back “within 15 days” and still waiting weeks later.",
                s: "Our own building, October 2026",
              },
            ].map((x, i) => (
              <Reveal key={x.k} delay={i * 0.08} className="flex">
                <div className="card w-full transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <p className="font-display text-5xl font-bold tracking-tight text-primary">{x.n}</p>
                  <p className="mt-3 text-[15px]">{x.d}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{x.s}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Earlier research found international students often have no receipt, no written agreement and no record of the
            room&apos;s condition.{" "}
            <Link href="/sources" className="underline">Sources</Link>
          </p>
          {/* Tester results: 4 international students, feedback form, 10-11 Oct 2026 */}
          <Reveal>
            <p className="mt-14 text-sm font-semibold tracking-wider text-primary uppercase">Tested by 4 international students</p>
          </Reveal>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {TESTER_RESULTS.map((x, i) => (
              <Reveal key={x.d} delay={i * 0.08} className="flex">
                <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-lg shadow-emerald-900/20">
                  <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
                  <p className="font-display text-5xl font-bold tracking-tight">
                    <NumberTicker value={x.value} decimalPlaces={x.decimals} className="text-white" />
                    {x.suffix}
                  </p>
                  <p className="mt-2 text-[15px] text-emerald-50">{x.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {VOICES.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {VOICES.map((v, i) => (
                <Reveal key={v.quote} delay={i * 0.1} className="flex">
                  <figure className="card relative w-full">
                    <span className="pointer-events-none absolute top-2 right-5 font-display text-7xl leading-none text-primary/15" aria-hidden>&rdquo;</span>
                    <blockquote className="text-lg">&ldquo;{v.quote}&rdquo;</blockquote>
                    <figcaption className="mt-3 text-sm text-muted-foreground">{v.who}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold">Built for how students actually rent</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Paid your deposit to a building manager? Living in student accommodation run by a company? Bond never lodged
              with Fair Trading? Those are the cases other tools skip, and the ones we start with. Your result can be
              explained in Chinese, Hindi, Nepali, Vietnamese and 8 more languages.
            </p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold">Honest about what it is</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
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
