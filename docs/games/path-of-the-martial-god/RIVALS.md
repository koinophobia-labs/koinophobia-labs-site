# RIVALS.md
## The three who grow alongside you

A rival is not an enemy. A rival is **someone whose life is running in parallel to yours, who is also trying to answer the question, and who will arrive at a different answer.**

**Architectural requirement:** every rival carries a persistent **Read table** across the entire campaign (`COMBAT_SYSTEM.md` §11). Yeo Ansa remembers how you fought at sixteen when she meets you at twenty-four. This costs one serialised table per character and is the highest-value-per-byte feature in the game.

**Trajectory rule:** each rival has a small set of authored end-states. The player does not choose them from dialogue. They are selected by the **pattern of the player's conduct** — chiefly the Final Inch record and the Standing model (`MORALITY_AND_REPUTATION.md`) — plus a handful of specific irreversible events.

---

## 1. Yeo An-sa — "the Tally"

*The moral accountant. The one who is watching.*

| | |
| --- | --- |
| **Age** | Two years older than the player |
| **Style** | Low River → **Standing Water** at Instinctive. A structure fighter who takes people apart without hurting them. |
| **Body** | Root / Density / Wind — immovable |
| **First met** | Chapter 2, the Cut, age 18 to your 16 |

### Who she is
The daughter of an Ashgate pit fighter who was crippled in a bout and then billed by the company for the lost gate receipts. She fights to pay debts — literally at first, and then as an entire worldview.

Her philosophy: **every injury inflicted must be justified by a debt owed.** She keeps an actual ledger of what she has done to people and what she believed it was for, and she balances it. She is not cruel and she is not kind; she is *rigorous*. She will break a man's arm without hesitation if she can name the reason, and she will take a beating rather than hurt someone she cannot account for.

She is the only person in the game who thinks about the Final Inch the way the game does, and she will notice that you do too.

### Why she matters
She is **the player's conduct arriving as a person.** She tracks what you do — not the rumours, the *acts*, because she goes and checks. From Chapter 4 she becomes one of the three people Ruhn trusts (`MASTER.md` §7), which means she is, unknowingly, the instrument by which the player's real behaviour reaches the person it matters to.

The scene where the player realises she has been reporting to Ruhn is the best betrayal in the game, and it is not a betrayal — she never lied, and she is baffled that you are angry.

### Her flaw
Accounting is not ethics. She can justify anything that balances, and she has never once asked whether the books themselves are the right books. In Chapter 5 she says the truest thing anyone says in the game — that Ruhn ran an experiment on a child without consent — and she is right, and she is also unable to see that she is doing a version of the same thing to everyone she meets.

### Trajectories
| End-state | Condition |
| --- | --- |
| **Partner** | Consistent restraint, especially when costly. She stops keeping your column and starts working beside you. She teaches at the end. |
| **Creditor** | Mixed conduct. She stays close, stays watching, and permanently withholds judgement. The most uncomfortable outcome. |
| **Collector** | Repeated severity, particularly against people who could not answer. She closes the ledger, informs you that she has, and comes for you. **She does not stop, and she cannot be talked down** — she is the one rival with no reconciliation path once this triggers. |
| **Unpayable** | If the player kills someone she was accountable for. She fights you early, loses, and spends the rest of the game trying again, worse each time. Tragedy. |

---

## 2. Kem Du-ro — "Bright Kem," later "the Forge"

*The joyful one. The mirror. The penultimate boss.*

| | |
| --- | --- |
| **Age** | Same as the player, two years older in the slice |
| **Style** | Whatever is strongest near him. Begins with barge-hand scrapping, ends with **an imitation of the player's own build** |
| **Body** | Burst / Speed early; converges on yours |
| **First met** | **The vertical slice**, age 14, on the Mudgate barge dock |

### Who he is
A barge-boy with no family, no school, no papers, and an enormous, uncomplicated delight in fighting. He is better than the player when you meet him and *thrilled about it* — not smug, genuinely happy, the way people are happy about a thing they love. He loses to you eventually and is equally happy about that.

**Kem has no philosophy.** None. He has never had a reason and has never needed one, and that is not a comic trait — it is the tragedy, stated early and quietly:

> **A person with no philosophy takes on whatever philosophy is strongest near them.**

And the strongest thing near Kem, for eighteen years, is the player.

### What he becomes
He copies you. Not consciously — he *admires* you, and admiration at that intensity is indistinguishable from imitation. He picks up your habits, your entries, your rhythm, your style preferences, and above all **your terminals.** If the player breaks people, Kem breaks people, cheerfully, and does not understand why the crowd goes quiet.

By Chapter 6 he has students of his own — a whole yard of them, in the Cut, where everyone loves him — and they are learning the player's doctrine at third hand from a man who cannot explain it.

He is the **penultimate boss**: the player's own argument, worn by someone who did not choose it and cannot defend it. The fight is not against evil. It is against consequence.

### Implementation note
Kem's build is **procedurally derived from the player's telemetry**: his style bindings, his three most-used techniques, his preferred distance band, and his most-used Final Inch terminal are all read from the player's own record at a Chapter 5 snapshot. He is a data-driven boss whose content is the player's play. This is expensive to tune and the single most memorable fight in the game if it lands (`RISK_REGISTER.md` R-06).

