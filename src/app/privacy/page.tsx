import Link from "next/link";
import { GEMINI_TERMS_URL, isPaidTier } from "@/lib/content/privacy";

export const metadata = { title: "Your data · Bond Secure" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px] text-muted">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const paid = isPaidTier();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display tracking-tight text-3xl font-semibold">How your data is handled</h1>
      <p className="mt-3 text-muted">
        Short version: no account, no database, and we don&apos;t keep your video or documents. Three things go to
        Google&apos;s Gemini AI so it can do its job. Everything else stays on your phone.
      </p>

      <div className="mt-6 space-y-4">
        <Section title="Stays on your phone">
          <p>Your move-in report and claim pack PDFs are made on your phone, not on our server.</p>
          <p>Your answers are kept in this browser tab only, and are gone when you close it.</p>
          <p>When you upload your move-in report PDF to make a claim, it&apos;s read on your phone and not sent anywhere.</p>
        </Section>

        <Section title="Goes to Google's Gemini AI">
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

        <Section title="What Google does with it">
          {paid ? (
            <p>
              We use Google&apos;s paid Gemini API. Under its terms, Google doesn&apos;t use what you upload to improve its
              products. It keeps logs for a limited time only to detect misuse.
            </p>
          ) : (
            <p className="rounded-xl bg-warn-soft p-3 text-warn">
              While we&apos;re testing, we use Google&apos;s free Gemini API. Under its terms, Google may use what you upload
              to improve its products, and human reviewers may read it after it&apos;s separated from our account. Don&apos;t
              upload anything you wouldn&apos;t want seen, or use the demo.
            </p>
          )}
          <p>
            <a className="underline" href={GEMINI_TERMS_URL}>Gemini API terms</a>
          </p>
        </Section>

        <Section title="What we don't do">
          <p>No accounts, no database, no ads, no tracking. We never sell or share your information.</p>
          <p>
            Our host (Vercel) keeps standard server logs, such as the time and the page visited. Our server passes your
            files to Google without saving them.
          </p>
          <p>We don&apos;t send letters or file anything for you. You decide what to send.</p>
        </Section>

        <Section title="Who it's for">
          <p>Bond Secure is for people aged 18 and over. It gives legal information, not legal advice.</p>
        </Section>
      </div>

      <p className="mt-6 text-sm text-muted">
        Checked 10 October 2026. <Link className="underline" href="/sources">Where our legal rules come from</Link>
      </p>
    </div>
  );
}
