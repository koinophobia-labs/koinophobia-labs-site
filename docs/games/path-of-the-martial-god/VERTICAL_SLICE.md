# VERTICAL_SLICE.md
## Scope ladder and the 50-minute slice

---

## 1. The scope ladder

Three tiers. **We build the third one first, and we do not build the second until the third proves the game.**

### Dream Game
The complete vision if everything succeeds.

- 25–30 hour campaign, eight chapters, eighteen years
- **6 styles + the Quiet**
- 6 regions, fully built
- ~14 major bosses, ~40 named opponents, ~90 persistent fighters
- Full rumour propagation with all six channels
- Five endings, full epilogue assembly
- Post-campaign **Teaching** mode: take students, and discover that they are learning your habits rather than your reasons
- Second Life (NG+) carrying the Ledger forward as a readable record

### Version 1 — what we actually ship
Cut hard and deliberately. Everything removed is removed because a specific cheaper thing covers its job.

| | Dream | **V1** | What covers the gap |
| --- | --- | --- | --- |
| Campaign | 25–30h | **20–24h** | Density over length |
| Styles | 6 + Quiet | **4 + Quiet** (Low River, Split Reed, Standing Water, Glass Hour) | All four distance bands and all three target resources are covered; the web stays non-transitive |
| Cut styles | — | Hooks, False Face | Hooks' pressure niche is partly served by aggressive Low River. **False Face's best idea survives as the universal Lie**, which improves every style |
| Regions | 6 | **5** (Mudgate, the Cut, Ironmouth, Ninebell, the Thousand Steps) | The Iron Road becomes **connective tissue** — trains, barges, waystations — rather than a hub. Cheaper and better |
| Bosses | 14 | **9** (+ Ruhn twice) | `BOSSES.md` §2 |
| Named opponents | 40 | **22** | |
| Persistent fighters | 90 | **90** | **Not cut.** It is cheap (a record per entity) and it is the proof of two pillars |
| Endings | 5 | **5** | **Not cut.** They are the thesis, and they are mostly assembly rather than new content |
| Rumour channels | 6 | **5** | Letters folded into rail/river |
| Teaching mode | Yes | **No** | Post-launch |
| Second Life | Yes | **No** | Post-launch |

### Vertical Slice — what we build first
**45–55 minutes**, one region (Mudgate), and it must be genuinely finishable by a small team. It exists to answer one question: **does becoming a martial artist feel good enough to justify twenty more hours?**

---

## 2. Slice contents against the brief

| Required | In the slice |
| --- | --- |
| Protagonist | Vahn, ages 9 → 12 |
| Master | Ruhn, five scenes, including the boss fight |
| One training space | Ruhn's yard, in three seasons |
| One exploration space | Mudgate village and the barge dock |
| One standard enemy archetype | Iron Road dock toughs (pressure brawlers) |
| One advanced opponent | **Kem Du-ro**, age 14 |
| One boss | **Ruhn — the First Test** |
| At least two styles | Low River (taught) + a stolen Split Reed stance (Impression) |
| Progression | Rough → Sound tier promotion, visible and felt |
| Dialogue | ~14 scenes, full VO |
| One meaningful moral consequence | The prologue Final Inch, paid off 20 minutes later |
| Enough story to demonstrate tone | The whole slice is the game's premise |

---

## 3. The slice, beat by beat

### Beat 1 — Water (0:00–0:05) · *the world*
Mudgate. The player, age nine, carries two buckets up a levee. Controls: walk, carry, and — when they trip — **fall**.

At the bottom of the levee, a **Ninth Bell arbitration boat** is moored. Two adults are settling a property dispute by proxy duel while a clerk writes it down. It is formal, brief, unspectacular, and entirely legal.

**The point:** before the player throws a single punch, they learn that in this world **violence is paperwork**. Nobody explains it. A nine-year-old watches it the way a child watches adults doing a boring job.

### Beat 2 — The first fight (0:05–0:11) · *incompetence*
Three older children take the buckets. The fight is the combat tutorial and **the player loses it.**

