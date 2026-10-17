# GAME_VISION.md
## Path of the Martial God — High Concept & Combat Thesis

**Status:** Design lock candidate — v1.0
**Date:** 2026-09-14
**Owner:** Blake Taylor
**Read first.** Everything else in this package is downstream of this document.

---

## 1. One-sentence pitch

*Path of the Martial God* is a third-person martial-arts action RPG in which you are raised from the age of nine by a man who once broke sixty-three teachers to prevent a war, and who is trying to find out whether the restraint he never had can be taught.

## 2. The combat thesis

Every design decision in this package descends from one sentence:

> **A martial god is someone who can end any fight and chooses how it ends.**

Power is the capacity to author outcomes. Godhood is not the capacity — it is what you do with the authorship. Therefore the mechanical spine of the game is not *more damage*. It is **more terminal options**.

- A beginner can only flail until a number runs out. They have one ending available: the fight stops when the other person can no longer stand.
- A competent fighter can choose between hurting someone and out-lasting them.
- A master, standing over a broken opponent, can break the arm, take the back and choke them unconscious, dismantle their base until they cannot continue, submit them, humiliate them, kill them — or stop one inch short and let them feel it.

Each of those is a **distinct mechanical act** with distinct animation, distinct cost, and distinct consequences in the world. We call the moment where the fight is decided and the player selects among them **the Final Inch**.

This produces the three properties the game needs, from one idea:

1. **Progression is perceptible without a menu.** You know you got better because you have choices you did not have before.
2. **Morality is not a meter.** The moral system's primary input channel is a fighting decision made at fighting speed, under pressure, with no dialogue wheel. Character is what you do when there is no time to perform being good.
3. **The mentor relationship and the morality system are the same system.** Ruhn took the player specifically to find out what they do in that moment. Every training hour is him running the experiment. The ending is the result.

**Corollary — the anti-thesis.** If a feature makes the player stronger without giving them a new *choice*, it is a stat, and stats are the failure mode this game is built to avoid. When evaluating any proposed mechanic, the question is not "does this make the player more powerful?" It is: **"does this widen the space of things the player can decide to do to another person?"**

## 3. Player fantasy

> *"I learned how to fight. I know exactly who taught me each thing I know, and what it cost. People can tell what I am from across a room. And I have decided, over and over, at speed, what kind of person I am going to be with it."*

Explicitly **not** the fantasy:
- Not "I found purple gloves with +37 DPS."
- Not "I hit level 60."
- Not "I unlocked the secret technique that wins."
- Not "I am the chosen one." The player has no bloodline, no prophecy, and no innate gift. They were chosen for a pause, not for talent.

## 4. Genre

**Third-person martial-arts action RPG.** Specifically:

- **Action core:** a deterministic, frame-authoritative hand-to-hand combat system. Timing and spacing decide fights.
- **RPG shell:** long-form narrative across eighteen years of a life, persistent relationships, a world that holds beliefs about you, meaningful and divergent endings.
- **Not** an open-world game. Not a looter. Not a roguelite. Not a fighting game (no versus mode at launch).

The RPG layer exists to give the action layer **consequence and memory**. It never exists to gate the action layer behind numbers.

## 5. Camera perspective

Third-person, close, grounded, with **four distinct modes** (specified in `ART_DIRECTION.md` §7 and the camera section of `COMBAT_SYSTEM.md`):

| Mode | Use |
| --- | --- |
| **Travel** | Exploration. Over-shoulder-adjacent, slight handheld, low horizon. |
| **Duel** | One-on-one. Soft-lock two-shot at a slight angle off the fighters' axis, camera drops to chest height. Distance is legible because the camera respects the line between the two bodies. |
| **Field** | Group fights. Rises and widens, soft-targeting, diegetic peripheral threat cues. |
| **Inch** | The Final Inch and cinematic finishes. Deliberate angle that shows **both faces**. You do not get to end a person off-camera. |

## 6. Target platforms

