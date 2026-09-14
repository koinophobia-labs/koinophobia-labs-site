# IMPLEMENTATION_LEDGER.md
## Milestone 1 — design requirement → system → code

**Scope:** `TECHNICAL_ARCHITECTURE.md` §11 steps 1–5. Exit: one unarmed fight, no HUD, readable by a stranger.
**Code root:** `games/path-of-the-martial-god/`

---

## Conflicts found in the canonical package, and the rulings

### C-1 — What Milestone 1 actually is
- `PRODUCTION_ROADMAP.md` M1: art-free, **"Debug HUD exposing every value"**, exit criteria are determinism / hot-reload / two-player / fun.
- `TECHNICAL_ARCHITECTURE.md` §11: *"Milestone 1 exit is step 5: an unarmed fight against one opponent, **no HUD**, that a stranger can read."* Steps 1–5 include the animation pipeline and additive layers.

**Ruling: §11 governs.** It is the explicit build-order contract, it is the stated objective for this work, and no-meter readability is the executive thesis's differentiator (`GAME_VISION.md` §10). The roadmap's deliverable list is treated as the *engineering subset* inside §11's readability gate. Consequence: the debug overlay exists but is **off by default and fully removable**, and the fight must be comprehensible with it off.

### C-2 — Engine
- `TECHNICAL_ARCHITECTURE.md` §1 recommends **Unreal Engine 5.x**.
- The repository contains **no engine project** (it is the Next.js studio site), and no Unreal project can be compiled, run, played, or verified in this environment. An Unreal M1 would fail the milestone's own final rule: *"complete only if there is a playable beginning-to-end unarmed fight."*

**Ruling: implement the M1 simulation engine-free, and keep it engine-free by construction.** This does not contradict §1 — §1 already mandates a *bespoke* combat core that deliberately refuses Unreal's ability framework, runs on a fixed 60 Hz tick, keeps all frame windows in plain-text data rather than animation notifies, and is replay-serialisable. That specification is portable by definition. The presentation layer is a thin, replaceable consumer.

**Port contract (binding on M2+):** `sim/` imports nothing from `view/`, touches no DOM, no timers, no I/O, and no floating-point non-determinism in the decision path. Technique data stays in JSON. Porting to UE means re-implementing `sim/` in C++ against the same JSON and the same frame integers, and replacing `view/`. Enforced by a test.

### C-3 — Animation pipeline (§11 step 3)
Step 3 is "single skeleton, four proportion states, retarget, motion-matched footwork" — not meaningful without an engine and an animator. **Its readability *function* is delivered instead by procedural placeholder posture** driven directly from resource values (`view/pose.js`), which is the same contract `ANIMATION_REQUIREMENTS.md` §5 gives the additive layers. Step 4 (three fidelity tiers) is **stubbed as a real parameter, not implemented** — the `tiers` map exists in the data and `sound` is the only populated tier, per `PRODUCTION_ROADMAP.md` M1.

---

## Requirement → system → file

| Design requirement | Source | System | File |
| --- | --- | --- | --- |
| Deterministic 60 Hz combat FSM | TECH §3.1 | `FormMachine` | `sim/formMachine.js` |
| Frame windows in data, never on notifies | TECH §3.2 | `TechniqueDB` | `sim/techniques.js`, `sim/data/low-river.json` |
| Technique data validated at build | TECH §3.2 | `validateTechniques()` | `sim/techniques.js` |
| Four-quadrant spatial structure | COMBAT §2 | `StructureModel` | `sim/structure.js` |
| Quadrant hit chosen by geometry, not by move | COMBAT §2 | `quadrantFromIncoming()` | `sim/structure.js` |
| Structure recovery by footwork; none while gassed | COMBAT §2 | `recoverStructure()` | `sim/structure.js` |
| Breath spent by inefficiency and panic | COMBAT §2 | `fighter.breath` | `sim/fighter.js`, `sim/resolve.js` |
| Vitality across six regions | TECH §3.1 | `RegionHP` | `sim/fighter.js` |
| Will (hidden) drives folding and the Inch | COMBAT §2 | `fighter.will` | `sim/fighter.js`, `sim/fight.js` |
| "Inputs never change; meaning changes" | COMBAT §4 | `StanceSystem` grammar table | `sim/grammar.js` |
| Four distance bands | COMBAT §4 | `bandFor()` | `sim/constants.js` |
| Guard / Deflect / Evade / Footwork, four costs | COMBAT §5 | `resolveHit()` | `sim/resolve.js` |
| Guard covers only the quadrant you face | COMBAT §5 | `resolveHit()` | `sim/resolve.js` |
| Evade i-frames conditional on direction | COMBAT §5 | `resolveHit()` | `sim/resolve.js` |
| Commitment; no animation-cancel soup | brief §3 | `commitAt`, cancel windows | `sim/formMachine.js` |
| The Lie (feint) — release before commitment | COMBAT §6.1 | feint branch | `sim/formMachine.js` |
| Opponent never sees the input buffer | COMBAT §11 | `Perception` (delayed, filtered) | `sim/ai/perception.js` |
| Small inspectable decision model | brief (AI) | `OpponentBrain`, scored options | `sim/ai/brain.js` |
| Read-model hook for false reads | brief §6 | `ReadMemory` tendencies | `sim/ai/brain.js` |
| Final Inch; terminal chosen, not automatic | COMBAT §10 | `FinalInch` | `sim/finalInch.js` |
| The Stop gated on competence (hook) | COMBAT §10 | `canStop(mastery, …)` | `sim/finalInch.js` |
| Deterministic replay / regression harness | TECH §3.1 | `Replay` | `sim/replay.js` |
| Body is the HUD — posture from resources | COMBAT §14, ANIM §5 | `poseFor()` additive layers | `view/pose.js` |
| Reaction chosen by vector × quadrant × structure | ANIM §7 | `reactionFor()` | `view/pose.js` |
| Duel camera respects the fighters' axis | ART §7 | `Camera` | `view/render.js` |
| Breathing is the interface | AUDIO §2, §9 | procedural WebAudio | `view/audio.js` |
| Impact is weight, not sparks | ART §8 | frame-holds, micro-shake | `view/render.js` |
| Debug UI permitted but removable | brief §5 | overlay, default **off** | `view/debug.js` |

## Explicitly NOT built (out of M1 scope)

Styles beyond Low River · stance switching · Custody/grappling · fidelity tiers · mastery ladder · the Ledger · Body/conditioning · RecordBus · RumourNetwork · Standing · dialogue · quests · save system · menus · progression · Ruhn's content · endings · adaptation/counter-purchase (tendency tracking only, as the hook).