What the losing fight teaches, in order:
- Guard exists and it is not enough.
- Mashing gasses you. (First experience of **Breath**.)
- Your base can be taken. (First **Structure Break**, from behind, which is exactly how it happens to children.)
- Getting up matters.

**This is the player's first experience of the combat system, and it is failure.** A player who has felt incompetence for six minutes will feel competence for the next twenty-five hours.

### Beat 3 — The pause (0:11–0:12) · *the moral consequence*
One of them trips and goes down hard. The player, bloodied, is standing over them with a free shot.

**The first Final Inch.** Time dilates. Two real options, expressed as inputs the player already knows. **No prompt explains what this means.**

Ruhn is mending nets on the levee, forty metres away, and he is watching.

> **Design note — the branch.** If the player *takes* the shot, Ruhn still approaches, and he still teaches them, **for the opposite reason** — he has seen the thing he recognises, and the experiment becomes about whether it can be *undone* rather than preserved. His dialogue in Beats 4 and 10 changes substantially, the slice recolours, and the final line lands as a threat rather than a question. **Both branches are fully authored in the slice.** This is the single most important thing the slice proves: that the game watches.

### Beat 4 — Ruhn (0:12–0:15) · *the offer*
He does not comfort the player. He does not praise them. He asks one question about the fight, waits for an answer, and then offers exactly one thing:

> *"I will teach you to fall."*

The player follows him to the yard. The game's title card does not appear.

### Beat 5 — The yard (0:15–0:29) · *training, and the tier promotion*
Three drills, each teaching a real system (`TRAINING_AND_MASTERY.md` §3):

1. **Falling** — the recovery system. Thematically: your first lesson is how to be defeated safely.
2. **The Base** — Ruhn pushes; you keep your base. Teaches Structure quadrants directly.
3. **The Count** — reaction drill. Teaches deflect timing, then gets irregular.

Then the sequence **repeats three times**, in-engine, with the yard changing season and the player's clip set promoting **Rough → Sound**. Each pass is ~90 seconds. The player is 9, then 11, then 12.

**This is the single most important 14 minutes in the slice.** The player *performs* the passage of time, and they see and feel their own animation clean up. If this beat does not land, Pillar 1 does not exist and the project should be reconsidered.

Ruhn says four sentences across the whole sequence. One of them is the first of his three sincere compliments.

### Beat 6 — Mudgate (0:29–0:37) · *exploration and consequence*
Age 12. The village opens: the river market, the barge dock, the rope bridge, the shrine, the Ninth Bell mooring.

- **The consequence payoff.** The child from Beat 2 is here. If the player stopped, he is wary and civil and there is an awkward, human exchange. If the player did not, **he has a limp**, and his mother is with him, and she looks at the player, and nobody says anything about it. The game does not comment.
- **Ambient rumour.** Two bargemen discuss the player, inaccurately, within earshot. First exposure to the rumour system.
- **The stolen stance.** On the arbitration boat's deck, a Ninth Bell escort drills **Split Reed** forms. Watching it long enough grants the stance as an **Impression** — bad, real, and entirely the player's own idea. First Ledger entry from channel II.

### Beat 7 — The dock (0:37–0:43) · *the standard archetype, and the first win*
Three Iron Road dock toughs, pressure brawlers, over a genuinely petty dispute about a crate.

**The first winnable fight**, and the first time the systems feel good. The player gets shoulder-checked repeatedly and acquires **Shoulder Check** as a stolen Impression, with its provenance line written into the Ledger in front of them:

> *"Shoulder-check — the barge dock, age twelve. A rail guard whose name I never got. He did it to me six times."*

### Beat 8 — Kem (0:43–0:48) · *the advanced opponent*
**Kem Du-ro**, 14, a barge-boy who is better than the player and *delighted about it.* Genuinely difficult, genuinely fair, non-lethal, and winnable or losable.

He is the first opponent with a real **Read** — repeat an opening twice and he stops it, visibly, and laughs.

