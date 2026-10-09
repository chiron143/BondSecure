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

One headline job: getting the bond back. Move-in is the follow-on that makes the claim stronger.
Use the deployed site on a phone (or Chrome dev tools phone size). Demo data is labelled; the operator is "Sample Rooms".
Before recording: make the move-in report with a move-in date BEFORE the move-out date you'll use (e.g. 3 Feb 2026), and keep the PDF.

| Time | Show | Say |
|---|---|---|
| 0:00 | Home page | "Priya's an international student in Sydney. She paid an $802 deposit. Her terms promised a refund in 15 days. It's been seven weeks: 'still being processed'. Bonds were 1 in 4 private rental cases at the NSW tribunal last year, and most tenants face it with no lawyer." |
| 0:25 | "Get my bond back", add 3 screenshots (receipt, terms, email) | "She drops in her receipt, the terms and their email. AI pulls out the amount, the dates and the 15-day promise, and shows exactly where it read each one." Tick, "Use these". |
| 0:55 | Remaining questions, "Show me where I stand" | "A few plain questions. The legal decision is not AI: it's tested rules. Boarding Houses Act. 36 days late." |
| 1:20 | Scroll to "How we decided" | "It shows its working: the rule, the official source, the date we checked it." |
| 1:35 | Back, "Try an example case" → "Not sure how many people live there" | "If she isn't sure, it doesn't guess. Fewer than 5 residents would make her a lodger with no deadline, so it shows both answers and sends her to Redfern Legal Centre first." |
| 2:05 | Switch language to हिन्दी, then back | "She can read it in her own language. The letter stays in English, because that's what the operator and the tribunal read." |
| 2:25 | Letter, then upload move-in report PDF on the evidence card, download claim pack, scroll to "Already there when I moved in" | "And because she filmed her room on day one, her claim pack has stills of damage that was already there." |
| 2:55 | `/move-in`: upload the room video → review screen | "That's the follow-on: on move-in day she filmed two minutes and said what she saw. AI listed each mark with the second it appears and a still from her own video. She confirms every line." (cut the ~90 s wait) |
| 3:45 | Report PDF | "A proper condition report with the video's fingerprint. Keep the PDF, and months later it drops straight into the claim." |
| 4:10 | Home page | "From 'I wouldn't know where to start' to a formal demand that cites the law, with proof, in ten minutes. Legal information, not advice. Bond Secure." |

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
