# PRODUCTION_ROADMAP.md
## Milestones to the production decision, and the AI-assisted workflow

**Assumed team:** 4–6 people (1 combat/systems engineer, 1 generalist engineer, 1–2 animators, 1 environment/character artist, 1 designer-writer), with heavy AI assistance in the categories defined in §3.

**Target:** vertical slice complete and externally playtested in **~9 months** from combat-prototype start, leading to a go/no-go production decision.

---

## 1. Milestones

### M0 — Design Lock *(complete on delivery of this package)*
**Deliverables:** this document set; `OPEN_DECISIONS.md` populated.
**Exit criteria:** Blake signs off on the combat thesis, the Final Inch, the style roster, the world, and the V1 scope. Open decisions are *recorded* rather than resolved — they are allowed to remain open, but not to remain unnoticed.
**Risks:** design-by-committee reopening settled questions. *Mitigation: changes after lock require a written justification against a pillar.*

---

### M1 — Combat Prototype *(6 weeks)*
The single most important milestone in the project. **Placeholder art throughout.**

**Deliverables**
- `FormMachine` + `TechniqueDB` running deterministically at 60Hz
- `StructureModel` with four quadrants, break detection, footwork recovery
- Breath and Vitality
- 12 techniques in one style, Sound tier only
- One opponent with hand-authored behaviour (no adaptation yet)
- Debug HUD exposing every value
- Deterministic replay + regression test harness

**Exit criteria**
1. Two competent players can fight each other and the better player wins reliably.
2. A designer can change a technique's feel by editing a text file and hot-reloading, with no engineer involvement.
3. A recorded fight replays identically, frame for frame.
4. **The "is this fun?" test:** an outside player fights the same opponent ten times and improves measurably without being taught anything.

**Risks:** the combat does not feel good and no amount of animation will save it. *Mitigation: this milestone is deliberately first and deliberately art-free, so a failure here costs six weeks rather than two years.* If M1 fails its fourth exit criterion twice, the project stops.

---

### M2 — Animation Pipeline Prototype *(4 weeks, overlaps M1 from week 3)*
**Deliverables**
- Single skeleton with four proportion states (9/15/19/26) and full retarget
- Build morph driven by `BodyModel`
- Motion-matched locomotion: travel + one fighting stance
- Foot IK across three footing types
- **Three techniques authored at all three fidelity tiers**
- Additive layers: breathing and fatigue

**Exit criteria**
1. One animation set retargets cleanly across all four ages with no hand-fixing.
2. **The tier test:** five people outside the team watch two unlabelled ten-second clips of the same technique and correctly identify which is later in the game, **without being told what to look for.** ≥4/5 required.
3. Breathing reads clearly enough that a viewer can tell an exhausted fighter from a fresh one with the sound off.

**Risks:** the retarget pipeline requires per-age hand-fixing, multiplying the animation budget by four. *Mitigation: this is tested in week 4 of the project, not month ten. If it fails, the age range narrows before anything is authored.*

---

### M3 — Enemy Prototype *(4 weeks)*
**Deliverables**
- `Perception` with enforced latency and no input access
- `ReadMemory`, tendency detection, counter purchase, decay
- `TellScheduler` with the tell-before-counter guarantee
- AI read debugger tool
- Three opponent archetypes with distinct posture/tempo/band/habit/hole

**Exit criteria**
1. A player who repeats one opening is reliably shut down within 60 seconds.
2. A player who varies is not.
3. **The fairness test:** playtesters describe the AI as "reading me," never as "cheating." Any tester who says "it reads inputs" is a failure to investigate.
4. The tell is visible to a tester who was not told a tell exists.
5. Automated tests prove no stat modification and no input access.

**Risks:** adaptive AI reads as unfair or as noise. *Mitigation: tells are the entire mitigation, and criterion 4 is the gate.*

---

