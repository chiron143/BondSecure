import type { Metadata } from "next";
import Link from "next/link";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bond Secure: get your full bond back",
  description:
    "Film your room on move-in day and get a proper condition report. If your bond or deposit isn't returned, get the right legal steps and a claim pack. For renters in NSW.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              Bond Secure
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-muted">
              <Link href="/move-in" className="hover:text-ink">Moving in</Link>
              <Link href="/recover" className="hover:text-ink">Bond not back</Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-xs text-muted sm:px-6">
            Legal information for NSW renters, not legal advice. Bond Secure doesn&apos;t file anything for you and doesn&apos;t
            store your documents. <Link href="/sources" className="underline">Where our rules come from</Link>.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
