# OPEN_DECISIONS.md
## Questions that remain open, with a recommendation for each

**How to read this document.** Every entry has a **recommendation that is already reflected in the rest of the package** — the design is complete and internally consistent, and work can begin without resolving anything here. These are the places where a reasonable person could disagree, where the alternative is worth preserving, or where the answer genuinely depends on data we do not have yet.

**Nothing in this file blocks the vertical slice**, except where marked ⚠.

---

## OD-01 — Engine: Unreal vs. Unity
**Recommendation: Unreal 5.x** (`TECHNICAL_ARCHITECTURE.md` §1).

**The alternative, preserved:** Unity's iteration speed is genuinely better and would save real weeks across a multi-year project, and its asset-pipeline friction is lower for a tiny team.

**Why the recommendation stands:** we are buying down the project's top risk (animation) with the currency of iteration speed. The single-skeleton four-age retarget and two-character Custody pipeline is better served by IK Rig / IK Retargeter / Motion Matching than by assembled third-party equivalents.

**Reopen if:** the team's existing Unity expertise is deep and its Unreal expertise is thin. A team's familiarity is worth more than a feature comparison, and this should be an honest conversation before M1 rather than a defended position. **Decide before M1 begins.** ⚠

---

## OD-02 — Is the morality system too invisible?
**Recommendation: ship it invisible** (`MORALITY_AND_REPUTATION.md`), with ambient rumour, crowd reaction, and the use-name as the surfaces.

**The alternative, preserved:** a minimal diegetic surface — for example, the Ledger's "People" section showing, for each person you have fought, *what you did and one line about what became of them.* This is not a meter; it is a record. It would substantially raise legibility at a small cost to the design's purity.

**The genuine risk:** a system with no feedback can read as no system at all (`RISK_REGISTER.md` R-11).

**Resolution path:** M8 playtest. If fewer than 60% of testers articulate that the game responded to their conduct, implement the Ledger "People" surface. **This is the most likely concession in the entire package**, and the design is written to accommodate it without damage.

---

## OD-03 — Assist withdrawal
**Recommendation: implement it, with the guard-rails** (`CORE_PILLARS.md`, Pillar 1).

**The alternative, preserved:** cut it entirely and rest Pillar 1 on animation tiers and the Breath economy, which are individually sufficient.

**Resolution path:** telemetry gate at M8. If median player performance drops across a step-down boundary, cut the feature. **The design survives without it** and no other system depends on it.

---

## OD-04 — Should the protagonist be voiced and named?
**Recommendation: yes — voiced, named Vahn, fixed history, selectable presentation** (`CHARACTERS.md` §1).

**The alternative, preserved:** a silent, player-named protagonist for identification.

**Why the recommendation stands:** the game's emotional core is a *relationship* with Ruhn across eighteen years, and a mute protagonist cannot hold up one end of it. The player's identity expression is delivered through their fighting identity, their body, their Ledger, their coat, and their conduct — which is far more personal than a name field.

**Cost:** four voice performances across the life arc, and it forecloses a common RPG player expectation. Accepted.

---

## OD-05 — The V1 style roster
**Recommendation: 4 + the Quiet.** Cut Hooks and False Face; keep False Face's **Lie** as a universal mechanic (`MARTIAL_STYLES.md` §10).

**The alternative, preserved:** ship five by including **Hooks**, which is the cheapest of the two to build (it needs no new system) and is the most immediately *fun* style in the design. There is a real argument that a V1 without an aggressive volume-pressure style feels more austere than it should.

**Why the recommendation stands:** four styles cover all four distance bands and all three target resources, and the matchup web stays non-transitive. Hooks' niche is partly served by aggressive Low River play.

**Reopen at:** M6, if the animation budget is tracking under. Hooks is the first thing to add back.

---

## OD-06 — Death and hard failure
**Recommendation:** losing is usually narrative and continues the story; genuine death exists only in **explicitly lethal encounters**, signalled diegetically (someone draws a blade; the pit declares a death match). Those reload to the fight start. No corpse runs, no currency loss, no aging penalty (`STORY.md` §9).

**The alternative, preserved:** no death at all, ever — every loss continues. This is more thematically pure ("a martial artist learns through defeat") and removes all reload friction.

