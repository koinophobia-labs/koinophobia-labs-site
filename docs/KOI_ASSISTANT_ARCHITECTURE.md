# Koi Assistant — Architecture

The koi is a single, page-aware companion for the **studio site only** (koinophobialabs.com), layered over the existing deterministic Project Concierge. It has three integrated layers that share one state and one lead pipeline.

- **Layer 1 — Living presence:** an anchored koi that drifts and reacts, never chases.
- **Layer 2 — Page copilot:** grounded, per-page understanding, comparison, relevant-work, and next-step help.
- **Layer 3 — Project concierge:** the unchanged finite qualification flow, launched/resumed in-panel.

## Files

| File | Role |
|------|------|
| `components/companion/KoiCompanion.tsx` | Global mount, presence, motion controller, invitation budget, collision avoidance, analytics. |
| `components/companion/KoiCompanionPanel.tsx` | The dialog: page-aware menu + copilot surfaces (understand / compare / work / help) + concierge. |
| `components/companion/CompanionKoiArt.tsx` | SVG koi (reuses the Trendi fish geometry so it can transform/undulate live). |
| `lib/companion/page-context.ts` | Route → `{ routeKey, invitation, actions, copilot[], slug, preferredSide, delay }`; host allowlist; suppression list. |
| `lib/companion/site-knowledge.ts` | **Grounded knowledge derived from `lib/commercial.ts`** — services, comparison, relevant-work, page briefs, next steps, free-text answers. |
| `lib/companion/site-help.ts` | Thin back-compat adapter over `site-knowledge` (`SITE_HELP_TOPICS`, `answerSiteQuestion`). |
| `lib/companion/motion.ts` | Pure, bounded motion math + state machine. |
| `lib/companion/session.ts` | Invitation/annoyance budget + session persistence. |
| `app/koi-companion.css` | All styling and animation. |
| `tests/companion.test.ts` | Unit coverage for every module above. |

## Page-aware usefulness model

`resolveCompanionPageContext(pathname)` classifies the route and returns a `copilot: CopilotIntent[]` list (`understand` | `compare` | `relevant_work` | `next_step`) that is **distinct per route** — `/services` offers compare, `/work` offers relevant-work, `/products` offers neither. The panel renders exactly those surfaces plus the always-present help, concierge, and nav actions.

### Site knowledge source

Everything the koi "knows" is **derived at import time from `lib/commercial.ts`** — the same `serviceOffers`, `workProjects`, `products`, `studioConfig`, `faqs`, `processSteps`, `businessProblems` the studio pages render. Nothing is hand-typed. A price or timeline change in `commercial.ts` flows straight into the koi's answers, comparisons, and page briefs. This is the deliberate fix for the "shadow website that goes stale" failure mode.

Key functions:
- `compareServices(a, b)` — side-by-side of two published services + a deterministic "start with the audit when the cause is unclear" recommendation. Returns `null` for identical/unknown slugs (no fabrication).
- `relevantWork(intent)` — keyword scoring over each project's `businessType` / `capabilities` / `problem`; returns ranked matches with a grounded reason.
- `pageBrief(routeKey, slug?)` — "what this page shows" + supporting facts.
- `smallestNextStep(routeKey)` — the smallest sensible action, which is **not always a build** (read a service, run the audit, organize via concierge).
- `answerGroundedQuestion(q)` — keyword match over topics assembled from live data; low confidence returns a bounded clarifying choice, never a guess.

## Motion engine (`lib/companion/motion.ts`)

The koi is **anchored, not a cursor follower**. All motion is bounded pure math so "never chases" is provable:

- `COMPANION_MAX_OFFSET = 40px` — the koi may never leave its anchor further than this.
- `ambientDrift(t)` — deterministic Lissajous path, amplitudes chosen so its magnitude is provably `< COMPANION_DRIFT_RADIUS (16px)`.
- `pointerInfluence(pointer, anchor)` — **zero** influence beyond `COMPANION_PROXIMITY_RADIUS (150px)`; within it, a shy nudge *away* from the cursor, hard-capped at `COMPANION_PROXIMITY_NUDGE (22px)` regardless of pointer distance.
- `scrollInfluence(velocity)` — a decaying vertical nudge capped at `COMPANION_SCROLL_NUDGE (18px)`, opposite the scroll direction.
- `clampOffset(dx, dy, max)` — final clamp on the summed offset.

