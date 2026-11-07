# Path of the Martial God — Design Package

**Status:** Design lock candidate v1.0 · **Date:** 2026-09-14 · **Owner:** Blake Taylor

A complete pre-production design package for a third-person martial-arts action RPG. The purpose of this package is that a coding agent can begin building the vertical slice **without inventing fundamental game design on the fly.**

---

## Start here

**[EXECUTIVE_GAME_BLUEPRINT.md](EXECUTIVE_GAME_BLUEPRINT.md)** — the entire game in one document. Read this first; read the rest to build it.

## The design bible

| # | Document | What it settles |
| --- | --- | --- |
| 1 | [GAME_VISION.md](GAME_VISION.md) | High concept, the combat thesis, comparables and exact points of divergence |
| 2 | [CORE_PILLARS.md](CORE_PILLARS.md) | The six pillars and the test each imposes on every feature |
| 3 | [COMBAT_SYSTEM.md](COMBAT_SYSTEM.md) | **The most important document.** Resources, inputs, the intent grammar, the Final Inch, adaptive AI, damage and consequence |
| 4 | [MARTIAL_STYLES.md](MARTIAL_STYLES.md) | Six styles + the Quiet, the matchup web, and how a fighting identity is produced by constraint |
| 5 | [PROGRESSION.md](PROGRESSION.md) | Six axes of growth, and what is allowed to be a number |
| 6 | [TRAINING_AND_MASTERY.md](TRAINING_AND_MASTERY.md) | The Ledger, the five acquisition channels, playable drills, the mastery ladder |
| 7 | [WORLD.md](WORLD.md) | The Concord — geography, martial culture, and the rumour infrastructure |
| 8 | [CHARACTERS.md](CHARACTERS.md) | The protagonist, the four-phase life arc, the supporting cast |
| 9 | [MASTER.md](MASTER.md) | Ruhn — history, philosophy, flaws, secrets, and why he comes |
| 10 | [RIVALS.md](RIVALS.md) | Yeo Ansa, Kem Duro, Ise Vauran, and the one who betrays you |
| 11 | [FACTIONS.md](FACTIONS.md) | Five institutions with economic functions and internal splits |
| 12 | [STORY.md](STORY.md) | Dramatic architecture, seven chapters, and five earned endings |
| 13 | [MORALITY_AND_REPUTATION.md](MORALITY_AND_REPUTATION.md) | Standing — consequence without a meter, and why it can't be gamed |
| 14 | [BOSSES.md](BOSSES.md) | Boss philosophy and the nine-boss V1 roster |
| 15 | [ART_DIRECTION.md](ART_DIRECTION.md) | Visual identity, colour, the Ledger UI, camera, and the anti-generic pass |
| 16 | [ANIMATION_REQUIREMENTS.md](ANIMATION_REQUIREMENTS.md) | Three fidelity tiers, additive layers, the clip budget that controls the project |
| 17 | [AUDIO_DIRECTION.md](AUDIO_DIRECTION.md) | Hit philosophy, breathing as the HUD, silence as power, the thematic architecture |
| 18 | [VERTICAL_SLICE.md](VERTICAL_SLICE.md) | The scope ladder and the 50-minute slice, beat by beat |
| 19 | [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Engine recommendation, system breakdown, interfaces, and the build order |
| 20 | [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) | Ten milestones with exit criteria, and the AI-assisted production workflow |
| 21 | [RISK_REGISTER.md](RISK_REGISTER.md) | What is most likely to kill this, and what we do about it |
| 22 | [OPEN_DECISIONS.md](OPEN_DECISIONS.md) | Fourteen open questions, each with a recommendation already reflected in the package |

---

## Implementation record

The twenty-two documents above are the **design**. These five are what happened when it
was built, and they are the ones to read before touching code — they carry the rulings,
the corrections, and the defects that were found the hard way.

| Document | What it is |
| --- | --- |
| [IMPLEMENTATION_LEDGER.md](IMPLEMENTATION_LEDGER.md) | Design requirement → system → file, plus every conflict and defect ruled on rather than silently resolved |
| [MILESTONE_1_REPORT.md](MILESTONE_1_REPORT.md) | The web prototype: six defects it surfaced, the assumptions it made, and the hosted playtest build |
| [PRODUCTION_ENGINE_DECISION.md](PRODUCTION_ENGINE_DECISION.md) | Why native Swift + Metal rather than Unreal, and the gate for reopening that |
| [NATIVE_M1_REPORT.md](NATIVE_M1_REPORT.md) | The Apple build: what is verified, what is merely written, and what cannot be done without a Mac |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | Everything between here and TestFlight, split by what needs a Mac, an account, or a human |

**The browser build is not the game.** It is a validated reference implementation and a
parity oracle. `games/path-of-the-martial-god/README.md` says which tree is which, and
says it loudly, for the same reason this paragraph exists.

---

## The thesis, in one line

> **A martial god is someone who can end any fight and chooses how it ends.** Mastery is not more damage — it is more terminal options. And the ability to be merciful is mechanically gated behind competence.

## Where to start building

`TECHNICAL_ARCHITECTURE.md` §11 gives the dependency-correct build order. Milestone 1 exit is an unarmed fight against one opponent, **no HUD**, that a stranger can read.
