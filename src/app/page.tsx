import Link from "next/link";
import { aiPrivacyLine } from "@/lib/content/privacy";
import { VOICES } from "@/lib/content/voices";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="grid gap-10 py-10 sm:py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">For international students renting in NSW</p>
          <h1 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            Your bond is your money. Keep the proof, and get it back.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            New to renting in Sydney? Film your room on move-in day and Bond Secure turns it into a proper condition report. If
            your bond or deposit doesn&apos;t come back, it tells you which NSW rules apply, whether they&apos;ve broken them,
            and gives you the letter and steps to get it back, explained in your language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/move-in" className="btn-primary">I&apos;m moving in</Link>
            <Link href="/recover" className="btn-ghost">I didn&apos;t get my bond back</Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Free. No account, no database. {aiPrivacyLine()}{" "}
            <Link href="/privacy" className="underline">How your data is handled</Link>
          </p>
        </div>

        <div className="card relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Example result</p>
          <p className="mt-3 font-serif text-2xl font-semibold">Your deposit was due back on 3 September. They&apos;re 36 days late.</p>
          <p className="mt-3 text-sm text-muted">Boarding Houses Act 2012 · $802 owed</p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Demand letter, ready to send", "Move-in photos of damage that was already there", "NCAT application kit if they still don't pay"].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-accent">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {[
          {
            n: "1",
            t: "Film your room",
            d: "Walk through slowly on move-in day and say what you see: \"chip on the tile\", \"fan doesn't work\". Two minutes is enough.",
          },
          {
            n: "2",
            t: "Get a real report",
            d: "Every scratch and stain is listed with a still from your video and the time it appears. You check every line before it's final.",
          },
          {
            n: "3",
            t: "If they keep your money",
            d: "Months later, upload your move-in report and screenshots of your receipt. Answer a few questions and we work out which law applies, check the deadlines, and give you a claim pack with your evidence already in it.",
          },
        ].map((s) => (
          <div key={s.n} className="card">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{s.n}</span>
            <h2 className="mt-4 text-lg font-semibold">{s.t}</h2>
            <p className="mt-2 text-[15px] text-muted">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="py-10">
        <h2 className="font-serif text-2xl font-semibold sm:text-3xl">This happens to international students all the time</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "1 in 4",
              d: "legal problems international students brought to a Sydney legal centre were about getting a rental bond back.",
              s: "UNSW, Kingsford Legal Centre, 2019",
            },
            {
              n: "57%",
              d: "of international students in share housing met illegal or poor living conditions in their first share house.",
              s: "Living Precariously survey of 5,000+ students, 2019",
            },
            {
              n: "6",
              d: "residents of one Sydney student building, our founder included, promised their deposit back “within 15 days” and still waiting weeks later.",
              s: "Our own building, October 2026",
            },
          ].map((x) => (
            <div key={x.n} className="card">
              <p className="font-serif text-5xl font-semibold text-accent">{x.n}</p>
              <p className="mt-3 text-[15px]">{x.d}</p>
              <p className="mt-2 text-xs text-muted">{x.s}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Many had no receipt, no written agreement and no record of the room&apos;s condition.{" "}
          <Link href="/sources" className="underline">Sources</Link>
        </p>
        {VOICES.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {VOICES.map((v) => (
              <figure key={v.quote} className="card">
                <blockquote className="font-serif text-lg">&ldquo;{v.quote}&rdquo;</blockquote>
                <figcaption className="mt-2 text-sm text-muted">{v.who}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Built for how students actually rent</h2>
          <p className="mt-2 text-[15px] text-muted">
            Paid your deposit to a building manager? Living in student accommodation run by a company? Bond never lodged with
            Fair Trading? Those are the cases other tools skip, and the ones we start with. Your result can be explained in
            Chinese, Hindi, Nepali, Vietnamese and 8 more languages.
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Honest about what it is</h2>
          <p className="mt-2 text-[15px] text-muted">
            Legal information, not legal advice. Every rule is linked to its official source. When your situation is unclear,
            we tell you to call a free legal service instead of guessing.
          </p>
        </div>
      </section>
    </div>
  );
}