**He becomes the player's friend either way.** And if the player was brutal in Beat 3, **Kem is thrilled about it** and says so, warmly, which is the first quiet note of what he eventually becomes.

### Beat 9 — Back to the yard (0:48–0:50) · *the setup*
Ruhn has been told about the dock. He does not ask what happened. He says he wants to see something, and steps into the yard, and puts one hand behind his back.

### Beat 10 — The First Test (0:50–0:56) · *the boss*
**Ruhn spars the player with one hand behind his back, and only defends.** He does not attack once.

**The win condition is not damage. The player must land one technique that he does not expect.**

- His **Read** is fully active and merciless. Repeat anything and he shuts it down completely, and he tells you so, flatly, once.
- Guard and pressure accomplish nothing — he simply is not there.
- The solution is the **Lie** (a feint, `COMBAT_SYSTEM.md` §6.1), or an **angle** the player learned from the stolen Split Reed stance, or the stolen shoulder-check used as an entry rather than a strike.

**The fight is the game's thesis as a boss encounter: you cannot win by force, you must win by understanding.** It is short, it is hard, and it is entirely fair, and it uses only mechanics the previous forty-five minutes taught.

### Beat 11 — The hook (0:56–0:58)
The player lands it.

Ruhn stops. He looks at his own arm where it connected. The rain starts, or does not. There is a long silence — long enough to be uncomfortable — and then he says the thing that reframes the entire game.

The shape of the line is fixed even though the text is not: **he is not pleased, and he is not angry. He has just received the first result of an experiment the player does not know they are in**, and it is not the result he expected, and now he has a decision to make about a twelve-year-old.

**Title card. Cut to black.**

---

## 4. What the slice proves

| Claim | Proven by |
| --- | --- |
| Mastery is perceptible without a menu | Beat 5's tier promotion |
| Styles are philosophies | Beat 6's stolen stance vs. taught Low River |
| Combat is readable with no HUD | The whole slice ships HUD-off by default |
| Fights have personality | Kem, and the dock toughs' authored habits |
| The Final Inch works | Beat 3, paid off in Beat 6 |
| Morality has consequence without a meter | The limp |
| The master relationship carries weight | Beats 4, 5, 9, 10, 11 |
| Adaptive AI is fair and legible | Kem's read, then Ruhn's |
| The world is specific and unoccupied | Beat 1's arbitration boat |
| Defeat is content | Beat 2 |

## 5. What the slice deliberately does not include

- No rumour propagation across regions (one settlement only — but the *ambient rumour lines* are in, to prove the surface)
- No Standing model beyond a single flag (the Beat 3 branch)
- No Custody/grappling — **Standing Water is not in the slice.** It is the largest animation cost and the slice does not need it
- No Glass Hour, no the Quiet
- No injury persistence beyond cosmetic marks
- No factions beyond a visual presence
- No travel, no economy, no equipment
- One boss, one archetype, one advanced opponent

## 6. Slice production budget

| Asset | Count |
| --- | --- |
| Playable characters | 1 (ages 9 and 12) |
| Full NPCs | 4 (Ruhn, Kem, the child, the mother) |
| Secondary NPCs | ~10 |
| Environments | Mudgate village, the yard (×3 seasons), the dock, the boat |
| Techniques | **14** (10 Low River, 4 Split Reed Impressions) |
| Tiered techniques | **8** at Rough + Sound (Silent not required in the slice) |
| Animation clips | **~190** |
| VO lines | ~140 |
| Music cues | 3 |

**Target: buildable by a team of 4–6 with AI-assisted production in approximately 7 months from combat-prototype start** (`PRODUCTION_ROADMAP.md`).

## 7. The bar

The slice succeeds if a playtester who has never heard of the game finishes Beat 11 and **immediately asks what happens next** — and, separately, if a playtester shown two ten-second clips of the same technique from Beat 5's first and third passes can tell which one came later **without being told what to look for.**

Those two tests are the production decision. Everything in this package is downstream of them.
