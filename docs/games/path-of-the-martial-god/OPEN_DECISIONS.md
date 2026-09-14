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