**Why the recommendation stands:** if nothing can ever go permanently wrong, the lethal encounters lose their tension, and tension is what makes the Final Inch weigh anything. The player must believe the world is dangerous in order to believe their own restraint matters.

**Open sub-question:** should the player be able to **die in the final fight against Ruhn**? Current answer: **no** — losing to Ruhn is the *Lineage* ending, not a game over. This is a deliberate and slightly unusual choice and it should be validated.

---

## OD-07 — Difficulty selector
**Recommendation: no difficulty selector.** Instead: the accessibility layer (`COMBAT_SYSTEM.md` §14) and a world whose pressure responds to Standing.

**The alternative, preserved:** a conventional selector. It is honest about what it does, it is what many players expect, and there is a defensible argument that refusing one is a purity position that costs real players.

**Why the recommendation stands:** the accessibility layer already does the work a difficulty selector does, without labelling the player and without removing decisions. Bandwidth is adjustable; the decisions are not.

**Resolution path:** M8. If completion rate is below 85% and testers cite difficulty rather than confusion, add an "Assisted" preset that bundles the accessibility options under one switch. This is a presentation change, not a design change.

---

## OD-08 — Chapter count and the Chapter 4/5 boundary
**Recommendation: seven chapters plus a prologue** (`STORY.md` §3).

**The open question:** Chapters 4 (Ninebell) and 5 (the Thousand Steps) are both "the player learns what Ruhn is" chapters, and there is a real risk they read as one long revelation with a mountain in the middle.

**The alternative:** merge them, making a six-chapter game with a tighter middle and more room in Act III for the consequences of Chapter 6 to breathe.

**Resolution path:** narrative review at story-lock, after the slice. This does not affect the slice.

---

## OD-09 — Does Ruhn ever hold back in the final fight?
**Recommendation: no.** He fights to end the lineage, entirely, at full capability.

**The alternative, preserved:** he holds back fractionally and the player can detect it — which would be a devastating detail (*he came to break you and could not do it cleanly*) and would also undercut the argument he came to make.

**Why the recommendation stands:** if he holds back, the player's victory is compromised and the *Answer* ending becomes sentimental rather than earned. He must genuinely try.

**But:** there is a strong version of the alternative in which he holds back *only in the final phase*, in the Quiet, and only enough that a player paying very close attention notices — and the game never confirms it. Worth exploring at story-lock. It may be the best single detail in the game, or it may be the thing that ruins the ending.

---

## OD-10 — Multiple playable presentations vs. one
**Recommendation:** two body presentations for Vahn with no mechanical difference, plus voice selection.

**The alternative:** one fixed protagonist, saving a full character art and animation pass and a voice performance.

**Cost of the recommendation:** roughly 8–10% of character art and VO budget.

**Reopen if:** M6 character art is over budget. This is the cleanest large cut available in the art pipeline, and it should be taken over cutting animation.

---

## OD-11 — Should the player be able to take students before the endgame?
**Recommendation: not in V1.** Teaching is a post-launch mode, and in V1 the *Stillwater* ending's student requirement is satisfied by a small number of authored relationships rather than a system.

**The alternative:** build a lightweight teaching system in Chapter 6, where the player can take on two or three named students who visibly learn their habits.

**The genuine argument for it:** it would make Chapter 6's thesis — *you have been teaching the whole time* — mechanical rather than narrated, and it would make the Kem fight land harder. This is the most valuable cut feature in the package.

**Reopen at:** the production decision. If full production is greenlit with a real budget, this moves into V1.

---

## OD-12 — Does the game ever use the phrase "Martial God"?
**Recommendation: yes, but only in other people's mouths**, and with the meaning contested by faction (`GAME_VISION.md` §12).

**The alternative:** never say it at all, and let the title stand alone.

**Why the recommendation stands:** the word doing different work for different people — a marketing term to the Iron Road, blasphemy to the Thousand Steps, a legal problem to the Ninth Bell, a diagnosis to Ruhn — is one of the best pieces of worldbuilding available, and it costs nothing but dialogue.

**Hard rule either way:** the game never tells the player they have become one.

---

## OD-13 — Combat determinism vs. authored variation
**Recommendation: fully deterministic**, with all variation authored rather than rolled (`TECHNICAL_ARCHITECTURE.md` §3.1).

