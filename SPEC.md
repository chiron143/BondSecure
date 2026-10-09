# Bond Secure: build spec

Read this first. It's the handoff from the planning session on Friday 9 October 2026.
Builder: Chiranth (solo). Event: **Builders Hack: Unlocked** (Lyra × Rampersand's Product Counsel).

## 0. The deadline and what we submit

- **Submissions close Monday 12 October 2026, 9am Sydney time.** Target: submit **Sunday night**.
- Three things are required:
  1. **A public website**: this app's landing page (`/`), deployed on Vercel.
  2. **A four-page deck**, one page per question: who is it for and how big is the problem / what can they do now / what did you learn / what is real today (what's built, how AI is used, what's simulated, what existed before the weekend).
  3. **A demo, five minutes or less**, any format (screen recording is fine).
- Every builder must complete the Builders Survey before submitting.
- Judging, equally weighted: **Problem**, **Product** (does the core experience work end to end), **Presentation**. A narrow thing that works beats a broad thing that half works.

## 1. The product

**Person:** an international student renting a room in NSW, often from a company running student accommodation or rooms, sometimes paying the bond straight to a building manager.

**Task:** get their full bond or deposit back.

**The ability we unlock:** going from "I don't know what counts as evidence, which law applies, or who to complain to" to "I have proof of the room's condition, I know they're 36 days late, and I've sent a formal demand with an NCAT kit ready".

Two moments, one job:

1. **Move-in day:** film a narrated walk-through. AI lists each room, item and defect with a timestamp. The app grabs a still from the student's own video at each timestamp. The student confirms every line. Output: a PDF condition report with stills, timestamps and the video's SHA-256 fingerprint.
2. **Bond not returned:** a short intake. A **plain-code rules engine** (no AI) decides which of four paths applies and checks deadlines. Output: a verdict screen, a demand letter, and a claim pack PDF that includes the move-in evidence.

**Why it isn't already solved** (competitor check, 9 Oct):
- Tenant apps in Australia (Bondinator, BondGuard, Inspect Studio) are manual photo checklists with no AI or video, and none help after move-out. Bondinator has one App Store rating.
- AI video inspection exists (Paraspot, Wooma, SnapHome), but it's sold to landlords and agents, who then own the evidence.
- Legal help (NSW Gov, Tenants' Union, Redfern Legal Centre) is information only. The student has to work out which rules apply.
- Our position: the only tool on the tenant's side that takes a 2-minute video instead of a checklist and carries that evidence through to the claim, built around how international students actually rent.

**Evidence of the problem:** recovering rental bonds was 25% of international students' legal advice matters at Kingsford Legal Centre (UNSW report, 2019). Chiranth's own case: $802 deposit paid to a student accommodation operator, refund promised within 15 days in their T&Cs, weeks overdue; five other residents in the same building had the same issue (they're the test users on Sunday).

## 2. What's already built (Friday night) and verified

| Area | Status | Where |
|---|---|---|
| Rules engine: 4 paths + refer, deadlines, legal-maximum checks | ✅ 18 unit tests pass | `src/lib/rules/` |
| Legal sources, each rule with URL and date checked | ✅ | `src/lib/content/sources.ts`, page `/sources` |
| Demand letters per path (templates, not AI) | ✅ tested | `src/lib/content/letters.ts` |
| NCAT kit (what to have ready) | ✅ | `src/lib/content/ncatKit.ts` |
| PDFs: condition report + claim pack, made in the browser with pdf-lib | ✅ rendered and checked | `src/lib/pdf/` |
| Move-in flow: upload → fingerprint → analyse → stills → review → PDF | ✅ end to end **in demo mode** | `src/app/move-in/MoveIn.tsx` |
| Recovery flow: intake → verdict → letter → claim pack | ✅ end to end | `src/app/recover/Recover.tsx` |
| Landing page, sources page, phone layout | ✅ | `src/app/page.tsx`, `src/app/sources/page.tsx` |
| Gemini upload + analysis code | ⚠️ **written, never run** (planning workspace couldn't reach Google) | `src/lib/ai/`, `src/app/api/video/` |
| Step 3: evidence reader (receipts/emails → pre-filled answers, with quotes) | ✅ demo mode tested; live untested until key | `src/app/api/extract`, `src/lib/evidence/`, `recover/EvidenceReader.tsx` |
| Step 4: verdict translation, 12 languages (letter stays English) | ✅ UI + error path tested; live untested until key | `src/app/api/translate`, `src/lib/content/languages.ts` |
| Step 5: recording date from MP4/MOV `mvhd` metadata | ✅ tested | `src/lib/movein/mp4.ts` |
| Step 5: ABN lookup for the operator's legal name | ✅ fallback (link to public search) tested; live API untested until `ABR_GUID` | `src/app/api/abn`, `src/lib/abn/`, `recover/AbnFinder.tsx` |
| Deck (4 pages) and demo script | ✅ drafted; page 3 has [brackets] to fill after user testing | `docs/SUBMISSION.md` |

`npm test` (unit tests) and `npx next build` both pass. A headless-browser run clicked through both flows with a generated test video and produced both PDFs with no console errors.

## 3. Build order for the weekend

Work top to bottom. Don't start a "Should" until every "Must" above it works.

### Step 1 (MUST, do first): prove the live video path
Goal: a real phone video goes browser → Gemini → structured analysis → stills, without the API key ever reaching the browser.

1. `cp .env.example .env.local`, then Chiranth pastes his Gemini key into `.env.local` himself. **Never print the key or commit `.env.local`.**
2. `npm run dev`, open `/move-in`, upload a ~20 MB clip first, then a 100 MB+ phone video.
3. The flow is in `MoveIn.tsx → analyseLive()`:
   - `POST /api/video/start-upload` → server starts a Gemini resumable upload, returns `uploadUrl`.
   - Browser `POST`s the file bytes to `uploadUrl` with `X-Goog-Upload-Command: upload, finalize`.
   - `POST /api/video/analyse { fileName }` → server waits for `ACTIVE`, calls `gemini-3.8-flash` with JSON schema output.
4. Things most likely to break, in order:
   - **CORS on the browser → `uploadUrl` request.** If the browser blocks it, use the fallback: Vercel Blob client upload (`@vercel/blob/client`, `handleUpload`), then the server streams the blob into Gemini's resumable upload. Same `/api/video/analyse` afterwards.
   - **Response shape:** check `res.text` parses to `MoveInAnalysis` (`src/lib/movein/types.ts`). If `responseJsonSchema` is rejected, try `responseSchema` with the SDK's `Type` enums.
   - **Function timeout** on Vercel for the analyse route (`maxDuration = 300` is set; lower it if the plan rejects it).
   - **iPhone HEVC `.mov` won't decode in desktop Chrome**, so `grabFrame` fails. Safari is fine. Fallbacks: ask the student to use the phone browser (Safari), or set iPhone camera to "Most Compatible", or extract stills server-side. Note it in the deck if unresolved.
5. Tune `src/lib/ai/prompts.ts` against Chiranth's real room video: are small marks found? Are timestamps accurate (check the stills)? Is narration picked up?

**Checkpoint:** a real narrated video produces a report whose stills actually show the items listed.

### Step 2 (MUST): deploy
1. Import `chiron143/BondSecure` into Vercel. Add `GEMINI_API_KEY` in Vercel project settings (Chiranth does this himself).
2. Run Step 1's test again on the deployed URL (phone and laptop).
3. If the live path is flaky on demo night, `?demo=1` on `/move-in` forces demo analysis (labelled as demo everywhere).

### Step 3 (SHOULD): AI reads the evidence in the recovery flow
Let the student upload screenshots of receipts, emails and their agreement; Gemini extracts amount paid, dates, operator name, and any promised refund period, and **pre-fills** the form for the student to confirm. Keep the rules engine as the only thing that decides the path. Add a route like `/api/extract` with a JSON schema, same pattern as the video.

### Step 4 (SHOULD): translated explanation
Show the verdict summary and next steps in the student's language (a language picker, Gemini translation). **The letter itself stays in English**, exactly as templated.

### Step 5 (NICE, only if time on Saturday night)
- ABN lookup to fill the operator's legal entity name (the ABR has a free lookup API that needs a GUID registration; or just link to abr.business.gov.au).
- Read the video's creation date from MP4/MOV metadata (stronger than `file.lastModified`).
- Map the NCAT kit to the actual fields of NCAT's online form (open the form and check; we haven't verified it).

### Sunday morning: user testing (feeds deck page 3)
2–3 neighbours try it cold on their phones. Write down where they hesitate. Fix the worst two problems. No new features after this.

## 4. Rules that must not drift

- **The rules engine stays plain code.** No AI decides which law applies or whether a deadline passed. If you change a rule, update `src/lib/content/sources.ts` and the tests.
- **Every page says "legal information, not legal advice"** and points to free help. The app never files anything.
- **Don't change letter wording casually.** It's legal text; keep it plain, firm and accurate.
- **No accounts, no database, no storing videos or documents.** Uploaded Gemini files are deleted after analysis (`analyseMoveInVideo`), and expire after 48 hours anyway.
- Demo data and demo mode are always visibly labelled.
- In the demo, hide the real operator's name (use "Sample Rooms").

## 5. The four legal paths (NSW, checked 9 Oct 2026)

| Path | When | Key rules | Next step |
|---|---|---|---|
| A. Lodged bond | Student got a bond number from Fair Trading / Rental Bonds Online | Tenant can claim in RBO after moving out; other party gets 14 days; if disputed, 14 days to respond; NCAT within 6 months of payout | Claim in RBO |
| B. Unlodged bond | Residential tenancy, bond never lodged | Must be lodged within 10 business days (agent: 10 business days after end of month); s162 RTA offence; bond max 4 weeks' rent | Demand → NCAT (CCD tenancy) |
| C. Boarding house | Business renting rooms to 5+ residents | Deposit max 2 weeks' fee; refund within 14 days of moving out (Boarding Houses Act 2012); enforce via NCAT | Demand → NCAT (CCD) |
| D. Lodger | Owner or head tenant lives there, or fewer than 5 residents | Not covered by RTA; business landlord → NCAT General Division (Fair Trading Act); otherwise Local Court | Demand → get advice |
| Refer | Other state, university college, too unclear | Uni colleges mostly excluded from RTA with exceptions | Redfern Legal Centre (02) 9698 7277 |

Also: condition report must be returned within 7 days of moving in (NSW Gov). NCAT fee $62 / $16 concession (as at 1 July 2025). Full sources with links: `src/lib/content/sources.ts`.

Known simplifications (say so in the deck): business days skip weekends but not public holidays; head-tenant cases may really be sub-tenancies; the boarding-house test relies on the student's estimate of resident numbers.

## 6. How it's built

- Next.js 16.4 (App Router, Turbopack, Cache Components on), React 19, Tailwind 4, TypeScript. **This Next.js is newer than most training data: read `AGENTS.md` and `node_modules/next/dist/docs/` before changing framework-level things.** The tool pages are client components wrapped in `<Suspense>` because they read today's date.
- AI: Google Gemini (`@google/genai`), model `gemini-3.8-flash` (override with `GEMINI_MODEL`). Video sampled at 2 fps, high media resolution, JSON schema output.
- PDFs: `pdf-lib`, generated in the browser. Standard fonts can't draw non-Latin scripts, so `Doc.safe()` replaces them with "?" (e.g. a name in Hindi). If that matters, embed a Unicode font with `@pdf-lib/fontkit`.
- State: React context + `sessionStorage` (`src/lib/store.tsx`). Stills are dropped from storage if too big; the PDF is the real record.

```
src/
  app/
    page.tsx                 landing page (the "public website")
    move-in/MoveIn.tsx       move-in flow
    recover/Recover.tsx      bond recovery flow
    sources/page.tsx         rules and sources
    api/video/start-upload   starts Gemini resumable upload (server holds the key)
    api/video/analyse        waits for the file, runs the analysis
  lib/
    rules/                   engine.ts, dates.ts, types.ts, engine.test.ts
    content/                 sources.ts, letters.ts, ncatKit.ts
    movein/                  types.ts, demo.ts, browser.ts (frames, hash), format.ts
    ai/                      gemini.ts, prompts.ts
    pdf/                     layout.ts, conditionReport.ts, claimPack.ts, pdf.test.ts
    store.tsx
```

Commands: `npm run dev`, `npm test`, `npx next build`, `npx eslint src`.

## 7. Demo and deck notes

**Demo story (under 5 min):** Priya films her room on day 1 (narrating a chipped desk and a broken blind) → report with stills in two minutes → day 200: $802 kept, "still being processed" → three questions later: "Boarding Houses Act. 36 days late." → claim pack with her move-in stills under "Already there when I moved in" → letter sent.

**Deck page 4, "what is real":**
- Built this weekend: all of it (new repo, first commit 9 Oct).
- AI: Gemini watches the video and listens to narration; (Step 3) reads receipts.
- Not AI on purpose: which law applies and deadlines (rules engine with tests), and the letter wording.
- Simulated / not done: nothing is filed; demo mode exists as a backup; NSW only; no lawyer has reviewed it yet.
