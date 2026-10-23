# PRODUCTION_ENGINE_DECISION.md
## Choosing the shipping technology for an Apple App Store product

**Date:** 2026-09-14
**Decision:** **Native Apple — Swift + Metal**, with the combat simulation as a pure Swift package.
**Status:** decided, with a dated re-evaluation gate (§9) and the alternative preserved.
**Supersedes, for Apple:** `TECHNICAL_ARCHITECTURE.md` §1, which recommended Unreal Engine 5 for a **PC-lead, console-secondary** product. The product has changed platform; the recommendation is re-derived rather than inherited or discarded.

---

## 1. What changed, and why that reopens the question

`TECHNICAL_ARCHITECTURE.md` §1 chose Unreal for reasons that were correct **for the product as specified at the time**: PC lead, PS5/Xbox secondary, 60fps, ~880 animation clips, a single skeleton retargeted across four ages, and two-character grappling. Unreal's Motion Matching, IK Rig and IK Retargeter were the deciding factors, and the document said so explicitly: *"The animation stack is the product."*

The product is now **Apple App Store first** — iPhone primary, iPad where practical, TestFlight distribution, touch as the primary input. That is not a delivery detail. It changes:

- **Binary size** from irrelevant to commercially load-bearing.
- **Input** from gamepad/KBM to glass, which the design's intent grammar must be re-expressed for.
- **Thermals and sustained clocks** from a non-issue to the dominant performance constraint.
- **Review, privacy and entitlements** from absent to mandatory.
- **Content volume** — a 20–24 hour, 880-clip premium campaign is not a realistic first Apple product at any engine choice. That tension is real and is recorded in §10; it is not resolved here because resolving it is a product decision, not an engineering one.

**A standing constraint that survives all of this:** the design already mandates a *bespoke, deterministic, frame-authoritative combat core that deliberately refuses the engine's ability system* (`TECHNICAL_ARCHITECTURE.md` §1, "do not use GAS for combat"). Whatever engine is chosen therefore supplies **rendering, animation, audio, input and lifecycle only**. It does not supply the game. That materially lowers the value of a heavyweight engine and raises the value of a lean one.

## 2. Environment reality, stated plainly

This build environment is **Linux with no Apple toolchain**: no Xcode, no `swift`/`swiftc`, no iOS SDK, no simulator, no Instruments, and no Unity or Unreal installation. `swift.org` and GitHub release downloads are refused at the egress proxy by organisation policy (HTTP 403), which the proxy documentation classifies as non-retryable.

**Consequence: no candidate can be prototyped, compiled, or benchmarked here.** This decision is therefore made on product and platform merits and on published platform characteristics, not on measurements taken in this session. Every performance figure below is a design *target*, never an observation. Where the report says something is unverified, it is unverified.

This constraint is recorded because it is the single largest caveat on this document.

---

## 3. Candidate A — Unreal Engine 5

**How it would consume the existing simulation.** The `sim/` layer would be re-implemented in C++ as a plain module with no `UObject` dependency, ticked from a fixed-step accumulator, exactly as the port contract already describes. Technique JSON would ship as a data asset or raw JSON. Unreal would drive `AnimInstance` from simulation state.

| Dimension | Assessment |
| --- | --- |
| **Shipping** | Requires macOS + Xcode regardless, plus the Unreal toolchain. Longest build and iteration loop of the three. |
| **App Store** | Base IPA is the heaviest by a wide margin before a single asset is added. Download size materially depresses install conversion for a paid or premium title. |
| **Rendering** | Mobile renderer is a different, more constrained path than desktop; Nanite/Lumen are not viable targets on iPhone for this game. The design's look (matte, reduced, restrained post, **no particles on strikes**) is a look you achieve by *removing* Unreal's defaults — and `ART_DIRECTION.md` §11 already names "generic Unreal look" as an explicit risk to mitigate. |
| **Animation** | **Best in class, and the reason §1 chose it.** Control Rig, IK Rig, IK Retargeter, Motion Matching. This is Unreal's real advantage and it is a large one. |
| **Touch input** | Workable but not a strength; an additional layer over an engine designed for gamepad and mouse. |
| **Controller** | Good, via engine input. |
| **Audio** | MetaSounds is powerful; heavier than this game needs for breath, cloth and impact. |
| **Persistence** | `SaveGame` is serviceable; Apple-native stores need bridging. |
| **Performance** | Achievable with discipline, but the highest floor cost for startup time, memory and thermals on older iPhones. |
| **Build/release** | Most moving parts, most ways to break signing and archive validation. |
| **Migration cost** | High: C++ port plus engine integration plus mobile-specific rendering work. |