**The alternative:** small random variation in frame windows and reaction selection, which makes fights feel less mechanical and prevents players from memorising exact timings.

**Why the recommendation stands:** determinism buys replay (which *ships* as the Meditation feature), regression testing, and a fair adaptive-AI story. Memorisation is not the threat it would be in a game with fixed enemy scripts, because the opponents adapt.

**Reopen if:** M1 playtesting reveals that fights feel robotic. The fix would be authored variation selected by a seeded, replayable sequence — preserving determinism while removing predictability.

---

## OD-14 — Platform: is the Nintendo successor realistic?
**Recommendation:** treat it as a stretch goal, reviewed at vertical-slice exit against real performance data.

**The open question:** the 60fps requirement is non-negotiable, and it is the thing most likely to make that platform impossible. We should decide with measurements rather than optimism.

**Resolution path:** M6, with a profiling pass on representative hardware.

---

## What stops a fight that nobody starts?

**Raised by:** the native M1 build, `NATIVE_M1_REPORT.md` §9.10.
**Status:** open, and it blocks Native M1 criterion 3.
**Reproduce:** `node reference/tools/endurance.mjs --why`

Nothing bounds a fight's length — no timer, no clock, no decision — and nothing
penalises not fighting. A player who holds "back and sideways" is never caught at
**any** opponent temperament: over twenty simulated minutes not one event fires, and
both fighters' breath, will and vitality stay at maximum. Nine of eighteen passive-player
cases never resolve.

It is not an AI bug in the ordinary sense. The opponent travels *faster* than the
player (0.0262 vs 0.0246 m/tick) but splits its budget between advancing and mirroring
the circle, so it closes at 0.0147 m/tick against a player opening at 0.0170. Faster,
and converging slower.

This is a genuinely unspecified case. `COMBAT_SYSTEM.md` §66 says recovering Breath
requires making distance; it does not say what happens when someone makes distance
forever.

**The options:**

| | Fix | For | Against |
| --- | --- | --- | --- |
| 1 | **Breath costs sustained movement** | Physically true; closes the loop on itself — refusing to engage tires you, and a tired man cannot refuse. Most in keeping with a game whose thesis is that competence creates options | Touches a core resource curve; every trace regenerates |
| 2 | **Opponent cuts the angle** | Interception rather than pure pursuit, or escalating commitment after N quiet seconds. Leaves the player's own numbers alone | A cleverer opponent is a harder game; and it fixes the symptom, leaving "not fighting is free" true |
| 3 | **A round limit** | Cheapest | The design has no scoring, so a decision needs a judging rule invented for it. Least in keeping |

**Resolved by a fourth option that was not on the list: URGENCY.** None of the three was
right, because all three treated a symptom. The real absence was that nothing in the
model measured *how long since anything happened*, so a fighter could not tell a
considered pause from a fight that had stopped. Adding that measurement — an eleventh
scoring term, ramping after five seconds of no contact — takes nine stalls to four and
changes nothing about any fight that was already working: all seven committed traces
regenerate byte-identically. Option 1 was rejected on reading `COMBAT_SYSTEM.md` §66,
which makes footwork the *recovery* loop; charging breath for it would have inverted a
stated rule.

See `NATIVE_M1_REPORT.md` §9.10.

---

## Should a body that is beaten be able to keep fighting forever?

**Raised by:** `NATIVE_M1_REPORT.md` §9.11, found once URGENCY stopped hiding it.
**Status:** open, and it is what now blocks Native M1 criterion 3.
**Reproduce:** `node reference/tools/endurance.mjs`

Over twenty simulated minutes a passive player absorbs **414 clean hits and 137
structure breaks**, has their torso destroyed outright, and the fight does not end. No
terminal route can be reached:

- **`unconscious`** needs `vitalityFraction <= 0`, and that sums **all six regions**. An
  opponent striking head and torso never touches the arms, so the total stays high while
  the parts that matter are gone.
- **The Final Inch** and **`yielded`** both need `will` to fall, and will regenerates —
  the attacker gains it on every answered blow, and the defender's recovers.

So the two values that decide endings both sit near maximum on a body that has lost.

**The options:**

