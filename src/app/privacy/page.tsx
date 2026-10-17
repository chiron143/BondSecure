import { Ban, Building, Cloud, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { HeroBand } from "@/components/bold";
import { GEMINI_TERMS_URL, isPaidTier } from "@/lib/content/privacy";

export const metadata = { title: "Your data · Bond Secure" };

function Section({ title, Icon, children }: { title: string; Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-700/30">
          <Icon className="size-5" aria-hidden />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const paid = isPaidTier();
  return (
    <div>
      <HeroBand>
        <p className="text-sm font-bold tracking-wider text-emerald-300 uppercase">Privacy</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
          How your data{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">is handled.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy-muted">
          Short version: no account, no database, and we don&apos;t keep your video or documents. Three things go to
          Google&apos;s Gemini AI so it can do its job. Everything else stays on your phone.
        </p>
      </HeroBand>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
        <Section title="Stays on your phone" Icon={Smartphone}>
          <p>Your move-in report and claim pack PDFs are made on your phone, not on our server.</p>
          <p>Your answers are kept in this browser tab only, and are gone when you close it.</p>
          <p>When you upload your move-in report PDF to make a claim, it&apos;s read on your phone and not sent anywhere.</p>
        </Section>

        <Section title="Goes to Google's Gemini AI" Icon={Cloud}>
          <p>
            <strong className="text-ink">Your move-in video</strong>, so the AI can list what&apos;s in each room. It goes
            straight from your phone to Google. We delete it as soon as the analysis is done. If the analysis never
            finishes, Google deletes it automatically within 48 hours.
          </p>
          <p>
            <strong className="text-ink">Receipts, emails or agreements</strong>, only if you use &quot;Let AI fill this
            in&quot;. They&apos;re sent once for that request and not kept by us.
          </p>
          <p>
            <strong className="text-ink">The text of your result</strong>, only if you choose another language. Your letter
            is never sent for translation.
          </p>
          <p>Prefer not to upload anything? Demo mode shows how it works without sending your files.</p>
        </Section>

        <Section title="What Google does with it" Icon={Building}>
          {paid ? (
            <p>
              We use Google&apos;s paid Gemini API. Under its terms, Google doesn&apos;t use what you upload to improve its
              products. It keeps logs for a limited time only to detect misuse.
            </p>
          ) : (
            <p className="rounded-2xl border-2 border-warn/30 bg-warn-soft p-4 font-medium text-warn">
              While we&apos;re testing, we use Google&apos;s free Gemini API. Under its terms, Google may use what you upload
              to improve its products, and human reviewers may read it after it&apos;s separated from our account. Don&apos;t
              upload anything you wouldn&apos;t want seen, or use the demo.
            </p>
          )}
          <p>
            <a className="underline" href={GEMINI_TERMS_URL}>Gemini API terms</a>
          </p>
        </Section>

        <Section title="What we don't do" Icon={Ban}>
          <p>No accounts, no database, no ads, no tracking. We never sell or share your information.</p>
          <p>
            Our host (Vercel) keeps standard server logs, such as the time and the page visited. Our server passes your
            files to Google without saving them.
          </p>
          <p>We don&apos;t send letters or file anything for you. You decide what to send.</p>
        </Section>

        <Section title="Who it's for" Icon={UserCheck}>
          <p>Bond Secure is for people aged 18 and over. It gives legal information, not legal advice.</p>
        </Section>

        <p className="pt-2 text-sm text-muted-foreground">
          Checked 10 October 2026. <Link className="underline" href="/sources">Where our legal rules come from</Link>
        </p>
      </div>
    </div>
  );
}
