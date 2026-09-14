# MILESTONE_1_REPORT.md
## Combat prototype — build report

**Milestone:** `TECHNICAL_ARCHITECTURE.md` §11 steps 1–5
**Exit condition:** one complete unarmed fight, no HUD required for comprehension, readable by someone unfamiliar with the design
**Status:** **IMPLEMENTED / AWAITING HUMAN PLAYTEST** — the automated criteria are met (§4, §5); the human-readability question is Blake's to answer, not mine (§11)
**Code:** `games/path-of-the-martial-god/`
**Date:** 2026-09-14

---

## 1. How to launch it

```bash
node games/path-of-the-martial-god/serve.mjs     # then open http://localhost:5173/
```

No build step, no bundler, no new dependencies. The browser loads the same ES modules Node runs.

```bash
node --test games/path-of-the-martial-god/tests/*.test.js   # 27 tests
node games/path-of-the-martial-god/verify.mjs               # playable browser pass (server must be running)
```

## 2. Controls

Controller-first by design; a gamepad is used when present (left stick = intent, X strike, Y commit, B slip, LB/LT guard, RB deflect, A breathe). Keyboard mirrors it:

| Input | Verb | Meaning |
| --- | --- | --- |
| **W / S** | Intent | Pressure · Retreat |
| **A / D** | Intent | Angle — leave the line |
| **J** | Strike | Light, fast, low commitment |
| **K** | Commit | Heavy. Lands hard, leaves you stuck |
| **Shift** (hold) | Guard | Covers the quadrant you **face**, and nothing else |
| **L** | Deflect | Timed. Free on success, expensive on failure |
| **Space** | Slip | Directional. The wrong direction just moves you |
| **F** | Breathe | Recover Breath, and be vulnerable doing it |
| **tap-release J/K** | Feint | Release before the commit frame and the strike is a lie |
| **`** | — | Debug overlay (off by default) |
| **M / R** | — | Sound · restart |

The same eight inputs produce different techniques by **intent**: `commit` + forward is Through-Palm, `commit` + back is Nail, `commit` + lateral is Come Down. The inputs never change; their meaning does.

## 3. What was implemented

**Simulation (`sim/`, engine-free, deterministic, 60 Hz fixed tick)**

| Module | What it is |
| --- | --- |
| `formMachine.js` | The combat FSM. Commitment, cancel windows, the Lie, locomotion, the Line, input buffer |
| `techniques.js` + `data/low-river.json` | TechniqueDB. 12 techniques, Sound tier, frame windows as data with build-time validation |
| `grammar.js` | StanceSystem — `resolve(style, verb, intent, band)`. The intent grammar |
| `structure.js` | Four-quadrant base, geometric quadrant selection, collapse latch, footwork recovery |
| `resolve.js` | Hit resolution: guard / deflect / slip / footwork, each with its own cost |
| `finalInch.js` | Terminal offer and execution. The Stop gated on competence |
| `fight.js` | Orchestrator, body separation, termination, the Inch |
| `ai/perception.js` | Latency-gated, filtered snapshots. No input access, structurally |
| `ai/brain.js` | Scored decision model, 18 options × 10 named terms |
| `replay.js` | Record / playback / digest |

**Presentation (`view/`, replaceable)** — `pose.js` (five additive layers), `render.js` (2.5D duel camera, frame-holds, dust), `audio.js` (procedural; breathing is the interface), `input.js`, `debug.js` (off by default).

## 4. Milestone 1 requirements

| Requirement | Status | Where |
| --- | --- | --- |
| Player movement, facing, distance management | ✅ | `formMachine.js` |
| Unarmed attacks | ✅ | 8 attacks across every verb × intent pair |
| Defensive responses | ✅ | Guard, Deflect, Slip, Footwork — four distinct costs |
| Four-quadrant structure interaction | ✅ | Geometry decides the quadrant; guard covers only `fore` |
| Hit / structure resolution | ✅ | `resolve.js` |
| Attack commitment and recovery | ✅ | Data-driven windows; feint before `commitAt` only |
| Opponent AI (range, quadrant, recent actions, commitment, risk, punish) | ✅ | All six terms present and inspectable |
| Readable telegraphing | ✅ | Per-technique tells; identifiable only after 4 ticks of startup |
| Fight termination | ✅ | Final Inch with three terminals, plus KO and yield |
| Restart / reset | ✅ | `R`, `reset()` |
| Debug instrumentation | ✅ | Overlay **off by default**, fully removable |
| No HUD dependency | ✅ | Ships HUD-off; see §7 for honest limits |
| The Stop architected as competence-dependent | ✅ | `attempt()` — mastery below threshold connects anyway |
| Feint / read-model hook preserved | ✅ | The Lie implemented; tendency tracking present, adaptation deferred to M3 |

**Roadmap M1 exit criteria:** deterministic 60 Hz ✅ · four quadrants with break and footwork recovery ✅ · Breath and Vitality ✅ · 12 techniques one style ✅ · hand-authored opponent ✅ · debug view ✅ · deterministic replay + regression harness ✅ · designer can change feel by editing text and reloading ✅ · **the better player wins** ✅ (§6).

## 5. Test results

```
games:  27/27 pass   (sim.test.js 19, fairness.test.js 8)
site:   193/193 pass (crm 84, products 40, concierge 30, migrations 23,
                      commercial 7, seo 4, ykb 3, legal 2)