| | Fix | For | Against |
| --- | --- | --- | --- |
| 1 | **A destroyed vital region ends it** — head or torso at zero is finished, regardless of the total | Matches the fiction: nobody fights on with a destroyed torso because their arms are fine. Smallest change | Makes head damage decisive, which changes what every technique is worth |
| 2 | **Weight the regions** in `vitalityFraction` — head and torso dominate, limbs contribute little | Keeps the aggregate model; one function changes | A weighting is a balance surface, and picking numbers is the whole job |
| 3 | **Will stops regenerating while losing** — no answer bonus below some structural threshold | Goes at the mechanism directly: will is meant to model the decision to keep going, and a dismantled fighter deciding to keep going is the bug | Touches the Inch and the Stop, the game's centre |

**Measured, for option 3.** Will never falls far enough for anything to fire: over
twenty minutes against a passive player it bottoms out at **64.4**, and at **68.3** while
staggered — the Inch needs below 55. The player is staggered for 4,658 ticks and never
goes down once. At aggression 0.15 a blow lands roughly every 174 ticks, and
regeneration returns 8.7 will in that gap against the 2-4 the blow took. **Composure
outruns damage because the damage is sparse**, which may well be right for one light
blow every three seconds — and is the reason this is a design question rather than a
bug.

I implemented option 3 in its broad form (no regeneration while gassed, staggered or
down) as an experiment and reverted it: it took stalls from 4 to 3, did **not** close the
414-hit case, and picking it by re-running the numbers until a test passed would be
designing the Final Inch's threshold economy by trial and error. The narrow half of it —
no regeneration on the tick the gassed drain applies — was a straightforward correctness
fix and has shipped (`NATIVE_M1_REPORT.md` §9.12).

### All three are now measured — choose by reading, not by reasoning

`node reference/tools/experiments/n22.mjs` applies each candidate to a throwaway copy of
the simulation, runs the same three measurements, and discards it. The real tree is never
touched. Adding a fourth idea is four lines, deliberately.

| | stalls | engaged fights | median | traces to re-baseline | endings reachable |
| --- | --- | --- | --- | --- | --- |
| **baseline** | 4/18 | all resolve | 13.0s | — | `finished` only |
| **option 1** | **2/18** | all resolve | 11.8s | **2 of 8** | `finished` + **`unconscious`** |
| **option 2** | 4/18 | all resolve | 13.0s | 0 of 8 | `finished` only |
| **option 3** | 3/18 | all resolve | 11.0s | **7 of 8** | `finished` only |
| **1 + 3** | **2/18** | all resolve | 10.9s | 7 of 8 | `finished` + **`unconscious`** |

**Option 2 cannot work, and that is a proof rather than a result.** `vitalityFraction`
is a weighted sum of non-negative terms, and such a sum is zero only when every term
with a non-zero weight is zero. So no weighting reaches zero while an untouched arm has
a positive weight — and a weighting that gives limbs weight zero *is* option 1, with
extra steps and a worse name. Strike it.

**Option 1 is the strongest on every axis measured.** It halves the stalls, is the only
candidate that brings a second ending back to life, costs the fewest re-baselined
fixtures by a wide margin, and makes ordinary fights slightly *quicker* rather than
slower. Option 3 does less, for three and a half times the blast radius.

**What option 1 actually asks you to accept:** head damage becomes decisive. A fighter
whose head reaches zero is finished on the spot, regardless of the rest of them. That is
faithful to `COMBAT_SYSTEM.md` §32 — *"Vitality reaching zero means unconscious or
unable to continue"* — read as the located model §34 describes, and it changes what every
head strike is worth. That revaluation is the decision, and it is the part I should not
make for you.

**Still not chosen here.** Say the word and it is one pass: implement, port to Swift,
re-baseline the two traces, and extend the tests.

---

## Decisions deliberately NOT open

Recorded so they are not re-litigated:

- The Final Inch is the game's central mechanic.
- Structure is directional (quadrants), not a bar.
- Styles are grammars of intent; the inputs never change.
- There is no XP tree; acquisition is the five channels with provenance.
- Ruhn is the final boss, he is right, and he is not secretly evil.
- The world is the Concord, not feudal Japan.
- No open world.
- No loot, no gear score, no damage numbers by default.
- No morality meter, ever.
- 60fps is a design constraint.
- Combat animation is never AI-final.
