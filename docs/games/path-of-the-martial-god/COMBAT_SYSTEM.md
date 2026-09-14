# COMBAT_SYSTEM.md
## The combat architecture

**This is the most important document in the package.** Everything the player will spend their hours doing is specified here. Read `GAME_VISION.md` §2 (the combat thesis) first.

---

## 1. Classification — what kind of combat this is

**Animation-authored, frame-authoritative, stance-driven, directional, soft-locked hybrid.**

Unpacked, because each word is a decision:

| Property | Decision | Why |
| --- | --- | --- |
| **Animation-authored** | Every technique is a hand-authored clip set, not a procedural blend. | This game lives on animation. Procedural strikes never look like a person who trained. |
| **Frame-authoritative** | Hit, hurt, cancel, and armour windows live in **data**, not on animation notifies. | Designers tune feel without re-authoring animation; frame data is diffable in git; fights are deterministic and testable. This is the single most important technical decision in the combat core. |
| **Stance-driven** | Your active style changes what every input *means*. | Pillar 2. |
| **Directional** | The left stick supplies **intent** (pressure / retreat / angle / close), not combo-string selection. | Makes footwork and angles real, and makes styles into grammars. |
| **Soft-locked** | Duels use a soft lock that biases facing without welding it; group fights use soft-targeting. | Hard lock kills angle play, which is half the game. |
| **Hybrid** | Deterministic tick simulation underneath, cinematic presentation on top. | We want fighting-game precision with action-game feel. |

**Determinism requirement.** The combat simulation runs on a fixed 60Hz tick, independent of render frame rate, with no floating-point non-determinism in the decision path. Consequences: fights are recordable and replayable exactly (which we ship as the in-game **Meditation** feature, §13), automated regression tests can assert "this input sequence produces this outcome," and the adaptive AI can be tested against recorded human play.

---

## 2. Resources — three, not five

Three resources, three ways to win, three things every style has an opinion about.

### Vitality (Health)
Accumulated physical trauma. Slow-moving, meaningful, and **does not fully restore between fights**. Rest, food, and time restore it; a chapter's worth of fighting grinds it down. Vitality reaching zero means **unconscious or unable to continue**, not dead. Death is only ever a choice someone makes (§10, §12).

Vitality is also **located**. It is not one pool but a light body-region model: head, torso, lead arm, rear arm, lead leg, rear leg. Damage concentrates. A leg that has taken repeated low kicks stops carrying weight, which degrades that fighter's base in that quadrant. This is cheap to implement (six accumulators) and it makes targeted striking meaningful without a limb-selection UI.

### Structure (Base / Balance)
**The primary fight resource, and the game's central invention.**

Structure is not a bar. It is a **base with four quadrants** — fore, rear, lead-side, rear-side — relative to the fighter's own stance. Each quadrant holds an integrity value.

- Force applied to a quadrant degrades it. Force from the front degrades *fore*.
- A degraded quadrant means you cannot bear weight in that direction: you cannot advance into a broken fore, cannot retreat into a broken rear.
- **Structure Break** occurs when a quadrant hits zero *and* force is applied through it. The fighter is dumped off their base in that direction, producing a specific, physically-correct stagger, and enters the vulnerable state where the Final Inch is available.
- Quadrants recover through **correct footwork** — resetting your base by stepping, by settling weight, by breathing. Standing still recovers slowly. Panicking recovers not at all.

**Why quadrants instead of a bar.** A bar makes defence a rhythm game. Quadrants make defence a *spatial* problem: it matters *where* the pressure is coming from, which direction you are being walked, and which way you have left to go. It is the reason footwork exists mechanically rather than cosmetically, and it is what makes the six styles genuinely different — each one attacks the base in a different way:

- **Low River** walks you backward through your fore quadrant with linear pressure.
- **Standing Water** attacks the base directly by *pulling*, collapsing a quadrant you are trying to stand on.
- **Glass Hour** adds to your own committed momentum, breaking the quadrant *you chose to lean into*.
- **Split Reed** denies you the ability to reset by never being where you step.
- **False Face** makes you shift weight to a quadrant that did not need defending.
- **Hooks** simply hits the same quadrant more times than it can take.

