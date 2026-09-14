# NATIVE_M1_REPORT.md
## Native Apple M1 — build report and requirement map

**Date:** 2026-09-14
**Engine decision:** Native Apple — Swift + Metal ([`PRODUCTION_ENGINE_DECISION.md`](PRODUCTION_ENGINE_DECISION.md))

| | |
| --- | --- |
| **WEB M1** | **VALIDATED REFERENCE PROTOTYPE** — reclassified, preserved, not shipped |
| **NATIVE M1** | **IN PRODUCTION — code complete, NEVER COMPILED** |

---

## 1. Read this first

This environment is **Linux with no Apple toolchain**: no Xcode, no `swift`, no iOS
SDK, no simulator, no Instruments, no device. `swift.org` and GitHub release downloads
are refused at the egress proxy by organisation policy (HTTP 403), which the proxy
documentation classifies as non-retryable, so a Swift toolchain could not be obtained
either.

**Consequence: not one line of the Swift in this milestone has ever been compiled.**

That single fact governs the whole report. Everything below is written so you can tell,
at a glance, which claims are verified and which are merely written:

| Mark | Meaning |
| --- | --- |
| ✅ | Verified by something that actually ran in this session |
| ✍️ | Written and reviewed, **never executed** |
| ⛔ | Cannot be done here at all |

I have not marked anything ✅ that I could not run.

## 2. What was actually verified

Real checks, really executed:

| Check | Result |
| --- | --- |
| Reference oracle regression suite | ✅ 27/27 pass |
| **Parity harness self-test** — corrupts a good trace 11 ways, every one must be caught | ✅ 13/13 pass |
| Golden traces generated from the oracle | ✅ 7 scenarios, 6,484 frames, 417 events |
| Oracle determinism (regenerating reproduces committed traces byte for byte) | ✅ pass |
| Technique JSON identical between reference and Apple target | ✅ pass |
| Parity fixtures identical between `reference/traces` and the Swift test bundle | ✅ pass |
| **27 tuning constants identical between the Swift port and the oracle** | ✅ pass |
| All 23 technique JSON keys represented in the Swift `Technique` type | ✅ pass |
| Swift structural preflight (29 files: brace balance, imports, `guard`/`else`, keyword members, build-definition paths) | ✅ no problems |
| Site suites unaffected by the restructure | ✅ lint, typecheck, 193 tests pass |
| Swift compiles | ⛔ no toolchain |
| Swift unit tests / parity gate run | ⛔ no toolchain |
| Launches on simulator or device | ⛔ no toolchain |
| Performance measurements | ⛔ no device |

## 3. Requirement → code map

### Simulation (ported, not redesigned)

| Preserved behaviour | Swift | Oracle |
| --- | --- | --- |
| Fixed-timestep combat | `App/GameSession.swift`, `Constants.swift` | `sim/constants.js` |
| Four-quadrant structure | `Structure.swift` | `sim/structure.js` |
| Structure collapse latch | `Structure.swift` (`collapseTicks`) | `sim/structure.js` |
| Stagger / knockdown recovery | `FormMachine.swift` | `sim/formMachine.js` |
| Range grammar (bands) | `Constants.swift`, `Grammar.swift` | `sim/grammar.js` |
| Flanking / graduated facing rates | `FormMachine.swift` (`turnRate`) | `sim/formMachine.js` |
| Breath behaviour incl. Focus | `FormMachine.swift` (`breathe`) | `sim/formMachine.js` |
| Commitment and recovery windows | `Techniques.swift`, `FormMachine.swift` | `sim/techniques.js` |
| AI perception model (latency-gated, no input access) | `Perception.swift` | `sim/ai/perception.js` |
| Scored AI decision model | `Brain.swift` | `sim/ai/brain.js` |
| Final Inch + terminals + the Stop gate | `FinalInch.swift` | `sim/finalInch.js` |
| Update-order fairness (shared pre-tick refs, alternating resolution) | `Fight.swift` | `sim/fight.js` |
| Feint semantics | `FormMachine.swift` | `sim/formMachine.js` |
| Input buffer | `FormMachine.swift` — **ported inert, see §6** | `sim/formMachine.js` |
| Technique data | `Resources/low-river.json` (byte-identical) | `sim/data/low-river.json` |