### M4 — Master Training Prototype *(3 weeks)*
**Deliverables**
- Three drills (Falling, the Base, the Count), fully playable
- Restriction-based sparring
- Tier promotion visible in-session
- Meditation replay with annotation overlay
- Ruhn in placeholder form with temp VO

**Exit criteria**
1. A tester who plays the drills performs measurably better in a subsequent fight than one who skipped them — **measured in telemetry**, not opinion.
2. Testers describe the drills as interesting rather than as a chore.
3. The Meditation screen teaches a tester something about their own play that they did not know.

**Risks:** training reads as filler. *Mitigation: criterion 2 is a hard gate; a failed drill is cut, not polished.*

---

### M5 — Vertical Slice Greybox *(4 weeks)*
**Deliverables:** all eleven slice beats playable end to end, greybox environments, placeholder audio, temp VO, both Beat 3 branches implemented.

**Exit criteria**
1. Playable start to finish without an engineer present.
2. Length is 45–60 minutes for a first-time player.
3. The pacing works: no beat drags, no beat is confusing.
4. **The consequence lands:** testers who took the shot in Beat 3 notice the limp in Beat 6 without prompting.

**Risks:** the slice is too long. *Mitigation: cut beats rather than compress them.*

---

### M6 — Vertical Slice Alpha *(6 weeks)*
**Deliverables:** final-quality Mudgate and the yard (three seasons); final character models for Vahn (both ages), Ruhn, Kem; ~190 animation clips at final quality; real audio including the breath system; the Ledger UI; 140 VO lines with cast performers; music cues.

**Exit criteria**
1. **Playable with the HUD off**, by a stranger, successfully.
2. 60fps locked on reference hardware.
3. No placeholder assets in the player's path.
4. The art direction test: a still frame is identifiable as this game (`ART_DIRECTION.md` §13).

**Risks:** animation volume overruns. *Mitigation: the CI animation-budget report runs from M5 onward and a 15% overrun triggers a scope conversation immediately, not at the end.*

---

### M7 — Vertical Slice Polish *(4 weeks)*
**Deliverables:** combat feel pass (frame-holds, micro-shake, hit stop); audio mix to the priority order in `AUDIO_DIRECTION.md` §9; camera polish against the five hard rules; accessibility layer implemented and tested; the first eight minutes given disproportionate attention.

**Exit criteria**
1. Combat feel is rated "excellent" by testers with fighting-game or action-game experience.
2. The accessibility layer is validated with players who need it — not simulated.
3. Zero camera occlusion failures in a recorded hour of play.

---

### M8 — External Playtest *(2 weeks)*
**Deliverables:** 20+ external testers, none of whom have seen the project; recorded sessions; structured post-play interviews; full telemetry.

**Exit criteria — the two questions that decide the project**
1. **Does the player immediately ask what happens next at Beat 11?** Target: ≥70%.
2. **Can a tester identify the later of two technique clips from Beat 5, unprompted?** Target: ≥80%.

Supporting measures: completion rate ≥85%; median session enjoyment; whether testers can articulate *why* they lost; whether anyone calls the AI unfair; whether the Beat 3 branch is noticed.

---

### M9 — Production Decision
**Deliverables:** a full-production plan with a costed budget, schedule, and team; a revised risk register; a publisher/funding package if external money is required.

**The decision is binary and honest.** If M8's two headline questions miss their targets, the correct outcome is to fix the slice and re-test, or to stop — not to proceed and hope that content volume will solve a feel problem. **It will not.**

---

## 2. Schedule summary

| Milestone | Weeks | Cumulative |
| --- | --- | --- |
| M0 Design lock | — | 0 |
| M1 Combat prototype | 6 | 6 |
| M2 Animation pipeline *(overlaps)* | 4 | 8 |
| M3 Enemy prototype | 4 | 12 |
| M4 Master training | 3 | 15 |
| M5 Slice greybox | 4 | 19 |
| M6 Slice alpha | 6 | 25 |
| M7 Slice polish | 4 | 29 |
| M8 External playtest | 2 | 31 |
| M9 Production decision | 2 | 33 |

