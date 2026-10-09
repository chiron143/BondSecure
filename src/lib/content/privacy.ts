import "server-only";

// What we can truthfully say about AI and privacy depends on the Gemini plan the key is on.
// Free tier: Google may use and human-review uploads to improve its products.
// Paid tier: Google doesn't use them to improve its products; it logs them for a limited
// time to detect abuse. Set GEMINI_PAID_TIER=true ONLY once billing is on for the key.
// Source: https://ai.google.dev/gemini-api/terms (checked 10 Oct 2026).

export const GEMINI_TERMS_URL = "https://ai.google.dev/gemini-api/terms";

export const isPaidTier = () => process.env.GEMINI_PAID_TIER === "true";

export function aiPrivacyLine(): string {
  return isPaidTier()
    ? "Google's Gemini AI looks at your video once and we delete it straight after. Google doesn't use it to train its AI."
    : "While we're testing, the AI runs on Google's free tier, where Google may use and review uploads to improve its products. Try the demo instead if you'd rather not upload.";
}
