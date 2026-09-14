# NATIVE_M1_REPORT.md
## Native Apple M1 — build report and requirement map

**Date:** 2026-09-14
**Engine decision:** Native Apple — Swift + Metal ([`PRODUCTION_ENGINE_DECISION.md`](PRODUCTION_ENGINE_DECISION.md))

| | |
| --- | --- |
| **WEB M1** | **VALIDATED REFERENCE PROTOTYPE** — reclassified, preserved, not shipped |
| **NATIVE M1** | **IN PRODUCTION — simulation compiled, tested and at parity; the app around it is not yet built** |

---

## 1. Read this first

This environment is **Linux with no Apple toolchain**: no Xcode, no iOS SDK, no
simulator, no Instruments, no device.

An earlier version of this report said no Swift toolchain could be obtained either,
because `swift.org` and GitHub release downloads are both refused at the egress proxy.
**That was true of the routes I had tried and false as a conclusion.** Docker Hub
rate-limits anonymous pulls, but Google's mirror of the official images is reachable,
so there is a Swift 5.10 toolchain here after all.

That changes the character of this document. `MartialGodCore` is platform-free by
contract — `PortContractTests` enforces it — so the whole simulation, its unit suite
and **the parity gate** build and run on Linux. They have now done so.

What still cannot be done here is the presentation layer: 11 files of UIKit, Metal,
AVFoundation, CoreHaptics and GameController that need the iOS SDK to type-check and a
device to run. Those are the files that remain unproven, and `Renderer.swift` is the
riskiest of them.

Everything below is marked so you can tell, at a glance, which claims are verified and
which are merely written:

| Mark | Meaning |
| --- | --- |
| ✅ | Verified by something that actually ran |
| ✍️ | Written and reviewed, **never executed** |
| ⛔ | Cannot be done here at all |

I have not marked anything ✅ that I could not run.

**Status: the simulation is proven. The app around it is not.**

## 2. What was actually verified

Real checks, really executed:

| Check | Result |
| --- | --- |
| Reference oracle regression suite | ✅ **89/89 pass** — 19 simulation, 17 parity harness, 12 input buffer, 8 fairness, 8 playtest baseline, 6 cross-tree sync, 4 settings, 4 audio cues, 3 tuning constants, 3 terminal resolution, 3 first-run, 2 selectors |
| **Parity harness self-test** — corrupts a good trace every way a port defect would, including a wrong buffered verb | ✅ 17/17 pass |
| Golden traces generated from the oracle | ✅ 7 scenarios, 5,861 frames, 407 events (format v2, re-baselined after the buffer fix) |
| Oracle determinism (regenerating reproduces committed traces byte for byte) | ✅ pass |
| Technique JSON identical between reference and Apple target | ✅ pass |
| Parity fixtures identical between `reference/traces` and the Swift test bundle | ✅ pass |
| **27 tuning constants identical between the Swift port and the oracle** | ✅ pass |
| All 23 technique JSON keys represented in the Swift `Technique` type | ✅ pass |
| Swift structural preflight (30 files: brace balance, imports, `guard`/`else`, keyword members, build-definition paths) | ✅ no problems |
| Input buffer behaves, and the opponent still cannot use it | ✅ 12/12 pass; 9 of them fail against the pre-fix code |
| The buffer capture sits above the early returns in **both** trees | ✅ pass (positional check, runs without Xcode) |
| Site suites unaffected by the restructure | ✅ lint, typecheck, 193 tests pass |
| **Swift core compiles** | ✅ Swift 5.10, one error found and fixed |
| **Swift unit suite** | ✅ **43/43 pass** — 16 combat, 11 input buffer, 6 outcome subject, 5 port contract, 4 parity, 1 performance |
| **THE PARITY GATE, run for real** | ✅ all 7 scenarios, 5,861 frames, 407 events, 0 divergences |
| Worst continuous deviation across the whole set | ✅ 1.3e-15 against a 1e-4 tolerance (0.0% of budget) |
| Strict concurrency (`-strict-concurrency=complete`) | ✅ clean in MartialGodCore |
| Simulation frame cost | ✅ **7.4µs/tick**, 0.045% of a 60Hz frame (release, x86_64 Linux) |
| Presentation layer parses (`swiftc -parse`, 13 files) | ✅ syntax only |
| **Presentation layer TYPE-CHECKS against stub frameworks (ALL 13 files)** | ✅ `./typecheck.sh` — our own types, optionality, labels, conformances and **required-initializer obligations**, SwiftUI shell included. Not Apple's API shape |
| App icon meets App Store requirements | ✅ 1024×1024, opaque, no alpha |
| Presentation layer links, or type-checks against the REAL frameworks | ⛔ needs the iOS SDK |
| `#selector` target/action pairing | ⛔ no Objective-C runtime on Linux; rewritten away by the harness |
| Launches on simulator or device | ⛔ needs Xcode |
| Render / audio / haptics performance | ⛔ needs a device |

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
| Input buffer | `FormMachine.swift` — **fixed, see §6** | `sim/formMachine.js` |
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