### Breath (Stamina)
Not a dash meter. Breath is spent by **inefficiency and panic**:

- Committed/heavy actions cost Breath.
- **Rough-tier techniques cost markedly more Breath than Silent-tier ones.** This is the mastery economy (Pillar 1).
- Late blocks, blocked-at-the-last-instant guards, and mashed inputs cost Breath.
- Holding a clinch or a grip costs Breath; so does escaping one.
- Sprinting, hard evades, and absorbing heavy impact cost Breath.

Breath at zero: **gassed** — attacks drop to Rough tier regardless of mastery, structure recovery halts, and the fighter's animation goes heavy and loud. This is the most vulnerable state in the game and it is entirely self-inflicted.

Breath recovers passively at range, faster while **breathing deliberately** (§3, Focus). Recovering Breath requires making distance, which requires footwork, which is the loop.

### Will (hidden, not a resource the player spends)
Every fighter has a hidden **Will** value: the willingness to continue. Will drops from being structurally dominated, from taking damage they cannot answer, from watching a friend broken, from fear of a reputation. Will drives:
- Whether the Final Inch is available at all (a broken base on a high-Will fighter means they scramble and reset; on a low-Will fighter it means they are finished).
- Whether an opponent **surrenders**, **flees**, or **fights to unconsciousness**.
- The additive animation layer that makes frightened people move like frightened people.

Will is why a feared player fights different opponents than a respected one. The same dock tough will fold immediately for a player the Cut calls a butcher, and fight to the end against one it calls soft.

---

## 3. Inputs — seven verbs, controller-first

Designed for a standard dual-stick controller. Mouse+keyboard is supported and fully rebindable, but the **design target is the controller**, because the analog stick is the intent channel and analog matters.

| Input | Verb | Notes |
| --- | --- | --- |
| **Left stick** | **Intent** | The heart of the system. Not movement-only — see §4. |
| **□ / X** | **Strike (light)** | Fast, low commitment, chains. Style decides what it is. |
| **△ / Y** | **Commit (heavy)** | Slow, high structure damage, punishable. Style decides what it is. |
| **L1 / LB (hold)** | **Guard** | Absorbs into Structure. Costs Breath. Directional: guards the quadrant you face. |
| **L1 / LB (tap)** | **Deflect** | Timed. Negates damage, returns structure damage, style-specific follow-on. |
| **○ / B** | **Evade / Slip** | Directional. Short i-frames on a *correct* read, none on a panicked one. Costs Breath. |
| **R1 / RB** | **Seize** | Grab, clinch entry, sweep entry, throw. Context decides which. |
| **L2 / LT** | **Stance** | Hold to open the stance ring; flick to switch to a bound style (§7). |
| **R2 / RT (hold)** | **Focus / Breathe** | Recovers Breath fast, sharpens reads, reveals opponent state. **You are vulnerable.** |
| **R3** | Lock toggle | Soft lock on/off. |

**Seven verbs.** Complexity emerges from **verb × intent × style × opponent state**, not from memorising twenty buttons. A player who understands the seven verbs can play the whole game; a player who understands the grammar can play it well.

**No combo strings to memorise.** There are no "□□△○" notation tables. Sequences emerge because actions have cancel windows and because the intent grammar chains naturally. Nothing in the UI ever shows a combo list, because there are none.

---

## 4. The intent grammar — the core innovation

The left stick, during any offensive or defensive verb, supplies one of five **intents** relative to the opponent:

| Intent | Stick | Meaning |
| --- | --- | --- |
| **Neutral** | Centre | Act from where you are. |
| **Pressure** | Toward | Take ground. Enter. Walk through them. |
| **Retreat** | Away | Give ground. Buy time. Counter from withdrawal. |
| **Angle** | Lateral | Leave the line. Attack a quadrant they are not defending. |
| **Close** | Toward + Seize | Collapse distance to contact range. |

Each of the six styles maps every (verb × intent) pair to a different technique. **The same input produces a different, coherent action in every style, and the action is always philosophically consistent with that style.**

Worked example — **Strike + Angle**, the same input in four styles:

