# ANIMATION_REQUIREMENTS.md
## The system that decides whether this game works

**This game lives or dies on animation.** It is the largest cost, the largest risk (`RISK_REGISTER.md` R-01, R-02), and the mechanism by which three of the six pillars are delivered. This document specifies what must be built and, equally importantly, **what must not be attempted.**

---

## 1. The animation thesis

> **The protagonist gets better by losing motion, not by gaining it.**

A novice's technique contains everything: the wind-up, the tell, the over-rotation, the stagger on recovery, the extra step to re-find balance. A master's version of the same technique contains only the parts that do work. It starts, it lands, it resets.

This is observably how real competence looks, it is perfectly legible to a non-expert viewer, and it is **the only progression system in the game that requires no UI at all.**

**Corollary:** frame data follows the animation *honestly*. A Silent technique is faster because the motion is genuinely shorter, not because a multiplier was applied to a Rough clip. If the two ever disagree, the animation is right and the data is wrong.

---

## 2. The three fidelity tiers

Every **core** technique is authored three times.

| Tier | Character | Startup | Recovery | Mastery states |
| --- | --- | --- | --- | --- |
| **Rough** | Telegraphed wind-up, over-rotation past the target, a recovery stagger, an extra balance step | Long | Long + stagger | Impression, Learned |
| **Sound** | Correct mechanics, no waste, normal commitment | Normal | Normal | Sound |
| **Silent** | Compact, minimal preparation, lands and resets, weight stays over the base | Short | Short | Silent, Instinctive |

### Budget — the number that controls the project

| Category | Count | Tiers | Clips |
| --- | --- | --- | --- |
| **Core techniques** (tiered) | **40** | 3 | 120 |
| **Secondary techniques** (single tier, Sound only) | 28 | 1 | 28 |
| **Shared-body techniques** (same mechanic across styles, authored once) | — | — | −18 reuse |
| **V1 technique total** | **68** | | **~130 authored technique clips** |

**How 40 tiered techniques cover four styles:** ten per style, which is exactly the five core techniques that define a style's grammar plus five that extend it. Everything else is Sound-only, which is fine — a player never sees a *secondary* technique enough for its fidelity to register.

**Reuse rule:** where two styles share a body mechanic (a rear straight, a basic front kick, a hip throw), the clip is authored once and differentiated by **stance entry and exit**, not by re-animating the whole motion. This is worth roughly 18 clips.

---

## 3. Rigs and the aging protagonist

**One skeleton. Four proportion states. One build morph system.**

- A single skeleton drives the protagonist at ages 9, 15, 19, and 26, differentiated by **proportion morphs** (limb length ratios, head-to-body, mass distribution) rather than by separate rigs. All animation retargets across all four.
- The **build morph** (`PROGRESSION.md` §2) layers on top: Root/Density shifts mass to the hips and shoulders; Mobility/Speed narrows and lengthens. Continuous, driven by the attribute values.
- **Ruhn ages 68 → 86** on the same principle: one scanned identity, authored age states, no second capture.

**Why this matters:** without a single-skeleton retarget pipeline, four age states multiply the entire animation budget by four and the project dies. This is the first thing to build and prove (`PRODUCTION_ROADMAP.md` M2).

**The child is not a small adult.** Age 9 gets a small set of **bespoke** locomotion and technique clips — roughly 15 — because a child's proportions make retargeted adult motion read as uncanny, and the prologue is the player's first impression of the entire game.

---

## 4. Locomotion

**Motion matching**, with a curated database rather than a giant capture dump.

- Requirements: responsive starts and stops, proper foot planting, turn-in-place, weight-accurate direction changes, and — critically — **stance-specific locomotion**, because how a fighter moves in Standing Water is not how they move in Split Reed.
- **Fighting-stance locomotion is separate from travel locomotion.** Four styles × (advance, retreat, lateral, pivot, settle) — the footwork vocabulary is the single most-seen animation in the game and it must be the best work in the project.
- Foot IK on all surfaces; slope and stair adaptation; **footing-state variation** for mud, wet plank, gravel ballast, a moving deck, and ice.

## 5. Additive layers — how the body becomes the HUD

The combat system removes the HUD (`COMBAT_SYSTEM.md` §14), which means **these layers are load-bearing gameplay systems, not polish.**

| Layer | Driven by | Reads as |
| --- | --- | --- |
| **Breathing** | Breath resource | Shoulder rise, chest expansion, mouth open, pace between actions |
| **Fatigue** | Breath + fight duration | Guard drifts down, feet get heavy, recovery steps get sloppy |
| **Injury** | Per-region Vitality | Favouring a side, limping, asymmetric guard, protecting a limb |
| **Structure** | Quadrant integrity | Weight settles into the surviving quadrants; posture leans |
| **Will** | Hidden Will value | Distance-keeping, glances away, hesitation before committing |

All five are **additive layers over every other animation in the game.** They compose. A tired, hurt, frightened fighter with a broken rear quadrant moves in a way nobody had to author specifically, and the player can read all four states at a glance.

**This is the single highest-value animation system in the project** and it must be built early, in the combat prototype, not deferred to polish.

## 6. Stance transitions

Authored per **style pair**, both directions.

- V1: 4 styles + the Quiet = **20 ordered pairs**, plus entries from neutral/travel = **~28 transitions**.
- Each is 0.4–0.7s and must read as a *decision* — a settling, a change of weight, a different set of intentions. Never a snap or a blend.
- **Transitions have defensive character.** Low River → Standing Water is a short, safe settle. Split Reed → Standing Water is a long, exposed collapse of distance. The animation and the frame data agree.
- **Flow variants** at high mastery: shortened transitions that can play *inside* a technique's recovery, so the style change is hidden inside an action. ~12 additional clips. This is where high-level play starts to look like something.