### Production layers (new)

| Requirement | Where |
| --- | --- |
| Touch controls | `Input/TouchGrammar.swift` (§4) |
| Controller support | `Input/ControllerInput.swift` |
| Production camera | `Presentation/CombatCamera.swift` |
| Rendering | `Presentation/Renderer.swift`, `Shaders.metal` |
| Animation architecture | `Presentation/Pose.swift` — five additive layers |
| Audio framework | `Audio/CombatAudio.swift` |
| Haptics | `Haptics/Haptics.swift` |
| Lifecycle | `App/GameSession.swift`, `GameViewController.swift`, `MartialGodApp.swift` |
| Persistence + accessibility | `Persistence/Settings.swift` |
| Parity gate | `Tests/ParityTests.swift`, `Sources/TraceDump`, `parity.sh` |
| Port contract enforcement | `Tests/PortContractTests.swift` |
| Apple project | `project.yml`, `bootstrap.sh`, `Info.plist`, `PrivacyInfo.xcprivacy` |

## 4. The touch grammar

Not nine buttons on glass. Two thumbs, one idea each, and the design principle is
unchanged: **the inputs never change; the meaning of the inputs changes.**

**Left thumb — intent.** A free-placement pad that appears under the thumb. Toward him
is pressure, away is retreat, across is angle. Continuous and analogue, exactly like
the stick it replaces.

**Right thumb — the hands.** One zone, six meanings, separated by gesture:

| Gesture | Verb |
| --- | --- |
| tap | strike |
| hold | commit |
| hold, then pull back | **feint** |
| flick up (and hold) | guard |
| flick toward him | deflect |
| flick away or across | **slip, in the direction you flicked** |
| flick down | breathe |

Two of those are not arbitrary, and that is the whole point:

- **Feint** is release-before-commitment in the simulation, so "throw it and take it
  back" is the same act expressed as a gesture rather than named by a button.
- **Slip's i-frames are already conditional on direction**, so the flick direction
  feeding the slip direction means the gesture *carries* the mechanic.

Both zones are inset from the screen edges, and the view controller defers the system's
bottom edge gesture so a low thumb does not summon the home indicator mid-exchange.
Thresholds are tunable and wired to the accessibility sensitivity setting; the zones
mirror for left-handed play.

**Untested on glass.** ✍️ Reachability, accidental activation, gesture ambiguity
(tap versus short flick) and latency are exactly the things that cannot be judged
without a device. The tap/flick threshold is the most likely thing to need tuning.

## 5. Orientation

**Landscape, locked.** The duel camera frames a two-shot along a horizontal axis;
portrait would either crop the fighters or push them so far apart that distance stops
reading, and distance is the whole game. Declared in `Info.plist` for both idioms, with
`UIRequiresFullScreen`, safe-area-aware layout, and system edge gestures deferred.

## 6. A defect this port surfaced in the validated reference

Porting `tickFighter` line by line exposed something the M1 work missed.

**The input buffer is unreachable dead code.** Its set-site tests `!isActionable`, but
every early return above it has already fired for `acting`, `staggered`, `down` and
`finished` — so control only reaches that line when the state is `neutral` or `guard`,
both of which are actionable. The condition can never be true.

Verified: **0 of 3,171 ticks** across three seeds ever populated the buffer.

**This corrects a claim in `MILESTONE_1_REPORT.md`**, which listed the input buffer
among the fixes and said it addressed the player being strictly disadvantaged against
the brain. It does not. When I measured "no change" after adding it, that was the
evidence and I misread it as being masked by another bug.

**The underlying unfairness is real and still open:** the brain is consulted every tick
and acts the frame it becomes free, while a human pressing during recovery has the
press silently discarded.

