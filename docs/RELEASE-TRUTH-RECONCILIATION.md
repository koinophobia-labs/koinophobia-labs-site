# Release-truth reconciliation — 2026-07-20

Audit performed before merging `feature/dev-personal-universe`. Every public
product status on koinophobia.dev was re-checked against release artifacts,
Apple's delivery logs, code-signing output, git state, and live HTTP responses.

**Result: three of four product statuses were wrong.** One overclaimed, one
underclaimed, and one described a resolved problem as ongoing.

Evidence classes used below:
**HARD** = an artifact, log, receipt, or live response ·
**INFERRED** = a conclusion Apple's own error messages force ·
**SOFT** = someone's written note, uncorroborated.

---

## Truth table

| Product | Stage | Reach | Verified | Basis |
|---|---|---|---|---|
| Career Forge | Publicly available | Anyone can use it | 2026-07-20 | HARD — HTTP 200; `/pricing` renders live-mode-only copy |
| Trendi | Available to internal testers | Invite / beta only | 2026-07-20 | HARD — TestFlight screenshot, build 118 installed |
| You Know Ball | Uploaded, accepted by Apple | Anyone can use it *(web demo)* | 2026-07-20 | INFERRED — Apple's 409s name builds 26 and 27 |
| Koi Cave | Internally validated | Runs for me only | 2026-07-20 | HARD — `spctl` rejects; dev-signed, un-notarized |

---

## Every status claim changed

### Trendi — was "blocked on builds 115/116", now "internal testers, build 118"

| Claim | Before | After | Evidence |
|---|---|---|---|
| Build in testers' hands | "Testers are on build 114" | Build 118 installed via TestFlight | **HARD** — TestFlight app page: Version 0.1.0 (118), release date Jul 19 2026, 90-day expiry, Open button present |
| Release blocker | "Blocked on an Apple account problem" | Upload resolved; gate is now the incomplete isolation test | **HARD** — `PENDING-beta-user-handoff.md`: "Status: PENDING — User B unavailable" |
| Reason isolation test is incomplete | (not stated) | A second, genuinely different Apple account was not available on the device | **HARD** — step 18 of 18: "the User B sign-in was canceled and the cross-user sequence stopped"; every cross-user row reads "Not run" |
| Build 119 | not mentioned | Exists, archived, isolation-hardened, never uploaded, unpushed | **HARD** — `Trendi-0.1.0-119.xcarchive` (Jul 19 22:17); three commits local-only |
| V2 pipeline | "switched off" | still switched off in 117/118/119 | **HARD** — `TrendiCoachPackGenerationVersion = 1` in all three shipped Info.plists |

**Not carried forward:** the release manifest asserts delivery UUID
`977ea0ce-…` and an upload time of 21:15:53 CDT. That UUID appears in no log on
this machine, and the only altool activity that evening is two auth failures at
21:09 — 118 was almost certainly uploaded via Xcode Organizer instead. The
*outcome* is proven by the device screenshot; those two specific values are
**SOFT** and are not published.

### You Know Ball — was "never been on TestFlight", which was false

This is the correction that matters most, because the site was wrong in the
direction of self-criticism, which is the direction nobody audits.

| Claim | Before | After | Evidence |
|---|---|---|---|
| Upload history | "Never been on TestFlight. No build has ever reached a tester." | Builds 26 and 27 were uploaded and accepted by App Store Connect | **INFERRED (airtight)** — two Transporter 409s: `2026-07-16_23-00-51` reports `previousBundleVersion: "26"`; `2026-07-19_13-35-02` reports `"27"`. Apple naming builds it already holds. |
| Processing / testers | (conflated with the above) | Never confirmed past processing; never assigned to a group; nobody has installed it | **HARD (absence)** — no delivery receipt, no ASC record on this machine |
| Engine statistics | "4,500 simulated games", "2.36%", "460 topics" | **removed** | Could not be traced to any artifact in the workspace. They came from a prior session summary. |
| Backup state | (not stated) | Repo has no git remote; the recent engine work is unmerged and exists only on this Mac | **HARD** — `git remote -v` empty; main at `cf74ac4` |