**≈ 33 weeks (~8 months)** with a small, focused team. Add 25% contingency for a realistic **~10 months**.

---

## 3. AI-assisted production

The goal is acceleration **without consistency collapse**. The governing rule:

> **An AI-generated asset may never enter the vertical slice as final.**

### The traffic-light model

#### 🟢 Green — AI may produce ship-quality output, with human review
| Task | Tool |
| --- | --- |
| Systems code, tools, editor utilities, build scripts | Claude, Codex |
| Test generation, replay regression harnesses, fuzzing inputs | Claude |
| Data schema design and technique data authoring | Claude |
| Technical documentation, design doc maintenance | Claude |
| Localisation first drafts | LLM + human linguist review |
| Procedural set dressing and world-population variation | Procedural tools + Houdini |
| QA: automated playthroughs, crash reproduction, telemetry analysis | Claude + custom tooling |
| Placeholder audio and temp VO | Generated, clearly tagged |

#### 🟡 Amber — AI assists, a human finishes and owns the result
| Task | Workflow |
| --- | --- |
| Environment concepting | Image generation for exploration → **human modelling and texturing** |
| Texture base layers | Generated bases → human authoring in Substance |
| Cinematic blocking and previz | **Higgsfield** for animatics and shot exploration → human scene assembly in-engine |
| Music sketches | Generated exploration → human composition and performance |
| Dialogue | AI drafts for volume and coverage → **human rewrite of every line that ships** |
| Marketing and capture | AI-assisted, human-approved |

#### 🔴 Red — never AI-final, under any schedule pressure
- **All combat animation.** This is the product.
- **Character models for the seven principals.**
- **Final VO for Ruhn and the three rivals.**
- **The Ledger's handwritten typography** (it is the game's signature).
- **Boss fight design.**
- **Final music for the thematic architecture** (`AUDIO_DIRECTION.md` §5) — the parent/child instrument idea cannot be generated.
- **The Final Inch animations**, particularly the Stop.
- Anything that defines the game's silhouette.

### Enforcement — the provenance manifest
Every asset in the repository carries a provenance record:

```json
{ "asset": "chars/ruhn/ruhn_coat_d.png",
  "provenance": "human-authored",
  "aiAssisted": ["texture base layer"],
  "reviewedBy": "…", "date": "…" }
```

**A CI check asserts that no asset on the vertical-slice ship list has `provenance: "ai-final"`.** This converts "don't ship generated garbage" from an intention into a build failure, which is the only form of discipline that survives a deadline.

### Where AI genuinely accelerates this project most
1. **The data-driven architecture is an AI multiplier.** Because techniques, frame windows, read tables, and style grammars are plain text (`TECHNICAL_ARCHITECTURE.md` §1), an AI agent can author, validate, and balance them at a speed no human matches — and every change is diffable and covered by the deterministic replay tests.
2. **Tools.** Every tool in `TECHNICAL_ARCHITECTURE.md` §10 is a strong AI-build candidate. Tools are the production capacity of a small team, and they are usually the first thing cut; here they are cheap.
3. **Test coverage.** The deterministic combat core is unusually amenable to AI-generated regression suites.
4. **Previz.** Higgsfield animatics let a 5-person team block cinematics at a scale normally requiring a cinematics department, *provided* nothing generated reaches the final frame.

### Where AI must be kept out, and why
**Consistency is the whole game.** A martial-arts game's animation must come from one coherent understanding of how a body moves. A hundred individually-plausible generated clips will not compose into a fighter — they will compose into an uncanny approximation, and the player will feel it immediately without being able to name it. The same is true of Ruhn's face and Ruhn's voice.

**The rule of thumb:** AI is excellent at *volume and scaffolding*, and unreliable at *identity*. This game is mostly identity.
