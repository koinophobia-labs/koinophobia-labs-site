# CORE_PILLARS.md
## The six pillars, and the test each one imposes

Every feature proposal is checked against these. A feature that serves no pillar is cut. A feature that violates one is cut even if it serves another.

The universal question, asked of every mechanic:

> **Does this make becoming a martial artist more interesting?**

If the honest answer is "it makes the player more powerful," that is a no.

---

## Pillar 1 — Martial mastery feels earned

**The claim:** the player begins visibly incompetent and becomes visibly excellent, and the difference is legible without opening a menu.

**How we deliver it (three mechanisms, all mandatory):**

1. **Animation economy.** Every core technique has three authored fidelity tiers — **Rough**, **Sound**, **Silent**. Rough has telegraph, over-rotation, a stagger on recovery. Silent is compact: it starts, it lands, it resets. The frame data follows the animation *honestly* — Silent is faster because the motion is genuinely shorter, not because a multiplier was applied to a Rough clip. The player can see why they got better.
2. **The Breath economy.** Inefficiency costs Breath. A Rough technique costs more Breath than a Silent one. Panic — mashing, blocking late, over-committing — costs Breath. As you master the art you stop getting winded, and you can *hear* it (`AUDIO_DIRECTION.md` §2). The stamina economy is the mastery meter.
3. **Assist withdrawal.** The nine-year-old gets generous help: wide deflect windows, strong auto-facing, snap-to-target on entries. As the character masters the art, the game quietly removes the training wheels. See the guard-rail below — this is the most dangerous idea in the package.

**The test:** *Show a stranger two clips of the same technique, ten seconds each, no HUD. Can they tell which one is later in the game?* If no, we have failed Pillar 1.

**Guard-rail (mandatory, non-negotiable):** assist withdrawal is the single easiest way to make progression feel like a *nerf*. Rules:
- Assists only step down at chapter boundaries, never mid-chapter.
- Every step-down is paired, in the same story beat, with a capability gain that measurably outpaces it. The player must end that beat objectively more capable than they began it, measured in telemetry, not in vibes.
- Every step-down is narratively framed. Ruhn stops correcting your stance. The world stops going easy on a child.
- A telemetry gate at vertical-slice playtest: if median player performance *drops* across a step-down boundary, the feature is cut and Pillar 1 rests on mechanisms 1 and 2 alone. Recorded in `OPEN_DECISIONS.md` OD-03.

---

## Pillar 2 — Styles are philosophies, not loadouts

**The claim:** a martial art changes how you *approach* a fight, not what your numbers are.

**The forbidden design:** `Karate = +10 damage`. `Kung Fu = +5 speed`. Any style whose description can be reduced to a modifier is not a style; it is a hat.

**How we deliver it.** The single most important architectural decision in the game:

> **The inputs never change. The meaning of the inputs changes.**

The player learns a language of **intent** — pressure, retreat, angle, close, break — expressed through the left stick and seven verbs. Each style is a **dialect** that reads those intents differently. Angling laterally while striking produces a switch-kick in Split Reed, an arm-drag to the back in Standing Water, and a pivot-throw in Glass Hour. Same input. Different sentence.

This is what makes the endgame possible. Because the player becomes fluent in *intent* rather than in button strings, a late-game fighter can change dialect mid-sentence — and eventually stop speaking any named dialect at all (`MARTIAL_STYLES.md` §9, the Quiet).

Each style must also own a distinct answer to **which resource it attacks** and **which distance it prefers**. Six styles, six answers, arranged in a non-transitive web rather than a power ladder.

**The test:** *Describe a style without using a number.* If you can't, it isn't a style.

---

## Pillar 3 — Every fight tells a story

**The claim:** important opponents are recognisable as people, from across a room, before they speak.

**How we deliver it.** Every named fighter is authored along seven axes, and those axes are *visible in play*:

| Axis | How the player perceives it |
| --- | --- |
| Posture | Silhouette, guard height, weight distribution |
| Tempo | How long they wait; how many actions they chain |
| Preferred range | Where they try to stand, and what they do when you leave it |
| Temperament | How they respond to being hurt, mocked, or shown mercy |
| Habits | The thing they always do — their own exploitable pattern |
| Adaptations | What they buy when they read you (`COMBAT_SYSTEM.md` §11) |
| Weakness | The genuine hole, discoverable by play, not by a codex entry |