## 3.9 The control card — how a stranger starts

The native build had **no onboarding of any kind**. It launched straight into a fight,
and its controls are gestures rather than labelled keys. A keyboard player can find `J`
by looking at the keyboard; nobody finds "hold, then pull back" by looking at a pane of
glass. A stranger opening the app saw two figures and had no way in — which fails the
milestone's exit condition before the fight even begins.

There is now a card on first launch, once, dismissed by touching anywhere. It lists ten
gestures and their verbs and says nothing else.

**Nothing else** is the important half. The web prototype showed eight control names
and no more, deliberately: every system named on the way in is one the fight no longer
has to communicate, and the readability measurement is spoiled the moment the game
starts describing itself. Naming the vocabulary is not explaining the game — the verbs
were always meant to be public; what they MEAN in a given moment is the thing the
player works out.

`first-run-reveals-nothing.test.js` holds that line, because it is the kind of line
that erodes one helpful sentence at a time. It fails if a verb goes missing from the
card, if the card starts mentioning quadrants, structure, frame windows, the Final
Inch, mastery, difficulty or advice, or if the card stops being gated on
`hasSeenControls` — a game that explains itself on every launch is conceding that it is
not legible.

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

## 6. A defect this port surfaced in the validated reference — and its fix

Porting `tickFighter` line by line exposed something the M1 work missed.

**The input buffer was unreachable dead code.** Its set-site tested `!isActionable`,
but every early return above it had already fired for `acting`, `staggered`, `down` and
`finished` — so control only reached that line when the state was `neutral` or `guard`,
both of which are actionable. The condition could never be true. Verified at the time:
**0 of 3,171 ticks** across three seeds ever populated the buffer.

That corrected a claim in `MILESTONE_1_REPORT.md`, which had listed the buffer among
the fixes and said it addressed the player being strictly disadvantaged against the
brain. It did not. When that milestone measured "no change" after adding it, that was
the evidence, and I misread it as being masked by another bug.

It was first **ported faithfully inert**, because the instruction for the port was to
preserve behaviour rather than improve it mid-flight. It has since been fixed as its
own change, with its own measurement, and the parity traces have been re-baselined.

### 6.1 The fix

The defect was **positional, not logical**. The capture read correctly; it simply sat
below the early returns. It now runs at the top of the tick, in both implementations:

```
tick(f, input, opp, emit):
    stateTicks++
    tickBuffer(f, input)        <- here, above everything that returns early
    ...face the opponent
    if staggered: ...return
    if down: ...return
    if finished: return
    if acting: ...return
    ...new action: honour the buffer, or the live press
```

`tickBuffer` captures a verb pressed while the body is busy, ages it one tick at a
time, and drops it once it is older than `INPUT_BUFFER_TICKS`. The consume site stayed
where it was, because the place control reaches when the body is free is exactly the
moment the buffer exists for.

Three properties keep it from becoming an action queue, all of them tested:

- **The verb only.** Movement and `held` are read from the hand as it is now, so a
  buffered press resolves through the grammar against the stick's current position —
  and a verb tapped during a recovery and released still produces a feint, exactly as
  tapping it in neutral does. That is not a special case; it is the Lie applying
  uniformly, and it means commitment is still expressed by holding.
- **A live press beats a remembered one.**
- **One press is one action.** A press made at the start of a knockdown is forgotten
  long before the fighter stands up.

**The opponent still cannot use it.** `Brain.decide` returns a nil verb whenever it is
not actionable, so it never captures anything. That asymmetry is the entire point: the
brain already acts on the exact frame it becomes free, and the buffer is what gives a
pair of hands the same privilege. A test asserts the opponent's buffer stays empty
across every scenario, because a buffer handed to both sides closes none of the gap.

### 6.2 What it actually changed

Measured before and after against the same scripted fights.

