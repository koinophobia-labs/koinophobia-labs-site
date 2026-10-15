# WO-0118 review record

Worktree: /Volumes/KoiBuild/koinophobia-labs-site/WO-0118
Branch: studio/WO-0118-b2b
Production base: 82a516ce98a11a4b1981017da29b109cfde44273 (newer than initial local origin/main 0d444e2).
Production HTML identified dpl_B1vzcJNcjkiw2XAxg2N5SihAQ1e7; read-only Vercel inspect and deployment metadata confirmed that SHA. The canonical working files and branch were not changed.

## Delivered

- /work-with-us and /audit, with source-preserving intake CTAs; exact approved positioning and four-rung offer ladder.
- Canonical QR: https://koinophobialabs.com/audit?src=chamber. Removed the old /audit redirect; /revenue-leak-audit now redirects to /audit.
- /start business branch and retained founder/PRD branch. `src` goes into existing `source`; offer goes into existing `service_interest` and an `Offer:` note. Company reuses `business_name`; role/contact preference reuse notes; phone reuses phone. Audit budgets are $250 audit / Not sure yet.
- Private /crm/quick-add: person, company, email or phone, problem, next action, tomorrow’s follow-up date, source Chamber, stage and notes. Atomic save, idempotent retries, authorization and origin checks. List supports case-insensitive exact source filter and follow-ups due today/overdue using Chicago calendar boundaries.
- Shared nav and home band; five verified App Store listings and current release versions. Founder route stays available.
- Internal offers: audit stays $250, timeline within 7 days of discovery, audit credit disabled. Quick Fix/Landing Page ranges replaced by “Quoted after the audit”; website range by “By proposal”. Concierge audit label and rationale reconciled. Existing concierge budget inputs are customer budgets, not studio quotes; its public route remains retired.
- No new dependencies. No live lead data read or committed.

## Database and payment prerequisites

`db/009_chamber_next_action.sql` adds `next_action text not null default ''` and a lower(source) index. Registered in the existing guarded migration runner. **Not applied to production or preview.** Production needs migration 009 before quick add or next-action edits can work. Public intake source/offer tagging itself needs no migration.

`lib/acquisition/audit-config.ts` has the single empty `AUDIT_PAYMENT_URL` hook. Blake must create/test a payment URL before a later reviewed code change enables the button. Proposed refund and build-credit policies remain unpublished.

## Verification

- npm run build: PASS (build-release.txt; Next.js 16.2.12).
- npm run lint: PASS, zero errors; one existing unused CRM_GOOGLE_PROVIDER warning in auth.ts.
- No generic npm test script exists. All existing tests/*.test.ts were run. Two baseline failures are confirmed on a bounded export of production: stale Teacher’s Pet/KOI dates; Trendi privacy-copy assertion. Final full suite: 171 passed, 2 failed (173 total). See tests-release.txt and production-baseline-complete.txt; final rerun logged separately.
- Focused changed-feature suites: 62/62 pass; new chamber suite including authenticated cross-site rejection: 10/10 pass.
- Migration safety tests: 24/24 pass, including local ephemeral PostgreSQL checks. No production connection or migration.
- Playwright: all required routes return 200, no horizontal overflow at 1440 and 390px; QR CTA → business form → intercepted synthetic POST preserves source/offer/budget; readiness branch works; anonymous quick-add redirects to login. No submission was sent to a database or email provider.
- Final screenshots: release-screenshots/{home,work-with-us,audit}-{desktop,phone}-{light,dark}.png. OS color preference is emulated; the existing site intentionally retains its dark palette in both modes. Initial and intermediate captures/logs are retained as evidence.
- Claims and proof: CLAIMS.md plus claims-release-grep.txt and apple-lookup.json.

## Disk and isolation

TMPDIR and npm cache stayed under /Volumes/KoiBuild/koinophobia-labs-site/tmp. Build output was isolated internally with a task-specific dependency link; no writes to KoiDev. A disk guard stopped one attempt above both reserves. One newly created disposable npm download-cache folder (427.7 MB, _cacache) was listed and removed; no evidence was removed. Prior failed build outputs remain preserved. Successful builds kept KoiBuild above 10 GB and internal storage above 12 GB.

## Director release step (after review and separately applying migration 009)

From this worktree, with its existing Vercel project link:

```sh
cd /Volumes/KoiBuild/koinophobia-labs-site/WO-0118
TMPDIR=/Volumes/KoiBuild/koinophobia-labs-site/tmp npm_config_cache=/Volumes/KoiBuild/koinophobia-labs-site/tmp/npm-cache npx vercel --prod --yes --scope team_GrnNjNAupVBmY91WucyLJOoV
```

This production command was **not run**. The final handoff supplies the committed HEAD and preview URL. No production deployment, env-var, DNS, domain, or Stripe change was made.
