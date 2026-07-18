# Koi Assistant — Usefulness Audit (Phase 0)

**Date:** 2026-07-18
**Auditor:** Claude (creative direction + primary dev)
**Under review:** the Living Koi Concierge shipped on `codex/living-koi-concierge` (draft PR #33), reconciled onto `feature/koi-assistant` off `origin/main` (which now carries the merged brand-intro work from PR #32).
**Method:** read every file in the feature (18 files, ~1.8k lines); traced the runtime as an actual visitor would experience it on `/`, `/services`, `/work`, `/work/[slug]`, `/audit`, `/intake`; checked host allowlisting against real Vercel preview hostnames; ran the existing test baseline (45 pass).

This is not a component inventory. It judges whether the thing is **useful, alive, and restrained** — the three things the mission asks for — and states plainly where it is not.

---

## Verdict in one paragraph

The foundation is genuinely good and should be **kept, not replaced**: the session/invitation budget is disciplined and correct, the panel is accessible (focus trap, Escape, reduced-motion, safe-area), the deterministic concierge handoff is intact, analytics are categorical and privacy-safe, and preview-host allowlisting already works. But the feature falls short of the mission on its two headline promises. **(1) It chases the cursor.** The last four commits on the branch turned the koi into a free-roaming pointer-follower — the single behavior the mission forbids most emphatically. **(2) Its "usefulness" is a shadow website.** Site help is eight hand-written generic answers that duplicate `lib/commercial.ts` and will go stale; there is no service comparison, no relevant-work matching, and the per-route "quick actions" are the same four buttons on every page. The koi can *launch* the concierge but cannot yet *help you understand the page you are on*. The corrective work is Layers 1 and 2 of the mission — real page-copilot usefulness, and motion that is alive without chasing.

---

## Usefulness

### U1 — Site "knowledge" is a hand-maintained shadow of the real content · **Severity: High · Replace**
- **Observation:** `lib/companion/site-help.ts` hard-codes 8 topics (services, pricing, timing, audit, process, work, contact, ai) as prose strings. Prices ("$250", "$149 … larger") and timelines are re-typed by hand.
- **Evidence:** `serviceOffers`, `studioConfig`, `workProjects`, `products`, `faqs` already exist in `lib/commercial.ts` as structured, published truth. `site-help.ts` imports none of them.
- **User impact:** The moment Blake changes a price or adds a service, the koi lies. The mission explicitly warns against "a manually duplicated shadow website that will immediately become stale."
- **Correction:** Derive a typed `SiteKnowledge` manifest from `lib/commercial.ts`. Answers cite the same numbers the pages render.
- **Verify:** unit test asserting every answer's price/timeline strings are the *same references* from `commercial.ts`, not literals.

### U2 — No service comparison · **Severity: High · Add**
- **Observation:** A core mission intent ("Compare the Audit and a Website Rebuild") has no implementation. The panel can link to `/services` but cannot say how two offers differ.
- **User impact:** The most common real decision a visitor faces — "audit or build?", "rebuild or automation?" — gets a generic link, not an answer.
- **Correction:** `compareServices(a, b)` over `serviceOffers` returning for-whom / problem / price / timeline side by side, plus a grounded "start with the audit when the cause is unclear" recommendation.
- **Verify:** unit test over known slug pairs.

### U3 — No relevant-work matching · **Severity: High · Add**
- **Observation:** Mission intent "show me work closest to my problem" is unimplemented. `workProjects` carries `businessType`, `capabilities`, `problem` — perfect matching signal — but nothing consumes it for the koi.
- **User impact:** On `/work` and `/work/[slug]` the koi offers proof-seeking visitors nothing beyond a generic "does this feel close?" invitation.
- **Correction:** `relevantWork(intent)` scoring projects by capability/business-type/problem keywords.
- **Verify:** unit test — an "inquiry routing" intent surfaces Blackline Ritual (structured intake) above the coffee shop.

### U4 — Per-route actions are identical · **Severity: Medium · Modify**
- **Observation:** Every enabled route (except `/intake`) serves the same `baseActions`: concierge / start project / explore services / human review. The invitation *text* changes; the *actions* do not.
- **User impact:** The panel is not actually page-aware; it is a fixed launcher wearing different captions. On `/work/[slug]` a visitor wants "show me a similar service," not "explore services."
- **Correction:** Route-specific action sets — compare-services on `/services`, show-relevant-work on `/work`, audit-vs-build on `/audit`, organize-project on `/intake`.
- **Verify:** unit test asserting distinct action IDs per route key.

### U5 — Free-text help falls back too eagerly · **Severity: Low · Modify**
- **Observation:** `answerSiteQuestion` scores by substring keyword hits; anything unmatched dumps to a generic "use the concierge." No clarifying choice.
- **Correction:** low-confidence path offers a bounded clarifying choice (which topic?) before defaulting to the concierge, per the mission's "grounding confidence low" rule.

---

## Motion quality

### M1 — The koi chases the cursor · **Severity: Critical · Replace**
- **Observation:** `KoiCompanion.tsx`'s `follow(event)` sets the koi's target position from `event.clientX/clientY` on every `pointermove`, easing toward a point offset from the cursor anywhere in the viewport. Commit history is explicit: "Let koi follow freely across viewport," "Steer koi along its swim direction," "Make free-moving koi easy to select."
- **Evidence:** `targetX = desiredCenterX - anchorX` where `desiredCenterX` tracks `event.clientX`. The fish trails the mouse across the whole screen.
- **User impact:** This is the mission's #1 prohibition — "No pursuit of the cursor," "does not chase," "Use proximity zones and vector influence with a strict maximum displacement." A fish that follows the mouse everywhere is a gimmick, not a companion, and it reads as needy.
- **Correction:** Bounded ambient drift inside a small route-anchored safe region; pointer only *influences* orientation and a small notice nudge (hard-capped displacement, ~24px) when the cursor comes near; scroll velocity nudges drift; the koi always returns to its anchor. Disable pointer reaction on touch.
- **Verify:** unit test on the motion controller asserting displacement never exceeds the cap regardless of pointer distance; browser observation that the fish stays in its corner while the mouse roams.

### M2 — State machine is minimal · **Severity: Medium · Modify**
- **Observation:** 5 states (`resting`, `noticing`, `inviting`, `listening`, `sleeping`). Mission asks for explicit `drifting`, `swimming`, `avoiding`, `paused` too, with defined transitions.
- **Correction:** Expand to a documented machine; drive drift/swim/avoid from real inputs (scroll, proximity, collision) not random timers. `paused` on tab-hidden already exists as a flag — fold it into the machine.

### M3 — Organic body motion is absent · **Severity: Low · Modify**
- **Observation:** The fish is a single SVG that translates and rotates rigidly (a "sticker," in the mission's words). No tail-leads-body undulation.
- **Correction:** Subtle phase-offset tail/body transform in CSS, gated by reduced-motion. Low priority relative to M1.

---

## Discoverability

### D1 — Trigger can vanish on dense pages · **Severity: Medium · Keep w/ guard**
- **Observation:** `triggerOverlapsInteractiveControl` hides the koi (`collisionHidden`, `aria-hidden`, `tabIndex -1`) whenever it overlaps any link/button by >6px. Good for not covering CTAs — but on a control-dense corner the koi can be silently unreachable.
- **Correction:** Keep collision avoidance, but couple it to motion: when blocked, the koi should *move to a safe anchor* rather than disappear. Only hide as a last resort.

---

## Annoyance risk

### A1 — Budget is correct · **Severity: —- · Keep**
- Invitation cap (2/session), 10-min cooldown, per-route dedupe, 30-min dismissal, full-session "let the koi rest," suppressed while a field is focused / dialog open, none during active scroll, none right after nav. This is exactly right and matches the mission. **Keep unchanged.**

### A2 — Invitation copy over-promises usefulness the koi can't deliver · **Severity: Low · Fix-with-U1..U4**
- The invitation sub-line says "Ask me about this site or find the right service," but until U1–U4 land the koi can't really compare or surface work. Once usefulness is real, the copy is honest.

---

## Commercial value

### C1 — Concierge handoff intact · **Keep**
- `ConciergeFlow` gains a `surface="companion"` prop, emits `koi_concierge_*` events, autosaves the draft on every answer, and offers "continue on the full page." Shared draft key (`CONCIERGE_STORAGE_KEY`) means one lead pipeline. No second concierge, intake, or router was created. **This is correct and preserved.**

### C2 — Smallest-next-step is asserted but not enacted · **Severity: Medium · Improve**
- The panel *says* "find the smallest sensible next step" but funnels every route toward the concierge or `/intake`. Real smallest-step outcomes (read one service, view one case study, run the $250 audit, or "not a fit") need to be first-class panel results — which U2/U3 enable.

---

## Accessibility

### X1 — Strong baseline · **Keep**
- Dialog semantics, focus trap + restore, Escape, reduced-motion media query, safe-area insets, decorative SVG (`aria-hidden`), meaningful trigger label that changes when a draft exists. **Keep.** New surfaces (comparison, work results) must carry the same care (headings, `role="status"` on answers).

---

## Performance

### P1 — Reasonable, watch rAF · **Keep w/ guard**
- One global controller, lazy panel + concierge, rAF only while motion active, pauses on tab hidden, throttled collision (120ms). Good. **Guard:** the new motion loop must keep the "rAF only while moving" discipline and must not re-render React per frame (use imperative transforms + CSS vars, as the current code already does).

---

## Mobile behavior

### MO1 — Pointer motion correctly disabled on touch · **Keep**
- `follow` early-returns on `pointerType === "touch"`; the pointer media query gates the whole effect. Mobile gets a static, tappable koi. Keep this; the rebuilt motion must preserve it (ambient drift may stay, pointer influence must not run on touch).

---

## Preview & production parity

### PP1 — Preview host allowlisting works · **Severity: —- · Keep (verified)**
- `companionHostAllowed` matches `koinophobialabs.com`, `www`, `localhost`, `127.0.0.1`, and `^koinophobia-labs(?:-[a-z0-9-]+)?\.vercel\.app$`. The existing test proves the real preview hostname `koinophobia-labs-git-codex-…-projects.vercel.app` is allowed. Correctly **excludes** `koinophobia.dev` (the personal site — koi is a studio-site feature). **Keep.**

---

## Brand fit

### B1 — Uses Trendi fish art, not the site's koi identity · **Severity: Medium · Note / defer**
- **Observation:** `CompanionKoiArt` renders `TrendiFishBody` with a violet palette — a reused product asset, not the brand koi emblem (`public/brand/koinophobia-labs-koi.webp`) that the intro/nav now use.
- **User impact:** The companion is a purple fish, not visibly *the Koinophobia koi*. Acceptable as an interim (the mission says "reuse current fish assets," and an SVG is needed for live transform/undulation which the raster emblem can't do), but it should read as the same character family. 
- **Decision:** Keep the SVG geometry (needed for motion) this pass; tune palette to the brand violet ramp so it reads as kin to the emblem. Full emblem-derived SVG is a follow-up, not a blocker.

---

## Summary table

| ID | Area | Severity | Verdict |
|----|------|----------|---------|
| M1 | Cursor chasing | Critical | Replace |
| U1 | Shadow-website knowledge | High | Replace |
| U2 | No service comparison | High | Add |
| U3 | No relevant-work matching | High | Add |
| U4 | Identical per-route actions | Medium | Modify |
| C2 | Smallest-step not enacted | Medium | Improve |
| M2 | Thin state machine | Medium | Modify |
| D1 | Trigger can vanish | Medium | Guard |
| B1 | Trendi art, not brand koi | Medium | Note/defer |
| U5 | Eager help fallback | Low | Modify |
| M3 | Rigid body motion | Low | Modify |
| A2 | Over-promising copy | Low | Fix-with-U |
| A1 | Invitation budget | — | Keep |
| C1 | Concierge handoff | — | Keep |
| X1 | Accessibility baseline | — | Keep |
| P1 | Performance | — | Keep |
| MO1 | Touch disables pointer motion | — | Keep |
| PP1 | Preview host allowlist | — | Keep (verified) |

## What this pass will implement
1. **Ground the knowledge** (U1–U3, C2): `lib/companion/site-knowledge.ts` derived from `lib/commercial.ts` — comparison, relevant-work, next-step; rework `site-help` to consume it.
2. **Stop the chase** (M1, M2): bounded anchored drift + capped pointer/scroll *influence*, expanded state machine, keep collision→anchor.
3. **Make the panel page-aware** (U4, C2, A2): route-specific actions, comparison + relevant-work + understand-this-page answer cards.
4. **Prove it** (all): extend `tests/companion.test.ts` + new knowledge tests; browser-pane verification (no-chase, typing pause, mobile, reduced motion); architecture + launch-gate docs.

Kept untouched: invitation budget, accessibility scaffold, concierge/intake/CRM/Resend pipeline, host allowlist, analytics privacy posture.