| Style | Result | Philosophy expressed |
| --- | --- | --- |
| **Low River** | Short lateral step *into* the centre with a driving palm — the style refuses to leave the line, so angling becomes a shoulder-first re-entry. | You do not go around a man. You go through where he is weakest. |
| **Split Reed** | A switch-kick off the angle, landing at the far edge of the measure. | Never be where he is aiming. |
| **Standing Water** | Arm-drag to the back — the lateral intent becomes a grip and a rotation. | Take the position, not the hit. |
| **Glass Hour** | Pivot-throw: a step off-line that borrows whatever momentum he already committed. | Add to what already moves. |

This is what makes "styles are philosophies" mechanically true rather than a slogan. The player does not learn a new controller. They learn a new *way of meaning the same thing*.

### Distance bands
All technique selection is also gated by distance, in four bands, communicated by the Duel camera framing rather than a UI element:

- **Outside** — nothing reaches. Breathing range. Split Reed lives here.
- **Long** — kicks and committed entries reach. Split Reed's measure.
- **Mid** — hands reach. Low River, Hooks, False Face live here.
- **Contact** — clinch, grips, elbows, knees. Standing Water lives here.

Styles are strong in their band and progressively weaker outside it. **Distance management is the fight.**

---

## 5. Defence — four tools, four costs

| Tool | Cost | Effect | Fails against |
| --- | --- | --- | --- |
| **Guard** | Breath drain while held, Structure damage on impact | Safe, forgiving, always available. Attrition. | Grabs, structure pressure, patience. Guarding does not save you; it postpones. |
| **Deflect** | Nothing on success; heavy Breath + Structure on failure | Negates damage, returns Structure damage to attacker, opens a style-specific follow-on window. | Feints, grabs, mixed timing. |
| **Slip / Evade** | Breath | Directional avoidance. **I-frames are conditional:** a slip in the correct direction relative to the incoming vector grants them; a slip in the wrong direction does not — it just moves you. | Tracking attacks, sweeps, anyone who has read your slip direction. |
| **Footwork** | Free | Pure spacing. Backing out of range is always legal and always correct sometimes. | Nothing — but it surrenders ground, degrades your Line, and against pressure styles it walks you into a wall. |

**Design intent:** there is no universal answer. Guard is safe and loses slowly. Deflect is powerful and punishes error harshly. Evade is spatial and requires reading a vector, not a timing. Footwork is free and costs you position. A player who leans on any one of them will be punished by an opponent who reads them (§11).

**No parry-everything button.** Deflect does not work on Seizes. Grabs beat timing-based defence — the answer to a grapple is footwork, a pre-emptive strike, or your own Seize. This is the rock-paper-scissors that keeps the deflect game honest.

---

## 6. Offence — the technique taxonomy

Every technique in the game is one of eight kinds. The kind determines its interaction rules; the style determines its expression.

1. **Strike** — impact. Primary Vitality, secondary Structure.
2. **Drive** — committed impact. Primary Structure, high Breath, punishable. (Heavy attacks.)
3. **Check** — a low-commitment interruption. Low damage, high tempo denial. Stops an entry.
4. **Redirect** — takes an incoming vector and changes it. The Glass Hour family, but every style has one.
5. **Seize** — establishes a grip. Enters **Custody** (§8).
6. **Displace** — throws, sweeps, trips. Immediate Structure Break on success, no Vitality damage by default.
7. **Break** — joint attacks. Causes **Injury** (§12). Almost always a Final Inch terminal rather than a mid-fight action.
8. **Lie** — a feint: a technique released early so it never lands. Universal to all styles at a basic level (§6.1).

### 6.1 The Lie (feints) — universal
Releasing a strike or drive input before its commitment frame produces a **Lie**: the wind-up plays, the technique does not. Costs a little Breath.

A Lie that provokes a defensive reaction does two things:
1. Puts the opponent in **Committed** state with extended recovery — a genuine opening.
2. **Feeds their read table false data** (§11). The AI learns that you "favour the low kick" and starts defending a low kick you never actually throw.

This is one system attacking another system, and it is the most satisfying interaction in the game. It is also why the full **False Face** style (which is built entirely out of Lies) is *weak early and elite late* — you cannot lie to an opponent too stupid to have a model of you.

