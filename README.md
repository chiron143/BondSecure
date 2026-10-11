# Bond Secure

**Get your bond back.** For international students renting in NSW.

**Live:** https://bondsecure.vercel.app · **How it decides:** https://bondsecure.vercel.app/how-it-decides

Built for Builders Hack: Unlocked (Lyra × Product Counsel), 9–11 October 2026. Everything here was built over that weekend, starting from an empty repo.

## What it does

1. **Bond not back?** Answer a few plain questions, or drop in screenshots of your receipt, terms and emails and let AI pre-fill them (it quotes where it read each value; you confirm). Tested NSW rules work out which law applies (lodged bond, unlodged bond, boarding house, lodger, or "get advice") and exactly how many days late they are.
2. **Act.** You get a demand letter that cites the law, a claim pack PDF (timeline, evidence, NCAT application kit) and the explanation in 13 languages. The letter always stays in English.
3. **Follow-on: next room.** Film a 2-minute walk-through on move-in day and say what you see. AI lists every mark with the second it appears and a still from your own video; you confirm each line. The PDF records the video's SHA-256 fingerprint and carries its own data, so months later you upload it into a claim.

Legal information, not legal advice. NSW only. It never files anything.

## AI vs not AI

| Done by AI (Google Gemini) | Deliberately not AI |
|---|---|
| Watching the move-in video and hearing the narration | Which law applies and every deadline (`src/lib/rules`, plain code with tests) |
| Reading receipts, terms and emails, quoting its source | The letter wording (fixed templates) |
| Translating the explanation | Showing the working: rules used, sources, dates checked, what-ifs for "not sure" answers |

The student confirms every AI finding before it's used. When the rules can't place someone safely, the app says so and refers them to Redfern Legal Centre.

## Privacy

No accounts, no database. PDFs are made on the device. The video goes straight from the phone to Gemini and is deleted after analysis. While testing, Gemini runs on Google's free tier, which the site discloses ([/privacy](https://bondsecure.vercel.app/privacy)).

## Run it

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY, or leave blank for demo mode
npm run dev                   # http://localhost:3000
npm test                      # 51 tests: rules engine, what-ifs, dates, evidence, PDFs
```

Add `?demo=1` to `/move-in` to force demo analysis (always labelled as demo).
Optional env vars are documented in `.env.example`.

## Where things are

```
src/lib/rules/      engine.ts (decides the path), explain.ts (sources + what-ifs), examples.ts, tests
src/lib/content/    sources.ts (every rule with its URL and date checked), letters.ts, ncatKit.ts
src/lib/ai/         gemini.ts (model fallback), prompts.ts (JSON schemas)
src/lib/pdf/        condition report, claim pack, embedded report data
src/app/recover/    bond recovery flow
src/app/move-in/    move-in report flow
```

Next.js 16, React 19, Tailwind 4, pdf-lib, Google Gemini (`gemini-3.8-flash` with fallbacks). See [SPEC.md](SPEC.md) for the build plan and the rules that must not drift.
