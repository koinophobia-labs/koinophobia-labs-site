# Path of the Martial God

Two things live here, and they are **not** the same thing.

---

## `apple/` — THE GAME

The production Apple project. Swift + Metal, iPhone and iPad, bound for TestFlight and
the App Store. **This is the product.** Everything shipped is built from here.

```bash
cd apple && ./bootstrap.sh      # generate the Xcode project, build, test, run the parity gate
cd apple && ./parity.sh         # the port gate on its own
```

Engine rationale: [`PRODUCTION_ENGINE_DECISION.md`](../../docs/games/path-of-the-martial-god/PRODUCTION_ENGINE_DECISION.md)
Status and requirement map: [`NATIVE_M1_REPORT.md`](../../docs/games/path-of-the-martial-god/NATIVE_M1_REPORT.md)

---

## `reference/` — NOT THE GAME

The browser combat prototype, now classified:

> **REFERENCE IMPLEMENTATION / COMBAT VALIDATION HARNESS**

It exists to preserve verified combat behaviour, the regression suite, the parity
traces, and the six defects Milestone 1 surfaced. It is the **specification oracle**:
when the Swift simulation and this disagree, this one is right until a change is made
deliberately and the traces are re-baselined.

**Do not ship it. Do not polish it. Do not mistake it for the game.** It has no
Apple lifecycle, no touch controls, no device story, and it never will.

```bash
cd reference && node --test tests/*.test.js    # the behaviour the port must preserve
cd reference && node tools/trace.mjs           # regenerate the golden parity traces
cd reference && node serve.mjs                 # play the harness, for comparison only
```

---

## How the two are kept honest

The Swift port is a transliteration, so the numbers are duplicated by definition. Three
checks stop them drifting apart, and all three run in the reference suite because that
is the suite a machine without Xcode can execute:

| Check | What it catches |
| --- | --- |
| `tests/production-sync.test.js` | Technique JSON, parity fixtures or any of 27 tuning constants drifting between the two implementations |
| `tools/verify-trace.mjs` | The Swift simulation taking a different branch, or drifting beyond the declared numeric tolerance |
| `tests/parity-harness.test.js` | The gate itself going blind — it corrupts a good trace eleven ways and requires every one to be caught |

---

## Documentation

All design and production documents live in
[`docs/games/path-of-the-martial-god/`](../../docs/games/path-of-the-martial-god/).
Start with `EXECUTIVE_GAME_BLUEPRINT.md`.