**Scope note:** the universal Lie ships in V1. The full False Face style does not. See `OPEN_DECISIONS.md` OD-05.

---

## 7. Stance and style switching

The player carries up to **three styles bound** to the stance ring at any time (all learned styles remain in the Ledger; three are equipped). Switching is:

- **Deliberate.** Holding L2 opens a small radial; the switch takes a real, animated **stance transition** (0.4–0.7s depending on the style pair and your mastery). You cannot switch instantly out of danger.
- **Committed.** During the transition you are in a genuine in-between posture — some transitions are defensively sound, some are not. Low River → Standing Water is a short, safe settle. Split Reed → Standing Water is a long, exposed collapse of distance. **These are authored per style pair** (`ANIMATION_REQUIREMENTS.md` §6).
- **Meaningful.** Switching mid-combo is how advanced play works: throw a Low River entry to break their fore quadrant, switch to Standing Water on the recovery, and take the back before they reset.

**Mastery changes this.** At high style mastery, transitions shorten and gain **flow variants** — transitions that can be performed *inside* a technique's recovery, so the style change is hidden inside an action. This is the mechanical texture of a fighter who no longer thinks about which style they're in, and it is the on-ramp to the Quiet.

---

## 8. Clinch, grappling, and Custody

Grappling is where the game's moral core lives, so it gets a real system rather than a canned-animation throw button.

**Seize** at Contact range, on a valid opponent state, enters **Custody**: a shared-animation control state between two fighters.

- Custody is modelled as a small **grip graph** — a finite set of authored nodes (collar tie, underhook, over-under, back control, wrist control, head-and-arm, sprawl) with authored transitions between them. **Not** a continuous physical simulation. This is a deliberate scope decision: continuous two-body grappling is the single largest animation risk in the project (`RISK_REGISTER.md` R-02).
- While in Custody: the holder spends Breath to maintain and to advance nodes; the held fighter spends Breath to resist and escape. Inputs are a short directional contest, not a mash.
- From most nodes, the holder may convert to: **throw**, **sweep**, **knee/elbow**, **choke**, **break**, or **release**.

**Why this matters beyond mechanics.** "Custody" is the correct word and it is chosen on purpose. It is the state of having another human being entirely in your power, and it is where the widest set of Final Inch terminals live. The game's central question is asked most sharply here.

**Ground.** Limited by design. A fighter whose Structure is fully broken can go down, and the standing fighter may follow them down into a small set of ground nodes (mount, guard, back). **We do not build a full ground game.** Ground exists to make knockdowns matter and to host specific terminals, not to be a second fighting system. Three ground nodes, not thirty. Multiple opponents make going to ground actively dangerous, which limits its use naturally.

---

## 9. Knockdowns, recovery, and getting up

- A **Structure Break** staggers. A break plus follow-up force **knocks down**.
- Getting up is a real decision with three options: **quick rise** (fast, costs Breath, predictable), **technical stand** (slower, maintains guard, requires the skill — it is a taught technique, and the *first thing Ruhn teaches the player is how to fall*), and **stay down** (recovers Breath, invites finishing, sometimes the correct read against an exhausted opponent).
- **Wake-up defence** exists but is limited. Being knocked down is genuinely bad. The game teaches you not to be.
- The first playable lesson in the entire game is **falling**. It is the tutorial, it is the thesis, and it is the first thing Ruhn says to a child he is deciding whether to raise.

---

## 10. The Final Inch

**The most important mechanic in the game.** (`GAME_VISION.md` §2.)

### Trigger
The Final Inch is offered when an opponent is **finished**: Structure Broken *and* (Will below threshold *or* Vitality critical *or* held in a dominant Custody node). It is not offered on every knockdown — it is offered when you have genuinely won and the other person knows it.

### Presentation
- Time dilates to roughly 35% for a window of **0.9–1.4 seconds** (scaling with your mastery — a more skilled fighter has *more time to decide*, which is exactly right).
- The camera cuts to the **Inch** framing: both faces visible.
- **No prompt tells you the options and no prompt tells you what they mean.** The available terminals are expressed by the inputs you already know, from the position you are already in.
- Audio drops to breath and room tone.

