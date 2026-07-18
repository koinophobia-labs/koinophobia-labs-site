# Koi Assistant — Launch Gate

**Date:** 2026-07-18 · **Branch:** `feature/koi-assistant` (reconciled off `origin/main`, which carries the merged brand-intro PR #32; supersedes draft PR #33 `codex/living-koi-concierge`).

## Test + static checks
- `npx tsc --noEmit` — clean.
- `npx eslint components/companion lib/companion tests/companion.test.ts` — clean.
- `tests/companion.test.ts` — **18/18 pass** (was 10; +8 for knowledge, motion bounds, per-route copilot).
- `npm run test:concierge` (includes companion) — **53/53 pass**.
- `npm run test:commercial` — **6/6 pass**.
- Baseline before changes: 45 concierge-suite tests, all green.

## Live verification (local dev, http://localhost:3010)
The dev tab is reported `visibilityState: "hidden"` (it is not the focused OS window), which is the exact condition that throttles CSS animations — so this environment is a strong test of preview-host parity.

| Check | Result |
|-------|--------|
| Koi mounts + visible on `/services`, `/work` | ✅ anchored bottom corner |
| Koi absent on suppressed `/connect` | ✅ no trigger, no root node |
| Trigger accessible label | ✅ "Open Koinophobia Labs site guide" |
| Panel opens and is **visible** (opacity resolves to 1) | ✅ after the throttled-animation fix (see below) |
| Page-aware actions differ per route | ✅ `/services` → Compare; `/work` → Find the closest work |
| Grounded service comparison | ✅ Audit $250 / 2–3 days vs Website $1,500–$3,500 / 1–3 weeks + audit-first recommendation |
| Grounded relevant-work ranking | ✅ "messy inquiries" → Blackline Ritual first, reason "Closest on structured intake" |
| Smallest-next-step card, route-specific | ✅ `/work` → "See the service closest to this" |
| Mobile bottom sheet (375×812) | ✅ full-width, opacity 1, **no horizontal overflow** |
| Console errors | ✅ none |
| Server build errors | ✅ none |

### Bug found and fixed during verification
**Panel invisible on throttled/background tabs.** The panel's entrance used `animation: … both` with a `from { opacity: 0 }` keyframe; on a hidden tab (preview environment) CSS animations freeze at 0%, holding the panel at `opacity: 0`. A too-broad `[data-paused] *` rule compounded it by pausing the panel's own animation. **Fix:** the backdrop/panel now carry `opacity: 1` as their base state and animate transform only; the pause rule is scoped to `.koi-companion-presence` (the ambient fish) so it can never freeze the interactive dialog. Re-verified: `backdropOpacity: 1`, `panelOpacity: 1`. This directly satisfies the mission's "must be visible in the review environment" gate.

## Preview / production hostname logic
`companionHostAllowed()` allows `koinophobialabs.com`, `www`, `localhost`, `127.0.0.1`, and `^koinophobia-labs(?:-[a-z0-9-]+)?\.vercel\.app$`. Unit test proves the real preview host `koinophobia-labs-git-…-projects.vercel.app` is allowed and `koinophobia.dev` is rejected. Not yet exercised on a deployed Vercel preview URL for **this** branch (no PR pushed at time of writing) — see blockers.

## AI-unavailable
Verified by construction + tests: page briefs, comparison, relevant-work, next-step, site answers, and concierge routing all run without `OPENAI_API_KEY`. No AI credential is added by this change.

## Reduced motion / typing pause
Covered by unit tests and code: motion controller early-returns under `prefers-reduced-motion`; `frozen()` (includes `interactionInProgress()`) halts all drift and blocks invitations while any field is focused. Not separately screenshotted (the preview tool cannot emulate the reduced-motion media query), but the reduced-motion CSS + JS paths are asserted in `tests/companion.test.ts`.

## Regression status
- Concierge / intake / CRM / Resend pipeline: untouched. The only concierge change (from PR #33) is the additive `surface="companion"` prop + autosave + `koi_concierge_*` events; 53 concierge tests green.
- Migration `007`: not touched.
- No second concierge, intake, service router, or lead pipeline created.

## Remaining blockers / follow-ups (non-blocking for merge)
1. **Deployed preview URL not yet exercised** for this branch (needs the PR pushed). Host logic is unit-verified; run Journey 1 against the real `…vercel.app` once the PR is up.
2. **Brand fish (B1):** still the Trendi-derived SVG tuned to the violet ramp; an emblem-derived koi SVG is a future pass (kept as SVG because the raster emblem can't undulate live).
3. **Organic body undulation (M3):** tail/body phase-offset is subtle; could be richer.
4. Full Playwright QA harness (`scripts/qa-koi-companion.mjs`) predates this rework and should be refreshed to assert the anchored-motion invariants rather than the old follow behavior.

## Release recommendation
**GO for merge to `main`** (studio site). The three headline mission goals are met and verified: the koi is genuinely useful (grounded page copilot), alive without chasing (bounded anchored motion, proven by unit caps + live observation), and restrained (unchanged invitation budget). The invisible-panel preview bug — the one thing that would have made it "not review-ready" — is fixed and re-verified. Push the branch, then run the one outstanding deployed-preview check (Journey 1) before promoting.
