# ART_DIRECTION.md
## Visual identity

**The directive that governs this document:** the single greatest visual risk to this project is shipping a *generic Unreal Engine martial arts game* — photoreal-ish characters, grey-brown environments, default post-processing, lens flares, and a UI made of glowing rectangles. Everything below exists to make that outcome impossible.

**The test:** *a still frame from this game, with the HUD off, should be identifiable as this game.*

---

## 1. Realism level — grounded stylisation

**Anatomically honest, surfacing stylised.**

- **Proportions and anatomy are realistic.** This is a game about bodies: about weight, base, reach, and what a person's shoulders do when they are tired. Stylised proportions would destroy the readability that the entire combat system depends on. No exaggerated silhouettes, no oversized hands, no heroic eight-head figures.
- **Surfacing is reduced and painterly.** Matte. Chalky. Restrained specularity. Skin does not have subsurface glow and pores; it has tone, dust, and bruising. Fabric does not have micro-fibre detail; it has weight and creases.
- **Reference frame:** hand-tinted early photography meeting ink-wash painting, then dragged through coal smoke. Muted, slightly overexposed in daylight, deeply dark at night.

**We are not chasing fidelity. We are chasing legibility and mood**, which is also how we protect the 60fps requirement (`GAME_VISION.md` §6).

## 2. Colour philosophy

**Desaturated ground, one committed accent per region.** Each region owns a palette, and the player always knows where they are from a single frame.

| Region | Ground | Accent |
| --- | --- | --- |
| **Mudgate / the Long Water** | River brown, wet green, grey sky | Pale ochre lamplight |
| **Ironmouth** | Rust, coal, steam-white | Sodium yellow |
| **The Gate of Nine Bells** | Bone, weathered stone | Brass and deep green |
| **The Cut** | Coal black, slate | Sodium orange — the only warm thing in the region |
| **The Thousand Steps** | Fog white, wet slate | **A single vermilion**, used perhaps six times in the whole region |
| **The Iron Road** | Rust, canvas, steam | Signal lamp red-green |

### Red is reserved
**Blood and lacquer are the only saturated reds in most scenes.** No red clothing, no red signage, no red UI outside of the reserved cases. The consequence: violence is **chromatically loud even when it is quiet**, and a single split lip reads across a wide shot. This is the cheapest and most powerful decision in the document.

## 3. Environment style

- **Architecture is functional and lived-in.** Buildings exist because something happens inside them. No ruins for mood, no ornamental rubble.
- **Industry is wet, heavy, and specific.** Rail ballast, coal dust, rivets, steam, oil, standing water. The new world is *physically uncomfortable*, and it contrasts with the old world's dry cold air above the treeline.
- **Interiors are small and cluttered.** Fighting indoors should feel constrained, which is a mechanic (`COMBAT_SYSTEM.md` §15).
- **Verticality is modest.** This is a game about ground, base, and footing. Rooftop parkour is the wrong game.
- **Density over size.** Five hand-built regions in V1 (plus the Iron Road as connective tissue), each small and thoroughly authored, rather than open terrain. Every space the player can reach should have been placed by a person.

## 4. Character proportions and the player's silhouette

**The protagonist's silhouette changes across the game, and it is the player's portrait.**

Four base proportions across the life arc (9 / 15 / 19 / 26), plus a **build morph driven by the Body attributes** (`PROGRESSION.md` §2). A Root/Density fighter and a Mobility/Speed fighter are recognisably different people from across a courtyard — different mass distribution, different shoulder-to-hip ratio, different way of occupying a stance.

**Nobody in this game is a superhero build.** The most dangerous person in the world is a heavy, square, low-shouldered eighty-six-year-old who mends nets.

## 5. Clothing

**No robes. No silk. No flowing sashes.** This is a working world at an industrial moment.

Materials: quilted cotton, canvas, wool, oiled leather, iron, cheap machine-printed cloth. Hand wraps. Boots that have been resoled. Coats made to be repaired.

### The coat — the game's single best identity device
The player wears **one coat for the entire game**. It is given to them in Chapter 1 and it is never replaced.

It **ages, tears, is patched, and is repaired in the regional style of wherever it was repaired.** A Cut repair is coarse black thread and a mismatched panel. A Ninebell repair is neat and slightly too formal. A Thousand Steps repair is undyed wool and almost invisible. A repair made by Ruhn is the Mudgate river style, and the player will recognise it later on his own coat.

**Zero mechanical benefit. Enormous identity value.** By Chapter 7 the coat is a map of the player's life, readable at a glance, generated entirely by where they have been. This costs a small library of patch decals and a slot system, and it is the highest identity-per-byte feature in the game.

## 6. UI, menus, and typography

### The Ledger is the UI
There is no conventional menu system. The pause menu **is the physical notebook the character keeps** (`PROGRESSION.md` §4): hand-ruled paper, ink, the player's own annotations, techniques drawn as diagrams whose quality reflects their mastery state.

A technique at Impression is a scrawl with question marks. At Instinctive it is a clean, confident single line. **The player reads their own mastery in their own handwriting**, and no percentage appears anywhere.

### In-world HUD
Default: **none** (`COMBAT_SYSTEM.md` §14). No health bar, no stamina bar, no damage numbers, no lock-on reticle beyond a minimal soft indicator, no quest markers, no minimap. Optional Trace and Full modes exist for accessibility and preference.

