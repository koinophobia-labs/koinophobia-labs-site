# TECHNICAL_ARCHITECTURE.md
## Engine recommendation and system breakdown

**Purpose:** this document is written for the coding agent or engineer who will build the vertical slice. It should be possible to start work from here without inventing game design.

---

## 1. Engine recommendation

### Recommendation: **Unreal Engine 5.x**, with a **bespoke combat core in C++** that does *not* use the Gameplay Ability System for moment-to-moment fighting.

### Evaluation

| Criterion | Unreal 5 | Unity 6 | Godot 4 | Custom |
| --- | --- | --- | --- | --- |
| **Combat animation tooling** | Best-in-class: Anim Blueprints, Chooser, Blend Spaces, Layered Blend, Anim Notifies | Strong but requires third-party glue | Improving, not yet at this level | Years of work |
| **Motion matching** | **Built in and production-proven** (Motion Trajectory + Pose Search) | Third-party (Kinematica deprecated; MxM etc.) | No first-party solution | No |
| **IK / retargeting** | **IK Rig + IK Retargeter + Control Rig** — the single most important tool for our 4-age single-skeleton pipeline | Animation Rigging package; workable, more manual | Weakest area; retargeting is immature | No |
| **Two-character synchronised animation** | Well-trodden; good tooling for shared-root clips | Possible | Painful | — |
| **Console path** | Mature, first-party, certified | Mature | **Immature — this alone disqualifies it for a console target** | No |
| **Visual fidelity at our target** | Lumen/Nanite reduce environment art labour substantially | Good (HDRP) | Adequate | No |
| **Iteration speed** | **Worst of the three.** C++ compile loops, slow editor startup, heavy cook times | **Best** | Very good | — |
| **Binary asset source control** | **Painful.** Requires Git LFS + strict locking discipline | Painful | Better (more text-based) | — |
| **Small-team viability** | Good, with discipline | Best | Good for 2D/small 3D | No |
| **AI-assisted production fit** | Good — large public corpus, and our data-driven design keeps the hot path in diffable text | Best corpus | Smaller corpus | No |
| **Risk of "generic Unreal look"** | **High — actively mitigated** (`ART_DIRECTION.md` §11) | Medium | Low | — |

### Why Unreal wins for *this* game

1. **The animation stack is the product.** This game's entire proposition is animation fidelity, retargeting across four age states, motion-matched footwork, and synchronised two-character grappling. Unreal's IK Rig / IK Retargeter / Motion Matching combination is not merely convenient — it is the difference between a survivable animation budget (`ANIMATION_REQUIREMENTS.md` §12) and an impossible one.
2. **Console certification** is a V1 requirement and Godot cannot currently serve it without third-party porting houses.
3. **Environment art leverage.** Nanite and Lumen let a very small team build five dense regions to a high standard. This is the biggest labour saving available to us anywhere.

### Why Unity was seriously considered and rejected
Unity's iteration speed is genuinely better and would save real weeks. It loses on exactly one axis, and it is the axis this game is built on: **the animation and retargeting pipeline requires more assembly**, and our single-skeleton four-age retarget plus two-character Custody work is the project's top risk. We spend iteration speed to buy down animation risk. Revisit only if the team's existing Unity expertise is deep (`OPEN_DECISIONS.md` OD-01).

### Why Godot was rejected
Retargeting maturity and the console path. Both are improving and neither is there today for an animation-critical action game shipping to consoles.

### The important caveat: **do not use GAS for combat**

Unreal's Gameplay Ability System is designed for networked RPG/MOBA abilities with prediction, cooldowns, and replicated attribute sets. Our combat is a **deterministic, single-player, frame-authoritative fighting system**. Using GAS for strikes would mean fighting the framework on every tuning pass.

**Decision:**
- **Combat core:** bespoke C++ (`FormMachine`, below). Deterministic, tick-based, data-driven, no engine ability framework.
- **GAS (optional, and only if useful):** status effects, injuries, and buffs — things that genuinely are attributes with durations.
- **Rendering, animation playback, IK, physics, audio, world, tooling:** Unreal, fully.

