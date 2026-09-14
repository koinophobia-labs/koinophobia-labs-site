# Martial God — Apple production project

**This is the game.** Swift + Metal, iPhone and iPad, landscape, App Store bound.

## Build

```bash
./bootstrap.sh     # XcodeGen -> project, then build + test + parity gate
open MartialGod.xcodeproj
```

Requires macOS with Xcode 15+. `bootstrap.sh` installs XcodeGen via Homebrew if needed.

## Layout

```
Packages/MartialGodCore/    the deterministic simulation, ported from the oracle
  Sources/MartialGodCore/   no UIKit, no Metal, no timers, no I/O, no randomness
  Sources/TraceDump/        replays a fixture and emits a trace for the parity gate
  Tests/                    parity gate, behaviour tests, and the port contract
MartialGod/
  App/                      entry point, fixed-timestep session, lifecycle
  Input/                    the touch grammar, and GameController
  Presentation/             pose (five additive layers), duel camera, Metal renderer
  Audio/                    synthesised; breath is the interface
  Haptics/                  six events that mean something
  Persistence/              settings, accessibility, local diagnostics
  Resources/                Info.plist, privacy manifest, asset catalog
```

## The rules this project is held to

- **The simulation never depends on presentation.** No animation-completion callback
  gates a combat transition. `PortContractTests` fails the build if the core starts
  importing a platform framework, or reaches for randomness or a wall clock.
- **Timing truth belongs to the simulation.** It runs at a fixed 60 Hz whatever the
  display does. ProMotion changes presentation only.
- **The debug overlay is off by default** and the fight must read without it.

## Before this can go to TestFlight

See `NATIVE_M1_REPORT.md` §11. In short: it has never been compiled.
