# RISK_REGISTER.md
## What is most likely to kill this project

Ordered by expected damage. **Probability** assumes no mitigation; **residual** assumes the mitigation is actually executed.

| ID | Risk | Prob. | Impact | Residual |
| --- | --- | --- | --- | --- |
| R-01 | Animation scope overrun | **High** | **Fatal** | Medium |
| R-02 | Two-character grappling proves unshippable | Medium | Severe | Low |
| R-03 | Combat does not feel good | Medium | **Fatal** | Medium |
| R-04 | Solo/small-team scope collapse | **High** | **Fatal** | Medium |
| R-05 | Adaptive AI reads as unfair or as noise | Medium | Severe | Low |
| R-06 | The Kem fight does not land | Medium | Moderate | Low |
| R-07 | 60fps target lost to fidelity | Medium | Severe | Low |
| R-08 | Content volume for a 20-hour campaign | **High** | Severe | Medium |
| R-09 | Generated asset inconsistency | Medium | Severe | Low |
| R-10 | Open-world temptation | Medium | **Fatal** | Low |
| R-11 | The morality system is illegible to players | Medium | Severe | Medium |
| R-12 | Assist withdrawal feels like a nerf | Medium | Moderate | Low |
| R-13 | The master's final turn reads as a cliché | Low | Severe | Low |
| R-14 | No-HUD readability fails | Medium | Severe | Low |
| R-15 | Key-person dependency | Medium | Severe | Medium |

---

## R-01 — Animation scope overrun
**The primary risk.** Three fidelity tiers × 40 core techniques × four age states × two-character grappling × 72 reactions is an enormous surface, and animation overruns do not announce themselves — they arrive as a slow accumulation of "just one more variant."

**Mitigations**
1. **A hard clip budget of ~880 for V1** (`ANIMATION_REQUIREMENTS.md` §12), reported automatically **in CI** from M5 onward. A 15% overrun triggers a scope conversation immediately.
2. **Single skeleton + retarget, proven in week 4** (M2), before a single production clip is authored.
3. **Tiers on 40 techniques only.** Secondary techniques are Sound-only, and players will never notice.
4. **The reuse rule:** shared body mechanics authored once, differentiated by stance entry/exit.
5. **Additive layers generate state variation without authoring it** — this system alone saves several hundred clips.
6. **Pre-emptive cut list, agreed at M0 and executed without debate if triggered:** drop Glass Hour to 3 tiered techniques → cut the child's bespoke set to 8 → cut Silent tier from secondary styles → cut one boss.

## R-02 — Two-character grappling proves unshippable
Synchronised two-body animation with variable builds is the hardest thing in the project, and Standing Water's Custody is built on it.

**Mitigations**
1. **The grip graph is finite by design** — 7+3 nodes, ~46 clips, not a continuous simulation. This is the whole reason the system is shaped that way.
2. **Custody is built last** among combat systems (`TECHNICAL_ARCHITECTURE.md` §11) so it blocks nothing.
3. **It is excluded from the vertical slice entirely.** The slice does not need it, and the project should not risk it before the production decision.
4. **Fallback:** if the graph proves unaffordable, Standing Water degrades to a **throw-and-sweep style with a two-node clinch**, losing the deep chokes. The Final Inch keeps its other terminals. Painful, survivable.

## R-03 — Combat does not feel good
No amount of animation, story, or systems depth rescues a game whose core exchange is unsatisfying.

**Mitigations**
1. **M1 is first, art-free, and six weeks long.** A failure here costs six weeks, not two years.
2. **M1 exit criterion 4 is a genuine gate**, and the roadmap states the stopping condition explicitly: two failures and the project stops.
3. **Feel is data-driven** — frame windows in text, hot-reloadable — so tuning is cheap and frequent rather than expensive and rare.
4. Deterministic replay makes "it felt different yesterday" a testable claim.

## R-04 — Solo/small-team scope collapse
The most common death of ambitious games: the design is achievable, the team is not large enough, and the schedule stretches until funding or morale runs out.

**Mitigations**
1. **The scope ladder is explicit and enforced** (`VERTICAL_SLICE.md` §1). V1 is not the dream game and the difference is written down.
2. **The production decision at M9 is real.** The slice is designed to be a legitimate stopping point that produces something finishable and shippable-as-a-demo, not a sunk cost.
3. **Tools are built early**, because a small team's throughput is determined by its tools.
4. **AI-assisted production is targeted at volume and scaffolding**, where it genuinely multiplies a small team (`PRODUCTION_ROADMAP.md` §3).
5. Every document in this package contains an explicit "what we are not building" list. These exist to be cited in future arguments.

## R-05 — Adaptive AI reads as unfair or as noise
Adaptive systems fail in two opposite directions: players perceive input reading, or they never notice the adaptation at all and it was wasted work.

**Mitigations**
1. **Tells precede counters**, architecturally guaranteed and unit-tested. This is the single mitigation that matters.
2. **Perception is latency-gated and structurally cannot reach the input buffer** — enforced by type, not by discipline.
3. **Meditation shows the player the read**, in-fiction. The system is legible by design rather than by hoping.
4. **M3 exit criterion 4** gates on a tester noticing the tell without being told one exists.
5. Adaptation may only touch behaviour weights — never stats. Enforced by API shape.

## R-06 — The Kem fight does not land
A boss procedurally derived from player telemetry is a wonderful idea that frequently produces an incoherent opponent.

**Mitigations**
1. **Kem is assembled from authored components**, selected by telemetry — not generated. Every possible Kem is a hand-tuned configuration.
2. **The snapshot is taken at a fixed point** (Chapter 5) and then frozen, so he is a normal opponent definition by the time he is fought.
3. **A curated fallback set** of five hand-authored Kem builds covers the common player archetypes; the derivation picks the nearest and adjusts within bounds.
4. Fallback: if derivation is incoherent in testing, ship the five authored builds selected by archetype. Most players will never know.

