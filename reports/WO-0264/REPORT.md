# WO-0264 — Team passwords

Implemented and locally verified on November 10, 2026. Production deployment verification is pending.

## Jayvon

Log in with your email link once, then set a password.
Next time use email and password.

Open **Account** in the team navigation to set or change it later. Use 12–256 characters. “Forgot password? Email me a link” verifies access and opens a 15-minute, one-use password-reset opportunity.

## Implementation

- `/team` offers email/password and both email-link alternatives. Existing shared limits remain 8 attempts per email and 30 per IP per 15 minutes. Unknown, inactive, passwordless and incorrect-password logins return the same 401 response and perform scrypt verification; magic-link feedback is generic even on delivery failure.
- `/team/account` is available to every signed-in partner and owner. Existing salted scrypt parameters are reused. Password strings preserve whitespace. Ordinary changes require the current password; a freshly consumed email link provides the explicit reset exception.
- First email-link login without a password opens the skippable setup prompt. Skipping persists across subsequent email logins. Account settings remain available afterward.
- Password saves atomically revoke other sessions and outstanding login links, clear the reset permission and obsolete invite, and preserve the current session. Expired/revoked sessions and inactive accounts cannot set a password. Concurrent first-password attempts cannot both succeed.
- Additive migration `db/012_team_password.sql` adds `team_partners.password_prompt_dismissed` and nullable `team_sessions.password_reset_until`. The guarded migration verified the production database identity and both resulting columns at 2026-11-10 23:56 UTC. No real user credentials were read or modified.
- Existing production invitations still require email verification; exposing password login does not enable the legacy invite-code login path in mail-enabled production.

## Verification

- All 77 team tests passed, including real isolated PostgreSQL tests for set/change/wrong current password, password bounds, reset, reset expiry, deactivation, enumeration, salted hashing, session revocation and concurrency. Migration runs twice successfully.
- Nine browser/HTTP acceptance checks passed against a production-mode local build and fictional PostgreSQL data: desktop/mobile login, both email alternatives, authentication/origin rejection, persistent prompt skip, setup/change/password login, already-signed-in reset, enumeration and both rate limits.
- Browser test server blocks all outbound fetches. Email provider behavior in other tests is injected/mocked. No real accounts were logged into; no messages or Stripe requests were sent.
- Production build and changed-file ESLint passed. Desktop/mobile login and account screenshots were visually inspected.
- Connect/payment/logo source is byte-for-byte unchanged relative to the production base; Connect regression tests are included in the passing suite. Production verification uses unauthenticated GETs only.

## Release and retained evidence

- Production base: `3e76e0fc22cfbf50a822b0d10c1640125bf1756b`, deployment `dpl_va5EwCN4AZW7Fwq18P8QF6FyS8sA`.
- Archive worktree: `/Volumes/KoiArchive/WO-0264/site`, branch `codex/wo-0264-password`; independent repository storage also on KoiArchive. No edits to the shared original checkout or HQ ledger.
- Evidence: `/Volumes/KoiArchive/WO-0264/reports/WO-0264/`: `team-tests.log`, `build-final.log`, `lint-final.log`, `browser-tests-final.log`, `browser-final/`, `production-baseline.json`, `migration.json`, and deployment/HTTP receipts.
- PostgreSQL fixtures and all earlier captures remain under `/Volumes/KoiArchive/WO-0264/tmp` and the evidence directory. Nothing was deleted or moved. Estimated peak addition was 3 GB; task allocation before deploy is 1.4 GB with about 65 GB free on KoiArchive. Internal disk remains below reserve and was not used for checkout/build/test scratch storage.
- Rollback, if separately authorized: restore the prior code deployment and retain the additive columns and all evidence. Do not run a destructive down migration.
