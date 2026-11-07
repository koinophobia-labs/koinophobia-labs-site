# AUDIO_DIRECTION.md
## Sound design and music

**The governing principle:** power does not require cartoon explosion sounds. In this game the most frightening sound is a person who has stopped breathing hard.

---

## 1. Hit sound philosophy

**Low, short, and bodily.** Every impact sound answers three questions: *what hit, what it hit, and how hard.*

| Impact | Sound |
| --- | --- |
| Fist → torso | Dull, low thud with cloth compression. Almost no high end. |
| Fist → head | Sharper, shorter, with a bone component. Unpleasant. |
| Shin → thigh | A heavy slap with a deep body under it |
| Elbow/knee → anything | Short, hard, with almost no tail |
| Blocked on forearms | A flat slap of meat on meat — **distinctly not a hit**, so the player can hear their defence working |
| Deflected | A brief scrape-and-redirect, quieter than a block, with a rising tail |
| Structure break | Not an impact sound at all: **the sound of a person's feet losing the floor** — scuffing, a stumble, a grunt of effort |
| Joint break | One sharp crack, then silence, then the other person's breathing changes |

**Prohibitions:**
- **No whooshes on ordinary limb motion.** Only committed heavy attacks displace enough air to be audible, and then only slightly.
- **No layered cinematic impact stacks** — no sub-drops, no metallic shings, no reverse cymbals.
- **No sound at all on a whiff except the cloth and the breath**, which is what makes a missed technique feel as embarrassing as it should.

---

## 2. Breathing — the main HUD

**This is the most important audio system in the game.**

The default presentation has no stamina bar (`COMBAT_SYSTEM.md` §14), which means **breath is the interface.**

- The player's own breathing is mixed forward and tracks the Breath resource continuously: quiet and nasal when fresh; audible through the mouth under load; ragged and loud when gassed.
- **The opponent's breathing is equally legible**, mixed by distance, and it is how the player reads their exhaustion.
- **Deliberate breathing** (the Focus input) is a distinct, controlled, deep sound — a fighter managing themselves. When the player first hears an opponent do this (**Tanu Vesh**, `BOSSES.md` §9), it should be a small revelation.
- Breathing is **character-specific**. Ruhn's breathing is the quietest in the game. Kem's is the happiest.

**Progression is audible.** As the player's techniques reach Silent tier and their Breath economy improves, they simply *stop being winded* — which means the player can hear themselves getting better, in a game where the whole point is that you can perceive mastery without a menu.

---

## 3. Silence as power — the mastery audio curve

> **Master-tier fighters are quiet.**

Less cloth noise. Less foot noise. Shorter, shallower breath. Fewer vocalisations of effort. A dangerous person in this world is identifiable by how little sound they make while moving, and the player learns this without being told.

**The player's own sound design changes across the campaign.** The nine-year-old is loud — scuffing feet, heavy landings, audible effort on everything. The twenty-seven-year-old is nearly silent. **Nobody ever mentions it.**

And in the final chapter the player fights the quietest character in the game, and by then they know exactly what that means.

---

## 4. Foley

- **Footsteps** are surface-specific and *weight-specific* — they change with the Body build and with fatigue. Iron-shod boots are loud on stone and a liability in every sense.
- **Cloth** is a primary channel, not a background layer. Quilted cotton, canvas, and wool each have a voice, and the volume of cloth movement is one of the clearest mastery cues.
- **Ground contact under load** — the scuff and grind of a base being held or lost — is mixed prominently, because it is the Structure system's audio representation.
- **Hand wraps**, buckles, and coat hardware give each character a small recognisable signature.

---

## 5. Music

**Sparse, and absent by default.**

- **No music in ordinary fights.** Ambience, breath, foley, and crowd only. This is a deliberate and unusual choice, and it makes the fights feel real and makes the moments with music land enormously harder.
- Music enters for **boss fights, key story beats, and travel**, and only some of those.
- **Nas Il-ke's fight has no music at all** (`BOSSES.md` §8), which is the quietest three minutes in the game and, in a game full of silence, still noticeable.