The controller (`KoiCompanion.tsx`) runs `requestAnimationFrame` **only while there is motion to resolve** — the koi rests at its anchor the majority of the time. It freezes entirely while the visitor is typing (`interactionInProgress()`), while the tab is hidden (`paused`), and under `prefers-reduced-motion`. Pointer influence is disabled on touch devices.

### State machine

`resolveCompanionMotionState({ open, paused, collisionHidden, invitationVisible, reducedMotion, ambientState })` resolves the rendered state with this precedence:

`listening` (panel open) → `paused` (tab hidden) → `inviting` → `avoiding` (collision) → `resting` (reduced motion) → ambient (`resting` / `drifting` / `noticing` / `sleeping`).

## Safe zones & collision

`triggerOverlapsInteractiveControl()` (throttled to 120ms, plus scroll/resize) hides the koi (`aria-hidden`, `tabIndex -1`) when it would cover a link/button. The koi's small drift means it rarely needs this; when blocked it enters the `avoiding` state.

## Annoyance budget (`lib/companion/session.ts`) — unchanged, and correct

Max 2 proactive invitations/session, 10-min cooldown, per-route dedupe, 30-min dismissal, full-session "let the koi rest," suppressed while a field is focused / dialog is open / during scroll / right after nav / after the concierge has started. The koi rests or sleeps the majority of page time.

## Persistence

- `koinophobia:koi-companion:v1` (sessionStorage) — companion session (hidden/minimized/invitation counters).
- `CONCIERGE_STORAGE_KEY` (localStorage) — the **shared** concierge draft. The panel autosaves on every answer and offers "continue on the full page," so there is exactly one lead pipeline.

## Analytics

Categorical only, via the existing `trackStudioEvent`. Events: `koi_companion_viewed/opened/minimized/invitation_shown/invitation_dismissed/action_selected`, `koi_site_question_answered`, `koi_companion_page_understood`, `koi_companion_services_compared` (service-slug pair), `koi_companion_relevant_work_selected` (top slug + count), and the concierge's `koi_concierge_*`. **No visitor free-text, business names, contact details, or CRM identifiers are ever sent** — the relevant-work intent and site questions stay client-side (asserted by test).

## AI constraints

The assistant is **fully useful with no `OPENAI_API_KEY`**: page briefs, comparisons, relevant-work, next-step, and the concierge's deterministic routing are all rules-based. When a model is available it may only rephrase within validated knowledge entries and allowed actions — it can never invent facts/prices/proof, select links, change recipients, override routing, or access the CRM. Low grounding confidence yields a clarifying choice, a page link, or the concierge — never a guess.

## Performance

One global controller; lazy-loaded panel and concierge; rAF only while moving; observers/timers torn down on suppression; animations paused when the tab is hidden; continuous motion applied via imperative transforms + CSS vars (no per-frame React re-render).

## Accessibility

Dialog semantics, focus trap + restore, Escape-to-close, meaningful trigger label (changes when a draft exists), `role="status"` answer regions, `prefers-reduced-motion` support, safe-area insets, 44px targets. The fish itself is `aria-hidden`; all meaning lives in the trigger and controls.

## Suppressed routes & hosts

Suppressed prefixes: `/api`, `/brand`, `/concierge`, `/connect`, `/crm`, `/home`, `/now`, `/payment`, `/resume`, `/trendi`, `/you-know-ball`. Host allowlist: `koinophobialabs.com`, `www`, `localhost`, `127.0.0.1`, and `^koinophobia-labs(?:-[a-z0-9-]+)?\.vercel\.app$` (real preview hostnames). `koinophobia.dev` is deliberately **excluded** — the koi is a studio-site feature.

## Preview-host behavior

Background/preview tabs throttle CSS animations. The panel's visibility therefore does **not** depend on its entrance animation: `.koi-companion-backdrop` and `.koi-companion-panel` carry `opacity: 1` as their base state, and the entrance keyframes animate transform only. This guarantees the panel is visible in the review environment and if a tab ever loses visibility mid-open.