| | Before | After |
| --- | --- | --- |
| Presses thrown away because the body was busy | **474 of 1,747 (27.1%)** | 0 thrown away at the press; a captured press that outlives its window is then forgotten on purpose |
| Ticks on which the buffer held anything | **0** | 127 capture events across the seven scenarios |
| Idle gap after a press made 3 ticks early | 1.94 ticks | 1.44 ticks |
| Idle gap after a press made 6 ticks early | 3.87 ticks | 1.09 ticks |
| Idle gap after a press made 9 ticks early | **44.89 ticks** | **1.56 ticks** |

The last row is the mechanic. A player who pressed 150ms early used to have the press
thrown away and then stood there for three quarters of a second, because the only way
back was to notice they were free and press again. Now it comes out on the next tick.

Two results worth stating plainly, because neither is the flattering one:

**It does not rescue a player who is simply late.** Driving the player seat with the
opponent's own brain and adding motor lag, the win rate barely moves (at 4 ticks of
lag: 2/24 before, 3/24 after; at 6 ticks: 0/24 both). That is the correct result and it
is worth understanding — the buffer fixes *delivery*, not *decision staleness*. A
player acting on a world six ticks old will act wrongly whether or not the press lands.

**It makes a masher lose faster.** The scripted balance battery went from 19 losses and
5 stalemates to 23 losses and 1. Those fights are shorter because the player now
actually throws the commits it kept asking for, back to back, and a fighter who is
committed 100% of the time never recovers structure (recovery is 0 while acting) and
never breathes. That is the design working: the buffer honours the input, and the game
punishes the input. It is not a reason to withhold the fix, but it is a reason not to
read "the player got worse" as a regression.

### 6.3 What now guards it

| Guard | Runs here? |
| --- | --- |
| `reference/tests/input-buffer.test.js` — 12 tests, 9 of which fail against the pre-fix code | ✅ |
| `InputBufferTests.swift` — 11 of the same 12, in Swift | ⛔ needs Xcode |
| `production-sync.test.js` — asserts the call sits **above** the early returns in *both* files | ✅ |
| `parity-harness.test.js` — asserts the committed traces still exercise the buffer | ✅ |
| `bufferedVerb` in the parity trace (format v2) | ✅ produced / ⛔ compared against Swift |

The positional check is the important one. The defect was a line in the wrong place, in
a file that reads correctly either way, and nothing in this environment can compile
Swift — so a behaviour test on the Swift side cannot catch a regression here. A
position test can, in both languages, today.

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

The simulation is measured. The app around it is not.

| | |
| --- | --- |
| Simulation cost | **7.4µs per tick** (release build, x86_64 Linux) |
| 60Hz frame budget | 16,667µs |
| Share of budget spent simulating | **0.045%** |

Whole fights are timed, not quiet ticks, so that figure includes perception, the
brain's full scoring pass over 18 options, landing resolution and the Final Inch.
`TraceDump --bench` reproduces it; `PerformanceTests` guards it with a 1,000µs ceiling,
deliberately ~20× the debug-build cost. That ceiling is a tripwire for an accidental
O(n²) or a per-tick allocation storm, not a tuning target — a tight assertion would
fail on a busy CI runner and teach everyone to ignore it.

Read that number for what it is: **the simulation is not going to be the problem.**
Even at 10× the cost on a phone it is under half a percent of the budget. What remains
unmeasured is everything that actually touches hardware — the renderer, audio,
haptics, and thermals over a long session.

What is *designed* for, and what to measure first on a device:

- The simulation runs at a fixed 60 Hz regardless of display rate; `preferredFramesPerSecond`
  is 120 so ProMotion changes presentation only. Determinism is structurally
  independent of frame rate.
- The tick loop caps catch-up at 6 steps and clamps `dt` to 250 ms, so a stall cannot
  produce a burst of ticks the player never saw.
- Vertex buffers are triple-buffered behind a semaphore; the per-frame geometry
  scratch array is preallocated and reused, so the combat loop should not allocate.
- Draw is a single pass, one pipeline, one draw call, no post stack.

**Profile before believing any of that.** First measurements to take: frame pacing on
the oldest supported device, allocation count per frame, touch-to-photon latency, and
thermal behaviour over a ten-minute session. None of those are simulation questions,
which is rather the point of the table above.

### 8.9 Terminal resolution — the last image of the fight

`.finished` had no pose. It fell through to the default case, so at the moment the
fight ended the loser was drawn standing in a normal fighting guard, as though nothing
had happened. Fixing that exposed the larger problem underneath: **both terminals set
`.finished`, so a knockout and a Stop rendered identically.**