### Trajectories
| End-state | Condition |
| --- | --- |
| **Student** | The player gives him something to believe that is not simply *win* — a specific set of authored conversations across Ch.3–6, most of which the player can easily miss because he never asks. He survives, he teaches well, and he is the seed of the **Stillwater** ending. |
| **Copy** | Default. The player was never cruel but never gave him anything. He becomes a shallow, dangerous, beloved version of you, and the fight in Chapter 6 kills him or breaks him, and neither of you understands why it happened. |
| **Monster** | Sustained severity. He does everything you did, worse, to people who did not deserve it, while genuinely believing he is honouring you. **The player must decide what to do with him at the Final Inch,** and the game will not help. |
| **Apart** | If the player is consistently distant and Kem finds a philosophy elsewhere (the Vessel recruits him). He becomes a rival rather than a mirror, and lives. The quiet good outcome that most players will not find. |

---

## 3. Ise Vau-ran — "the Nine-Bell Heir"

*The institution. The ideological opposite. The hardest respect in the game.*

| | |
| --- | --- |
| **Age** | Six years older than the player |
| **Style** | **Bell Form** at Instinctive — the formal, rule-bound Low River derivative |
| **Body** | Balanced; technically flawless; deliberately unremarkable |
| **First met** | Chapter 4, Ninebell |

### Who he is
Grandson of Ise Ha-rin, chair of the Arbiter Council. Raised inside the last functioning institution of a dead empire, and he believes in it with a dry, unshowy sincerity that is very hard to mock.

His position: **martial skill must be licensed, recorded, and answerable.** Not because fighters are bad, but because an unanswerable person is a hole in the world. He wants the player registered, arbitrated, documented, and boring, and he wants this *for the player's sake as much as anyone's.*

He is, in a sense, **arguing Ruhn's conclusion with paperwork instead of violence** — and he does not know it, and the player will realise it before he does, which is one of the best quiet moments in the game.

### Why he is not a villain
He is right about the problem. He is losing at his own institution (the Ninth Bell's rules are being bought, `FACTIONS.md` §1) and he knows it and keeps working anyway. He is personally incorruptible in a building where almost nobody else is. He is also snobbish, bloodless, condescending about the Cut, and completely unable to see that a licensing regime administered by purchasable people is worse than no regime at all.

He is the only major character who can **lose an argument and change his mind**, which makes his respect the most valuable thing in the game.

### Trajectories
| End-state | Condition |
| --- | --- |
| **Advocate** | Earned by fighting inside his rules, winning without humiliating anyone, and — crucially — by *losing a duel deliberately when the rules required it.* He becomes the player's institutional protection and spends the last act holding the Council off you. |
| **Prosecutor** | Earned by contempt for the process, by unlicensed public fights, by any killing inside a city. He builds a case, lawfully, over years, and the last act has the Ninth Bell moving against you formally. |
| **Ally in ruin** | If the player helps him lose gracefully — supporting his failing reform — he ends the game without an institution but with a position, and he is the one who writes the honest account of the player afterward. |
| **Successor** | Rare. If the player convinces him that the answer is not licensing but *teaching*, he leaves the Ninth Bell and takes students. Requires the player to be doing the same. |

---

## 4. Nas O-rin — the one who betrays you

*Not a rival. A test.*

A fellow student during Chapter 3's Iron Road work: a cheerful, competent, unremarkable young escort who becomes the player's closest working friend and then **sells them out** — passes a route to people who ambush it, for money, because his sister is in the Cut and the company scrip does not stretch.

It is not a grand betrayal. It is a small, comprehensible, cowardly one by a man who is not evil and who will not meet the player's eye.

**He is caught, and he is delivered to the player, and nobody else will decide what happens to him.** The Iron Road does not want to know. He is unarmed, he is not resisting, he is crying, and there is no correct answer and the game does not supply one.

This is the **highest-weighted single Record event in the campaign** (`MORALITY_AND_REPUTATION.md` §4). Whatever the player does here propagates for the rest of the game, is reported to Ruhn by Yeo Ansa, and is the event Kem cites — with total sincerity — when he is explaining to his students what kind of man the player is.

*(He is related to Nas Il-ke of the Thousand Steps. Distant cousins. She finds out what you did to him from the family, months before you ever climb the stair.)*

---

## 5. Rival design rules

1. **Rivals grow.** Every rival returns at least four times across the campaign, and each time they are measurably better — new techniques, a changed body, a deeper Read of you. They are on the same progression curve you are, and the game shows it.
2. **Rivals are beatable and beat you.** Each rival has at least one authored encounter the player is *expected* to lose, and losing it is a story branch, not a failure (`STORY.md` §9).
3. **No rival is resolved by dialogue.** The player never selects "convince him." Trajectories are selected by accumulated conduct and by irreversible events.
4. **Rivals notice each other.** Yeo Ansa has opinions about Kem. Ise Vauran has a file on all of them. The rival set is a social graph, not three parallel tracks.
5. **At least one rival must be able to end the game hating you, with justification.** If every relationship can be repaired, none of them mean anything.
