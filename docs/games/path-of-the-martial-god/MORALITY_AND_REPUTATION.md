# MORALITY_AND_REPUTATION.md
## Standing — consequence without a morality meter

**The forbidden designs.** No karma bar. No virtue points. No good/evil axis. No blue-and-red aura. No "+10 Honour" popup. No label of any kind applied to the player by the game. No dialogue option that repairs a reputation.

**What replaces them:** a two-layer model in which *what you did* and *what people believe* are different things, connected by a rumour network with delay, distortion, and limited reach.

---

## 1. The architecture

```
  CONDUCT  ──►  RECORD  ──►  RUMOUR NETWORK  ──►  STANDING  ──►  WORLD BEHAVIOUR
 (the Final    (facts +      (channels with      (beliefs held    (access, Will,
  Inch, and    witnesses)     delay, decay,       by specific      dialogue, rivals,
  more)                       distortion)         parties)         bosses, endings)
```

**Layer 1 — the Record.** Objective, complete, permanent. Every morally salient act is logged as a fact with a timestamp, a location, a target, and a **witness set**. No scores are assigned. This is a ledger of events, not of virtue.

**Layer 2 — Standing.** Subjective. Each faction, settlement, and named NPC holds its own **beliefs** about the player, assembled only from the rumours it has actually received. Standing is therefore plural, inconsistent, frequently wrong, and occasionally out of date in ways that matter.

> **The single most important property: what you did ≠ what people know.**
> A merciful act in an empty alley changes nothing. A cruel act in front of the pit crowd travels the rail line for two chapters and arrives larger than it left.

---

## 2. The Record

### What is logged
Primarily the **Final Inch** (`COMBAT_SYSTEM.md` §10) — the terminal you chose, against whom, in what state they were in, and whether they had given up. Also:

- Fights started, and against whom.
- Fights *declined* — walking away is data.
- Winning method (damage / structure / exhaustion). **The world notices how you win, not just that you won.**
- Treatment of people in your power outside of combat.
- Promises kept and broken; debts paid; obligations discharged or ignored.
- Deference and its absence toward teachers and elders.
- Whether you helped someone when it cost you something.
- Whether you used someone.

### Witnesses — the mechanism that makes the whole system work
Every fight space has an authored **witness composition** (`WORLD.md` §9): who is present, what they can see, who they talk to, and which rumour channel they feed.

| Space | Witnesses | Channel |
| --- | --- | --- |
| Ruhn's yard | One | **None — he is not on the network** |
| A pit at Ashgate | A paying crowd who know your use-name | The Cut → high distortion |
| Ninebell duelling ground | Arbiters and clerks | The registry → zero distortion, outcomes only |
| A moving freight car | Nobody | None |
| The Thousand Steps stair | Monks who will not intervene | Almost nothing leaves the mountain |

**The design consequence:** the player's moral life and their public life are genuinely separate, and a thoughtful player will come to understand that these are two different things they are managing — which is itself the theme.

### The dimensions
Tracked internally, **never displayed**, never named to the player:

`Mercy · Severity · Restraint-under-provocation · Honesty-of-victory · Loyalty · Deference · Custody (what you do with people in your power) · Utility (do you use people)`

Note that these are **not** opposed pairs. A player can score high on Mercy *and* Severity — merciful to the weak and merciless to the strong is a coherent, legible, and quite common human position, and the world has a specific reaction to it.

---

## 3. The rumour network

Full channel table in `WORLD.md` §7. The mechanics:

**Propagation.** A Record event with witnesses becomes a **rumour object**: `{event, magnitude, distortion, origin, age}`. It travels along channels at each channel's speed, arriving at settlements and factions as a belief update.

**Distortion.** Each hop applies channel-specific distortion. The Cut exaggerates *deliberately*, because a frightening fighter sells tickets. Rail crews improve a story with telling. The registry does not distort at all but only records **outcomes, never conduct** — so Ninebell can know you won forty duels and nothing about how.

**Decay.** Rumours fade with age and distance — **unevenly**:
- Ordinary conduct decays normally.
- **Severity does not decay.** You can become known as merciful again. You cannot become un-known as the person who killed a disarmed man in Ninebell. Ever.

**Reach.** The Thousand Steps hears almost nothing, which is why they judge on what they see. The high country is a *clean slate by geography*, and a player who has ruined their name can climb a mountain and be judged fresh — once.

**The player can outrun their reputation, and it will arrive.** A thing done in the Cut in Chapter 2 reaches Ninebell in Chapter 4, wearing a different shape.

---

## 4. Weighting — why this cannot be farmed

The system does not score acts. It recognises **patterns**, and it weights them by cost.