That is not polish. `COMBAT_SYSTEM.md` §10 calls the Stop "the hardest thing in the
game", and the thesis of the entire design is that mercy is gated behind competence —
*"restraint is not a moral choice available to the weak."* If the two outcomes look the
same, the game cannot state its own argument, and the single moment it exists to be
about becomes invisible.

| Terminal | What the body now says |
| --- | --- |
| `strike_through` | Down, flat, lower than a knockdown and not getting up. Chest and head are overwritten rather than offset, which removes the breathing motion entirely |
| `stop` | Still standing. Hands down, head down, weight off the front foot — beaten, conscious, and aware of what did not happen to them. **Breathing is deliberately preserved** |

The difference between the two images is, exactly, whether the body is still moving.
`terminal-resolution-reads.test.js` asserts the branch exists, that the Stop does not
put them on the floor, and that the renderer actually reads `fight.over?.terminal` —
because the pose can only tell them apart if something passes it the answer.

### 8.10 What the game says when it is over — and a bug inherited from the reference

The native build said **nothing**. The fight ended, the body fell or stood, and the
screen held that image with no text at all. The web prototype names the ending in one
sentence; the port had a restart gesture and no statement.

Building it surfaced a defect in the reference. `showOutcome` in
`reference/view/main.js` picks its subject once —

```js
const who = e.winnerId === 'player' ? 'You' : 'He';
```

— and then applies it to all four endings. Two of the four describe the winner
(`finished`, `stopped`); the other two describe the **loser** (`unconscious`,
`yielded`). So a fight you win by knockout reads:

> **You could not continue.**

It survived every playtest of M1 because it only misfires in half the endings and only
in one of the two voices, and because the sentence is grammatical — it is simply about
the wrong man.

The native build does not reproduce it, and the fix is structured so a third
implementation cannot either. **Who an ending is about is a fact about the ending, not
a choice of words**, so it lives in the simulation:

```swift
public extension Outcome {
    enum Subject: Sendable { case winner, loser }
    enum Reason: String, Sendable, CaseIterable {
        case finished, stopped, unconscious, yielded
        public var subject: Subject {
            switch self {
            case .finished, .stopped:    return .winner
            case .unconscious, .yielded: return .loser
            }
        }
    }
    var knownReason: Reason? { Reason(rawValue: reason) }
}
```

`OutcomeOverlay` supplies English for that subject and nothing more. `reason` stays a
`String` because the parity trace compares it as one and the oracle emits one; `Reason`
is the typed reading of it, and `knownReason` is deliberately **optional** — an ending
this build has no words for falls back to a bare "You won." rather than printing a
confident sentence about the wrong fighter.

`OutcomeSubjectTests` guards three things, each verified by mutation:

| Guard | Mutation it catches |
| --- | --- |
| The subject differs across the set | Making every ending `.winner` — i.e. retyping the reference's bug |
| Each ending maps to the right subject | Flipping either pair |
| Every `reason:` literal in `Fight.swift` parses as a `Reason` | Adding an ending to the simulation that nothing knows how to narrate. Read from source, because staging all four endings in a unit test would require conditions no unit test should have to arrange |

`CaseIterable` plus an exhaustive `switch` means a fifth ending cannot be added without
the compiler asking who it is about.

The overlay itself keeps the same restraint as the rest of the interface: one sentence,
no score, no rating, no breakdown of the exchange. It holds for 0.35s before fading in
over 0.5s — the last frame of a fight is the one the whole milestone is about, and text
that materialises instantly arrives before the player has finished looking. The fade is
driven from the render loop rather than `UIView.animate`, because the caller already
knows exactly how long the fight has been over and that clock survives a backgrounded
app where a detached animation would finish invisibly. The restart hint appears **only
once the tap is actually live**, so the game never invites a touch it is about to
ignore.

### 9.0 The Final Inch, built to its own spec

`COMBAT_SYSTEM.md` §10 specifies four things for the Inch. Three were present and one
was not, which only became visible on reading the spec line by line against the code:

| Spec | Status |
| --- | --- |
| Time dilates to ~35% for 0.9–1.4s, scaling with mastery | ✅ `InchRule.dilation`, window from `windowTicks(mastery)` |
| No prompt tells you the options or what they mean | ✅ nothing is drawn; the inputs you already know are the options |
| The camera cuts to the Inch framing, **both faces visible** | ✅ the look-at now rises to head height. Pulling in alone cropped two torsos — the decision is about a person, not a hitbox |
| **Audio drops to breath and room tone** | ✅ everything ducks to 16% except breath, over a room-tone bed |