The product page's scoreboard was rebuilt around release facts that *are*
checkable — builds Apple accepted (2), reached a tester (0), outside players
(0), App Store review (none) — rather than gameplay numbers that aren't.

### Career Forge — was "checkout fail-closes", which is false in production

| Claim | Before | After | Evidence |
|---|---|---|---|
| Commerce state | "The checkout path has never been verified end to end — it fail-closes rather than charging anyone." | Production is in **live commerce mode** with a working $49 Career Reset payment link | **HARD** — `/pricing` renders "Founding paid beta · Career Reset only" and "$49"; that string is emitted only when `commerceMode === "live"`. No test-mode banner. |
| Paying users | "No confirmed paying users." | Unestablished **in both directions** — there is no order database by design, so only Stripe knows | **HARD (structural)** — `stripe-webhook` route persists nothing; `docs/PAYMENTS.md`: "No database, no auth, no career data server-side" |
| Beta feedback | "in-product feedback capture" | Zero feedback collected; it saves to the tester's own browser and never reaches Blake | **HARD** — `beta-feedback-store.ts` is localStorage-only; no collection endpoint exists |
| Job outcomes | (not claimed) | Explicitly stated as none | — |

⚠️ **Operational flag, not a copy issue.** Production can take real money right
now, and the fulfilment path depends on `STRIPE_SECRET_KEY`,
`LICENSE_SIGNING_PRIVATE_KEY`, and Resend being correctly set in Vercel. None of
those could be verified from here. If any is misconfigured, a customer is
charged and receives nothing. Worth checking the Stripe dashboard directly —
both to confirm fulfilment works and to answer whether anyone has actually paid.

### Koi Cave — was "installed build predates the feature", now resolved

| Claim | Before | After | Evidence |
|---|---|---|---|
| Installed build | "The build installed on my own machine predates the feature I just certified." | The installed app is current | **HARD** — `~/Applications/Koi Cave.app` binary stamped Jul 13 2026 00:33, built from HEAD `350269a`. The gap was closed the night the report was written. |
| Distributability | (not stated) | Dev-signed and un-notarized — Gatekeeper rejects it on any other Mac | **HARD** — `codesign`: "Apple Development: BLAKE JIHAD TAYLOR"; `spctl -a` → rejected; `stapler validate` → no ticket |
| Mail integration | (not stated) | Has never completed a sync; every brief ran on local seed state | **HARD** — `gmail-oauth-config.json` holds a clientID and no tokens; the sync target file was never created |
| >72h truth bug | stated | unchanged, still open | **HARD** — certification report finding F2 |

---

## What could not be verified

These are open questions, not claims. None of them are published as facts.

1. **Whether anyone has paid Career Forge.** No local records can exist by
   design. Only the Stripe dashboard can answer it.
2. **Career Forge traffic.** Vercel Analytics is live and collecting; reading
   counts needs dashboard access.
3. **Apple-side state today** for either app — processing status, export
   compliance, tester groups. Everything here is inferred from local artifacts
   and one device screenshot; nothing queried App Store Connect.
4. **Whether You Know Ball builds 24/25 were ever uploaded.** No receipts.
5. **An older Capacitor-lineage "1.0 (4)" upload** appears in status notes for a
   *different* bundle ID. **SOFT** only, no log survives. Not published.

---

## Freshness safeguards added

- Every product carries `verifiedAt` and `evidence[]`. Tests fail if either is
  missing.
- `MAX_STATUS_AGE_DAYS = 45` — the suite fails when a status goes stale, so
  decay becomes a broken build rather than a quiet lie.
- `statusOwner` is recorded in one place.
- Product pages render "Verified 2026-07-20" with the evidence beneath the
  status, so a reader can check the claim rather than trust it.
- A cross-surface test asserts home, `/products`, `/now` and the sitemap cannot
  describe the same product differently.