### Terminals
Which are available depends on your style, your position, your mastery, and their state. A representative set:

| Terminal | Input | Effect | Typical reading |
| --- | --- | --- | --- |
| **Strike through** | Commit | KO. Ends it. Fast, clean, forgettable. | Ordinary. The default. |
| **Break** | Seize + Commit from a Custody node | Permanent injury to a limb. They will never fight the same. | Severity. Remembered forever. |
| **Choke** | Seize from back control | Unconscious, unharmed. Requires real skill to reach. | Control. Respected by fighters, frightening to civilians. |
| **Dismantle** | Repeated Strike + Pressure without finishing | Their Structure is destroyed; they physically cannot continue. Non-damaging, humiliating, slow. | Contempt. |
| **Submit** | Seize, hold, do not convert | They tap. They are unhurt and they yielded in front of witnesses. | Domination without cruelty. Costly to their standing, not their body. |
| **Kill** | Break or Strike-through on a critical target, with intent | They die. Always a deliberate act. Never automatic. | Irreversible. Propagates hardest and never decays. |
| **The Stop** | Release input — actively *not* throwing the terminal, held to the end of the window | You hold the finish and do not take it. They feel the inch. **Requires high mastery**: at low skill you cannot stop cleanly, you just miss. | The hardest thing in the game, and the one Ruhn is watching for. |

### Rules that make it work
1. **The Stop is a skill.** A novice who tries to pull a punch fails at it — the technique is Rough, the motion overshoots, and they connect anyway. The ability to be merciful is *mechanically gated behind competence*, which is the entire thesis of the game stated as a rule. **Restraint is not a moral choice available to the weak.**
2. **Not acting is acting.** Letting the window lapse is its own outcome — you disengage, they live, and it reads as neither mercy nor cruelty, just indifference. The world reads indifference differently from both.
3. **No undo, no confirm.** There is no "are you sure?" There is never a second chance at an inch.
4. **Witnesses matter.** The Record system logs *who saw it* (`MORALITY_AND_REPUTATION.md` §2). An empty alley and a packed pit are not the same act.
5. **It is never mandatory.** The player can decline the entire mechanic for a whole playthrough by simply never finishing anyone that way. That is also a pattern, and the world reads it.

---

## 11. Adaptive opponents — the Read

Strong fighters learn. The system is called **the Read**, and its guiding principle is: **the opponent must never see your inputs, and you must always be able to see them reading you.**

### What is tracked
Each significant opponent maintains a lightweight tendency table over a sliding window (and, for recurring rivals, **across the entire campaign**):

- Opening action (the first thing you do in an exchange)
- Favoured distance band
- Slip/evade direction bias
- Deflect frequency and deflect timing bias (early/late)
- Most-used technique, and most-used *technique prefix*
- Active style, and style-switch triggers
- Preferred Final Inch terminal
- Response to their own pressure (do you back up, do you counter, do you freeze)

### How adaptation happens
When a tendency crosses a confidence threshold, the opponent **buys a counter**: a shift in behaviour weights (raise the lead hand, start checking low, start feinting to bait your deflect, stand at a range that denies your favourite entry).

### Fairness rules — mandatory, all of them
1. **No input reading, ever.** The AI's perception layer sees only what a person could see: your pose, velocity, facing, distance, current animation state *after* its startup has become visible, and its own memory. There is a mandated **perception latency** per opponent (180–380ms depending on tier).
2. **Every adaptation has a tell, and the tell precedes the counter.** If a boss is about to start punishing your low kick, their guard visibly changes first — weight shifts back, lead hand drops. The player can read the read. Elite play is *counter-counter* play: bait the adaptation, then punish it.
3. **Adaptations decay.** Stop the pattern and the counter fades. Changing works. This is the lesson the system exists to teach.
4. **Lies poison it.** Feints feed the table false data (§6.1). The Read is a system the player can attack.
5. **No stat cheating.** Adaptation only ever changes *behaviour weights and reaction budgets*. It never silently raises damage, health, or speed.
6. **It is legible.** The **Meditation** screen (§13) shows the player exactly what an opponent learned about them. We tell the player the system exists, in-fiction, and then let them play against it.