The audio rule is not mood. The Inch is the one moment the game asks a question, and it
asks with no prompt and no menu, so the mix has to leave the two things that still mean
something: someone breathing, and the room they are standing in. Breath is deliberately
routed around the duck — it is what the duck exists to reveal, and a test asserts that,
because ducking everything uniformly would be the easy mistake and would silently undo
the whole effect.

### 9.1 The Metal path, read adversarially

`Renderer.swift` cannot be compiled here, so it was read instead — specifically for the
errors a compiler and a GPU catch and a reviewer normally does not. What was checked,
and what it found:

| Checked | Result |
| --- | --- |
| Shader source exists and is reachable | ✅ `Shaders.metal` is under the target's `sources` path, so Xcode compiles it into the default library |
| Function names match `makeFunction(name:)` | ✅ `combat_vertex`, `combat_fragment` |
| Vertex attribute indices match `[[attribute(n)]]` | ✅ 0/1/2 = position, normal, colour |
| Vertex buffer index matches `setVertexBuffer` | ✅ both 0, and no layout collides with it |
| Uniform buffer index matches `[[buffer(1)]]` | ✅ both 1 |
| **`Uniforms` memory layout across the Swift/Metal boundary** | ✅ offsets 0 / 64 / 80 and stride 96 on both sides — `SIMD3<Float>` pads to 16 bytes exactly as Metal's `float3` does |
| Semaphore balance on the early-return path | ✅ signalled; the abandoned command buffer is never committed, so its handler cannot double-signal |
| Camera reaches the renderer | ✅ `CombatCamera` is a struct and is copied from the session every frame before `draw` |
| Double camera update | ✅ not a bug — the frame-hold branch returns before the second call |
| Empty vertex buffer | ❌ **fixed** — `src.baseAddress!` force-unwraps nil for an empty array, and a zero-vertex draw is a Metal validation error. Both are now guarded |

The `Uniforms` row is the one worth dwelling on, because it is the classic way this
fails: a `float3` in a Metal struct occupies 16 bytes, not 12, and a Swift struct that
disagrees produces a renderer that draws with garbage transforms and no error message.
It happens to be right here.

**None of this is a substitute for compiling.** It rules out a specific list of failure
modes. Anything not on that list is still unknown, and `Renderer.swift` remains the
file to open first on the Mac.

### 9.2 Two things in the project spec that would have cost a Mac session

Found by reading `project.yml` against XcodeGen's actual schema rather than its
plausible one:

- **`info: path: .../Info.plist`** — XcodeGen's `info` key *generates* a plist at the
  path it is given. Pointing it at the hand-written Info.plist would have overwritten
  it with a minimal stub on the first `xcodegen generate`, silently, taking the
  orientation lock, the controller declarations and the export-compliance answer with
  it. Replaced with `INFOPLIST_FILE`.
- **`resources:`** — not a target-level key in XcodeGen at all. The files were already
  covered by the `sources` path, so listing them again bought nothing and risked
  duplicate build-phase entries.

Neither would have been visible until someone ran the generator.

### 9.3 A required initializer the stub harness was not asking for

Two shipping files would have failed the Mac build outright, and the type-check harness
was passing both:

```
error: 'required' initializer 'init(coder:)' must be provided by subclass of 'UIView'
```

`UIView` conforms to `NSCoding`, so `init?(coder:)` is a *required* initializer: any
subclass that declares a designated initializer of its own must supply it. Both
overlays do declare one — `ControlsOverlay(frame:onDismiss:)` and
`OutcomeOverlay(frame:outcome:)` — and neither had it. The stub `UIView` did not
declare the initializer at all, so the harness had nothing to enforce and reported a
clean pass on files Xcode rejects.

This is precisely the failure mode `tools/typecheck/README.md` warns about — a stub
that misremembers Apple's API produces a **false pass**, which is worse than no harness
— and it is the first instance of it found. Fixed on both sides:

- The stub `UIView`, `UIViewController` and `MTKView` now declare `required init?(coder:)`.
- Both overlays implement it, with a `fatalError` naming why it cannot be reached: these
  views are built in code with an outcome or a dismissal to run, and are never decoded
  from a nib.