### Typography
Two faces and no more:
1. **A high-quality serif** for everything printed in-world — the era's cheap industrial printing: registry forms, telegrams, pit billing, contracts, signage. Slightly inked-up, slightly uneven impression.
2. **A handwritten face** for the Ledger and for anything the player or Ruhn wrote.

**No sans-serif anywhere in the game, including options menus.** No glowing edges, no drop shadows, no sci-fi UI panels, no hexagons. The entire interface should look like something that could have been printed on a press in Ironmouth.

## 7. Camera

Four modes (`GAME_VISION.md` §5), specified:

| Mode | Behaviour |
| --- | --- |
| **Travel** | Over-shoulder-adjacent, ~1.6m height, moderate FOV, slight handheld drift. Low horizon; the world sits above you. |
| **Duel** | Drops to chest height, pulls back, and frames a **two-shot at ~20° off the fighters' axis** so that the distance between the bodies is always legible. The camera respects the line between the fighters and never crosses it. This is the game's signature frame. |
| **Field** | Rises, widens, softens targeting. Peripheral threats are cued diegetically — a shadow, a footstep, a shift in the ambient mix — never by an arrow. |
| **Inch** | A deliberate, slow move to an angle showing **both faces**. You do not get to end a person off-camera. |

### Camera rules — "the camera cannot become the hardest opponent"
Hard constraints, enforced in code and tested automatically:
1. **Never occludes the player.** Geometry between camera and player triggers a pull-in or a material dither, never a blind frame.
2. **Never auto-rotates during committed frames.** If the player is in the middle of a technique, the camera holds its relationship.
3. **Predictive framing:** the camera anticipates the opponent's committed action and adjusts *before* it starts, so incoming attacks are never framed out.
4. **Tight interiors get a deliberate semi-fixed "room camera"** — a wide, static-ish angle like a security frame — rather than collapsing into the player's back. This is authored, not a failure state, and it is one of the better-looking things in the game.
5. **No camera shake above a defined threshold.** Impact is communicated by frame-holds and micro-shake, never by shaking the frame until it is unreadable.

## 8. Impact and effects

**Contact is communicated by weight, not by sparks.**

- **Frame-holds** on significant impact — a handful of frames where both characters hold, which is the single most effective impact technique in fighting games and costs nothing.
- **Micro-shake**, small and short.
- **Cloth ripple** on the struck body.
- **Dust and breath vapour** displaced by movement.
- **No hit sparks. No impact flashes. No speed lines. No slow-motion on ordinary hits. No particle systems on strikes at all.**

The only time-dilation in the game is the **Final Inch**, which means it always signifies something.

## 9. Blood and injury

Present, accumulative, never gratuitous.

- **Blood accumulates** on faces, hands, clothes, and the ground, and **persists between fights within a day.** It is washed off, not despawned.
- **Bruising and swelling develop over time** — a fight in the morning shows on the face by evening. This is a shader-driven damage layer on the head and body.
- **No dismemberment, no gore, no spectacle violence.** A broken arm is shown by how the person holds it and by the sound, not by a fracture render.
- **Every injury is visible on the model**, because the combat system requires the player to read Vitality from the body (`COMBAT_SYSTEM.md` §14).

**Target rating:** Mature / PEGI 18, earned by weight and consequence rather than by volume.

## 10. Lighting

- **Practical, motivated, and period-correct.** Oil lamps, coal fires, arc lights (late chapters, Ironmouth only), daylight through smoke, and genuine darkness. Night in Mudgate is *dark*.
- **Low-key by default.** Deep shadows, limited fill, one dominant source per scene.
- **The Thousand Steps is the exception** — blown-out, foggy, near-white, almost no shadow. The visual relief of the entire game, arriving exactly when the story is at its worst.
- **Lumen with a hard budget.** If global illumination threatens the frame rate, it is reduced. The frame rate is a design constraint (`GAME_VISION.md` §6).

## 11. Post-processing — the anti-generic pass

A custom post stack established at vertical slice and never defaulted:
- Custom matte/ramped shading bias on skin and cloth.
- Restrained bloom, effectively off on anything but light sources.
- **No chromatic aberration, no vignette by default, no lens dirt, no lens flares.**
- A fine, stable film grain, resolution-independent.
- A gentle, per-region colour response curve rather than a global LUT.
- Motion blur off by default (it damages readability at 60fps, which is the whole point of 60fps).

**Rule:** any post effect that reduces the legibility of a body in motion is deleted, however good it looks in a screenshot.

## 12. Cinematics

- **In-engine, always.** No pre-rendered cutscenes anywhere.
- **Short.** Median cutscene length under 45 seconds. The game's emotional work is done in play.
- **The camera behaves like a camera** — it is operated, it has weight, it is occasionally imperfect. No impossible drone moves.
- **Dialogue scenes are mostly two-shots and hands.** Ruhn's hands get more screen time than his face, deliberately (`MASTER.md` §8).
- **The training montages are in-engine and playable** (`VERTICAL_SLICE.md` §5), not cutaways. The player performs the passage of time.

## 13. The recognisable frame

If the art direction succeeds, this is the frame someone remembers:

> Wet packed earth. Low grey light through coal smoke. Two figures in quilted working coats, one of them old, standing at conversational distance with their hands down. No UI. No effects. The only saturated colour in the frame is a split lip.