**The prohibition:** no waves of interchangeable humans. Trash mobs exist — dock toughs, rail guards, pit hopefuls — but they exist in **archetypes with authored behaviour**, and crucially they are *the same people over time*. The man you break in Chapter 2 is working a gate in Chapter 5. Population is finite and persistent (`WORLD.md` §8).

**The test:** *Can a player describe a mid-game opponent to a friend without naming a mechanic?* "The tall one who won't come forward and keeps touching his face" is a pass. "The 400-HP one" is a fail.

---

## Pillar 4 — Growth is physical and moral

**The claim:** who the player becomes is the product of accumulated behaviour under pressure, and the world responds to *patterns*, not to acts.

**How we deliver it.** The Final Inch (`COMBAT_SYSTEM.md` §10) makes moral choice a fighting decision at fighting speed. Standing (`MORALITY_AND_REPUTATION.md`) converts a record of those decisions into *beliefs held by specific people*, transmitted as rumour along real channels with delay and distortion.

Three refusals:
- **No meter.** There is no number, bar, aura, or label. The player is never told they are Merciful.
- **No preview.** The game never signals what an action will cost reputationally, before or after.
- **No obviously correct answers.** A meaningful share of moral situations are authored so that both options have a genuine cost, and at least one recurring dilemma per chapter has no defensible resolution at all.

**Physical growth is equally real:** the body is shaped by what you train, permanently marked by what you survive, and those marks constrain and redirect your fighting identity (`PROGRESSION.md` §2, §4).

**The test:** *If a player could see the reputation system's internals, would they play differently?* If yes, the system is too gameable and needs more witness-dependence and more weighting toward costly acts.

---

## Pillar 5 — The master relationship matters

**The claim:** the mentor is a person, not a tutorial delivery mechanism, and a late confrontation with him should genuinely hurt.

**How we deliver it.** Ruhn is designed as an *experiment runner* (`MASTER.md`). He chose the player for a pause, not for talent. He is trying to learn whether restraint survives capability. Consequently:

- Training is never generic. Every drill Ruhn sets is chosen in response to something he saw you do, including moral things.
- Ruhn's channel is **separate from the rumour network**. He does not know what the world says about you. He knows what he has seen with his own eyes, and what he has been told by exactly three people he still trusts. This is why the ending is earned rather than tallied.
- He is **right**, and being right is the problem. The final confrontation is not "teacher secretly evil." It is a disagreement about whether a person who cannot be answered should exist, argued by two people who can only argue in one language.

**Budget commitment:** the master relationship gets the highest per-minute production spend in the game — hand-keyed animation, final VO from a first-choice performer, bespoke music. It is the emotional load-bearing wall. It is never the thing we cut to save the schedule.

**The test:** *Would a player hesitate before the final input?* That is the whole game.

---

## Pillar 6 — Skill matters more than loot

**The claim:** mastery is the primary source of power. Full stop.

**How we deliver it:**
- **No weapons progression, no armour, no rarity, no gear score, no damage numbers by default.**
- Clothing exists and has *texture* rather than power: hand wraps reduce accumulated hand injury, iron-shod boots change footing on wet stone and cost you silence, a heavy coat blunts cold and slows rotation slightly. None of it is a power axis, and none of it is ever the answer to a fight.
- Your coat is the one persistent object in the game, and it matters because it is a **map of where you have been** — torn, patched, and repaired in the local style of wherever it was repaired (`ART_DIRECTION.md` §5). Zero mechanical benefit. Enormous identity value.
- Conditioning attributes exist but are a **shape**, not a level: paired sliders under a hard budget, moved slowly. There is no "level 47."

**The test:** *Can a player explain why they won a hard fight without mentioning an item?* Yes, always, by construction.

---

## Cross-pillar principle: depth over breadth

Prefer few systems that interact deeply over many systems that sit beside each other. The systems in this game are wired together on purpose:

- The **Breath** economy is the stamina system *and* the mastery meter *and* the audio HUD.
- The **Final Inch** is a combat mechanic *and* the morality input *and* the ending selector.
- **Meditation** is the tutorial *and* the replay viewer *and* the analytics surface *and* how the player discovers that opponents are reading them.
- **Structure quadrants** are the defence system *and* the reason footwork exists *and* what makes hit reactions look physically honest.
- The **Ledger** is the progression UI *and* the menu *and* the record of every relationship the player has had with violence.
- **False Face's Lie** does not merely feint the opponent — it poisons their adaptive read table. One system attacking another system.

When a feature is proposed, prefer the version that plugs into three existing systems over the version that adds a fourth.
