# RELEASE_CHECKLIST.md
## Everything between here and TestFlight, in order

This exists because the work now splits cleanly in two, and the split is not where it
was. The simulation is compiled, tested, benchmarked and proven frame-identical to the
validated oracle. What is left needs a Mac, an Apple Developer account, or a human
thumb — three things a Linux container does not have.

Nothing below is padding. Each item is either a gate that can fail or a decision only a
person can make.

---

## A. Already done — do not redo, but do re-run

| | Item | Where |
| --- | --- | --- |
| ✅ | Swift core compiles | `apple/Packages/MartialGodCore` |
| ✅ | 37 Swift tests pass | `apple/test.sh` |
| ✅ | **Parity gate passes** — 5,861 frames, 407 events, 0 divergences | `apple/parity.sh` |
| ✅ | Strict concurrency clean (Swift 6 ready) | CI enforces it |
| ✅ | Simulation cost measured: 7.4µs/tick, 0.045% of a 60Hz frame | `TraceDump --bench` |
| ✅ | 70 reference tests pass; hosted build byte-identical to the reference | `reference/` |
| ✅ | App icon: 1024×1024, opaque, wired into the catalog | `apple/tools/make-icon.py` |
| ✅ | Privacy manifest: nothing collected, nothing tracked, no required-reason APIs | `PrivacyInfo.xcprivacy` |
| ✅ | Export compliance answered (`ITSAppUsesNonExemptEncryption = false`) | `Info.plist` |
| ✅ | CI runs all of the above on every change | `.github/workflows/martial-god.yml` |

**Re-run `./parity.sh` on the Mac anyway.** The passing result above is x86_64 Linux.
arm64 with Apple's libm is a different floating-point environment, and the whole point
of a tolerance is that it is the thing you check rather than assume. Current headroom
is eleven orders of magnitude, so a failure there would be genuinely informative.

---

## B. Needs a Mac — in this order

1. **`cd apple && ./bootstrap.sh`.** XcodeGen generates the project; then build.
2. **Fix the first-build errors in the 11 presentation files.** They parse, and nothing
   more. They have never been type-checked, because that needs the iOS SDK. Expect
   ordinary porting errors — argument labels, optionality, protocol conformance.
   - `Presentation/Renderer.swift` is the one to open first and read hardest. Pipeline
     state, vertex descriptor and shader ABI are exactly the class of thing a compiler
     and a GPU catch and a careful reader does not.
3. **Run `./test.sh` and `./parity.sh` on the Mac.** Both should already pass.
4. **Launch on the simulator.** First question is not whether it is fun; it is whether
   two bodies appear and one of them moves when you touch the glass.
5. **Launch on a device.** The touch grammar has never met a thumb. Tap-versus-flick
   disambiguation is the most likely thing to need tuning, and the tuning knob is
   `TouchGrammar.Tuning`, not the simulation.
6. **Verify the launch screen** on a notch device and a Dynamic Island device.
7. **Profile.** Frame pacing on the oldest supported device, allocations per frame,
   touch-to-photon latency, thermals over ten minutes. The simulation is not going to
   be the problem — it is under half a percent of the budget. Everything that touches
   hardware is unmeasured.

---

## C. Needs an account or a decision — only you can do these

| | Item | Note |
| --- | --- | --- |
| ⛔ | **Real bundle identifier** | `com.koinophobialabs.martialgod` is a placeholder. This is the one item nothing else can proceed past. |
| ⛔ | App ID, provisioning profile, signing identity | |
| ⛔ | App Store Connect record | |
| ⛔ | **Age rating questionnaire** | The game depicts unarmed violence, non-gory, no blood beyond a split lip. Likely 12+. Answer it honestly; a wrong answer is a rejection and a resubmission. |
| ⛔ | **Crash reporting decision** | Recommendation: Apple's own organiser reports and **no third-party SDK**. The privacy manifest is genuinely empty right now and that is worth more than a nicer stack trace. |
| ⛔ | Screenshots and store copy | Needs a running build. |

---

## D. The gate that is not a checkbox

**A human has to play it, and it must not be me.**

Native M1's exit condition is the same one the web prototype had: *a person unfamiliar
with the design can read the fight without a HUD*. That question cannot be answered by
a test, by a parity gate, or by the person who wrote the game. Every green tick above
is a statement that the machine does what it was told. None of them is a statement that
a person can see it.

When you play it, the thing worth watching is not whether you win. It is whether your
body works the fight out before your memory of the design documents does.

---

## E. Deliberately still not built

Milestone 2 content is untouched, per the standing instruction: no campaign, no second
style, no clinch, no weapons, no Ledger, no adaptive Read, no authored animation. The
renderer is a scaffold and is the subject of the engine re-evaluation gate in
`PRODUCTION_ENGINE_DECISION.md` §9 — not of this checklist.
