# AI Project Concierge launch gate

Updated: 2026-07-18

## Release recommendation

**Code release candidate: PASS. Production launch: READY AFTER EXTERNAL GATES.**

The implementation, deterministic fallback, regression suite, production build, browser journeys, accessibility automation, and production dependency audit pass locally. The feature branch includes the current `origin/main`. No deployment was attempted or claimed because production deploys through the repository's `main`-branch Git integration only, and the production database migration plus live OpenAI and Resend smoke checks require approved credentials.

## Implemented scope

- Typed service, answer, evaluation, draft, signed-handoff, and CRM contracts.
- Adaptive seven-step public flow with back, edit, escape, refresh recovery, and standard-form paths.
- Auditable deterministic scoring with confidence bands, alternatives, manual review, and not-a-fit handling.
- Optional strict OpenAI Responses API enrichment that cannot change routing, price, recipients, persistence, or navigation.
- Complete no-key/provider-outage fallback.
- Homepage, services, intake, and audit entry points.
- Editable prefilled handoff into the existing intake with server recomputation and tamper resistance.
- JSONB CRM persistence migration, list qualification signals, and lead-detail context.
- Escaped text/HTML email notification extension and durable CRM lead link.
- Privacy-limited analytics events without raw visitor text or contact details.
- Honeypots, same-origin checks, durable/fallback rate limiting, payload limits, HMAC signing, and idempotency.
- Indexed route metadata and sitemap inclusion.
- Architecture, environment, operations, and test documentation.

## Baseline before integration

- `npm run test:crm` — 58/58 passed.
- `npm run test:commercial` — 6/6 passed.
- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with one pre-existing warning in `lib/trendiHero.ts` for `_random` being unused.
- The first Turbopack attempt could not use a temporary out-of-worktree `node_modules` symlink. A real local `npm ci` was subsequently completed in the isolated worktree, removing that environment limitation.

## Final verification

| Gate | Result |
| --- | --- |
| `npm run test:concierge` | PASS — 35/35 |
| `npm run test:crm` | PASS — 58/58 |
| `npm run test:commercial` | PASS — 6/6 |
| Combined unit/integration assertions | PASS — 99/99 |
| `npm run test:dev-routing` after merging current `main` | PASS — 9/9 |
| `npm run test:concierge:e2e` against `next start` | PASS — 12/12 |
| `npm run test:release-qa` against `next start` | PASS — 50/50 |
| `npm run build` | PASS — Next.js 16.2.7 Turbopack, 38 static pages generated |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS — zero errors; same one pre-existing warning |
| `git diff --check` | PASS |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |

The final dependency tree overrides Next.js's transitive PostCSS onto patched `8.5.15`; `npm ls postcss` reports the Next.js copy deduplicated to that version.

## Browser and accessibility evidence

- Website rebuild recommendation, editable intake prefill, and mocked persistence envelope.
- AI workflow recommendation from the services entry.
- Uncertain need routed to the existing Revenue Leak Audit handoff.
- Quick Fix Sprint on a 390 × 844 viewport.
- Conflicting scope routed to human review.
- AI disabled/provider unavailable path completed deterministically.
- Refresh recovery restored the active branch and step.
- No horizontal overflow on the mobile result.
- axe WCAG A/AA automation reported no concierge-result violations.
- Full-site release QA covered seven viewport widths from 320 through 1920 pixels, homepage and game overflow, link integrity, gameplay, privacy, reduced motion, media fallback, and homepage accessibility/contrast.

The release runner ignores only `/_vercel/insights/script.js` when testing a production build on localhost, because that Vercel-managed endpoint exists only after deployment. Other console errors remain failures. Manual VoiceOver/screen-reader verification is still recommended.

## Integration evidence and limits