It has been **ported faithfully, inert, with a comment saying so** — because the
instruction was to preserve behaviour, not to improve it mid-port. Fixing it is a
deliberate change to validated behaviour that must re-baseline the parity traces, and
it should be its own task with its own before/after measurement. It is listed in §10.

## 7. How the two implementations are kept honest

The port duplicates the numbers by definition, so drift is the default outcome unless
something fights it. Three mechanisms do, and all three run without Xcode:

1. **Golden traces.** Seven scenarios chosen to exercise every preserved mechanic —
   approach, static guard under pressure, the Line, angling, feint and slip, breath to
   empty, and a fight driven to a terminal. Each fixture carries the *exact per-tick
   inputs*, so the Swift side never reimplements a test script: it replays and emits.
2. **A language-neutral verifier.** `verify-trace.mjs` compares discrete fields exactly
   and continuous fields within declared tolerance, and reports the **first** discrete
   divergence, because everything after a branch split is noise.
3. **A self-tested gate.** `parity-harness.test.js` corrupts a known-good trace eleven
   ways — drift inside tolerance, drift beyond it, a changed state, a changed technique
   id, an off-by-one frame counter, a wrong collapse counter, a dropped event, reordered
   events, an early finish — and requires the verifier to catch every one. A gate that
   cannot fail is not a gate.

**Tolerances, and why they exist.** Exact bit equality across languages is not
achievable: JavaScript engines implement `Math.hypot`, `atan2`, `sin` and `cos` in
their own code and Swift calls the platform libm. They disagree in the last ulp.
Discrete state must match **exactly**; continuous state is allowed 1e-4 m on position,
1e-4 rad on facing, and 1e-3 on structure, breath, will and vitality — far tighter than
anything gameplay could perceive.

**Two parity hazards were handled explicitly** rather than discovered later:

- **Term summation order.** JavaScript sums `Object.values(terms)` in insertion order,
  and floating-point addition is not associative. `ScoreTerms.total` adds the ten terms
  in exactly that sequence.
- **Sort stability.** `Array.prototype.sort` is stable by specification; Swift's `sort`
  is not. Equal option scores keep their declaration order via an explicit index
  tiebreak rather than by trusting the sort.

## 8. Build instructions

```bash
cd games/path-of-the-martial-god/apple
./bootstrap.sh          # XcodeGen -> project, swift build, swift test, parity gate
open MartialGod.xcodeproj
```

```bash
./parity.sh             # the port gate alone
node preflight.mjs      # structural check, runs anywhere
cd ../reference && node --test tests/*.test.js   # the oracle's own suite
```

**Why `project.yml` and not a committed `.xcodeproj`.** A hand-written
`project.pbxproj` could not be opened, built or validated even once here. Four hundred
lines of unverifiable UUID bookkeeping that fails to open wastes more of your time than
a sixty-line declarative spec that XcodeGen turns into a guaranteed-valid project. Once
generated it can be committed and the spec retired, or kept as the source of truth.

## 9. Performance

⛔ **No measurements were taken. There is no device and no Instruments.** Anything
numeric here would be invented, so there are no numbers.

What is *designed* for, and what to measure first:

- The simulation runs at a fixed 60 Hz regardless of display rate; `preferredFramesPerSecond`
  is 120 so ProMotion changes presentation only. Determinism is structurally
  independent of frame rate.
- The tick loop caps catch-up at 6 steps and clamps `dt` to 250 ms, so a stall cannot
  produce a burst of ticks the player never saw.
- Vertex buffers are triple-buffered behind a semaphore; the per-frame geometry
  scratch array is preallocated and reused, so the combat loop should not allocate.
- Draw is a single pass, one pipeline, one draw call, no post stack.

**Profile before believing any of that.** First measurements to take: frame pacing on
the oldest supported device, allocation count per tick, touch-to-photon latency, and
thermal behaviour over a ten-minute session.

## 10. Known issues

