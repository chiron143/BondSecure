# BondSecure

a tool that helps you get your bond back

Film your room on move-in day and get a proper condition report. If your bond or deposit isn't returned, find out which NSW rules apply, whether the deadline has passed, and get a demand letter and claim pack with your evidence already in it.

Legal information, not legal advice. NSW only.

## Run it

```bash
npm install
cp .env.example .env.local   # add your Gemini key, or leave blank for demo mode
npm run dev                   # http://localhost:3000
npm test                      # rules engine and PDF tests
```

Add `?demo=1` to `/move-in` to force demo analysis.

See [SPEC.md](SPEC.md) for the full build plan.