### Supporting decisions
- **Language:** C++ for all simulation. Blueprint for scene assembly and non-critical UI only. **No gameplay logic in Blueprint**, because it is not reviewable, not diffable, and not testable.
- **Data:** all technique definitions, frame windows, AI read tables, style grammars, dialogue conditions, and encounter definitions live in **plain-text data files (JSON or a compact DSL) in the repository**, not in `.uasset` binaries. This is essential for AI-assisted production, code review, diffs, and automated testing. A cooked binary form is generated at build time.
- **Source control:** Git + LFS with mandatory file locking on binary assets; text data in normal Git.
- **Determinism:** fixed 60Hz simulation tick decoupled from render; fixed-point or carefully-constrained float in the decision path; no frame-rate-dependent logic anywhere.

---

## 2. System map

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORLD / QUEST LAYER                      │
│  WorldState · QuestGraph · DialogueSystem · SaveSystem          │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
┌────────────▼─────────────┐   ┌─────────────▼───────────────────┐
│    SOCIAL SIMULATION     │   │        PROGRESSION              │
│  RecordBus               │   │  LedgerSystem                   │
│  RumourNetwork           │   │  BodyModel                      │
│  StandingModel           │   │  MasteryLadder                  │
│  PersistentPopulation    │   │                                 │
└────────────▲─────────────┘   └─────────────▲───────────────────┘
             │ facts                         │ mastery / body
┌────────────┴───────────────────────────────┴───────────────────┐
│                        COMBAT CORE                              │
│  FormMachine (deterministic FSM, 60Hz)                          │
│  TechniqueDB · StanceSystem · StructureModel · FinalInch        │
│  CustodyGraph · HitResolver                                     │
└────────────┬───────────────────────────────┬────────────────────┘
             │ state                         │ intent
┌────────────▼─────────────┐   ┌─────────────▼───────────────────┐
│    ANIMATION DRIVER      │   │        OPPONENT BRAIN           │
│  TierSelector            │   │  Perception (latency-gated)     │
│  ReactionSelector        │   │  ReadMemory (persistent)        │
│  AdditiveLayers          │   │  BehaviourWeights · StateTree   │
│  StanceTransitions · IK  │   │  TellScheduler                  │
└──────────────────────────┘   └─────────────────────────────────┘
```

**Interface discipline:** the combat core knows nothing about narrative, reputation, or quests. It emits **facts**. Everything social is downstream and one-directional. If combat ever needs to query Standing, it does so through a single read-only interface and never writes.

---

## 3. Combat core

### 3.1 `FormMachine`
The deterministic combat state machine. One instance per fighter.

```cpp
struct FighterState {
    EFormState   State;        // Neutral, Startup, Active, Recovery, Guard,
                               // Deflect, Evade, Custody, Staggered, Down, Finished
    TechniqueId  Current;
    int32        Tick;         // ticks into current state
    StanceId     Stance;
    Quadrants    Structure;    // 4 × int16
    int16        Breath;
    RegionHP     Vitality;     // 6 regions
    int16        Will;         // hidden
    InjurySet    Injuries;
};