Verified by mutation — removing the initializer from `OutcomeOverlay` reproduces the
Xcode error verbatim, at the right line, and restoring it goes green. The harness now
catches this class of defect for every view written from here on.

Nothing in the previous type-check passes was wrong about the code it examined; the
harness simply was not asking this question. Every other stub remains a stub, and a pass
still means *"no internal contradictions found"*, never *"this compiles."*

### 9.4 The other kind of harness failure: a confident false alarm

`preflight.mjs` reported `unbalanced braces: 23 { vs 24 }` on a file `swiftc` compiles
and runs. Its string-stripper did not know about Swift **raw strings**, so `#"reason: ""#`
read as two ordinary string literals — and the second one ran on, swallowing everything
up to the next quote anywhere in the file, an opening brace included.

A false pass is the worse failure, but a false alarm is not harmless: `PortContractTests`
already carries a note about this, written when the ban list fired on a doc comment
saying there was no randomness. *A gate that fires on correct code trains whoever sees
the red bar to read it as noise.* Both failures end the same way — the tool stops being
consulted.

Fixed by teaching the stripper the raw-string delimiter rule (`#`-run, quote, matching
`#`-run; no escapes inside), and verified both directions: preflight is clean on the
file that tripped it, and still reports the imbalance when a stray brace is added to
that same file.

### 9.5 Main-actor isolation: seven files that would not have compiled

The presentation layer contained **no `@MainActor` annotations at all**, and neither did
the stubs. UIKit is main-actor-isolated from `UIResponder` down; the app target builds
in Swift 5.9 mode, where calling main-actor state from a nonisolated synchronous context
is an **error**, not a warning. So the harness was silent about an entire category of
first-build failure.

Modelling it — `@MainActor` on `UIResponder`, `UIGestureRecognizer`, `UITouch`,
`UIEvent`, `UIAccessibility.isReduceMotionEnabled`, and on SwiftUI's `View`, `Scene`,
`App`, `ViewBuilder`, `SceneBuilder` and `UIViewControllerRepresentable`, which are
`@MainActor @preconcurrency` in the real SDK — produced errors in seven files:

| File | What it was doing |
| --- | --- |
| `Input/TouchGrammar.swift` | Nonisolated methods reading `UITouch.location(in:)`, `UITouch.timestamp` and `UIView.bounds` — the file every touch passes through |
| `Presentation/Renderer.swift` | Mutating `MTKView.device`, both pixel formats, `clearColor`, `sampleCount`; reading `currentDrawable` and `currentRenderPassDescriptor` |
| `Persistence/Settings.swift` | `UIAccessibility.isReduceMotionEnabled` from `init` and from a notification block |
| `Audio/CombatAudio.swift` | Reading `SettingsStore` on every cue |
| `App/GameSession.swift` | Driving audio, haptics and camera |
| `Presentation/CombatCamera.swift` | Reading Reduce Motion per frame |
| `Haptics/Haptics.swift` | **A real data race — see below** |

Six of those are annotations: the types were always main-thread in fact, and now say so
where the compiler can check it. The seventh was a bug.

**`CHHapticEngine.stoppedHandler` and `resetHandler` fire on an arbitrary queue** —
Apple documents the reset handler as called on a background queue. Both were wired
straight to `restart()`, which touches `engine`, main-actor state:

```swift
engine?.stoppedHandler = { [weak self] _ in self?.restart() }   // off-main → main state
```

It would never have reproduced on demand: it needs an audio-session interruption to land
in the same instant as a frame. The hop is explicit now, and the stub types both
handlers `@Sendable` so the harness asks the question the real SDK asks.

`MartialGodCore` is deliberately **not** isolated and stays that way. It has no platform
and no actor, which is exactly what lets the parity gate run it on Linux.

Verified by mutation in both directions: removing the isolation from `TouchGrammar`
reproduces nine errors, and restoring the direct call in the haptics handler reproduces
the cross-actor one.

### 9.6 The shader ABI, and the selector — both checkable without hardware

`Renderer.swift` and `Shaders.metal` are compiled by two different compilers that never
see each other. Everything they agree on is agreed **by hand**: function names, vertex
attribute indices and formats, buffer indices, and the field order of the uniform
struct. None of it fails the build. A mismatch produces garbled geometry, a black
screen, or a pipeline that silently fails to create — on a device, hours from the change
that caused it. This is N-2, the highest-risk file, and its static half needs no GPU.

`preflight.mjs` now cross-checks five things, each verified by mutation:

| Check | Mutation |
| --- | --- |
| Every `makeFunction(name:)` exists in the shader, and every shader entry point is looked up | Rename `combat_vertex` → both directions reported |
| Attribute index and format against the shader's declared type | Descriptor says `.float3` for a `float4` colour → named |
| Attributes' `bufferIndex` has a `layouts[n].stride` and a `setVertexBuffer(index: n)` | — |
| Every `[[buffer(n)]]` the shader reads is bound at `n` | Move uniforms to `buffer(2)` → "nothing is bound at index 2" |
| `Uniforms` field-by-field **in order**, by type *and by name* | Swap `lightDirection` and `ambient` → caught. This is the worst case in the set: both sides compile, the struct is the same size, and every matrix is silently wrong. The name check is what catches it |

The ABI turned out to be correct as written. It was correct by care, and nothing was
checking it.

**The `#selector` blind spot is now half closed.** The type-check harness rewrites
`#selector(x)` into `Selector("x")` because Linux Swift has no Objective-C runtime, so
the pairing goes unchecked there — and a selector naming a missing method passes every
gate and crashes when the gesture fires. Preflight now verifies that each `#selector`
names a method declared in the same file **and** that it is `@objc`; a correct name that
is not exposed to the runtime is the more likely of the two mistakes and the harder to
see. Both mutations are caught.

Also fixed while building this: the shared source stripper removes string contents,
which is right for counting braces and wrong for any check whose subject is a string
literal. Asking it for shader function names returned none and reported that as three
missing functions. A second, comment-only stripper now exists for those.

## 10. Known issues

| # | Issue | Severity |
| --- | --- | --- |
| N-1 | ~~Nothing has been compiled.~~ **The core is compiled and green** — 43 tests, parity gate, strict concurrency. **All 13 presentation files now type-check** against stub frameworks (`./typecheck.sh`), the SwiftUI shell included; real-SDK behaviour still needs a Mac. | Open, narrowed further |
| N-2 | `Renderer.swift` is still the highest-risk file. Narrowed twice: it **type-checks** against stub Metal, and the **shader ABI is now cross-checked statically** (§9.6) — function names, attribute indices and formats, buffer bindings, and the uniform struct field by field. What remains needs a GPU: whether the pipeline actually creates, and whether the geometry is right once it does. | High, narrowed |
| N-3 | The touch grammar is untested on glass. Tap-versus-flick disambiguation is the most likely tuning need. | High |
| N-4 | ~~The input buffer is inert in both implementations.~~ **Fixed**, and the Swift half is now proven by a parity gate that actually ran — `bufferedVerb` matches the oracle on every one of 5,861 frames. | Closed |
| N-5 | ~~`TechniqueDB` uses mutable static state.~~ **Fixed:** one immutable `Sendable` table in a `static let`. Verified clean under `-strict-concurrency=complete`, and CI fails on any new warning. | Closed |
| N-6 | ~~No app icon artwork.~~ **Generated** from the game's own stance (`tools/make-icon.py`), 1024×1024, opaque, and `ASSETCATALOG_COMPILER_APPICON_NAME` is now set — it was missing, which would have produced an iconless app at upload. | Closed |
| N-7 | Bundle identifier `com.koinophobialabs.martialgod` is a placeholder pending App Store Connect. | Blocks TestFlight |
| N-8 | Renderer is a scaffold. Skinned meshes, real silhouettes and authored animation are M2 and are the subject of the engine re-evaluation gate. | Expected |
| N-9 | ~~Parity tolerances have never been exercised against real Swift output.~~ **Measured:** worst deviation 1.3e-15 against 1e-4, eleven orders of magnitude of headroom. Left as declared, because that figure is x86_64 Linux and says nothing about arm64 and Apple's libm. | Closed on Linux, open on Apple |
| N-10 | ~~No restart affordance is wired to a gesture.~~ **Fixed:** three-finger tap any time, or a tap anywhere 1.6s after the fight ends. Three, not two — two thumbs on the glass *is* the playing position, so the originally-intended two-finger tap would have thrown away live fights. | Closed |
| N-11 | SwiftPM's generated `resource_bundle_accessor.swift` trips strict concurrency. Not our code; fixed in newer SwiftPM. Will need a toolchain bump before Swift 6. | Low |
| N-12 | **The browser reference narrates two of its four endings with the wrong subject** (§8.10) — a knockout win reads "You could not continue." The native build does not inherit it and `OutcomeSubjectTests` prevents a third implementation from doing so. Left unfixed in `reference/view/main.js` on purpose: the browser build is a frozen, parity-verified reference and this is presentation copy, not simulation. | Open in the reference, closed in the port |
| N-13 | ~~The native build said nothing when a fight ended.~~ **Fixed** — `OutcomeOverlay`, one sentence, timed to let the last image land first. | Closed |
| N-14 | ~~Two overlays were missing `required init?(coder:)` and the stub harness was not asking for it~~ (§9.3). **Fixed on both sides**, and the harness now catches it by mutation. A reminder that every other stub is still only a stub. | Closed |
| N-15 | ~~Nothing in the presentation layer declared main-actor isolation and the harness could not see it~~ (§9.5). **Fixed** — seven files, six annotations and one genuine off-main data race in the haptics engine handlers. | Closed |
| N-16 | ~~The shader ABI was agreed by hand and checked by nobody~~ (§9.6). **Fixed** — five static cross-checks, all mutation-verified. The ABI was correct as written; it is now correct *and* guarded. | Closed |
| N-17 | `#selector` target/action pairing. **Half closed** (§9.6): preflight verifies the method exists and is `@objc`. A selector naming a method on a *different* object is still invisible here. | Low, was a blind spot |