### Instrumentation
Small, acoustic, and regionally specific. Bowed strings, low woodwind, struck metal, prepared percussion built from **industrial sources** (rail, steam, hammer) for the new world, and breath-driven instruments for the old. **No orchestra. No choir. No taiko-and-shakuhachi genre cliché.** Nothing electronic before the arc lights arrive, and then only barely.

### The thematic architecture — the one big musical idea
- **Ruhn's theme** is a single bowed string instrument, played by an old player: slow, unornamented, technically plain, perfectly placed.
- **The player's theme is the same phrase**, played by a second, younger player of the same instrument — initially rough, over-ornamented, and pushing the tempo. **It cleans up across the campaign in exact parallel with the animation fidelity tiers.**
- In the final fight, **both play**, the same phrase at different tempos, drifting in and out of alignment.
- Then one stops.

Which one stops, and whether the remaining phrase resolves or is left hanging, is determined by the ending (`STORY.md` §10). The **Stillwater** ending is the only one where a third, much younger player picks it up.

### Boss themes
Each boss theme is built from **one idea that mirrors their lesson**: Hess Aram's theme never resolves and never comes closer; Dul Ka-sen's theme quotes the player's theme and modifies it, live; Tanu Vesh's is a single figure that simply refuses to stop for four minutes.

---

## 6. Crowds

Reactive and informed.

- **Crowds know your use-name** (`MORALITY_AND_REPUTATION.md` §5) and chant it, or don't.
- **Crowd behaviour is a reputation readout.** A crowd that fears you is *quieter* than one that likes you, and the drop in volume when a feared player walks into a pit is one of the game's better wordless moments.
- Crowds react to the **Final Inch specifically** — mercy, brutality, and a Stop each produce a distinct, immediate, unmistakable response, and the player hears the world's verdict before any rumour has travelled anywhere.
- Cut crowds are loud, partisan, and enjoying themselves. Ninebell "crowds" are twelve clerks and a scratching pen.

---

## 7. Ambience

- **Mudgate:** water, rope, wind in reeds, distant fish traps, one dog.
- **Ironmouth:** continuous industrial bed — shunting, steam release, gulls, machinery that never stops, and it is genuinely tiring to be in for long.
- **Ninebell:** enormous empty stone rooms, footsteps with long tails, paper, pens, a distant bell on the hour that everyone has stopped hearing.
- **The Cut:** ventilation fans, coal chutes, a constant low rumble from underground, sodium lamp hum.
- **The Thousand Steps:** wind, and almost nothing else. **The quietest region in the game**, and the only one where you can hear your own breathing at rest.
- **The Iron Road:** rail rhythm, couplings, the specific acoustics of a moving freight car.

---

## 8. Voice

- **Ruhn speaks rarely**, and his lines are mixed close and dry, with no reverb regardless of the space. He always sounds like he is standing next to you.
- **Combat vocalisations are effort sounds, not battle cries.** Nobody shouts a technique name. Nobody roars.
- **Pain is understated.** A person who has just had an arm broken does not scream cinematically; they make a short sound and then go very quiet, and that is far worse.
- **Ambient NPC dialogue carries the rumour system** — the player overhears themselves being discussed, inaccurately, in every settlement, and this is the primary way Standing is surfaced.

---

## 9. Mix priorities

In combat, the mix order is fixed and non-negotiable:

1. **Breath** (yours, then theirs)
2. **Impacts and blocks**
3. **Ground contact and footwork**
4. **Cloth**
5. **Ambience**
6. **Crowd**
7. **Music** (when present at all)

Anything that competes with breath is ducked. The player must always be able to hear how tired both fighters are, because that is the game's most important piece of information and there is no bar to show it.
