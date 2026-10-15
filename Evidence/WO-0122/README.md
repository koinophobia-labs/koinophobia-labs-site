# WO-0122 — Revenue Leak Audit checkout

Missions: M-0015 and M-0008. Base: production `05762518a583090d77d38043925c3bd2eb2c9eb2`, verified against remote main on 2026-10-15. Worktree: `/Volumes/KoiBuild/koinophobia-labs-site/WO-0122`, branch `studio/WO-0122-audit-checkout`. The canonical checkout's working files were not edited. No writes to KoiDev, no evidence removal, no production deploy, no merge, no live purchase, no Stripe settings changes.

The public button POSTs source to `/api/audit/checkout`. When Stripe and database configuration are present, the route creates an empty-contact CRM lead (optional buyer-supplied email only), a fixed $250 accepted proposal, and one full balance payment through the existing `createCheckout`. Stripe receives `mode=payment`, `price_data` for 25000 USD cents, product name `Revenue Leak Audit`, email collection, a required Name custom field, and `metadata.paymentId`. Tax and shipping configuration are untouched. Success returns to `/audit/paid?session_id={CHECKOUT_SESSION_ID}`; cancellation preserves source on `/audit`.

The durable existing audit limiter allows five checkout attempts per client per ten minutes and fails closed on limiter failure. The paid page retrieves Stripe server-side and verifies paid state, offer, amount, currency, and the linked CRM record. It renders no customer data. The booking form POSTs `offer=audit` and `paid=true` to the existing intake; the session is retrieved from an HttpOnly, SameSite=Lax cookie and cross-checked with the session stored in `crm_payments`. A forged paid flag or session query cannot authorize a booking. The verified handoff updates the same lead using existing fields, includes preferred times and the Stripe session in notes, and uses the existing intake email helper. Duplicate submissions preserve the first booking and do not resend notification. Booking requires the browser used for checkout; another browser receives generic confirmation and a contact/recovery message. `AUDIT_BOOKING_URL` is the single future booking-tool switch.

No migration is needed or applied. No dependency on migration 009. `processStripeEvent` and the webhook route are unchanged.

## Verification

- `npm run lint`: passed; one existing `CRM_GOOGLE_PROVIDER` unused-import warning in `auth.ts`. See `lint-final.txt`.
- `npm run build`: passed, including `/api/audit/checkout`, `/audit`, and `/audit/paid`. See `build.txt`.
- `npm run typecheck`: passed. See `typecheck-verified.txt`.
- `npm run test:audit-checkout`: 12/12 passed. See `audit-tests-final.txt`.
- Entire existing TS and migration test suite: `node --import tsx --test tests/*.test.ts tests/*.test.mjs` — 204 tests, 202 passed, two known pre-existing failures. See `all-tests.txt`.
- Known failures: `tests/dev-universe.test.ts` — `no product status has gone stale for its stage` (Teacher's Pet and KOI verification dates); `tests/legal-pages.test.ts` — `Trendi privacy and support routes are publication-ready and discoverable` (existing privacy-copy assertion).
- Browser: button POST/source propagation, error/retry behavior, forged `paid=true` neutral state, required booking fields, hydrated form submission and confirmation, desktop/mobile viewport fit, no JavaScript runtime errors. `browser-checks.json` records these checks.
- Local screenshot configuration uses fake Stripe/database values solely to show the button. Checkout and intake browser requests are mocked. Paid screenshots render the actual production component with a mocked verified result; there is no deployed mock endpoint or bypass flag.

Earlier failed script/typecheck attempts are retained. `browser-capture.txt` is the initial CommonJS/top-level-await script error, `browser-capture-reviewed.txt` is the overly broad alert locator, and `typecheck-final.txt` is an incorrect mock email return type. All were fixed; the final captures, `browser-checks.json`, and `typecheck-verified.txt` supersede them. The first `audit-paid-mocked-mobile.png` had a capture tiling artifact; use `audit-paid-mocked-mobile-final.png`.

## Preview

https://koinophobia-labs-4ju6hkcuy-koinophobia999-8829s-projects.vercel.app

Created with `npx vercel --yes` (not production). Deployment `dpl_FbsYynfFu99NZ1YUtBvNyqAD5SKn`, READY. Preview build passed. The deployed application source matches this change; later edits concern test/evidence tooling and documentation only.

Exactly one POST to the preview checkout route returned HTTP 503 and `Payment is temporarily unavailable. Please try again later or ask Blake a question.` This is the expected unavailable state: Preview has DATABASE_URL but no Stripe environment variables. Production has STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET names configured (read-only inspection; values were neither read nor recorded). No environment configuration was changed. See `preview-check.json`, `preview-env-names.txt`, `production-env-names.txt`, and `preview-browser-checks.json`.

Live/test key mode cannot be determined for Preview because no key exists there. No hosted Stripe Checkout URL was created, so the real $250.00 / Revenue Leak Audit checkout page and its unpaid screenshot could not be verified or captured. No test-card or live payment was made. Webhook payment/CRM state transitions were verified with the shared mocked fixture, not a live Stripe delivery. Actual Stripe Checkout/receipt/webhook round-trip validation remains pending a preview environment with authorized Stripe test configuration.

## Screenshots

- `audit-button-local-mock-config.png`: `/audit` with Pay $250 and book (local fake configuration).
- `audit-button-mobile-mock-config.png`: mobile audit page.
- `audit-checkout-error-mocked.png`: recoverable checkout error.
- `audit-paid-mocked.png`: desktop paid confirmation and booking form, visibly labeled mock.
- `audit-paid-mocked-mobile-final.png`: mobile paid confirmation and booking form.
- `audit-booking-submitted-mocked.png`: actual client form after mocked successful intake.
- `audit-paid-unconfirmed.png`: local unconfirmed state with forged paid query.
- `preview-audit-no-stripe.png`: deployed preview's intake fallback without Stripe keys.
- `preview-paid-unconfirmed.png`: deployed preview's unconfirmed state.
- Stripe unpaid screenshot: unavailable because Preview has no Stripe keys; no fabricated checkout image.

Peak additional allocation was estimated below 4 GB. Initial free space: KoiBuild approximately 32.48 GB; internal approximately 12.17 GB. Both stayed above the requested 12 GB floor. All dependencies, npm cache, temporary browser data, build output and evidence were placed on KoiBuild. The existing dependency tree on KoiDev was only read for the copy.