**Verdict:** the strongest answer to the *animation* problem and the weakest answer to the *Apple-first shipping* problem. Its decisive advantage is a cost we do not pay until the authored-animation milestone, which is well beyond Native M1.

## 4. Candidate B — Native Apple (Swift + Metal)

**How it would consume the existing simulation.** Direct, mechanical port to a pure Swift package: value types, integer frame counters, no framework dependency, no `Foundation` requirement in the hot path. It compiles and unit-tests on any Swift platform, including CI without a GPU.

| Dimension | Assessment |
| --- | --- |
| **Shipping** | Smallest possible footprint — no third-party runtime. Fastest launch, lowest memory floor. |
| **App Store** | Cleanest path. Privacy manifest, entitlements, age rating, controller declaration and archive validation are all first-party concerns with first-party answers. No third-party SDK to justify in a privacy disclosure. |
| **Rendering** | Full control of a deliberately *simple* look. The design wants matte surfacing, ramped shading, frame-holds, dust, and no strike particles. That is a modest custom Metal pipeline, not an engine-scale one — and it cannot accidentally look like a default engine. |
| **Animation** | **The real cost.** A skeletal animation system with blending, additive layers and IK must be built. Mitigations: Apple ships the USD/USDZ pipeline, ModelIO, and skinned-mesh support first-party; and Native M1 needs none of it, because M1's presentation is procedural posing that is already proven in the reference harness. |
| **Touch input** | **Best of the three.** Direct `UITouch` access, precise latency control, full authority over gesture arbitration against system edge gestures. For a game whose thesis is *"the inputs never change; the meaning of the inputs changes"*, owning the raw touch stream is a genuine advantage rather than a convenience. |
| **Controller** | First-party `GameController`, including controller-declaration metadata for the App Store. |
| **Audio** | `AVAudioEngine` is more than sufficient for breath, cloth, impact and room tone, with first-party interruption handling. |
| **Persistence** | Native. A small `Codable` store now, compatible with a larger Ledger later. |
| **Performance** | Highest ceiling and the most predictable frame pacing. `CADisplayLink` drives render; the simulation stays on its own fixed 60 Hz step, so ProMotion 120 Hz changes presentation only and never touches determinism. |
| **Build/release** | Simplest. One toolchain, one project, standard archive. |
| **Migration cost** | Moderate for the simulation (mechanical), higher for presentation over the full game's life. |

**Verdict:** best shipping characteristics, best Apple integration, best control, and the highest long-term animation cost.

## 5. Candidate C — Unity 6

The credible middle, and it deserves a fair hearing rather than a dismissal.

| Dimension | Assessment |
| --- | --- |
| **Shipping** | Mature, extremely well-trodden iOS pipeline; IL2CPP; binary between the other two. |
| **App Store** | Routine. Thousands of shipped titles. |
| **Rendering** | URP is a good fit for a stylized mobile look and is genuinely tunable. |
| **Animation** | Strong: Mecanim, Animation Rigging, Timeline. Covers the 880-clip requirement adequately, if not as well as Unreal. |
| **Touch / controller** | Good; an abstraction layer above the platform rather than the platform itself. |
| **Persistence / audio** | Adequate; Apple-specific behaviour needs plugins or bridging. |
| **Migration cost** | Low-moderate: a C# port of the simulation is as mechanical as the Swift one. |
| **Risks** | A third-party runtime in the privacy and review story; a licensing/governance history that, while reverted, is a real commercial risk to carry into a multi-year project; and less precise control of exactly the Apple lifecycle and touch behaviour this brief spends most of its words on. |

**Verdict:** the pragmatic industry default, and the correct destination if the animation system defeats the native approach. It is explicitly the documented fallback (§9), not a rejected option.

## 6. Rejected: reusing the JavaScript simulation directly

The brief prefers direct reuse where the runtime reasonably allows it. It is genuinely possible — `JavaScriptCore` is a first-party iOS framework and would give literal, guaranteed behavioural reuse of the validated code.

**Rejected, for four reasons:**

