# Path of the Martial God — Milestone 1

The combat prototype. One unarmed fight, no HUD, placeholder geometry.

Design is canonical in [`docs/games/path-of-the-martial-god/`](../../docs/games/path-of-the-martial-god/).
Build report: [`MILESTONE_1_REPORT.md`](../../docs/games/path-of-the-martial-god/MILESTONE_1_REPORT.md).
Requirement→code map and the two canon conflicts resolved: [`IMPLEMENTATION_LEDGER.md`](../../docs/games/path-of-the-martial-god/IMPLEMENTATION_LEDGER.md).

## Run it

```bash
node serve.mjs          # http://localhost:5173/
node --test tests/*.test.js
node verify.mjs         # browser pass; serve.mjs must be running
```

No build step and no dependencies. Node runs the ES modules directly; so does the browser.

## Controls

`W/S` pressure · retreat — `A/D` angle — `J` strike — `K` commit — `Shift` guard —
`L` deflect — `Space` slip — `F` breathe — tap-and-release `J`/`K` to feint.
`` ` `` debug overlay · `M` sound · `R` restart.

**Guard only covers the quadrant you face.** Walk around someone and it stops protecting them.

## Layout

```
sim/     deterministic, engine-free, 60Hz. No DOM, no timers, no randomness.
  data/low-river.json   frame windows as text — edit and reload
  formMachine.js        the combat FSM: commitment, cancels, the Lie, the Line
  structure.js          four-quadrant base; geometry picks the quadrant
  resolve.js            guard / deflect / slip / footwork, four costs
  finalInch.js          terminals; the Stop is gated on competence
  ai/perception.js      latency-gated snapshots — no input access, by construction
  ai/brain.js           18 options × 10 named, inspectable scoring terms
view/    presentation only. Replaceable; nothing in sim/ knows it exists.
```

**The port contract:** `sim/` is portable by construction and a test enforces it. Moving to
Unreal means re-implementing `sim/` in C++ against this same JSON and these same frame
integers, and replacing `view/`. See ruling C-2 in the ledger.
