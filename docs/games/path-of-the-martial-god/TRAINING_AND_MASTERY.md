# TRAINING_AND_MASTERY.md
## How techniques are acquired, drilled, and mastered

---

## 1. The acquisition thesis: no unlock tree

**Challenged and rejected: the XP skill tree.** A tree tells the player that techniques are *purchases* — that the relationship between a fighter and a technique is a transaction against a currency earned by doing anything at all. It makes every technique feel identical in origin, which destroys the one thing this game wants most: that **a player remembers where each thing they know came from.**

Replaced by **the Ledger** and **five channels of acquisition**.

---

## 2. The five channels

Every technique in the player's Ledger carries a permanent **provenance line**: *where, when, from whom, and how*.

### I. Taught
Someone shows you and drills you. Enters at **Learned**. The most reliable channel and the slowest.
- Sources: Ruhn, paid teachers, faction instructors, the temples, a friend.
- Costs: time, sometimes money, usually an obligation.
- Ledger reads: *"Settle — the yard at Mudgate, spring, age twelve. Ruhn. He made me do it four hundred times and said nothing."*

### II. Stolen (observed)
A technique used **against you** enters your Ledger as an **Impression** — you can attempt it, badly. Impressions sharpen only through attempts in real fights, never in the dojo.
- Trigger: being hit by the same technique N times, or witnessing it used decisively in the world.
- This is the channel that makes losing productive. **You learn best what beats you.**
- Ledger reads: *"Shoulder-check — the barge dock, age twelve. A rail guard whose name I never got. He did it to me six times."*

### III. Earned
Defeat someone who used a technique against you during the fight, and it enters at **Sound** — because you have already solved it.
- The fastest channel, gated behind winning.
- Ledger reads: *"Cut — the pit at Ashgate. Won. It was the third thing he tried and it nearly worked."*

### IV. Derived
Successfully defend a specific technique N times and you discover its **counter**. The counter is *yours*. It has no name until you give it one.
- **The player names derived techniques.** Free text, stored, and used thereafter in the Ledger and by NPCs who have seen it. A master who witnesses it may ask what you call it.
- This is the strongest ownership mechanic in the game and it is nearly free to implement.
- Ledger reads: *"[Left Hook Catch] — my own. Derived against Yeo Ansa, Ninebell, age twenty-two. She has not landed it since."*

### V. Inherited
From the dead, from a lineage, from a scroll, from a rival's last request, from a teacher who has decided to stop.
- Rare, always story-authored, always emotionally weighted. Enters at **Sound** or higher.
- Inherited techniques are the only ones that can enter at **Silent**, and only from Ruhn.

**Design check:** every technique in the game must be acquirable through at least two channels, so that no build is locked out by a missed encounter — except the small authored set of Inherited techniques, which are meant to be missable and meant to hurt.

---

## 3. Training must be playable

Every drill is **the combat system taught in isolation**. No drill is a minigame with its own unrelated rules. If a drill does not map directly onto a mechanic the player will use under pressure that same day, it is cut.

### The seven drills

#### 1. Falling — *the recovery system*
The first playable lesson in the game. Ruhn pushes; you fall; you learn the three rises (quick, technical, stay down) and how to absorb impact. Thematically: the first thing a martial artist learns is how to be defeated safely, and it is the first thing Ruhn offers a child.

#### 2. The Base — *the Structure quadrant system*
Ruhn pushes you from varying angles; you maintain your base by shifting weight (left stick) and settling at the right instant. Directly teaches which quadrant is being attacked and how recovery works. Escalates to: keeping the base while being pushed *and* struck; keeping it on a moving barge deck.

#### 3. The Rope — *distance management*
Footwork along a line. Stay within a band relative to a partner who advances and retreats unpredictably. Teaches the distance bands and, later, Split Reed's measure. Escalates to: holding the measure while being attacked; holding it with your eyes closed, on sound alone.