### Persistence across the campaign
Recurring rivals serialise their read table. **Yeo Ansa remembers how you fought at sixteen when she meets you at twenty-four.** The implementation cost is one saved table per named character; the emotional payoff is enormous — your rivals grow into people who have specifically studied *you*.

---

## 12. Damage, injury, and consequence

### How dangerous is fighting?
Very. This is not a game where people bounce up. A serious exchange between trained adults leaves marks that last for days of game time.

### Injuries
Distinct from Vitality. An **Injury** is a discrete, located, persistent condition caused by a **Break**, by accumulated regional damage, or by story.

- **Acute injuries** (sprains, bad bruising, cracked ribs, a swollen eye that narrows vision) last days-to-weeks of in-game time and impose real mechanical constraints: an injured lead arm cannot hold that guard, a damaged leg cannot bear a quadrant.
- **Permanent injuries** are authored story events. A specific break in Chapter 3 leaves a shoulder that never fully returns.

**Permanent injuries are designed as character, not punishment.** The game has content for them: techniques that lead with the other side, a style that suits a compromised base, dialogue from people who notice. A playthrough with a ruined left shoulder is a *different* playthrough, not a worse one. This is how the game makes a life feel lived-in.

### Can the protagonist kill?
Yes, and it is always a choice — with **one deliberate exception**.

**The exception, and it is the point.** Early in the game, before the player has control, they *can* kill by accident. There is one authored sequence where an unmastered technique goes further than intended. This is not a cutscene; the player does it. It establishes the game's actual moral architecture: **control is the moral achievement.** Intent is worthless without the skill to execute it. A person who means well and cannot pull a punch is not a good person; they are a hazard.

After that, every death is authored by the player.

### Nonlethal victory
The default and the mechanically richer path. KO, choke, dismantle, submit, Stop. Nonlethal terminals give access to the widest range of downstream content: opponents who live can be recruited, befriended, trained, testified to, or turned into enemies who *learn*.

### What happens to a defeated opponent
They persist. Always. The game maintains a finite, persistent population (`WORLD.md` §8). A fighter you beat:
- Heals, or doesn't, depending on what you did.
- Tells the story of it, distorted (`MORALITY_AND_REPUTATION.md` §3).
- May appear later — as a gate guard, a student, a subordinate, a witness at an arbitration, a man who crosses the street to avoid you, or someone who has spent two years learning to beat you specifically.

### Consequences for brutality
Not a penalty number. Four real mechanisms:
1. **The world's Will changes.** Feared players face opponents who fold early — and opponents who ambush rather than face them.
2. **Doors close.** The Thousand Steps will not teach a butcher. Ninebell will not arbitrate for one.
3. **The Tally.** Yeo Ansa exists as a character specifically to be the accumulated cost arriving in person.
4. **Ruhn watches.** The experiment has a result, and the result is the ending.

---

## 13. Meditation — review, tutorial, and analytics as one feature

The player can sit and reflect at safe locations. Mechanically this is the **fight recorder** (§1, determinism) replayed with an annotation overlay:

- Where you lost your base, and to what.
- Where you held your breath (Breath spikes) and why.
- Your three most-repeated actions this fight.
- **What your opponent learned about you** — the Read table, rendered in-fiction as Ruhn's voice or your own notes.
- Technique mastery movement from that fight.

One system serving four purposes: it is the tutorial (it teaches the systems by showing them in your own play), the analytics surface, the discovery mechanism for the adaptive AI, and a genuine character moment. It also gives us a free debugging tool, since the developer version is the same replay with more overlays (`TECHNICAL_ARCHITECTURE.md` §10).

---

## 14. Readability and accessibility

### Default readability: the body, not the bar
By default there is **no health bar, no stamina bar, and no damage numbers**. All three resources are read from the opponent's body:

| Resource | How you read it |
| --- | --- |
| **Vitality** | Injury. Limping, favouring a side, guard asymmetry, swelling, blood, slower rise from knockdowns. |
| **Structure** | Posture. Heavy feet, settled weight, guard drifting down, recovery steps that don't fully reset. |
| **Breath** | Sound and shoulders. Audible breathing, shoulder rise, mouth open, longer pauses between actions. |
| **Will** | Eyes and distance. They stop coming forward. They look for the door. |

