# Paid-job fulfillment

Payment receipt and job creation commit together. A unique proposal/deal constraint prevents duplicate jobs for webhook retries or multiple payments on the same project. The immutable job snapshot holds the paid offer and confirmed auditor proof. The Fix takes one purchased problem, matching the public deal-page proof when present; Tune-Up holds the confirmed problem set. Missing proof is visible and prevents verification/delivery.

The 256-bit `/start/{code}` invitation expires after 30 days. It is private/no-store/noindex, suppresses analytics, and sets no-referrer. The client selects a platform, supplies contact details and uses contributor invitations. An invitation claim does not confer access: Blake confirms it before work begins. The client contact email does not change the purchase email used for transactional messages. Direct purchases without a known business/site collect those two fields during onboarding.

`/team/admin#jobs` is the owner digest and job board. `/team/jobs/{id}` contains contact/access details, immutable before-proof, fix instructions, notes, deadline, verification history and email delivery status. Partners receive only `{deal_id, stage}` fulfillment data through their already-scoped snapshot. They cannot read job pages or invoke job actions.

Fix ready queues a fresh auditor pass immediately. A second successful pass is due at least ten minutes later. Each pass checks each exact purchased target through the shared auditor, preserving GET-only, public-network, robots, TLS and bot-block safeguards. A blank result, unsupported measurement, incomplete load, bot challenge, missing screenshot or reproducing finding blocks delivery. The owner cannot bypass this via the old deal-stage action. Verification expires for delivery after 24 hours.

## Scheduling and email

The authenticated `/api/jobs/tick` cron is scheduled every ten minutes in `vercel.json`. **Before any release, verify the existing Vercel plan supports this frequency and a production `CRON_SECRET` is configured.** Missing or incorrect authorization returns 401. Preview execution is disabled. Each tick persists deadline/access notifications, dispatches transactional messages, then claims one due verification job. A lease and revision prevent overlapping/stale verification from replacing a new attempt.

Messages use the existing Resend transactional sender in `lib/acquisition/intake.ts`. Next step goes only to the email on the paid Checkout Session. It's fixed goes to the same purchase email with before/after image attachments and one Care Plan link. Internal deadline/access messages go only to `blake@koinophobialabs.com`. The webhook dispatches at most one queued message after the payment transaction. No email network call is enabled outside production or when `NODE_ENV=test`.

Dispatch claims are durable and provider requests carry an idempotency key. Failed or uncertain sends remain visible on the owner board/job. A crashed or timed-out send is **not blindly resent**; reconcile with the provider before any retry. Jobs are marked Delivered when verified handoff is queued; their message record separately proves whether the provider accepted the email. No actual inbox delivery claim is implied by an API acceptance.

## Deadlines and escalation

The Fix is 72 elapsed hours after paid_at; Tune-Up is seven elapsed days. Other work needs the deadline from its accepted quote; no date is invented. The board flags a missing quoted deadline. Alerts are due within 24 hours of the deadline and at/after the deadline, with up to ten minutes of scheduler granularity. The daily portal digest is computed from current open jobs in Central time. Waiting on access for 24 hours creates an owner nudge; calls/texts are from a human's own phone.

After seven days without access, or an out-of-scope flag, the owner can create a close-and-refund draft. Blake must explicitly confirm closure. **This feature does not issue Stripe refunds.** The confirmed draft records his decision; issuing the refund in Stripe remains his separate action. Commission/payment records are never rewritten by a job transition.

## Release sequence

1. Read the literal status lines of HQ WO-0270 and WO-0272; both must be complete, done or blocked. Recheck at ten-minute intervals while waiting. Do not reinterpret open/in-progress as permission.
2. Fetch and merge the source of the *current live deployment*. Confirm ancestry immediately before deployment and promotion. Never overwrite another work order's release. Integrate WO-0272's final auditor package and add explicit positive-resolution predicates for any new check type; unsupported types must continue to block delivery.
3. Re-run all TypeScript/JavaScript test files, lint, typecheck, production build, browser acceptance with the synthetic database, and auditor trace inventory. The isolated fake-browser test uses `scripts/wo0274-browser.mjs`; do not use it against production or actual accounts.
4. Apply only `db/015_team_fulfillment.sql` with `scripts/migrate-team-fulfillment.mjs`, using the existing authenticated direct Neon migration identity controls. It prints pre-counts and verifies all pre-existing row counts before commit. No existing tables or rows are removed. Inspect historical paid deals lacking jobs before release; do not silently email/backfill old clients.
5. Make the single authorized production deployment, verify routes/auth boundaries/assets/scheduler configuration and runtime, then verify the live alias. Production probes must not send mail, submit real onboarding, charge or refund, or log into real accounts. Keep the previous deployment id for an alias rollback if verification fails. Retain the additive tables and all records/evidence on rollback.

## Evidence boundaries

Local mocked Stripe events exercise real PostgreSQL transactions. Browser screenshots use fictional data and synthetic before/after outcomes, not a claim that a real client site was fixed. Test mail providers are mocked or disabled. No real account login, purchase, invitation, email, text, refund or Stripe setting change is part of acceptance.