- **Primary:** PC (Steam) — lead platform, keyboard+mouse supported but **controller-first design**.
- **Secondary (V1 ship target):** PlayStation 5, Xbox Series X|S.
- **Stretch:** Nintendo's current-generation successor hardware, subject to a performance review at vertical-slice exit.
- **Explicitly out of scope:** mobile, VR, cloud-only.

**Performance target:** 60fps locked on all target hardware. This is a non-negotiable design constraint, not a polish goal. A game whose entire premise is timing windows and readable bodies cannot ship at 30fps. If visual fidelity threatens 60fps, fidelity loses. See `RISK_REGISTER.md` R-07.

## 7. Target audience

**Primary:** players aged 22–40 who finished *Sekiro* and *Sifu* and wanted the fighting itself to be the subject rather than the obstacle. People who rewatch fight scenes. People who have trained something, even briefly, and noticed that the games never get the *feeling* of getting better right.

**Secondary:** narrative-RPG players who want a character arc with real moral weight and are willing to learn a demanding combat system to get it. Supported by a genuine, non-condescending accessibility layer (`COMBAT_SYSTEM.md` §14) that widens timing windows and assists without removing the decisions.

**Not the audience:** players who want power fantasy without friction; players who want a hundred-hour open world; players who want a character-action spectacle game with air juggles.

## 8. Expected campaign length

| | Main path | Thorough play |
| --- | --- | --- |
| **Version 1 (what we ship)** | **20–24 hours** | 30–34 hours |
| **Dream game (full vision)** | 25–30 hours | 34–40 hours |

**Vertical slice:** 45–55 minutes (`VERTICAL_SLICE.md`).

Figures elsewhere in this package refer to **V1** unless stated otherwise; the scope ladder is in `VERTICAL_SLICE.md` §1.

This is deliberately shorter than the genre average. The game is dense rather than long. Every hour should contain a fight you remember.

## 9. Replayability model

Not a New Game+ treadmill. Three real drivers:

1. **Fighting identity is exclusive.** Your body can only support so much (`PROGRESSION.md` §2). A pressure-grappler build and an outside-deception build are genuinely different games at the mechanical level, and neither can reach the top of the other's tree in one life.
2. **The world remembers differently.** Standing is built from *rumor*, not truth (`MORALITY_AND_REPUTATION.md`). A second playthrough with different conduct produces different factions open to you, different rival trajectories, different boss encounters, and a materially different final act.
3. **Second Life (NG+).** Carries the **Ledger** forward as a *readable record*, not as power: you begin again at nine, and the notebook contains a previous life's handwriting. Techniques do not carry. Knowledge of *where they came from* does, which changes how the game reads. Optional and thematically motivated, not a stat reset.

## 10. Comparables — and exactly where we diverge

Naming the reference is not the same as copying it. For each, what we take and what we deliberately refuse.

### Sifu
- **Take:** the density of hand-to-hand exchange; the readability of a single opponent's body; the refusal to make fights long.
- **Diverge:** Sifu's central mechanic is aging as a *death penalty* — you pay years for failure inside a single revenge night. We age the protagonist as **story**, across eighteen years, and defeat marks the **body** (persistent injuries) rather than spending a life budget. Sifu is a revenge arc against strangers; this is a *relationship* with one man across a lifetime. Sifu's morality is a binary spare/kill gate on five bosses; ours is a continuous behavioural record read by a world that only knows rumours.

### Sekiro
- **Take:** posture as the primary fight resource; the idea that defence is offence; boss fights as lessons.
- **Diverge:** Sekiro's posture is a single shared bar and its combat is fundamentally a **rhythm duel with one weapon**. Ours is **directional structure** — a base with four quadrants — which makes angles and footwork mechanically real, and we have **six grammars** of attacking that structure rather than one. Sekiro's death loop is a hard fail-and-retry; ours frequently continues the story through defeat. Sekiro gives you a fixed toolkit; our toolkit is acquired with provenance and can be *stolen from the people who beat you*.