#### 4. Hands — *contact reflex, deflect, redirection*
Bridged-arms sensitivity drill. Both fighters maintain contact; each tries to find an opening without breaking contact. Teaches deflect timing and the Glass Hour Borrow at close range. The most intimate drill in the game, and the one Ruhn does with the player at the start and end of the campaign, which is how we show eighteen years passing.

#### 5. The Count — *timing windows*
A reaction drill. Ruhn counts; on a cue you act. Then the count gets faster. Then it gets *irregular* — which is the actual lesson, because a real fighter does not keep time for you. Teaches deflect windows and, later, reading intent rather than reacting to motion.

#### 6. Forms — *economy of motion*
**Not** a Simon-says QTE. A form is a sequence the player performs freely, graded on **economy**: no excess input, correct rhythm, correct breathing (Focus input at the right beats), clean finish.

This is the one place a "perform" mechanic is correct, because economy of motion is literally the game's theme. **A high form grade is one of the two ways to promote a technique's animation tier** (§5). Forms are meditative, quiet, scored honestly, and short.

#### 7. Conditioning — *the Body*
A schedule decision, not a button-masher (`PROGRESSION.md` §2). You choose what to work; the change accrues over weeks; over-training injures. The interaction is choosing, not performing.

### Sparring — the master drill
Full combat against the master or a partner under **restrictions**, which is the best teaching tool in the design:

- *He uses only one style.* (Learn that matchup.)
- *You may only win by Structure.* (Learn the base game.)
- *You may not retreat past this line.* (Learn to stay in range of harm.)
- *You may not use your best technique.* (Break the crutch.)
- *You may only act after he does.* (Learn Glass Hour's discipline.)
- *He will not attack at all — land one thing he does not expect.* (The vertical slice's boss fight.)

Restriction sparring is cheap to author (a rules mask over the existing combat system), infinitely re-playable, and it produces the "I finally understood" moment better than any tutorial could.

### Meditation — review
Specified in `COMBAT_SYSTEM.md` §13. The fight recorder replayed with annotation. Tutorial, analytics, adaptive-AI discovery, and a character moment in one feature.

### Anti-sludge rules
1. **No drill may be repeated for reward beyond its ceiling.** Drilling carries a technique from Impression to Learned and to Sound — **never further** (§5). The dojo has a hard cap. You must fight.
2. **No drill lasts more than 90 seconds** without a change in the rules.
3. **Every drill escalates** across the campaign rather than repeating. The Count at age twelve and the Count at age twenty-four are different drills with the same name and the same man counting.
4. **Drills are skippable after mastery** with a one-button "he watches you do it once" resolution — except when the story wants the scene.

---

## 4. The mastery ladder

| State | Startup | Recovery | Breath | Animation tier | Chaining | Special |
| --- | --- | --- | --- | --- | --- | --- |
| **Impression** | Worst | Worst, with stagger | Highest | **Rough** | None | May fail outright under pressure |
| **Learned** | Poor | Poor | High | **Rough** | Limited | Reliable input |
| **Sound** | Normal | Normal | Normal | **Sound** | Normal cancels | — |
| **Silent** | Fast | Short | Low | **Silent** | Extended cancels | Gains one contextual variant |
| **Instinctive** | Fast | Short | Lowest | **Silent** + flourish | Free into Accord | **Gains its Final Inch terminal**; becomes available in the Quiet |

**No damage percentages at any step.** Everything that improves is time, cost, and option-space. A mastered technique is not stronger. It is *sooner, cheaper, safer, and it can end a fight in more ways.*

### Instinctive is the important one
Two things happen only at Instinctive:
1. The technique acquires a **terminal** — it can be used to finish at the Final Inch, which literally widens the player's moral option space. Mastery increasing the number of ways you can choose to end a person is the thesis in one rule.
2. The technique becomes available in **the Quiet**, outside its style's grammar.

---

## 5. How techniques advance — and why you cannot grind

**Advancement is by correct use under pressure, not by repetition count.**

A technique advances when it **succeeds against a genuine threat**, and advances fastest when it succeeds against a **new** threat. Formally, each success is weighted by:

- **Threat weight** — how dangerous the opponent was relative to you. Beating a dock tough advances nothing after Chapter 2.
- **Novelty** — has this technique succeeded against *this kind* of opponent before? Repeats decay sharply toward zero.
- **Correctness** — did it succeed for the right reason? A technique that landed because they were already staggered counts far less than one that created the opening itself.
- **Pressure** — was the fight in doubt? Success while comfortably ahead is worth a fraction.

**Consequences of this formula, all intended:**
- You cannot farm. Repeating the same technique on the same opponent type yields nothing.
- You cannot dojo your way to mastery: **drills cap at Sound**, permanently.
- A player who uses one crutch technique will find it stops improving, while the techniques they are forced to use in hard fights climb. **The system pushes variety without a variety bonus.**
- Progress is fastest exactly when the game is hardest, which is when it feels best.

### Promotion to Silent has a second gate
Reaching Silent requires *either* enough weighted successes *or* a high **form grade** for that technique's family (§3, Forms). This gives a deliberate, quiet, non-combat path for players who want to polish — and it is the only place dedicated practice pays off at high tier, which makes the dojo feel like it matters without making it farmable.

### Promotion to Instinctive has a third gate
You must land the technique **at the decisive moment of a significant fight** — the exchange that actually wins it. Instinctive mastery cannot be accumulated; it must be *proved once, when it counted*. The Ledger records which fight did it.

---

## 6. Martial trials

Authored challenge encounters, each attached to a style, each unlocking that style's **Silent** mastery state. They are not arenas. Each is a single specific problem:

- **Low River — The Bridge.** A rope bridge over the Long Water. You cannot retreat; the bridge sways, degrading your rear quadrant continuously. Build Line or lose.
- **Split Reed — The Room.** A storeroom too small for the measure. Learn to *make* distance where there is none.
- **Standing Water — The Three.** Three opponents at once, where every second in Custody is a second the other two are walking toward you.
- **Glass Hour — The Patient Man.** A single opponent who will not commit to anything. He waits. You have nothing to borrow. The trial is to find out what you do when your philosophy is not enough.

Each trial is a **lesson the style cannot teach itself**, which is how the trials avoid being difficulty checks.

---

## 7. Who can teach you

| Teacher | Gives | Costs |
| --- | --- | --- |
| **Ruhn** | Low River, falling, the base, everything foundational, one Inherited technique | Nothing. He never asks for anything, which becomes unbearable. |
| **Paid teachers** | Isolated techniques, honest and transactional | Money, and the knowledge that this is not how he did it |
| **The Thousand Steps** | Glass Hour | Time, humility, and a Standing that does not read as butchery |
| **The Iron Road** | Standing Water (the Compact form), practical brutality | Employment, and doing things for them |
| **The Cut** | False Face, survival, and the worst habits you will ever acquire | Fighting people who cannot afford to lose |
| **The Ninth Bell** | Formal duelling, the registry, the rules | Deference, and being *licensed* |
| **The Vessel** | Hooks, and the argument that lineage is a prison | Your association with them, publicly |
| **Rivals** | The best techniques in the game, by beating you with them | Being beaten |

Note the pattern: **every teacher wants something, except the one who raised you.** That asymmetry is the emotional architecture of the whole game.

---

## 8. Learning from defeat

Defeat is a **channel**, not a failure state (`GAME_VISION.md`, Pillar 4; full spec in `STORY.md` §9 and below).

Every significant loss writes a Ledger entry naming **what beat you** — not the opponent, the *principle*: distance, patience, pressure, structure, deception, endurance. That entry then:

1. **Unlocks the specific drill** that addresses it. Beaten by distance → the Rope opens with a new escalation.
2. **Grants Impressions** of whatever they hit you with (channel II).
3. **May unlock a teacher** who specialises in that principle.
4. **Changes dialogue.** People know you lost. Some of them are kinder about it than you expect, and some are not.

A player who never loses a fight will have a thinner Ledger and fewer stolen techniques than one who lost some. **This is deliberate and it is never explained to the player.** It is simply true, the way it is true in life.