## R-07 — 60fps lost to fidelity
Nanite and Lumen make beautiful environments cheap in labour and expensive at runtime, and the temptation to spend the frame budget is constant.

**Mitigations**
1. **60fps is a design constraint, not a polish goal**, stated in `GAME_VISION.md` §6. A timing-window game at 30fps is a different, worse game.
2. **Performance gate in CI** on reference hardware, failing the build on regression.
3. The art direction actively helps: matte surfacing, restrained post, low-key lighting, and no strike particles are all cheaper *and* better-looking for this game.
4. Lumen has a hard budget and is reduced before anything else.

## R-08 — Content volume for a 20-hour campaign
V1 needs five regions, nine bosses, 22 named opponents, 90 persistent fighters, and a branching final act.

**Mitigations**
1. **Density over length.** 20–24 hours, not 40.
2. **Persistent population is cheap** — a record per entity, reusing archetype bodies, differentiated by one authored habit each.
3. The Iron Road is **connective tissue** rather than a sixth region.
4. **Endings are assembly, not new content** — the epilogue is the rumour network's report.
5. Restriction-based sparring generates enormous replayable content from a rules mask over existing systems.

## R-09 — Generated asset inconsistency
Fast generation plus deadline pressure equals shipped incoherence.

**Mitigations**
1. **The traffic-light model**, with an explicit red list (`PRODUCTION_ROADMAP.md` §3).
2. **The provenance manifest, enforced by a CI check** that fails the build if any ship-list asset is `ai-final`. Intentions do not survive deadlines; build failures do.
3. Combat animation, principal characters, and principal VO are categorically excluded.

## R-10 — Open-world temptation
At some point someone will ask why the player cannot just walk from Mudgate to Ironmouth.

**Mitigations**
1. `GAME_VISION.md` §11 and `WORLD.md` §10 both state it plainly, for citation.
2. **The routed-travel design is load-bearing**, not a limitation: rumours travel at the speed of the rail, so distance from your reputation is a mechanic (`MORALITY_AND_REPUTATION.md` §3). Opening the world would break the morality system.
3. Five dense, hand-built regions is already an ambitious content target for this team.

## R-11 — The morality system is illegible to players
A system with no meter, no feedback, and no preview can read as *no system at all*, and the player never discovers that the game is watching.

**Mitigations**
1. **Ambient rumour dialogue** is the primary surface and it is everywhere — players hear themselves discussed constantly.
2. **The use-name** is a diegetic, plural, uncontrolled reputation readout.
3. **The slice proves it in eight minutes**: Beat 3's choice, Beat 6's limp. M5 exit criterion 4 gates on testers noticing unprompted.
4. **Crowd reaction to the Final Inch is immediate** — the world's verdict is audible before any rumour has travelled.
5. This is the highest **residual** risk in the register after R-01, R-03, and R-04. It is monitored at every playtest and it is the most likely thing to need a designed-in concession (`OPEN_DECISIONS.md` OD-02).

## R-12 — Assist withdrawal feels like a nerf
Removing the player's training wheels can read as the game getting worse.

**Mitigations**
1. Step-downs only at chapter boundaries, always paired with a larger capability gain in the same beat.
2. Always narratively framed as Ruhn withdrawing correction.
3. **Telemetry gate:** if median performance drops across a boundary in playtest, the feature is cut and Pillar 1 rests on the other two mechanisms (`CORE_PILLARS.md`, Pillar 1 guard-rail). The design already survives without it.

## R-13 — The master's final turn reads as a cliché
"The mentor is the final boss" is a well-worn beat and can land as predictable or, worse, as "teacher secretly evil."

**Mitigations**
1. **Ruhn is right**, and the game says so. There is no betrayal, no hidden villainy, no concealed crime — everything he did was public, ordered, reasoned, and effective (`MASTER.md` §9).
2. His reasoning is about the player's **existence**, not the player's morality, which is a genuinely different argument.
3. **The player can refuse the fight**, and the Refusal is a real, mechanically demanding ending rather than a dialogue option.
4. He is **not the twist** — he is disclosed steadily from Chapter 4, so the game is not resting on a reveal.

## R-14 — No-HUD readability fails
If players cannot read resource states from bodies, the default presentation is unplayable and the game's signature feature collapses.

**Mitigations**
1. **Additive layers are built in M2**, not deferred to polish, and are gated on a readability test with the sound off.
2. **Breath is carried by audio as well as animation** — two independent channels for the most important resource.
3. The **Trace** and **Full** HUD modes exist and are not framed as difficulty settings.
4. M6 exit criterion 1 gates the alpha on a stranger completing the slice with the HUD off.

## R-15 — Key-person dependency
A 4–6 person team has no redundancy, and the animation lead in particular is irreplaceable mid-project.

**Mitigations**
1. **Everything that can be data is data**, in text, in the repository, reviewable and diffable.
2. Tools and pipelines are documented as they are built, not afterward.
3. Animation style guides and tier definitions are written down (`ANIMATION_REQUIREMENTS.md`) so a second animator can match the first.
4. AI assistance genuinely reduces bus-factor risk on code and tools, though not on animation or art direction — which is where the dependency actually is, and where it is honestly unmitigated.

---

## The three that actually kill projects

Stripping away everything else: **R-01 (animation scope)**, **R-03 (combat feel)**, and **R-04 (team scope)** are the ones that end this project, and they compound — a feel problem prompts more animation, which strains the team, which slows the feel iteration.

The roadmap is structured to attack all three in the first ten weeks, with art-free combat first and the retarget pipeline proven in week four, precisely because these three must be answered before anything expensive is authored.