### Absolver
- **Take:** the ambition of combat as a personal language; deck-building your own sequences; learning by absorbing what hits you.
- **Diverge:** Absolver's combat deck is a **loadout** — a menu of moves stitched into strings, and its world is a thin PvP sandbox with no story or mentor. We refuse the loadout entirely: styles are **grammars of intent**, the inputs never change, only their meaning does. And we put the whole thing inside a single-player life story with an actual dramatic spine. Absolver proved players want to build a fighting identity; it never gave them a reason to care.

### Sleeping Dogs
- **Take:** the weight and crunch of unarmed impact; environmental takedowns that feel like a real place fighting back.
- **Diverge:** Sleeping Dogs' combat is an open-world crowd-clearing system with a shallow ceiling and a counter button. We are building for one-on-one depth and a very high ceiling, and we are not an open-world crime game.

### Ghost of Tsushima
- **Take:** stance switching as a real tactical answer to enemy types; restraint in UI; landscape as mood.
- **Diverge:** Tsushima's stances are a **rock-paper-scissors key** to armed enemy archetypes — the correct answer is knowable and then applied. Our styles are not keys; matchups are non-transitive and situational, and the endgame is abandoning named stances entirely. Also: no katana. Hand-to-hand is the subject, not a side option. And we are not doing feudal Japan (`WORLD.md` §1).

### Yakuza / Like a Dragon
- **Take:** the tonal courage — a game can be about a fighter and also about a neighbourhood, a debt, a kid; style switching with real personality; NPCs who remember you.
- **Diverge:** Yakuza's fighting is a beat-'em-up with heat actions and a comedy register that undercuts consequence. Our violence has permanent physical costs, and our moral weight is load-bearing rather than melodramatic.

### Shenmue
- **Take:** the willingness to make training itself the content; time passing as a real force; a world with a schedule.
- **Diverge:** Shenmue's training is largely a repetition-counter attached to a stat, and its combat never becomes the reason to play. Our training drills **are** the combat system taught in isolation, and every drill maps to a mechanic you will use under pressure that day.

### Explicit points of differentiation (the elevator version)

1. **The Final Inch.** No other game in this space makes *how you end a fight* a moment-to-moment mechanical decision with a world that tracks it.
2. **Directional structure.** Balance is a base with quadrants, not a bar. Footwork and angles are mechanically real.
3. **Three fidelity tiers of animation per technique.** The character visibly loses excess motion as they master a move. You can see competence.
4. **The Ledger.** You do not buy techniques from a tree. You are taught them, you steal them from people who hit you with them, you earn them by winning, you derive counters and **name them yourself**, or you inherit them from the dead. Every entry records where it came from.
5. **Rumour, not reputation.** The world does not know what you did. It knows what it heard. You cannot correct it with dialogue — only with a new, witnessed pattern.
6. **The mentor is the experiment.** The final fight is an argument that can only be settled in the one language both of you speak, and it is an argument in which the master is *right*.

## 11. What this game is not

A short list, kept for use in every future scope argument:

- Not open-world. Regions are hand-built, dense, and closed.
- Not a loot game. No rarity tiers, no gear score, no damage numbers by default.
- Not a "choose your ending" game. There is no final dialogue wheel. By the last scene, the game already knows who you became.
- Not a morality-meter game. There is no karma bar, no blue/red aura, no "you are now Honourable."
- Not a simulator. We research real martial principles because they make better mechanics, not because we owe anyone accuracy.
- Not a supernatural wuxia power fantasy. Nobody flies. Nobody glows. The most frightening thing in this game is a sixty-eight-year-old man standing still.
- Not "generic Unreal martial arts game." See `ART_DIRECTION.md` §1, which exists specifically to prevent that.

## 12. The title

"Martial God" is a term used *in the world*, and the world does not agree on what it means. To the Iron Road it is a marketing word for an unbeatable escort. To the Thousand Steps it is blasphemy — the art has no gods. To the Ninth Bell it is a legal problem: a person no court can answer. To Ruhn it is the precise name for the disaster he became.

The game never tells the player they have become one. Other people say it about them, and whether it is said with awe or with fear is the score.
