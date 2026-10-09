import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bond Secure: get your full bond back",
  description:
    "Film your room on move-in day and get a proper condition report. If your bond or deposit isn't returned, get the right legal steps and a claim pack. For international students renting in NSW.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <div className="bg-navy text-navy-ink">
            <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
                <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-emerald-950">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                Bond Secure
              </Link>
              <nav className="flex gap-4 text-sm font-medium text-navy-muted">
                <Link href="/recover" className="hover:text-white">Get my bond back</Link>
                <Link href="/move-in" className="hover:text-white">Moving in</Link>
              </nav>
            </header>
          </div>
          <main className="flex-1">{children}</main>
          <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-xs text-muted sm:px-6">
            Legal information for NSW renters, not legal advice. Bond Secure doesn&apos;t file anything for you and doesn&apos;t
            keep your documents. <Link href="/privacy" className="underline">How your data is handled</Link> ·{" "}
            <Link href="/how-it-decides" className="underline">How it decides</Link> ·{" "}
            <Link href="/sources" className="underline">Where our rules come from</Link>.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