This is only possible because the animation system is built for it (`ANIMATION_REQUIREMENTS.md` §5, additive layers driven directly by resource values). It is the single biggest differentiator in feel and the single biggest animation cost. It is worth it.

### HUD options (three, player-selectable, no difficulty implication)
1. **None** (default) — as above.
2. **Trace** — a thin, unobtrusive arc at the character's feet showing Structure quadrants, and a breath indicator. No numbers.
3. **Full** — adds explicit resource readouts. For accessibility and for players who want it. Never required.

### Accessibility layer
Real, and designed so it never removes decisions:
- **Timing width:** deflect and Final Inch windows scale 100%–220% independently.
- **Read assist:** optional pre-attack highlight, tunable in lead time.
- **Auto-footwork:** holds optimal distance band unless overridden.
- **Custody simplification:** single-input escapes and conversions.
- **Full remapping, hold/toggle for every hold, no required simultaneous inputs, no required rapid input.**
- **Slow mode:** global simulation speed scaling down to 60%, in a game whose simulation is tick-deterministic and therefore safe to scale.

**Principle:** accessibility options change the *bandwidth* required, never the *decisions* available. A player using every assist still chooses their terminal at the Final Inch, still gets read by opponents, still gets rumoured about. They play the same game more slowly.

---

## 15. Environmental and multi-opponent combat

### Environment
The world participates, but it is never a damage lever.

- **Surfaces** change footing: wet stone, gravel, mud, a barge deck that moves, rail ballast, ice. Footing affects Structure recovery and evade distance. This is a *spatial* modifier, not a damage one.
- **Walls and obstacles** matter because of the quadrant system: a broken rear quadrant against a wall is a disaster with no bespoke code — it emerges from the base model. Standing Water can put a person into architecture.
- **Objects** can be used. Sparingly, and they are almost always *someone else's* choice — a pit fighter picks up a chair; the player can too, and it is always read as an escalation by witnesses.
- **Height** exists. Being thrown down stairs is a genuine and serious outcome. Being thrown off a barge is a fight-ender.

### Weapons
Present in the world, rare in the player's hands.

- The player's art is empty-handed. That is the fantasy and we do not dilute it.
- **Opponents use weapons** — knives in the Cut, rail spikes, staves at the Thousand Steps, the Ninth Bell's ceremonial batons. Fighting an armed opponent unarmed is a distinct, tense, *dangerous* encounter category with its own rules: no trading, Custody becomes essential, and a single mistake is a large Vitality hit.
- The player can **disarm** (a Seize-family technique) and may hold a weapon temporarily. Holding it is always heavily read by witnesses, and the game never gives you a reason to prefer it. Most players will throw it away, and that is correct.
- **No weapon progression, ever.**

### Multiple opponents
Handled honestly rather than with a crowd-control mode:
- Camera goes **Field**, soft-targeting.
- The **base model punishes being surrounded** naturally: pressure from two quadrants at once is genuinely unmanageable, so the fight becomes about *positioning* — lining people up, using architecture, taking one out fast.
- Attacker-queue pacing exists (a limited number of opponents commit at once) but it is modelled as **their** hesitation, is visible in their behaviour, and low-Will opponents hang back for legible reasons.
- Going to ground with three people standing is close to fatal. The systems teach this without a tutorial.

---

## 16. What we are explicitly not building

Recorded to prevent re-litigation:

- **No combo lists or move-list notation.** Emergent sequences only.
- **No air juggles.** No launcher-into-aerial-combo character-action layer.
- **No dodge-cancel-everything.** Committed actions are committed.
- **No super meter or rage mode.** No screen-clearing spectacle attack.
- **No elemental damage, no magic, no glowing.**
- **No weapon trees, no crafting, no durability.**
- **No lock-on-and-mash viable path.** A player who mashes gasses out and gets read.
- **No full continuous ground game.** Three nodes, deliberately.
- **No difficulty selector.** Instead: the accessibility layer above, plus a world that adapts its pressure to your Standing. Recorded as a risk and revisited at playtest (`OPEN_DECISIONS.md` OD-07).