## 7. Reactions — the system that makes Structure visible

**Reactions are selected, not played.** A hit reaction is chosen by:

```
reaction = f(incoming vector, victim's base quadrant state, victim's current structure, victim's fatigue/injury layers)
```

The same punch produces a materially different reaction depending on which way the victim's weight was going and which quadrant is already compromised. **This is what makes the quadrant system legible** — without it, Structure is an invisible number and the whole defensive design collapses.

**Budget:** 8 directions × 3 severities × 3 base states = **72 base reactions**, plus additive layering. This is large and it is not negotiable; it is the readability of the entire game.

- **Directional knockdowns**: 8, plus 3 rises each (quick, technical, stay down).
- **Physics blending on knockdown only.** Powered ragdoll for the fall, authored animation for the rise. No full physics on standing reactions — it looks weightless and it is unreadable.

## 8. Custody — two-character animation

**The largest single animation risk in the project** (`RISK_REGISTER.md` R-02).

**Mitigation, and it is the reason the system is designed the way it is:** Custody is a **finite grip graph**, not a continuous physical simulation (`COMBAT_SYSTEM.md` §8).

- **7 grip nodes** (collar tie, underhook, over-under, wrist control, head-and-arm, back control, sprawl) + **3 ground nodes**.
- **~22 authored transitions** between nodes, each a synchronised two-character clip.
- **~14 conversions** out (throws, sweeps, chokes, breaks, releases).
- Idle/struggle loops per node: **10**.
- **Total: ~46 two-character clips**, which is achievable. A continuous system would be 400+ and would not ship.

**Hard rules:**
- Both characters are driven from one authored clip with a **shared root**, snapped at entry. No procedural two-body IK solving in V1.
- Entry snapping must be within a tight distance/angle tolerance or the Seize fails cleanly rather than teleporting anyone.
- Height/build differences handled by **IK adjustment on contact points only**, within a limited range. Extreme mismatches (the child, Oro Bet) use dedicated clip variants or are excluded from those nodes entirely.

## 9. Contextual finishers — the Final Inch

Every terminal (`COMBAT_SYSTEM.md` §10) needs authored animation, and this is where the game's best animation work must go, because it is the moment the entire design is about.

**Budget:** 7 terminal types × 4 approach contexts (standing / Custody / grounded / against architecture) ≈ **24 finisher sets**, of which roughly 10 are two-character.

**The Stop** is the most important animation in the game and gets the most work: the technique fires, the body arrives, and the motion **arrests** — with the weight still moving, the breath still going, and the other person's face right there. It must be visibly *harder* than throwing the strike, and it must look like a decision made by a body rather than a menu.

## 10. Style-specific animation identity

Each style must be identifiable from **silhouette and locomotion alone**, with no technique thrown:

| Style | Identity |
| --- | --- |
| **Low River** | Square, low, flat driving steps that never cross. Elbows in. Unglamorous. Looks like lifting something heavy. |
| **Split Reed** | Bladed, light lead leg, constant small lateral motion, hands lazy. Looks like waiting for a train. |
| **Standing Water** | Low and wide, hands open and forward, level changes. Looks like reaching for something. |
| **Glass Hour** | Upright, still, quiet feet, one hand forward. Does not look like a fighting stance at all. |
| **The Quiet** | No stance. Hands down, weight even. **Identical to Ruhn's idle from hour one of the game.** |

## 11. Facial animation

- **Full facial performance for the seven principal characters only** (Vahn ×2 presentations, Ruhn, Yeo Ansa, Kem, Ise Vauran, Nas Il-ke).
- Everyone else: a reduced rig with strong pose work. This is a game where people are usually looking at each other's hands.
- **Combat facial animation is not expressive — it is physical.** Effort, breath, impact, and pain. Nobody grimaces theatrically.
- **The Inch camera shows both faces**, which means facial work must hold up in the most important close-up in the game.

## 12. Total V1 animation budget

| Category | Clips |
| --- | --- |
| Technique clips (tiered + secondary, after reuse) | ~130 |
| Stance transitions + flow variants | ~40 |
| Reactions, knockdowns, rises | ~95 |
| Custody (two-character) | ~46 |
| Finishers (Final Inch) | ~24 |
| Locomotion (motion-matching DB, travel + 4 fighting stances + footing variants) | ~200 |
| Child bespoke set | ~15 |
| Drills and training | ~30 |
| Cinematic / narrative | ~180 |
| NPC / ambient / world | ~120 |
| **Total** | **≈ 880 clips** |

**This is a large but survivable number for a small team over the production window**, and it is only survivable because of the single-skeleton retarget pipeline, the reuse rule, the finite Custody graph, and the additive-layer system that generates state variation without authoring it.

**If this number grows by 50%, the project fails.** It is the primary scope-control metric in `PRODUCTION_ROADMAP.md` and the first thing reviewed at every milestone.

## 13. What we are explicitly not building

- **No procedural/physics-driven strike generation.** It never looks like someone who trained.
- **No continuous two-body grappling simulation.**
- **No full-body physics on standing reactions.**
- **No cloth simulation on primary characters** — authored secondary motion and a cheap solver on coat hems only.
- **No hair simulation.** Period-appropriate bound hair, authored.
- **No facial animation on crowd characters.**
- **No unique animation sets per named NPC.** They share the archetype pool and are differentiated by *habit* — one authored idiosyncratic clip each, which is enough (`CORE_PILLARS.md`, Pillar 3).
