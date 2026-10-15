# WO-0124 payment reliability

Missions M-0015 / M-0008; D-0185 verified revenue.

Isolated worktree: `/Volumes/KoiBuild/koinophobia-labs-site/WO-0124`, branch `studio/WO-0124-payment-reliability`, based on `d0c92fe` (PR #65 merge). The canonical checkout's working files were not edited. No writes to KoiDev, production migrations, Stripe settings changes, new dependencies, or production deployment.

## Changes

- `lib/payments.ts`: one checked-out PostgreSQL connection wraps event registration, payment mutations, proposal/lead summaries, and the final `processed_at` update in a transaction. Event row locking serializes the same Stripe event; payment/proposal locking serializes distinct events. A processing exception rolls everything back. Existing failed event rows with null `processed_at` are retryable; processed events remain no-ops. Paid updates require Stripe's `paid` status and do not reapply to paid/refunded payments. The pending-only expiry handler is preserved and tested.
- Paid $250 audit payments reserve a per-payment internal notification record in the existing `stripe_webhook_events` table. After commit, the shared SITE-01 Resend sender sends Blake `Paid: Revenue Leak Audit $250`, CRM link, booking-submission state, and buyer name/email (already included by existing lead mail). No card fields are read or sent. Both completed and delayed-payment success events are covered.
- CRM default list/API hides expired, never-paid audit-checkout leads only. `abandoned=show` / **Show abandoned** includes them again. Active checkouts, paid/refunded records and ordinary leads remain visible. Nothing is deleted.
- Paid confirmation and booking submission use the tab's session ID and server-side Stripe + CRM verification. The cookie is a fallback for older form submissions, not a restriction on a verified paid session. No Stripe/customer object is rendered.

## Email delivery semantics

Dispatch is **at most once**, including concurrent events and replays. The notification reservation commits with payment state, then mail is attempted outside the transaction. The existing table records success via `processed_at` or failure/uncertainty via `processing_error`; failures also produce a non-PII error log. A crash after reservation or a rejected/ambiguous send can leave an alert undelivered and requires manual reconciliation. It is deliberately not automatically resent. Payment processing remains successful and does not strand paid buyers because email is unavailable.

A stable Resend idempotency key is extra protection, not the durable guarantee: [Resend retains keys for only 24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys). No new outbox schema or background job is introduced.

Read-only reconciliation query:

```sql
select event_id, received_at, processed_at, processing_error
from stripe_webhook_events
where event_type = 'internal.audit_paid_notification'
  and processed_at is null
order by received_at;
```

## Validation

- `npm run test:audit-checkout`: **22 passed, 0 failed, 0 skipped**. Includes 10 additional tests relative to WO-0122. Real local PostgreSQL verifies rollback/retry, processed replay, concurrent same/different event IDs, notification deduplication/failure, legacy failed events, expiry, and actual CRM filtering SQL. No live email or Stripe payment was sent.
- Full suite: **214 total, 212 passed, 2 known failures, 0 skipped**.
  - `tests/legal-pages.test.ts`: Trendi privacy and support routes publication-ready assertion (`every third party with whom Trendi shares`; known test 58).
  - `tests/dev-universe.test.ts`: Teacher's Pet and KOI verification dates older than the allowed 30 days.
- `npm run lint`: passed, one existing unused `CRM_GOOGLE_PROVIDER` warning in `auth.ts`.
- `npm run build`: passed (Next.js 16.2.12).
- No migration needed. Existing migrations 001, 002 and 006 were used only to construct the new local PostgreSQL fixtures; the existing migration suite also ran on its own loopback-only database.

Full-suite command (the preload only retains the existing migration test's temporary fixture instead of deleting it; assertions and DB operations are unchanged):

```sh
TMPDIR=/Volumes/KoiBuild/koinophobia-labs-site/tmp \
 npm_config_cache=/Volumes/KoiBuild/koinophobia-labs-site/tmp/npm-cache \
 node --import ./Evidence/WO-0124/retain-test-fixtures.mjs --import tsx \
 --test tests/*.test.ts tests/*.test.mjs
```

Logs and retained fixture paths are in this directory's test outputs. Fixtures remain under KoiBuild `tmp`; no evidence was removed. Disk checks remained above the 12 GB internal / 10 GB external reserves (about 27.8 GB internal and 31.2 GB KoiBuild at final validation).

## Preview

Created with `npx vercel --yes`, **not** `--prod`; READY:

https://koinophobia-labs-6a5sspgue-koinophobia999-8829s-projects.vercel.app

Deployment: `dpl_8XNb3GyzsqgpesqBqMLaJRw7pKuk`. Preview has no Stripe keys, so no live Stripe/Resend round-trip was attempted. Read-only smoke checks confirm `/audit` and the unverified `/audit/paid` fallback render correctly. See `vercel-preview.txt` and `preview-smoke.txt`.
