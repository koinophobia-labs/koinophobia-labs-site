# WO-0127 v2: App home "worlds" spec (studio-design-director, 2026-10-15)

## Verdict

V1 (PR #68) really is one template with seven palettes [V]. `trendi-desktop.png` and `dreamcatcher-desktop.png` in `/Volumes/KoiBuild/koinophobia-labs-site/WO-0127/Evidence/WO-0127/review/` share the same layout and the same section headings ("A look inside.", "Made to be used.", "Start here."). The seven worlds below each change four things: the composition, the motif source, the section form and the typography. Every motif comes from the app's own code or icon, and every price and claim is from the inventory. Six screenshot and claim defects need fixing before v2 ships. Two of them are live in v1 today: the Old Dog "Business" row and the Dreamcatcher AssistiveTouch dot.

The **World concepts** section is the part to save as `reports/WO-0127/WORLDS.md`.

---

## World concepts (save as WORLDS.md)

### Shared shell (applies to all 7)
- **Studio bar:** 44px high. Background is the world's ground at 85% with a backdrop blur. Mark and "Koinophobia Labs" in Sora 13px at 70% opacity. Links: Apps · Blake · Work with me. V1 shows both "Work With Us" and "Work with me" [V]; keep one.
- **Footer:** one line in Sora 12px, followed by an "Also from" row of the six other **real icons** (48px, labelled).
- **Fonts:** load per route through `next/font` in each app's `layout.tsx`. At most 3 families per world, plus Sora in the shell. **No Inter anywhere.**
- **Motion:** everything sits inside `prefers-reduced-motion: no-preference`. CSS or IntersectionObserver only, no rAF loops, and nothing animates at rest.
- **Screenshots:** real store PNGs only, through `next/image`. Alt text says what is on screen. No drawn bezels.
- **From Blake:** the same everywhere, as the one constant voice across the worlds. A Newsreader italic line (verbatim from INVENTORY §8) plus a JetBrains Mono receipt built from data, e.g. "Designed, built and shipped by Blake Taylor, Chicago · on the App Store since 2026-08-28". No invented origin stories.
- **Prices:** marked USA, with renewal text on every subscription. "Coming soon" status is a plain label, never button-styled and never a link.

---

### 1. Trendi: "The Green Room". The thirty seconds before you press record.
- **Hero:** an aubergine `#151017` stage.
  - `shot-1` sits centred at 68vh, lit from behind by a static radial key light (`#D95BA2` at 22%), like a ring light. Four thin viewfinder corner ticks (`#F7F2EC` at 30%) frame it.
  - Left: "SAY IT MESSY." in Hanken Grotesk 800, tracking 0.32em. That is the store set's own header style.
  - Right: "Make it yours." in Gelasio italic.
  - Icon at 88px, top left. The CTA is an enamel capsule (a pink-to-violet gradient, like the in-app "Shape This Into a Video" button) with an aubergine label.
- **Motion:** the enamel sheen appears on hover or press only. That mirrors the app, which has no animation at rest (`TrendiMetalFinish.swift:49-50`) [V]. In the teleprompter section, the line crossing the viewport centre goes from 0.45 to 1 opacity. Reduced motion: every line at 1.
- **Type:** Hanken Grotesk (caps 56–96px, body 17px), Gelasio italic for "your words" (40–64px), JetBrains Mono eyebrows. All three are the app's own fonts or its stand-in.
- **Flow:**
  1. **"The shot list":** shots 1–5 as storyboard cards SHOT 01–05.
  2. **"Your script":** the features mapped to the app's five script beats:
     - Opening: one angle, three hooks.
     - Main idea: editable script, caption, shot plan.
     - Example: text or speech capture.
     - Takeaway: teleprompter, section by section or the full script.
     - Ending: the on-device Vault and performance notes.
     - Leave Take Two out until CREATIVE.md covers 2.x.
  3. **"Coach Packs":** two cue cards. Free, 3 a week · Trendi Pro $7.99 a month for 100.
  4. **From Blake:** the teleprompter's last line (§8 #3).
- **Art:** see Higgsfield prompt A below.
- **AA:** `#F7F2EC`/`#151017` 16.9 · `#D95BA2`/`#151017` 5.3 · **CTA label `#151017` on pink 5.3. White on pink is 3.2 and fails.** · `#CD9CB6` 8.1.
- **Blake:** "You stay in control of the words." (the app's own string) sits beside his line.

### 2. Way In: "First Light on the Path". The path out of the shift, with the next step lit.
- **Hero:** full bleed `#051419`.
  - One cream SVG path, traced from the icon's own path, sweeps from the bottom-left corner to an amber four-point star at the upper right.
  - Three screenshots ride the path as waypoints, rising and growing: `shot-3` (26vh) → `shot-4` (34vh) → `shot-1` (44vh), each with a 1px mint rim.
  - Headline at upper left in Source Serif 4: "Your experience. A clearer next move." The star replaces the final period. The icon sits at the foot of the path.
- **Motion: none.** The app forbids animated movement even when Reduce Motion is off (`FootStyle.swift:61`) [V]. Only hover colour changes.
- **Motifs:** amber appears only on the star, proof marks and the selected offer (`FootStyle.swift:17`) [V]. The yellow triple-tick from the profile card marks sections. Mint "ME" monogram circles number the steps.
- **Type:** Source Serif 4 (display 48–88px with optical sizes) and Source Sans 3 at 18px.
- **Flow:**
  1. **Demo "Three steps up":** Bring what you have (shots 2–3), Keep the next move in view (shot 4), Keep every application together (shot 5).
  2. **Features as mile markers down the page:** true sentences or an import; fit check (supported, related, gap); versions, notes and follow-ups. Then plainly: "Way In does not apply on your behalf. No account is required."
  3. **Pricing as two tickets:** Resume Toolkit $9.99 one-time · 30-Day Career Pass $29.99, does not renew. Header: "One payment each. Nothing renews." (`ToolkitPresentation.swift:75`). The Free line carries its limit, per CREATIVE.md:58.
  4. **From Blake at the star** (§8 #8).
- **Art:** none.
- **AA:** cream/ground 17.2 · mint 11.8 · label `#053338` on amber 8.5 (never white) · `#C7DBD9` on `#0F262B` 10.9.
- **Blake:** respect for service work, said plainly, with no urgency. It closes with "Add one thing you're proud of."

### 3. Forget About It: "The Margin of the Day". A Wednesday, written down before it got away.
- **Hero:** paper `#F9F3E8`, no boxes.
  - A 120px left gutter of timestamps runs the whole page, like the Today screen, and every section is an entry in it.
  - Hero entry: the pasta-knot icon at 96px, with `Design/Entrance/forget-about-it-entrance.mp4` playing once (4 s, silent). Under reduced motion, or if decoding fails, it shows the still icon, which is the app's own rule (Entrance README).
  - Right: `shot-1` (light) and `shot-2` (dark) overlap by 30%, with the dark one behind and 6% lower: day and night of the same Wednesday.
- **Typography rule, kept literally:** "the person's words are set in a serif, and everything the app says about them is not" (`DiaryTokens.swift:60-61`) [V].
  - The big expressive moment is a sample thought from the screenshot in Newsreader, opsz 72, 72–120px: "Halcyon pricing still feels off to me", labelled "example entry".
  - The page's own voice, including the "Catch it before it goes." headline, is Instrument Sans 600.
- **Motifs:** a 2px sauce-red vertical rule for open thoughts; open-circle "still open" bullets (from the Memory screen); italic sauce asides. Paper grain is an SVG `feTurbulence` at 4%.
- **Motion:** only the app's settle (220ms) and appear (280ms) ease-outs, run once per entry. "Motion explains a change; it never decorates one." (`DiaryTokens.swift:84`)
- **Flow:**
  1. **Today, History, Memory** as gutter entries (shots 1, 3, 4).
  2. **"Still open" features:**
     - type or dictate;
     - on the Watch, speak, scribble or type;
     - search;
     - reflections shown apart from your words.
  3. **Pricing as a diary page:**
     - **Free:** unlimited capture, all history, text search, basic stats, today's reflection, plain-text export.
     - **Plus:** $2.99 a month or $24.99 a year, for filters, patterns and earlier reflections.
     - Say "Plus" only.
  4. **From Blake** as the last entry, gutter label "Later" (§8 #7).
- **Art:** none.
- **AA:** ink 15.0 · sauce 6.4 · muted 5.6 · white on sauce 7.1. Separator `#B7A99A` is 2.1, decorative only.
- **Blake:** dry imperatives. It signs off with "Open. Capture. Carry on."

### 4. Preaching to the Choir: "The Loft at First Light". An empty choir loft before the first voice.
- **Hero:** the only symmetrical world. Bone `#F4F0E7`.
  - The choir-arc icon at 160px, top centre. "What is on your heart?" centred below it in EB Garamond, 56–104px.
  - Five screenshots sit on a shallow arc that repeats the icon's fan: the centre phone `shot-1` at 52vh, the flanking pair at 44vh, the outer pair at 36vh, rotated ±3° and ±6°.
  - On mobile: the centre phone plus a swipe row.
- **Motifs:** tracked small-caps eyebrows exactly as in the app (ORIGINAL PRAYER, PRAYER RECORD); 1px oxblood rules; a hymnal measure (64ch, leading 1.6); roman-numeral sections.
- **Motion:** the arc rises 8px once on entry (280ms) and nothing else moves. No counters and no celebratory motion.
- **Type:** EB Garamond (display and prayer text, with real small caps) and Public Sans at 15px for chrome. It reads as a hymnal, it is distinct from FAI's Newsreader, and it keeps the app's serif/sans split.
- **Flow:**
  1. **"Order of the day":** I–V, shots 1–5 in order.
  2. **Hymnal index of features:**
     - write or record, with optional on-device transcription;
     - a dated journal with search, names, labels and threads;
     - export with an optional passphrase;
     - Recently Deleted for 30 days.
  3. **Pricing as a journal page:**
     - It opens with "Without Keeper, every prayer stays yours to keep, read, search and export." (`paywall.strings.json:17`).
     - Then Keeper: $2.99 a month · $24.99 a year · $79 once, which adds similar-wording search and a Year view.
     - Never "unlock", "premium" or "trial".
  4. **Privacy, plainly:** "No account, analytics, ads or tracking. iCloud sync is not available." Never "nothing leaves the phone".
  5. **From Blake.**
- **Art:** see Higgsfield prompt B below.
- **AA:** ink 15.1 · oxblood 10.6 · muted 6.1 · bone on ink 15.1. Outline `#8A857D` is 3.2, for non-text only.
- **Blake:** the page claims nothing about anyone's faith.

### 5. Old Dog: "The Reading Room". A lamp on, a weeknight, still learning.
- **Hero:** a split desk that mirrors the Mac app.
  - A fixed 300px navy column (`#142138`) holds the hound icon at 160px, "Old Dog" with a gold `#E3BA7D` period, LEARN SOMETHING NEW, and "Stay curious." All of it comes from the shipped sidebar.
  - Right: `shot-1` at 88% width on `#171D29`, with a deep soft shadow, like a book open on a table.
  - Headline in Literata, 56–96px: "Old Dog. New Tricks." Then: "On the Mac App Store · iPhone coming to the App Store."
- **Motifs:** the rust Learn · Practice · Prove bar works as the demo's progress indicator. A card-catalog drawer. Paper `#F5F4F1` sections, like a lit table ("quietly weathered", CREATIVE.md:40).
- **Motion:** the bar fills one segment per demo step (`scaleX`). Reduced motion: shown full.
- **Type:** Literata (bookish optical sizes) for display and text; Atkinson Hyperlegible at 18px for UI. Atkinson was designed for low-vision readers, which suits "never too old".
- **Flow:**
  1. **"One lesson, start to finish":** Mac shots 2→3→4→5. **Crop shot 5 above the "Business · Courses planned" row.**
  2. **Card catalog:** ten index cards, one per subject, each "2 units · 4 objectives", plus a note card: "Placement suggests a starting point. It never awards lesson mastery."
  3. **Pricing as a bookplate:** "The first course in each subject is free. Every course, every subject, including ones added later: $9.99. One-time purchase. Not a subscription." Then: "Bought before 1.2? You keep all ten courses."
  4. **From Blake** (§8 #6).
- **No iPhone screenshots** until iPhone 2.1 is live (see Defects).
- **Art:** none.
- **AA:** `#F3F1EC`/`#171D29` 15.0 · gold on `#142138` 8.9 · `#F3BA91` 9.8 · navy on gold CTA 8.6. On paper: navy 14.1, rust 6.7, slate 5.4.
- **Blake:** a plain-spoken librarian. No "certified", and no age jokes.

### 6. Teacher's Pet: "The Kitchen-Table Schoolhouse". A sunny weekday morning, school at the table. Coming soon.
- **Hero:**
  - A pine `#173F39` board band, 56vh, with a faint chalk grain (CSS). The headline is cream Gelasio 700: "Your personal school at home.", with a saffron highlighter swipe behind "school".
  - Status label "Coming to the Mac App Store": pine outline, no fill, no arrow, not a link.
  - On paper `#FAF9F4` below, `shot-1` (Your subjects) at 72vw breaks 12vh up into the board. The apple icon (128px) sits on its top-right corner with a contact shadow, like the apple on a teacher's desk.
- **Signature:** the app's own lesson stepper is the page's navigation. A sticky **Learn → Get help → Practice → Check → Result** bar marks the current section in saffron. That is state, not motion: a 150ms colour change, none under reduced motion.
- **Type:** Gelasio 700 (the Georgia-Bold stand-in, matching the subject titles) and Lexend at 18px. Lexend was built for reading fluency, which suits both learners and parents.
- **Flow:**
  - **Learn:** shots 1–3.
  - **Get help:** shot 4, "Choose your explanation".
  - **Practice and Check:** "Learn with help. Check without it." and "This is one supervised check—not a mastery grade or proof of learning."
  - **For your adult:** shot 5, adult passphrase; no account, ads or tracking.
  - **Result, as a report card:** Family $34.99 a month · $299 a year · $199 for the first year. "Planned pricing, pending App Review. Not available to buy yet."
  - **From Blake** (§8 #4).
- **Art:** none.
- **AA:** ink 12.9 · cream on pine 11.0 · pine on saffron 7.1 · coralText 6.0 · tealText on sage 7.1 · focus ring 5.2. Coral `#F47F68` (2.5) and teal `#7ECACA` (1.8) are fills only.
- **Blake:** it says what the app isn't (no diploma, no accreditation) before what it is.

### 7. Dreamcatcher: "3 a.m.". The room at 3 a.m., when you wake from a dream and reach for the words. Coming soon.
- **Hero:** full bleed, a gradient from `#0B0E1F` to `#12162C`.
  - The DreamHoop, rebuilt in SVG from `DreamHoop.swift`: 8 spokes, rings at 0.70 and 0.40, a centre dot. Lavender `#A99BD6` with stroke opacity 0.20 and ring opacity 0.32, at 130vh, cropped off the top-right edge.
  - One gold `#E7B76A` star dot.
  - Low left: "Catch the dreams you remember." in Instrument Serif italic, 64–120px, cream.
  - Lower right: `shot-1` at 40vh, like a phone face-up on a nightstand.
  - Label: "Coming to the App Store · iPhone and Apple Watch".
- **Flow, as night phases:**
  - **3 a.m. "Catch it":** shot 1, "Say it before it fades.", "Your exact words."
  - **7 a.m. "Morning review":** the ground turns to cream `#F7F1E8` with ink `#1B2140`. Check this feature against the build before stating it.
  - **Daytime "Are you dreaming?":** shot 3, "Read some text. Look away. Read it again. Did it change?"
  - **Tonight "Notice the next":** shot 2, dream signs.
  - **Back to night for pricing:** a nightstand card listing the four Lucid Toolkit tools, verbatim from shot 4, then "Everything else is included." $9.99 one-time. "Free to download. Planned pricing, pending App Review."
- **Motion:** stepped backgrounds per phase. Where `animation-timeline: view()` is supported and motion is allowed, the phases crossfade. **The hoop stays static** (D-0139, `DreamHoop.swift:3`) [V], and nothing twinkles.
- **Type:** Instrument Serif (display italic: tall, quiet, nocturnal) and Spectral at 18–20px (a screen-first literary serif) for dream text and tracked-caps eyebrows.
- **Art:** see Higgsfield prompt C below.
- **AA:**
  - Night: cream 14.5 · gold 9.7 · lavender `#9C8BD0` 6.0 · eyebrow 8.3 · night on gold 9.7.
  - Morning: ink 14.0 · gold `#805519` 5.8 · lavender `#705C9A` 5.1.
  - Hairline: 1.4, decorative only.
- **Blake:** honest about what is unknown. No dream meaning and no sleep claims (§8 #2).

### Higgsfield prompts (3 images in total; the other four worlds use code-native textures)
- **A. Trendi, 2560×1440:** "Soft out-of-focus studio light, large round bokeh discs of warm pink and muted violet over a deep aubergine-black ground, faint film grain, gentle edge falloff, calm. No people, no objects, no UI, no text, no devices, no logos." Palette `#151017 #251E29 #D95BA2 #CD9CB6 #D6C5D9`. Use at 35%, masked darkest behind the phone.
- **B. Preaching to the Choir, 2400×1350:** "Early morning light across a warm bone-white plaster wall, the soft blurred shadow of a tall arched window frame, fine plaster texture, still. No people, no religious symbols, no UI, no text, no devices, no logos." Palette `#F4F0E7 #FBF9F2`, warm umber shadow, a trace of `#6B131B` in the deepest shadow. Use at 30%.
- **C. Dreamcatcher, 2560×1440:** "A bedroom window at 3 a.m. through a sheer curtain, deep indigo sky with faint scattered stars, a soft lavender haze where moonlight touches the fabric, heavy grain, very low light. No moon shape, no feathers, no beads, no webs, no people, no UI, no text, no devices, no logos." Palette `#0B0E1F #12162C #262F57 #A99BD6`, one faint `#E7B76A` point. Sits under the SVG hoop.

---

## Defects (ranked)

1. **The Old Dog iPhone screenshots claim iPhone** [V image, `assets/old-dog-iphone-shot-1,3.png`]. They say "on your Mac and iPhone" and "Works on your Mac and your iPhone", but iPhone is on the do-not-claim list until 2.1 is live. They also show an AssistiveTouch dot. Keep them off the page until 2.1 is approved and recaptured.
2. **Old Dog Mac `shot-5` shows "Business · Courses planned"** [V image]. "Business course" is a do-not-claim, and v1 serves this shot today [V `review/browser-qa.json`]. Crop it above that row or replace it.
3. **The AssistiveTouch dot is on all four Dreamcatcher shots, not only shot 4** as INVENTORY:496 says [V images, `assets/dreamcatcher-shot-1..4.png`]. Shots 1–3 were uploaded to the store [E inventory]. For the web, crop above the dot or retake. The store set needs a retake at the next submission.
4. **Teacher's Pet content counts.** "1,273 learning objectives" sits against a strict completion of 4/1,273 with 0 human reviews [E/C `projects/teachers-pet/PROJECT_STATE.md:105,254`]. Don't put the counts on the page. Use "K–12 in math, ELA, science and social studies".
5. **"Coming soon" styled as a CTA.** V1 Dreamcatcher renders it as a gold button [V `review/dreamcatcher-desktop.png`]. Whether it is a link is [?]. Either way, a non-action must not look actionable.
6. **Stale-screenshot risk.** The PttC store shots are dated 2026-09-16 in-image and show the 1.0-era Today, while 2.1 is live with an offer row and Mark answered [E `PROJECT_STATE.md:123`]. Way In (1.0.3 set) and FAI are stale as soon as their 2.1 releases land. Whether Trendi's set matches 2.1 is [?]. Captioning them "From the App Store listing" keeps them honest for now. Recapture each set on release.
7. **Contrast traps:** white on Trendi pink is 3.2. FAI's separator (2.1) and Dreamcatcher's hairline (1.4) must never be the only boundary of a control [V computed].
8. **Duplicate nav items** in v1: "Work With Us" and "Work with me" [V images].

## Polish
- Use the real icon row for "Also from" instead of text links (S).
- Load fonts per route, so no page pulls all 12 families (M).
- Give each world its own OG card made from its hero (M).
- Record real current-build demos for Trendi 2.1, FAI, PttC 2.1 and the Old Dog Mac app, replacing the pre-2.0 Sept-10 masters (L; needs a device or Mac capture).

## Identity check
- **Way In:** the code palette (midnight `#053338`/`#051419`, mint `#94DBCC`, amber `#FFC240`) matches the locked navy, mint and warm-yellow identity [E inventory → `AppTheme.swift:4-7`]. Avoid the asset catalog's blue AccentColor. The static world honours `FootStyle.swift:61` [V].
- **FAI:** the serif/sans rule and the motion rule are both followed [V `DiaryTokens.swift:60-61, 84-90`].
- **Dreamcatcher:** the hoop is static per D-0139 [V], with no feathers, beads or Native motifs [E CREATIVE.md].
- **Trendi:** press-only enamel [V `TrendiMetalFinish.swift:49-50`]. The palette is still "observed; to set" [E CREATIVE.md:103].
- **PttC:** one oxblood accent, used as DESIGN-NOTES defines it [E `design/ptc-2.0/DESIGN-NOTES.md`].
- **Old Dog:** paper, navy, rust and gold, "quietly weathered" [E CREATIVE.md:40-41].
- **Teacher's Pet:** pine, saffron and Georgia-Bold [E `Theme.swift`].

## Needs Blake
1. **Typefaces beyond the inventory's stand-ins:** Literata and Atkinson (Old Dog), EB Garamond (PttC), Instrument Serif and Spectral (Dreamcatcher), Lexend (Teacher's Pet), Instrument Sans (FAI).
2. **The From Blake line mapping.** PttC has no fitting verbatim line, so he writes one or it carries the receipt only.
3. **The three Higgsfield images.** Is the PttC arched-window light right, or too churchy? The spend falls within D-0083's 40-credit allowance [C manual].
4. **Dreamcatcher's night-to-morning scroll.**
5. Commit `d71c8aa` records that Blake approved the coming-soon pages for Teacher's Pet and Dreamcatcher [C commit message]. Dreamcatcher's proposed claims ("No account. No analytics.") are still unchecked against the build, so the page uses only lines visible in the screenshots.

## Proposed ledger updates
- **WO-0127:** WORLDS.md adopted as the v2 spec, with defects 1–8 as v2 acceptance criteria.
- **`projects/old-dog` design debt:** no iPhone imagery until 2.1 is live; Mac `shot-5` shows a planned Business row.
- **`projects/dreamcatcher` design debt:** AssistiveTouch dot on store shots 1–3; retake at the next submission. The inventory's "shot-4 only" note needs correcting.
- **`projects/preaching-to-the-choir`:** store screenshots predate 2.1; recapture.
- **`projects/teachers-pet`:** content counts are not for marketing until completeness is evidenced. Commit `b3f4801` says the Family subscriptions were resubmitted [C], which supersedes INVENTORY gap 3 pending an ASC readback.

Contact sheets for review are in `/private/tmp/claude-501/-Users-koi-KoinophobiaLabs/75c1ad27-00cb-4f52-8504-fa839e93111b/scratchpad/sheets/`. Nothing in HQ or any repo was modified.