lint:   clean in games/ (1 pre-existing warning in auth.ts, untouched)
typecheck: clean
browser:   fight runs start-to-finish, zero console errors
```

Notable tests: identical inputs produce identical fights; a recorded fight replays frame-for-frame; a guard pointed the wrong way is bypassed; slip i-frames are conditional on direction; the Stop fails for a novice and succeeds for a master; perception snapshots contain no verb, no input, no Will; `sim/` contains no DOM, no timers, no `Math.random`.

## 6. Six real defects this milestone surfaced

The point of building M1 first is to find these before any art exists. All six are fixed.

1. **`Breathe` was a no-op.** The `acting` branch zeroed Breath recovery for every technique, so Focus cost time and returned nothing. The opponent sat permanently below its breath threshold spamming it — 1,893 of 2,400 ticks.
2. **Structure could never break.** Canon wants a two-stage break (empty the quadrant, then drive through it), but recovery nudged the quadrant back above zero between blows so the second stage never fired. Fixed with a **collapse latch**: an emptied quadrant stops recovering and cannot bear weight until re-established — which is also what "you cannot bear weight in that direction" actually describes.
3. **A broken fighter could never recover.** `tickFighter` returned early on `staggered`/`down` without calling `recoverStructure`, so anyone knocked off their base came back with nothing under them and was broken again immediately. A spiral no skill could escape.
4. **Flanking was mechanically impossible.** The soft lock re-faced at 0.11 rad/tick against a circling speed of 0.0217 — **5.1× faster than anyone can circle**. The four-quadrant base collapsed into a front-facing bar. Fixed with graduated turn rates: committed fighters barely turn, guarding fighters turn slower than you can circle (so walking around a turtle is the answer to a turtle), free fighters re-face comfortably.
5. **The contact band was empty.** Pressing forward — correct Low River behaviour — pushed fighters to minimum separation, into a band where `commit + pressure` resolved to `null`. The player threw **literally nothing** for whole fights. Minimum separation now sits inside the mid band, where Low River wants to be and where M1's grammar can speak.
6. **The second mover had a permanent aiming advantage.** Ticking B against A's already-updated position gave B better facing every tick; with identical brains on both sides it produced **4–0 for whichever side ticked second**. Both fighters now read one pre-tick snapshot, and landing resolution alternates by tick parity.

**Fairness after the fixes** (identical brains both sides): 4–3. **Skill expression:** brain-in-player-seat wins 3–1 evenly matched, 4–1 against a weakened opponent, and **loses 1–3 when the player is the weaker fighter**. A masher loses every time.

## 7. Known problems

- **Readability is proven for the essential states, not the subtle ones.** Commitment, recovery, spacing, staggering, structural collapse, injury and blood all read in placeholder geometry. Breath reads mostly through **audio and motion** and is weak in a still frame. Will reads weakly. Both were always slated for the authored animation of M2 (ruling C-3).
- **The default opponent is probably too strong for a first-time player.** Scripted heuristics lose to it consistently at every difficulty setting. Whether a human can beat it is a playtest question this milestone cannot answer. Levers exist and are authored, not hidden: `makeFight({ aggression, patience, reaction })`.
- **The opponent's technique mix is legible but still somewhat repetitive.** A repetition penalty keeps it from becoming a one-move machine; genuine variety wants the M3 Read.
- **Blind-test questions not yet answered by a stranger.** "Who has initiative?", "why did that defence fail?" — I can answer them from the screen; no naive observer has been asked. That is the M8 test, and it needs a human.
- **The contact band is effectively unused in M1**, because there is no clinch. It returns with Standing Water.
- **No animation tiers.** `tiers` carries `sound` only, per the roadmap. The Rough/Silent progression is M2.

## 8. Design assumptions made

Recorded so they can be overruled rather than inherited silently.

1. **The collapse latch** (defect 2) is an addition to canon. Canon specifies the two-stage break but not what holds a quadrant at zero long enough for stage two to happen. 100 ticks (1.67 s).
2. **Minimum separation of 1.02 m** is a consequence of M1 having no clinch. When Custody arrives, this must drop and the contact grammar must fill in.
3. **An input buffer of 10 ticks.** Without it the player is strictly disadvantaged: the brain is consulted every tick and acts the instant it is free, while a human pressing during recovery has the press silently discarded.
4. **Guard absorbs 62% of structure force and 86% of vitality**, and covers `fore` only. Tuned so a static guard loses slowly, per "guarding does not save you; it postpones."
5. **Leg strikes attack the quadrant that leg carries**, wherever the attacker stands. This is the one place technique overrides pure geometry.
6. **Will is hidden from perception.** The opponent infers pressure from posture and breath, never from the number.

## 9. Architectural decisions that bind future milestones

- **The port contract.** `sim/` imports nothing from `view/`, touches no DOM, no timers, no I/O, and contains no randomness — enforced by a test that reads the source. Porting to Unreal means re-implementing `sim/` in C++ against the same JSON and the same frame integers and replacing `view/`. Every frame number transfers unchanged. (Ruling C-2 in `IMPLEMENTATION_LEDGER.md`: no engine project exists in this repository and none can be compiled, run or played here, so an Unreal M1 would fail the milestone's own final rule.)
- **Frame data lives in JSON**, never on animation notifies, and is validated at load. A technique whose windows are incoherent fails loudly.
- **The AI emits the player's `InputIntent` struct**, asserted by test. The opponent has no private vocabulary; anything it can do, you can do, with the same seven verbs.
- **Perception is a filtered snapshot type**, not a fighter reference. Input reading is prevented by the shape of the data, not by discipline.
- **`FinalInch.attempt()` is the single place a terminal is decided.** Adding Break, Choke, Dismantle and Submit is adding rows to `TERMINALS`; no caller changes.
- **The replay harness is the future Meditation feature.** Determinism is already load-bearing.
- **Nothing in the Next.js site was touched.** The prototype is a self-contained ESM package with its own `package.json` (`type: module`) outside `app/`.

## 10. Hosted playtest build

The repository implementation is canonical. `dist/` is a **distribution adapter** only,
produced by `build-artifact.mjs` and proved equivalent by `verify-parity.mjs`
(6 fights, tick-for-tick identical digests, identical technique data).

**Forced divergences — packaging only, no behaviour:**

1. **JSON module → JS module.** `sim/techniques.js` imports the technique data with an
   import attribute (`with { type: 'json' }`), which the hosted sandbox's CSP will not
   reliably serve. The identical object is emitted as `low-river.data.js` and the one
   import line is rewritten. The build asserts deep equality before writing.
2. **Page shape and import root.** The host supplies its own `<!doctype>/<head>/<body>`,
   so the page is emitted as content only and `../view/main.js` becomes `./view/main.js`
   because the page sits at the artifact root rather than in `web/`.

Nothing else differs. No timings, AI parameters, structure behaviour, movement speeds,
damage, Final Inch logic, input grammar or combat rules were touched.

**Playtest additions (view layer only, read-only with respect to the simulation):**

- `view/telemetry.js` — records duration, winner, terminal, techniques attempted and
  landed, attacks guarded, deflects, slips attempted/successful, structure breaks,
  Final Inch openings, guard bypasses (split into **by angle** and **by leg strike**,
  because only the first supports the design claim), breath-outs, actions taken on an
  empty tank, time staggered, and time in each distance band. Stored in `localStorage`;
  no network, no backend.
- `view/survey.js` — the post-fight questionnaire, with the strategy question first.
- Debug mode now surfaces the **complete event log** after a fight, scrollable and
  copyable. Still off by default; `` ` `` toggles.

**First-run presentation** now shows the eight control labels and nothing else. The
previous build explained the quadrant model and named the optimal strategy
("walk around him"); both are removed, along with the descriptive control text in
`input.js`. The feint is deliberately **not** listed — see §11.

## 11. The open question this build exists to answer

> Can a first-time player understand and participate in the fight without relying on meters?

**Not self-assessed.** Automated verification can show the simulation is symmetric and
that the better fighter wins; it cannot show that a person can read the fight. That
gate is Blake's, and M1 stays in `IMPLEMENTED / AWAITING HUMAN PLAYTEST` until he has
played it.

One observation worth recording before the test: **the feint is currently
undiscoverable.** It fires by releasing a strike or commit before its commitment
frame, and nothing in the first-run presentation hints that holding versus tapping
differs. A player who never holds a button long enough may also produce feints by
accident without understanding why the attack did not arrive. Left as-is deliberately
for this test — whether anyone finds it is itself a result.

## 12. Not built, deliberately

Styles beyond Low River · stance switching · Custody/grappling · animation tiers · mastery ladder · the Ledger · Body/conditioning · RecordBus · RumourNetwork · Standing · dialogue · quests · saves · menus · progression · Ruhn's content · endings · adaptive counter-purchase.