void FormMachine::Tick(const FInputIntent& In, int32 DeltaTicks);
```

**Rules:**
- Pure function of `(state, input, opponent state)` → `new state`. No randomness in the decision path. Any variation is authored, not rolled.
- Windows (startup / active / recovery / cancel / armour) are read from `TechniqueDB`, **never from animation notifies.** Animation is driven *by* the machine, not the reverse.
- Fully serialisable, which gives us replay (Meditation), regression tests, and AI training data for free.

### 3.2 `TechniqueDB`
Data-driven. One record per technique per tier:

```json
{
  "id": "low_river.through_palm",
  "kind": "Drive",
  "style": "low_river",
  "intent": "pressure",
  "verb": "commit",
  "band": ["mid"],
  "tiers": {
    "rough":  { "startup": 22, "active": 4, "recovery": 30, "breath": 14, "cancelFrom": 44, "clip": "LR_ThroughPalm_Rough" },
    "sound":  { "startup": 17, "active": 4, "recovery": 21, "breath": 10, "cancelFrom": 30, "clip": "LR_ThroughPalm_Sound" },
    "silent": { "startup": 13, "active": 4, "recovery": 14, "breath":  6, "cancelFrom": 21, "clip": "LR_ThroughPalm_Silent" }
  },
  "structure": { "quadrant": "fore", "force": 34 },
  "vitality":  { "region": "torso", "amount": 9 },
  "lineBuild": 1,
  "terminal": "strike_through"
}
```

**Validation is a build step.** A technique whose frame windows disagree with its clip length fails the build. This is how we keep "the animation is honest" from silently rotting.

### 3.3 `StanceSystem`
Holds the **intent grammar**: the mapping from `(verb × intent × band × opponent state) → TechniqueId`, per style. This table *is* Pillar 2, and it is pure data.

```
resolve(style, verb, intent, band, oppState) -> TechniqueId
```

Also owns stance transitions, their durations, their defensive character, and flow variants at high mastery.

### 3.4 `StructureModel`
Four quadrants relative to the fighter's own facing. Applies directional force, handles degradation, recovery-by-footwork, and Structure Break detection. Publishes quadrant state to the `AnimationDriver` so reactions are physically correct.

### 3.5 `CustodyGraph`
Finite node graph (7 standing + 3 ground), authored transitions, Breath contest for hold/escape, conversion set per node. **Entry requires a tight position/angle tolerance or the Seize fails cleanly.** No procedural two-body solving in V1.

### 3.6 `FinalInch`
```cpp
struct FTerminalOffer {
    TArray<FTerminal>  Available;   // derived from style, position, mastery, target state
    int32              WindowTicks; // scales with mastery
};
```
On resolution, emits a `FRecordEvent` to `RecordBus` with terminal, target, target state, location, and **witness set**. This is the only place the combat core touches the social layer, and it is write-only.

---

## 4. Animation driver

- **`TierSelector`** — picks Rough/Sound/Silent from the technique's mastery state. One lookup.
- **`ReactionSelector`** — `f(incoming vector, victim quadrant state, victim structure, layers) → reaction clip`. 72 base reactions plus layering.
- **`AdditiveLayers`** — breathing, fatigue, injury, structure, Will. Driven **directly from resource values**, continuously. These are gameplay systems, not polish (`ANIMATION_REQUIREMENTS.md` §5).
- **`StanceTransitions`** — authored per ordered style pair, with flow variants.
- **IK** — foot planting on all footing types, contact-point adjustment in Custody, look-at.

**Hard interface rule:** the animation driver is a **consumer** of combat state. It never influences it. If a designer needs to change feel, they change `TechniqueDB`, not a notify.

---

## 5. Opponent brain

### 5.1 `Perception`
Latency-gated (180–380ms per opponent tier). Sees pose, velocity, facing, distance, and current animation state **only after its startup has become visually apparent**. It has no access to the input buffer. **This is enforced architecturally:** the perception module is given a filtered view struct and cannot reach the player's controller. Enforced by a unit test.

### 5.2 `ReadMemory`
```cpp
struct FReadTable {
    TMap<FTendencyKey, FTendency> Tendencies;  // value, confidence, lastSeenTick
    TArray<FPurchasedCounter>     Counters;    // active adaptations + decay
};
```
- Serialised per named character, **persisting across the entire campaign**.
- Tendency crosses confidence threshold → buy a counter → **`TellScheduler` plays the tell before the counter becomes active.** This ordering is a hard requirement and is unit-tested.
- Counters decay when the pattern stops.
- **Lies inject false tendencies** (`COMBAT_SYSTEM.md` §6.1).
- Adaptation may only modify **behaviour weights and reaction budgets** — never damage, health, or speed. Enforced by type: the adaptation API physically cannot reach the stat block.

### 5.3 Behaviour
`StateTree` (Unreal's) for behaviour selection, weighted by the read table and by the opponent's authored personality (posture, tempo, preferred band, temperament, habit, hole).

### 5.4 `KemBuilder` (special case)
Reads a Chapter 5 snapshot of the player's telemetry and produces Kem's style bindings, technique set, preferred band, and terminal preference (`BOSSES.md` §10). Runs once, at chapter transition, and is then a normal opponent definition.

---

## 6. Social simulation

### 6.1 `RecordBus`
Immutable, append-only fact log. Nothing downstream can edit a fact.
```cpp
struct FRecordEvent {
    ERecordKind Kind;  FGuid Target;  ETerminal Terminal;
    FTargetState TargetState;  FGuid Location;  int64 WorldTick;
    TArray<FGuid> Witnesses;  float CostToPlayer;  bool UnderProvocation;
};
```
`CostToPlayer` and `UnderProvocation` are authored per situation and drive the weighting (`MORALITY_AND_REPUTATION.md` §4).

### 6.2 `RumourNetwork`
Ticks on **world time**, propagating even while the player is elsewhere — that is the entire point. Channels with speed, distortion, decay, and reach. Fully serialisable.

### 6.3 `StandingModel`
One belief vector per **party** (faction / settlement / named NPC), each with confidence and age.
```cpp
float StandingModel::Believes(FPartyId Party, EDimension Dim) const;
```
**There is no global reputation value anywhere in the codebase.** If one appears, the design has been violated. Enforced by code review and by the absence of any such API.

### 6.4 `PersistentPopulation`
~90 persistent fighters. Each carries identity, record, injuries, current location/role, read table, and relationship state. Cheap, and it is the proof of two pillars (`WORLD.md` §8).

---

## 7. Progression

- **`LedgerSystem`** — technique acquisition with **provenance** (channel, place, world-tick, source character), mastery advancement via the weighted formula (`TRAINING_AND_MASTERY.md` §5), player-authored names for derived techniques.
- **`BodyModel`** — three paired attributes under a hard budget, conditioning schedule, over-training injury, drives the build morph.
- **`MasteryLadder`** — five technique states, four style states, gates for Silent (form grade) and Instinctive (decisive-moment flag).

---

## 8. Narrative systems

- **`DialogueSystem`** — condition-queried line selection. Conditions may query local Standing, relationship state, Ledger contents, and world flags. **No dialogue node may write to the Record or to Standing.** Conversation reports; conduct decides.
- **`QuestGraph`** — a directed graph of authored beats with entry conditions, not a linear script. Chapter transitions are explicit nodes.
- **`WorldState`** — world tick (days), chapter, region states, seasonal/visual state of recurring locations (Mudgate across four visits).

---

## 9. Save system

- Single save slot per campaign plus rolling autosaves. **No save scumming around the Final Inch:** the autosave commits *immediately* on terminal resolution, before the animation finishes. This is a deliberate design decision and it must be stated in the game's own options screen so it never reads as a bug.
- Everything is serialisable by construction: FormMachine state, read tables, the Record, the rumour network in flight, the persistent population, the Ledger.
- **Versioned schema with migration**, from day one. A five-year project will change its data shapes.

---

## 10. Tools, debugging, testing

### Tools to build (they are not optional; they are the production capacity)
| Tool | Purpose |
| --- | --- |
| **Technique editor / frame-data viewer** | Edit windows, see them overlaid on the clip, hot-reload into a running game |
| **Fight recorder & replay** | **Ships as the in-game Meditation feature** (`COMBAT_SYSTEM.md` §13). One system, two uses. |
| **AI read debugger** | Live view of what an opponent believes about the player, which counters are bought, and when tells fired |
| **Rumour map** | What each party believes, where it came from, how distorted |
| **Encounter authoring** | Define an opponent's posture/tempo/band/temperament/habit/hole as data |
| **Animation budget report** | Automated clip count by category against the `ANIMATION_REQUIREMENTS.md` §12 budget, **run in CI**, because scope creep here kills the project |

### Testing
- **Deterministic replay regression:** a library of recorded input sequences asserting exact outcomes. Any combat change that alters a recorded fight fails CI and must be explicitly re-baselined. This is the single most valuable test in the project.
- **Frame-data validation** at build: windows must agree with clip lengths.
- **Fairness tests:** assert the AI cannot access the input buffer; assert every counter is preceded by a tell; assert adaptation never modifies stats.
- **Social simulation tests:** propagation, decay, severity non-decay, witness-dependence.
- **Performance gate in CI:** 60fps at target settings on reference hardware, checked per build, failing the build on regression.

---

## 11. Build order for the coding agent

The dependency-correct sequence. **Do not reorder.**

1. `FormMachine` + `TechniqueDB` with placeholder animation and a debug HUD showing all state. *Prove the fighting works before it looks like anything.*
2. `StructureModel` (quadrants) + `ReactionSelector`. *This is where the game becomes itself.*
3. Animation pipeline: single skeleton, four proportion states, retarget, motion-matched footwork.
4. Tier system (Rough/Sound/Silent) on **three** techniques only. *Validate Pillar 1 as early as humanly possible.*
5. `AdditiveLayers` — breathing, fatigue, injury. *Turn the HUD off and check the game is still playable.*
6. `StanceSystem` with two styles.
7. `OpponentBrain`: perception, read memory, tells, counters.
8. `FinalInch` + `RecordBus`.
9. Meditation (replay + overlay) — mostly free by now.
10. `LedgerSystem`, `BodyModel`.
11. `CustodyGraph` — **last of the combat systems, because it is the biggest risk and must not block anything else.**
12. Social simulation, dialogue, quest graph.

**Milestone 1 exit is step 5**: an unarmed fight against one opponent, no HUD, that a stranger can read.