## 11. TestFlight readiness blockers

1. ~~Compile it.~~ The core compiles. **The app target still needs one `xcodegen &&
   xcodebuild` on a Mac** — all 13 presentation files type-check against stub
   frameworks, but never against the real SDK.
2. ~~Run `./parity.sh` and make it pass.~~ **Done, and it passes.** Re-run it on the
   Mac anyway: this result is x86_64 Linux, and arm64 with Apple's libm is a different
   floating-point environment.
3. ~~App icon artwork.~~ **Done** — generated, 1024×1024, opaque, wired into the
   catalog. Replace it with drawn artwork when there is any; `tools/make-icon.py`
   exists so it is reproducible rather than a mystery binary.
4. A real bundle identifier, App ID and provisioning profile. **Business decision —
   the one genuine blocker nobody but you can clear.**
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
| 1 | Launches as an Apple app | ⛔ app target unbuilt |
| 2 | One full unarmed fight via the production input scheme | ✍️ implemented, unrun on glass |
| 3 | Fight begins and ends normally | ✅ in the simulation — fights start, resolve and terminate in 43 tests and 7 traced scenarios; ✍️ on a screen |
| 4 | Passes parity/regression checks | ✅ **the gate ran and passed** — 5,861 frames, 407 events, 0 divergences |
| 5 | Both fighters visually readable | ✍️ pose ported; unrendered |
| 6 | Angling meaningfully visible | ✍️ camera sits off-axis for exactly this; unrendered |
| 7 | Commitment and recovery visible | ✍️ recovery is the loudest pose state; unrendered |
| 8 | Structure collapse visible | ✍️ strong per-quadrant posture gains; unrendered |
| 9 | Exhaustion perceptible | ✍️ breath drives pose and audio; unheard |
| 10 | Final Inch perceptible | ✍️ dilation, camera, haptic; unrun |
| 11 | No required gameplay meter | ✅ by construction — debug overlay defaults off and there is no HUD |
| 12 | Background/foreground correct | ✍️ implemented; the fight cannot tick while paused, and time is not accumulated |
| 13 | Runs cleanly on simulator and device | ⛔ |
| 14 | Suitable for TestFlight packaging | ⛔ see §11 — one business decision and one Mac |

**Native M1 is still NOT complete, but the shape of what is missing has changed.**

It is no longer "code-complete and unbuilt". The simulation — the part that carries
every rule this game is about, and the part a reviewer cannot check by reading — is
compiled, tested, measured, and proven identical to the validated oracle frame by
frame. That was the largest single risk in the milestone and it is retired.

What remains is the app around it: 13 files of UIKit and Metal that need the real iOS
SDK and a device to run, plus a bundle identifier only you can decide. The
honest summary is no longer "nothing has been compiled". It is:

> **The game's rules are proven. The window they are shown through is not.**

And the readability gate is unchanged and still not mine to call: a person has to play
it.

## 13. What was deliberately not built

World exploration, regions, campaign narrative, Ruhn's questline, other styles, the
Ledger, endings, economy, railway, final character art, cinematics, monetisation, Game
Center, multiplayer, cloud saves. The only forward-looking interfaces added are the
settings schema version and the `tiers` map on techniques, both of which exist to avoid
an architectural dead end rather than to start a feature.