| # | Issue | Severity |
| --- | --- | --- |
| N-1 | **Nothing has been compiled.** Expect ordinary first-build errors across 29 files. | Blocking |
| N-2 | `Renderer.swift` is the highest-risk file: pipeline state, vertex descriptor and shader ABI are exactly what a compiler and a GPU catch and a human reviewer does not. | High |
| N-3 | The touch grammar is untested on glass. Tap-versus-flick disambiguation is the most likely tuning need. | High |
| N-4 | The input buffer is inert in both implementations (§6). The fairness problem it was meant to solve is open. | Medium |
| N-5 | `TechniqueDB` uses mutable static state. Fine today; Swift 6 strict concurrency will require a `let`-loaded or actor-isolated form. | Medium |
| N-6 | No app icon artwork. The asset catalog has the slot and no image. | Blocks TestFlight |
| N-7 | Bundle identifier `com.koinophobialabs.martialgod` is a placeholder pending App Store Connect. | Blocks TestFlight |
| N-8 | Renderer is a scaffold. Skinned meshes, real silhouettes and authored animation are M2 and are the subject of the engine re-evaluation gate. | Expected |
| N-9 | Parity tolerances are declared but have never been exercised against real Swift output; the true cross-language deviation is unmeasured. | Medium |
| N-10 | No restart affordance is wired to a gesture in the shipped view (`handleRestart` exists, unbound). | Low |

## 11. TestFlight readiness blockers

1. **Compile it.** Everything else is downstream.
2. **Run `./parity.sh` and make it pass.** The port is not the game until it agrees
   with the oracle.
3. App icon artwork (1024 and the derived set).
4. A real bundle identifier, App ID and provisioning profile.
5. Signing identity and an App Store Connect record.
6. Launch screen verified on notch and Dynamic Island devices.
7. Age rating questionnaire — the game depicts non-gory unarmed violence.
8. Export compliance is already answered (`ITSAppUsesNonExemptEncryption = false`).
9. Privacy: nothing collected, nothing tracked, no third-party SDK, no required-reason
   APIs. The manifest is genuinely empty and should stay that way.
10. A crash reporting decision. Current recommendation: Apple's own organiser crash
    reports, and **no third-party SDK**, to keep the privacy disclosure empty.

## 12. Native M1 completion checklist

Assessed honestly against the fourteen stated criteria.

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Launches as an Apple app | ⛔ unbuilt |
| 2 | One full unarmed fight via the production input scheme | ✍️ implemented, unrun |
| 3 | Fight begins and ends normally | ✍️ implemented, unrun |
| 4 | Passes parity/regression checks | ✍️ gate built and self-tested; **never run against Swift** |
| 5 | Both fighters visually readable | ✍️ pose ported; unrendered |
| 6 | Angling meaningfully visible | ✍️ camera sits off-axis for exactly this; unrendered |
| 7 | Commitment and recovery visible | ✍️ recovery is the loudest pose state; unrendered |
| 8 | Structure collapse visible | ✍️ strong per-quadrant posture gains; unrendered |
| 9 | Exhaustion perceptible | ✍️ breath drives pose and audio; unheard |
| 10 | Final Inch perceptible | ✍️ dilation, camera, haptic; unrun |
| 11 | No required gameplay meter | ✅ by construction — debug overlay defaults off and there is no HUD |
| 12 | Background/foreground correct | ✍️ implemented; the fight cannot tick while paused, and time is not accumulated |
| 13 | Runs cleanly on simulator and device | ⛔ |
| 14 | Suitable for TestFlight packaging | ⛔ see §11 |

**Native M1 is NOT complete.** It is code-complete and unbuilt. The one thing standing
between this report and a genuine answer is a machine with Xcode on it.

## 13. What was deliberately not built

World exploration, regions, campaign narrative, Ruhn's questline, other styles, the
Ledger, endings, economy, railway, final character art, cinematics, monetisation, Game
Center, multiplayer, cloud saves. The only forward-looking interfaces added are the
settings schema version and the `tiers` map on techniques, both of which exist to avoid
an architectural dead end rather than to start a feature.
