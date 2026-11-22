# WO-0265 — Team portal brand restyle

Production release candidate based on `cf15c201d8b1d441a4402bae3e69342f805bda18` (WO-0264).

## Change

All nine team screens now share Koinophobia Labs' dark palette, Sora studio type, JetBrains Mono labels/buttons, card radii and spacing tokens. The header reads “Koinophobia Labs · Team”. The login uses the real lockup and koi emblem; workspace navigation uses the emblem. Owed is gold, paid is green, and lost/owed-back is rose, with text labels retained. Mobile forms use 16px input type and at least 44px button targets; ledgers stack into two columns.

Only five application presentation files changed: the scoped team stylesheet and Login, Portal, ConnectPanel and AccountPassword markup. Authentication, session scoping, Stripe/payment implementation, money calculations, email gate, password handlers and noindex configuration are unchanged. Supporting scripts capture and verify the result.

## Verification

- 370 automated tests passed, with zero skips (all `tests/*.test.ts` and `tests/*.test.mjs`, including isolated PostgreSQL, authentication, Stripe mocks, commission math, migrations and scope tests).
- Release QA: 53/53 passed. Password browser/HTTP acceptance: 9/9 passed, using fictional local accounts and blocked outbound fetch.
- Production build and typecheck passed. Repository-wide ESLint passed with zero errors and two existing unused-import warnings outside this change.
- Nine screens × two widths (390 and 1440): no horizontal overflow, no page errors, noindex metadata/headers retained; partner admin denial and email-copy gate verified.
- Owner/partner Connect captures at both widths: no Stripe calls, preview mutations/webhooks rejected; partner scoping retained.
- Axe contrast audit: zero detected violations across 18 screen/viewport combinations. Gradient/short-text cases were reviewed separately with conservative palette calculations: 41 color/background combinations passed 4.5:1, minimum 5.73:1. Disabled controls are exempt; this is a contrast check, not a claim of complete WCAG certification.
- All worktree, build output, local databases, temporary files and evidence are on KoiArchive. Estimated peak additional allocation under 4 GB; final headroom remains over 60 GB. Nothing was deleted or cleaned up.

## Evidence

Canonical evidence: `/Volumes/KoiArchive/WO-0265/reports/WO-0265/`.

- `before/` and `final/`: every team screen, viewport and full-page captures at 390×844 and 1440×900.
- `before-password-widths/` and `final-password-settled/`: password login, setup prompt, setup and change forms at both widths; fictional PostgreSQL accounts only.
- `before-connect/` and `final-connect/`: owner and partner commission/Connect views.
- `final/overview-390.jpg` and `final/overview-1440.jpg`: all-screen contact sheets, visually reviewed.
- `tests-release.log`, `release-qa.log`, `password-settled.log`, `build-release.log`, `typecheck-release.log`, `lint-final-check.log`.
- `contrast.json`, `contrast-matrix.json`, `source-scope.json`.
- `production-baseline.json`, `public-baseline/verification.json`: pre-deploy baseline and unauthenticated public route/icon checks.
- Earlier intermediate captures and logs are retained; `final*` directories are the release candidate.

## Deployment

Pending the one authorized deploy after a final unchanged-production check. No GitHub push, sends, real-account logins, Stripe calls, migrations, environment changes or settings changes are part of this release.