1. **Garbage collection versus frame pacing.** A combat loop whose entire value is timing cannot host a non-deterministic collector on the critical path.
2. **Determinism across runtime versions.** JSC's behaviour is tied to the OS version. A simulation whose contract is "identical inputs produce identical fights" cannot have its arithmetic supplied by a component that ships independently of the app.
3. **A bridge on the hot path.** Marshalling input in and state out sixty times a second, forever, for code we control anyway.
4. **It is the wrong artefact to ship.** The JS implementation's job is to be the *oracle*. Shipping it would collapse the reference and the product into one thing and destroy the ability to detect drift — which is the whole point of keeping it.

The brief's fallback is therefore taken: **port mechanically, keep the original as a regression oracle.**

---

## 7. Decision

**Native Apple — Swift + Metal.**

The reasoning in one paragraph: the engine is only being asked to supply rendering, animation, audio, input and lifecycle, because the design has already ruled out using its gameplay framework. Of those five, Apple-first shipping makes four of them *better* served natively, and the fifth — animation — is the one cost that Native M1 does not pay at all, because M1's presentation is procedural posing already validated in the reference harness. Choosing native buys the smallest binary, the best touch latency, the cleanest review and privacy story, and complete control of a look the design defines largely by what it removes. It defers one genuinely hard problem, and §9 makes that deferral explicit and dated rather than hopeful.

**What this does not claim.** It does not claim native is the right answer for the 880-clip version of this game. If that game is still the target when the animation milestone arrives, the honest answer may be Unity. The architecture is built so that answer stays cheap.

## 8. How the existing simulation is consumed

Unchanged from the port contract already in force (`IMPLEMENTATION_LEDGER.md`, ruling C-2):

- `MartialGodCore` is a **pure Swift package**: no UIKit, no Metal, no Foundation in the hot path, no DOM-equivalent, no timers, no I/O, no randomness. Enforced by test.
- Technique frame data stays **plain JSON**, shipped as a bundle resource and parsed once — the same file the reference uses, not a re-typing of it.
- The reference implementation remains the **specification oracle**. Golden traces generated from it are committed fixtures; the Swift test suite replays them and compares field by field within documented tolerances (`NATIVE_M1_REPORT.md` §5).
- Presentation consumes simulation state and **never** feeds back into it. No animation-completion callbacks, no render-state dependency.

## 9. The re-evaluation gate

Native Apple is chosen with a specific, falsifiable trigger rather than an open-ended hope.

**Gate:** at the Animation Prototype milestone (`PRODUCTION_ROADMAP.md` M2 equivalent), the native path must demonstrate, on device:

1. Skinned skeletal playback with blending between clips.
2. The five additive layers of `ANIMATION_REQUIREMENTS.md` §5 driven from resource values.
3. A working import path from a DCC tool through USD to the runtime.
4. Retargeting one clip set across at least two proportion states.

**If any of those four is not demonstrated by the end of that milestone, the presentation layer pivots to Unity** and the simulation package ports to C#. The cost of being wrong is bounded to `view`-equivalent code by the port contract, which is precisely the insurance that contract was bought for. This must be a real decision made against evidence, not a formality.

## 10. Risks and open matters

| # | Risk | Mitigation |
| --- | --- | --- |
| E-1 | **Animation system cost on native.** The dominant long-term risk. | §9 gate; M1 needs none of it; Apple's USD/ModelIO pipeline is first-party. |
| E-2 | **This decision was made without prototyping any candidate**, because the environment cannot build any of them. | Stated plainly; the gate at §9 is the correction mechanism; nothing here is presented as measured. |
| E-3 | **No designer-facing editor** on the native path. | Technique data is already text; tooling is a defined cost, and the reference harness already serves as a balance sandbox. |
| E-4 | **Cross-language float drift** between the JS oracle and Swift (libm differences, summation order, sort stability). | Trace comparison uses exact equality for discrete state and documented tolerances for continuous state; term summation order and a stable sort are specified in the port. |
| E-5 | **Scope tension: the canonical design targets a 20–24 h, 880-clip premium campaign; the product is now an Apple title.** Not an engineering question and not resolved here. | Recorded for `OPEN_DECISIONS.md`. It needs a product answer before content production begins, whatever the engine. |
| E-6 | Apple platform/API drift over a multi-year build. | Native minimises third-party exposure; deployment target reviewed each milestone. |

## 11. What was decided, in one line

**Ship native because the engine is only being asked for presentation, Apple-first makes native better at four of five presentation jobs, and the fifth is a bill that Native M1 does not pay — with a dated, falsifiable gate that pivots to Unity if that bill cannot be paid later.**