1. **Ratios, not counts.** Standing responds to the *proportion* of your resolved fights that ended a given way, over a window. Twenty merciful outcomes mean nothing if there were two hundred fights.
2. **Costly signals dominate.** An act that cost you something real — a payday, a rank, a contract, a win, a safe position — is weighted an order of magnitude above one that cost nothing. **Mercy that costs nothing is nearly free and the world knows it.**
3. **Hard cases are weighted hardest.** Being merciful to someone who just crippled your friend is worth ten ordinary mercies. The system explicitly looks for restraint *under provocation*, because that is the only kind that means anything, and because that is precisely what Ruhn is testing.
4. **Witness-dependence.** Farming good deeds in front of nobody does nothing. This alone defeats most optimisation strategies.
5. **No preview and no feedback.** The game never tells you an action's reputational value, before or after. There is no popup, no sound, no UI acknowledgement. You find out from the world, weeks later, when a door is open or closed.
6. **Consistency detection.** A player who alternates — brutal in the Cut, gentle in Ninebell — does not average out to neutral. The network eventually carries *both* reputations, and specific characters notice the contradiction. **Yeo Ansa goes and checks** (`RIVALS.md` §1). Being two people is its own legible identity, and it is the one Ruhn finds most alarming.
7. **The anchor events.** A small number of authored moments — Nas Orin foremost — carry enormous weight and cannot be diluted by subsequent behaviour. They are the events the player will be asked about for the rest of their life.

### The anti-gaming test
> *If a player could see the system's internals, would they play differently?*

If yes, the system is under-designed. The current answer: a player who saw the internals would learn that the optimal strategy is **be consistent, act the same when unobserved, and accept costs** — which is not a exploit. It is a description of having a character.

---

## 5. What Standing actually changes

Never a number. Always a behaviour.

| Surface | Effect |
| --- | --- |
| **Rumours** | NPCs discuss you in ambient conversation, inaccurately, sometimes in front of you |
| **NPC reaction** | Approach distance, eye contact, whether they serve you, whether they stop talking when you enter |
| **Dialogue** | Line selection across the whole cast, conditioned on the *local* Standing, not a global one |
| **Opponent Will** | Feared players face enemies who fold early — **and enemies who ambush rather than face them** |
| **Rival behaviour** | Trajectory selection for all three rivals (`RIVALS.md`) |
| **Student interest** | Whether anyone wants to learn from you, and what kind of person asks |
| **Invitations** | Arbitration work, escort contracts, temple access, pit billing |
| **Closed doors** | The Thousand Steps will not teach a butcher. Ninebell will not arbitrate for one. **Doors close without warning and often permanently.** |
| **Altered boss encounters** | Several bosses fight differently against a feared player — more cautiously, or with more people (`BOSSES.md` §11) |
| **Your use-name** | Assigned by the Cut, updated by the world, and never chosen by you |
| **Endings** | `STORY.md` §10 |

### The use-name as a diegetic readout
The player's **use-name** is the closest thing to a reputation display, and it is perfect because it is *diegetic, plural, and not under the player's control*. The Cut calls you one thing. Ninebell's registry writes another. Kem calls you something else entirely. The player learns their reputation by **hearing what people call them**, which is exactly how it works in life.

---

## 6. Situations with no correct answer

A design quota: **at least one irresolvable dilemma per chapter**, authored so that both options have a genuine cost and neither is a trick.

Examples of the required shape:
- A man who betrayed you, unarmed and crying, delivered to you because nobody else will decide (**Nas Orin**, Ch.3).
- A pit fighter who needs to lose to pay a debt, asking you to beat him convincingly enough that the booker believes it — which means hurting him in front of people who will believe *you* did it for fun.
- A Ninth Bell arbitration the player knows is bought. Winning it lawfully harms an innocent party. Refusing it hands it to someone who will win it anyway and be worse.
- A student of Kem's, aged sixteen, doing to a stranger exactly what the player did to someone in Chapter 2, and citing them by name while doing it.

**Rules for these:** no hidden third option, no reward for cleverness, no character who later tells you that you chose correctly. The game's silence is the design.

---

## 7. Ruhn is off the network

Repeated here because it is the most important implementation detail in this document (`MASTER.md` §7).

**Ruhn receives no rumours.** His model of the player is built from what he has seen and from three trusted informants (Nas Il-ke, Han Su-ye, Yeo Ansa), each with their own latency, their own selectivity, and their own agenda.

Consequences, all intended:
- A player who performs virtue publicly and cruelty privately finds the world adoring and **Ruhn unmoved.**
- A player who is quietly decent where nobody watches finds the world calls them a butcher and **Ruhn knows better.**
- Han Su-ye reports **by letter**, weeks late — so Ruhn's model is sometimes out of date at exactly the wrong moment.
- Yeo Ansa becoming an informant in Chapter 4 means the player's real conduct starts reaching Ruhn *accurately* from that point. Players who realise this change their behaviour, and **that is a legitimate and interesting thing to have caused.**

This asymmetry is why the ending is earned rather than tallied, and it must not be simplified during implementation.

---

## 8. Implementation notes

- `RecordBus` emits immutable fact events; nothing downstream can edit them.
- `RumourNetwork` ticks on world-time, not real-time, and is fully serialisable. Propagation is simulated even while the player is elsewhere — that is the entire point.
- `StandingModel` holds one belief vector per *party* (faction, settlement, named NPC), each with a confidence and an age. Queries are always scoped: `Standing.of(party).believes(dimension)`. **There is no global reputation value anywhere in the codebase.** If one appears, the design has been violated.
- Dialogue and access conditions query local Standing only.
- **Debug tooling** (developer-only): a rumour propagation map showing what each party believes, where it came from, and how distorted it is. Essential for authoring and QA, and it must never ship enabled.
