@AGENTS.md

# Bond Secure

Read `SPEC.md` before doing anything: it has the deadline, scope, build order, legal rules and the things that must not drift.

- Run `npm test` after touching `src/lib/rules`, `src/lib/content` or `src/lib/pdf`. Keep tests green.
- Run `npx next build` and `npx eslint src` before pushing.
- The Gemini key lives only in `.env.local` (local) and Vercel env vars. Never print it, log it or commit it.
- The rules engine is plain code by design. Don't move legal decisions into AI.
- Commit small and often; the deadline is Monday 12 Oct 9am Sydney time.