- Standard intake compatibility: locally tested.
- Recommendation tampering: locally tested; final answers are revalidated and rescored on the server.
- CRM JSONB persistence: tested with mocked PostgreSQL queries and migration coverage.
- Email formatting: text/HTML payload, escaping, recommendation details, and CRM link tested with fixtures.
- AI behavior: no-key, provider error, timeout, malformed output, and valid strict output tested with mocks.
- Audit handoff: locally exercised in the browser and existing audit copy/route tests pass.
- Stripe: existing checkout/webhook tests pass; this feature does not change Stripe code and no live charge was attempted.

Not verified in this worktree:

- Applying `db/007_ai_project_concierge.sql` to the production database.
- A real OpenAI structured-output request with the production model/key.
- A real Resend delivery and reply-to check.
- An authenticated production CRM record inspection.
- A live Stripe checkout (unchanged and intentionally not charged during local QA).

## Production environment audit

The production Vercel environment-name audit on 2026-07-18 confirmed `DATABASE_URL`, `CRM_ADMIN_SECRET`, the existing Resend variables, and the existing Stripe secrets are present and encrypted. Secret values and entropy were not read.

Two requested production variables are not currently configured:

- `CONCIERGE_SIGNING_SECRET`
- `NEXT_PUBLIC_SITE_URL`

`OPENAI_API_KEY` is also absent, but it is optional and does not block the deterministic concierge.

## Required production configuration

- `DATABASE_URL`
- `CRM_ADMIN_SECRET` with sufficient entropy
- `CONCIERGE_SIGNING_SECRET` with at least 32 random characters (recommended instead of relying on the CRM secret fallback)
- Existing `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL`
- Existing Stripe variables used by the audit/checkout flow
- `NEXT_PUBLIC_SITE_URL=https://koinophobialabs.com`
- Optional `OPENAI_API_KEY`; the concierge remains complete without it
- Optional `CONCIERGE_OPENAI_MODEL` (default: `gpt-5.6-luna`)
- Optional `CONCIERGE_OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)

## Deployment and post-deploy gate

The existing Vercel build script runs `node scripts/migrate-crm.mjs && next build`, so deployment must have the intended production `DATABASE_URL` before the build begins.

Migration `007` is additive and backward compatible with the currently deployed application: it adds a defaulted JSONB column and indexes, while the old application neither reads nor writes that column. The new application is not safe to serve before the migration because every intake insert includes `concierge_data`. The existing `vercel-build` order is therefore the correct sequence: migrate first, build the new artifact second, and only activate it after the build succeeds. A failed migration prevents the new deployment from replacing the current one.

The three indexes use regular `CREATE INDEX`, so they can briefly block writes while each index is built. The production `crm_leads` row count was not inspected. Run the deployment during a low-write window if that table has grown materially; do not bypass `vercel-build` or deploy the new artifact before migration completion.

After confirming the environment and database target, use the repository's PR workflow:

```bash
npm ci
npm run test:concierge
npm run test:crm
npm run build
# Push codex/ai-project-concierge, open a PR to main, and merge after checks pass.
# The Vercel Git integration then runs vercel-build and applies migration 007.
```

Do not use a Vercel CLI production promotion for this repository. Its recorded deployment guardrail requires production to remain traceable to `main` through the Git integration.

Then complete one real-provider concierge recommendation, submit one controlled lead, confirm the notification email, inspect its CRM qualification envelope, and recheck the Revenue Leak Audit handoff. Do not enable public traffic if the migration or durable lead persistence fails; the deterministic recommendation itself may remain available without OpenAI.

## Remaining launch risks

- The committed feature branch is local and has not been pushed or merged to `main`.
- GitHub CLI authentication is currently invalid and must be restored before the branch and draft PR can be published.
- `CONCIERGE_SIGNING_SECRET` and `NEXT_PUBLIC_SITE_URL` must be added to the Vercel production environment before merge.
- Production migration and provider/email smoke checks are the only blocking launch gates identified.
- Manual screen-reader review remains advisable even though automated accessibility checks pass.
