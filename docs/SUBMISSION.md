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

## Demo script

The current script is in [DEMO-SCRIPT.md](DEMO-SCRIPT.md), with sample documents in `docs/demo-documents/`.

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
