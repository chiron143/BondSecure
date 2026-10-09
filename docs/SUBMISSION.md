# Submission kit

Deadline: **Monday 12 October 2026, 9am Sydney**. Target: Saturday night, buffer on Sunday.
Submit at https://www.productcounsel.com.au/builders-hack (one form: website URL, deck, demo). Do the Builders Survey first.

## Checklist (things only Chiranth can do)

- [ ] Paste the Gemini key into `.env.local`, then test the live video path locally (SPEC Step 1)
- [ ] Optional: register for a free ABN Lookup GUID (https://abr.business.gov.au/Tools/WebServicesAgreement), put it in `.env.local` and Vercel as `ABR_GUID`. Without it the app links to the public ABN search instead
- [ ] Import `chiron143/BondSecure` into Vercel, add `GEMINI_API_KEY` in project settings, deploy (SPEC Step 2)
- [ ] Turn on billing for the Gemini key (AI Studio → the key's project → Set up billing), then add `GEMINI_PAID_TIER=true` in Vercel and redeploy. Only then does the site say Google doesn't train on uploads
- [ ] Add real tester quotes (with permission, word for word) to `src/lib/content/voices.ts`; the homepage shows them automatically
- [ ] Film a real 2-minute narrated video of your room (point at 3–4 real marks, say them out loud)
- [ ] Run it on the deployed URL from your phone; check the stills show the items listed
- [ ] Hand-over test: 2–3 neighbours try it cold on their phones (script below). Fill deck page 3 brackets
- [ ] Put the Vercel URL on deck page 4; share the deck (Share menu) so judges can open it
- [ ] Record the demo (script below), upload as unlisted YouTube or Loom, check the link opens logged out
- [ ] Builders Survey, then submit. Open every submitted link in a private window first

## Demo script (4:30, screen recording with voice-over)

Use the deployed site on a phone (or Chrome dev tools phone size). Demo data is labelled; the operator is "Sample Rooms".

| Time | Show | Say |
|---|---|---|
| 0:00 | Landing page | "Priya's an international student in Sydney. She paid an $802 deposit for a room. Her terms say 15 days for the refund. It's been seven weeks: 'still being processed'. One in four legal problems international students bring to a Sydney legal centre is exactly this. And she doesn't know what counts as evidence, which law applies, or who to complain to." |
| 0:30 | `/move-in`, upload the real room video | "Rewind to move-in day. She films her room for two minutes and says what she sees: chip on the desk, blind's bent." |
| 0:50 | Analysing… then the review screen | "AI watches the video and listens to her. Each defect comes back with the moment it appears, and a still from her own video. She has to confirm each line herself: it's her evidence." Edit one line, remove one, confirm the rest. |
| 1:40 | Download the PDF, scroll it | "A proper condition report: stills, timestamps and the video's fingerprint, so nobody can say it was swapped. She emails it to the manager on day one." |
| 2:00 | `/recover`, add 3 screenshots (receipt, terms, email) | "Day 200, no deposit. She drops in her receipt, the terms and their email. AI pulls out the amount, dates and the 15-day promise and shows exactly where it read each one." Tick, "Use these". |
| 2:40 | Answer the remaining questions, "Show me where I stand" | "A few plain questions. The legal decision is not AI: it's tested code. Boarding Houses Act. Due back on 3 September. 36 days late." |
| 3:15 | Switch language to हिन्दी / 中文, then back | "She can read it in her own language. The letter stays in English, because that's what the operator and the tribunal read." |
| 3:35 | Letter, then download claim pack, scroll to "Already there when I moved in" | "A formal demand citing the Act and the deadline. The claim pack has her timeline, the move-in stills of damage that was already there, and an NCAT kit if they still don't pay." |
| 4:10 | Back to landing | "From 'I wouldn't know where to start' to a formal demand with proof, in ten minutes. Legal information, not advice, every rule linked to its source. Bond Secure." |

Backup if the live AI fails on the day: `/move-in?demo=1` and the "Show a demo result instead" link on `/recover`. Both are labelled as demo on screen.

## Hand-over test script (15 minutes each, Sunday or earlier)

Give them your phone or the URL. Say only: "Pretend you just moved into a room. Use this to protect your bond." Then: "Now pretend you moved out 7 weeks ago and the deposit hasn't come back."

Don't help. Write down:
1. Where they hesitate or ask a question (exact words)
2. Any answer they weren't sure about in the questions
3. Whether they believed the verdict, and why
4. What they'd do next with the letter
5. "Would you use this? Would you send this letter?"

Fix the worst two problems. Note what you changed for deck page 3.
