# WO-0126 — services menu and direct checkout

D-0188; missions M-0015 / M-0010. Branch `studio/WO-0126-services`, based on `07284e8` (PR #66), isolated at `/Volumes/KoiBuild/koinophobia-labs-site/WO-0126`. Canonical working files were not edited. No KoiDev writes.

## Implementation

- `/services`: audit $250, Straight Answer $250, monthly support $500 for up to 5 hours, and quoted project deposit 50%. Navigation and B2B hub link to the menu; the retired `/services` redirect is removed.
- Audit routes remain `/audit`, `/api/audit/checkout`, `/audit/paid`. Audit and new services share `createOfferCheckout` → existing `createCheckout`, the origin/rate-limited handler, and Stripe + CRM paid-session verification. Proposal deposit/balance checkout remains unchanged.
- `lib/acquisition/services-config.ts`: `STRAIGHT_ANSWER_FREE_SLOTS = 5`. Blake/Director changes the remaining-slot constant and redeploys. Requests do not automatically decrement or reserve slots. Zero hides the free path on the menu/founder pages and rejects free readiness intake; paid checkout remains available.
- Straight Answer paid page accepts a PRD/spec link. Retainer paid page accepts support context and access contacts. Both re-verify Stripe and CRM on submit, use Stripe's buyer email, redact free text, and update the same lead only once. Session/customer details are not rendered.
- `lib/contact.ts`: `CONTACT_EMAIL = ""`; set the business mailbox when ready. Contact links use the form until then; the services contact component displays the configured address. No Customer Portal is offered or configured.
- Subscription Checkout uses `mode: subscription`, USD 50000 cents, monthly recurring inline price data, and identical session/subscription metadata. No `payment_intent_data` is sent for subscriptions.

## Persistence and reliability

No migration is needed or supplied. Only existing migrations 001, 002, and 006 are used by payment persistence. Nothing was applied in production. Local Postgres tests initialize isolated fixtures with `LC_ALL=C` and retain them under the requested KoiBuild temporary directory.

Subscription completion pays the original payment and records the subscription reference/contact on its lead. Initial `invoice.paid` is not double-counted. Each `subscription_cycle` invoice creates one accepted renewal proposal plus a paid payment for $500, on the same lead. A separate proposal preserves the existing `amount_paid <= total` constraint. Renewal invoice/subscription IDs are in proposal internal notes and lead history. Cancellation appends a dated lead-history record; it does not erase payment history or change already-paid invoices.

Webhook processing uses WO-0124's pinned PostgreSQL transaction and row locks. Event IDs dedupe replays, while semantic invoice/cancellation keys dedupe different event IDs for the same business event. Failures roll back all writes and remain retryable. Subscription metadata binds the original payment, proposal, and lead even when invoice/cancellation arrives before checkout completion. SDK 18's `parent.subscription_details` and the older invoice metadata location are supported.

Blake's new-subscription alert reuses the paid-audit delivery path and durable per-payment reservation. Delivery is at most once, after commit. Failed or ambiguous delivery is retained in `stripe_webhook_events.processing_error` for manual reconciliation, with no automatic resend. Existing `paid-audit:` reservation/key naming is intentionally retained for compatibility.

Operational prerequisite: the existing Stripe webhook endpoint must receive `checkout.session.completed`, `invoice.paid`, and `customer.subscription.deleted` (and existing async/expiry/refund events). This work does not change Stripe event subscriptions or settings. Cancellation requests go to Blake, who schedules cancellation at period end.

Stripe references: [Checkout session creation](https://docs.stripe.com/api/checkout/sessions/create), [invoice object](https://docs.stripe.com/api/invoices/object), [events](https://docs.stripe.com/api/events).

## Verification and visual evidence

See the checked-in logs and `screenshot-checks.json`. The capture script uses the actual built page shell, mocked Stripe/CRM verification, and the exact paid content component used by each server route. No application mock switch or production paid-page bypass exists. Unpaid screenshots exercise the actual route without a session. All fixtures are synthetic; no live charges or customer messages were sent.

Initial failed logs are retained alongside final results. Initial failures were an out-of-root Turbopack dependency symlink (resolved by APFS-cloning WO-0124's node_modules), a SQL parameter type (fixed and verified on PostgreSQL), a test helper parameter type (fixed), and capture-script top-level await under CJS (fixed).

Final results:

- Focused services/audit/proposal/reliability tests: **32 passed, 0 failed, 0 skipped**.
- Full suite (`node --import tsx --test --test-reporter=tap tests/*.test.ts tests/*.test.mjs`): **224 tests, 222 passed, 2 known failures, 0 skipped**.
- Known failure: Trendi privacy/support publication-ready assertion, historically “test 58” (full combined run #168), missing `every third party with whom Trendi shares`.
- Known failure: Teacher’s Pet and KOI verification dates are 2026-09-13, 32 days old against a 30-day allowance (combined run #119).
- Lint: zero errors, existing unused `CRM_GOOGLE_PROVIDER` warning in `auth.ts`. Build and typecheck passed.
- Preview ready: https://koinophobia-labs-mm8ox5uk4-koinophobia999-8829s-projects.vercel.app/services
- Screenshots captured against that deployed preview using installed Chrome: menu and all three paid pages, desktop 1440px and phone 390px; plus unpaid states. All eight menu/paid layouts passed horizontal-overflow checks; screenshots visually inspected. Mocked paid screenshots are explicitly named `paid-mocked`.
- KoiBuild remained around 30 GB free through build/tests, above the 10 GB reserve. Temporary Postgres fixtures and evidence were retained.

Screenshots:

| Page | Desktop | Phone |
|---|---|---|
| Services | [Desktop](services-desktop.png) | [Phone](services-phone.png) |
| Audit, mocked paid | [Desktop](revenue_leak_audit-paid-mocked-desktop.png) | [Phone](revenue_leak_audit-paid-mocked-phone.png) |
| Straight Answer, mocked paid | [Desktop](straight_answer-paid-mocked-desktop.png) | [Phone](straight_answer-paid-mocked-phone.png) |
| Retainer, mocked paid | [Desktop](monthly_support-paid-mocked-desktop.png) | [Phone](monthly_support-paid-mocked-phone.png) |
