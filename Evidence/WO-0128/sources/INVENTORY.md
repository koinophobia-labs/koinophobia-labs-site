# WO-0127 (D-0189): truth and asset inventory for the per-app home pages

Compiled 2026-10-15 17:46 CDT by a Claude research worker. Read-only throughout: no repo, `projects/**` or site file was edited, and no build was run.

**Sources and tags.** [V] means observed directly in this pass:
- the public iTunes lookup (`country=us`), fetched 2026-10-15;
- App Store Connect GET reads through `~/wayin-asc-request.py`, 2026-10-15;
- `git ls-files`, file reads and copies.

[E/C] means taken from a ledger or a worker's reading of the code; file:line is given where one exists. The full lookup JSON was kept only in session scratch, so the figures below are the record.

Asset copies are in `reports/WO-0127/assets/` (31 MB). Every icon is a 1024×1024 PNG.

---

## Summary

| App | Status | Icon | Fonts | US pricing (ASC) | Demo videos |
|---|---|---|---|---|---|
| Trendi | LIVE 2.1 | y | Georgia display, Hanken Grotesk, JetBrains Mono (bundled) | Free; Trendi Pro $7.99/mo | 4 (Sept masters, pre-2.0 UI) |
| Way In | LIVE 1.0.6; 2.1 in review | y | SF Pro and New York (system) | Free; Resume Toolkit $9.99 one-time; 30-Day Career Pass $29.99, no renewal | 3 (Sept masters, 1.0 UI, banned for new creative) |
| Forget About It | LIVE 1.1.1; 2.1 in review | y | New York and SF (system) | Free; Plus $2.99/mo or $24.99/yr | 1 brand entrance and 3 Sept masters |
| Preaching to the Choir | LIVE 2.1 | y | New York and SF (system) | Free; Keeper $2.99/mo, $24.99/yr or $79 lifetime | 0 |
| Old Dog | LIVE Mac 1.2.0; iPhone 2.1 in review | y (Mac and iOS) | New York and SF (system) | Free; all courses $9.99 one-time | 0 |
| Teacher's Pet | IN REVIEW 1.1 (15), Mac, never released | y | Georgia-Bold, New York, SF | Free download; Family $34.99/mo, $299/yr, $199 first-year intro | 0 |
| Dreamcatcher | IN REVIEW 1.0.0 (11), iPhone and Watch, never released | y | New York and SF (system) | Free; Lucid Toolkit $9.99 one-time | 0 |

**Every app's base price is $0.00 in the USA** [V ASC `appPriceSchedules/<id>/manualPrices`].

---

## 1. Trendi (`trendi`, app id 6776299336, iPhone)

**Status.** LIVE [V].
- Version 2.1, current release `2026-10-15T12:56:14Z`. First released 2026-08-28.
- Store page: https://apps.apple.com/us/app/trendi-content-coach/id6776299336
- The public What's New still shows the 2.0 notes.
- Ledger: 2.1 READY_FOR_SALE (`projects/trendi/PROJECT_STATE.md:152,244`). The front matter at `:6` still says 0.2.3 (stale).

**Icon.** `/Volumes/KoiBuild/trendi/WO-0084-procap/apps/mobile/ios/CommandCenter/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` → `assets/trendi-icon.png`.

**Palette.** From `apps/mobile/ios/CommandCenter/TrendiDesignTokens.swift`, dark / light:
- accent and pink/magenta: `#D95BA2` / `#922858` (:9, :11, :13)
- coral `#D5A4A7` (:10); rose `#CD9CB6` (:12); azure `#CD9CB6` / `#75506B` (:14); violet `#D6C5D9` / `#75506B` (:15)
- canvas `#151017` / `#F7F2EC` (:24); canvas1 `#18131A` / `#FFFBF6` (:25)
- card `#251E29` / `#FFFBF6` (:27); elevatedCard `#352B39` / `#F3E6ED` (:28)
- paper `#F7F2EC` (:16); aubergine `#151017` (:17)
- primaryText `#F7F2EC` / `#17141B` (:31)
- Status colours: green `#46D6A0` / `#226647` (:18); destructive `#FF8395` / `#B62940` (:19); warning `#E9B45B` / `#815600` (:23)

The palette is not formally decided: CREATIVE.md:103 calls it "observed; to set". The landing page uses `#171219`, `#F8F3E9` and `#EB9DC8` (CREATIVE.md:107-109).

**Fonts.**

| Font | Use | Web availability |
|---|---|---|
| Georgia | display (`TrendiDesignTokens.swift:58`) | Not on Google Fonts. **Gelasio** is drawn to Georgia's metrics. |
| Hanken Grotesk | body and labels (:62, :66; bundled `Resources/Fonts/HankenGrotesk-Variable.ttf`) | **Google Fonts** |
| JetBrains Mono | eyebrows and mono (:70, :150; bundled) | **Google Fonts**, already loaded by the site |
| Noteworthy | one use (`ClarkFidelityCommandShell.swift:12350`) | Ignore for the web, or use Kalam |

**Tone.** A calm creator coach. It speaks in the second person, keeps sentences short, is honest about limits, and keeps reminding you the words are yours. Examples:
- "Share enough context for one useful first move. You stay in control of the words." (`Views/BeginnerOnboardingView.swift:303`)
- "Leaving keeps your progress. Nothing is exported yet." (`Views/RecordModeView.swift:456`)

CREATIVE.md:101: "plain, practical, owner to owner… Never hype."

**Truth.**
- **Live description:** "a content coach for creators who know what they want to say but get stuck between the thought and the record button."
  - Shape This Into a Video gives one angle, three hooks, an editable script, a caption, a shot plan and a "why it works" note.
  - It also offers text or speech capture, a teleprompter (section by section or the full script), an on-device Vault, manual performance notes and the Creator Playbook.
- **2.0/2.1 additions** (live What's New):
  - AI coaching asks consent first.
  - Take Two reviews a take on the iPhone (time to the point, pace, length; Pro adds filler words and one fix).
  - Speech recognition runs on the device.
  - Account deletion confirms with Apple.
- **Approved claims:** CREATIVE.md:48-61 (14 claims, written for 0.2.3). CREATIVE.md has not been updated for 2.x, so treat the Take Two and consent claims as needing sign-off.
- **Do not claim** (CREATIVE.md:78-90):
  - viral, more customers or leads
  - instantly, in seconds, save hours
  - auto-post, TikTok, Instagram
  - AI, AI-powered, Claude, Anthropic
  - private, offline, encrypted, sync
  - ratings or user counts
  - unlimited, free trial, annual plan
  - iPad, Android, Mac, web app
  - Sign in with Apple, delete your account

**Pricing** [V ASC].
- Free: 3 Coach Packs per weekly allowance (live description).
- Trendi Pro Monthly, `app.aic.mobile.trendi.pro.monthly`, ONE_MONTH, APPROVED, **$7.99**, 100 Coach Packs a month. No intro offer.

**Store screenshots** [V]: `assets/trendi-shot-1..5.png` at 1320×2868 (say-it-messy, shape-it, pick-your-hook, own-the-script, press-record).

**Demonstrations.**
1. `/Users/koi/Projects/koinophobia-labs-site/public/demo/masters/01-trendi-idea-to-hooks.mp4`: real simulator recording of Trendi 0.2.2 (148), 2026-09-10. Manifest is `public/demo/masters/MANIFEST.md`. It shows the pre-2.0 UI.
2. `/Users/koi/Projects/koinophobia-labs-site/public/demo/trendi-hooks.mp4` (web cut, plus a `-360` version).
3. `/Users/koi/Projects/koinophobia-labs-site/public/trendi/trendi-final-demo.mp4`, from 2026-08-01, so older still.

Device PNGs (iPhone 17 Pro Max, 2.0 UI) in `/Volumes/KoiBuild/trendi/WO-0084-procap/Evidence/WO-0097/M-0014/canvas-captures-screenshots/`:
- `0F7C2E55-71FF-446F-88B8-1B91566B7EB9.png` (main)
- `DA38E23B-1895-4B8A-9A29-94781CA31688.png` (Take Two)
- `71C94553-9C99-4034-93A7-3E25FEB901FE.png` (consent)

The `real-take` `.mov` under `Evidence/WO-0097` is Blake on camera. Don't use it unless he approves.

**Existing site page.** `app/trendi/` (page.tsx, layout.tsx, trendi-page.css, privacy/, support/) on the shared `components/site/ProductPage.tsx`.
- Hero: "Say it messy. Leave with words you can say on camera." (`lib/products.ts:109`)
- Price line: "Free · 3 Coach Packs a week · Trendi Pro $7.99/mo for 100" (`lib/products.ts:95`)

---

## 2. Way In (`way-in`, app id 6807942376, iPhone and iPad)

**Status.**
- LIVE 1.0.6, current release `2026-10-13T14:25:23Z`, first released 2026-09-09 [V]. https://apps.apple.com/us/app/way-in-resume-job-search/id6807942376
- 2.1 (24) WAITING_FOR_REVIEW with manual release (`projects/way-in/PROJECT_STATE.md:134,214`).
- The ledger front matter (1.0.4) and CREATIVE.md:22 (1.0.5) are both behind the live 1.0.6.

**Icon.** `/Volumes/KoiBuild/way-in/WO-0078-foot/native/CareerApp/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` → `assets/way-in-icon.png`.

**Palette.** Paths are under `native/CareerApp/Design/`.
- **Brand core** (`AppTheme.swift`): midnight `#053338` (:4), cream `#FAF5E6` (:5), mint `#94DBCC` (:6), amber `#FFC240` (:7). Amber marks proof, the star and the selected offer (`FootStyle.swift:17`).
- **Background:** `#051419` / `#F7F5ED` (:11-12). Surface `#0F262B` / `#FFFFFF` (:35-38).
- **Accent:** `#94DBCC` / `#05333B` (:14-17); accentFill `#0D4A45` (:19).
- **Ink:** `#052B30` and paper `#F7F7F0` (`WorkspaceStyle.swift:17-18`). Secondary text `#C7DBD9` / `#385254` (`AppTheme.swift:44-48`).
- **Asset catalog mismatch:** AccentColor is a blue, `#206F94` / `#6BA7C9` (`Resources/Assets.xcassets/AccentColor.colorset/Contents.json`). Use the code palette.

**Fonts.**

| Font | Use | Web substitute |
|---|---|---|
| SF Pro | all UI (`FootStyle.swift:141`) | **Inter** (similar proportions, holds up at small sizes) |
| New York | headings and wordmark, via `.fontDesign(.serif)` (`FootStyle.swift:24`; `Features/FootPresentation.swift:34`) | **Source Serif 4** (it has optical sizes, as New York does) |
| SF Rounded | one résumé template only | Ignore |

**Tone.** Direct, calm, respectful of service work. It is concrete, says nothing is invented, and adds no urgency. Examples:
- "Your work, ready to send." (`Features/ToolkitPresentation.swift:55`)
- "One payment each. Nothing renews." (:75)
- "Add one thing you're proud of." (`Features/ProfileHomeView.swift:52`)
- Tagline: "Turn your experience into a clear next move." (`Core/AppBrand.swift:20`)

**Truth.**
- **Live description:** "Your experience counts. Make it part of your next application." It is for people moving beyond service, retail, gig or hands-on roles.
  - A private résumé and application workspace: start from true sentences or import a résumé.
  - See what fits: compare against a saved posting, showing supported, related and gap items.
  - Keep the whole application together: saved jobs, versions, progress, notes and follow-ups.
  - "Way In does not apply on your behalf." No account is required.
- **Approved claims:** CREATIVE.md:51-67 (17 claims). "Free" must always carry its paid limit (:58).
- **Do not claim** (CREATIVE.md:79-91):
  - get hired, dream job, more interviews
  - ATS in any form
  - job-board or auto-apply wording
  - AI
  - completely free, free PDF
  - lifetime, no subscription, unlimited
  - offline, encrypted
  - Mac app, Vision Pro, web app, Career Forge
  - superlatives, ratings, competitor names
- **Check this line:** the in-app "Every job. Tailored. Polished." (`Features/FootPresentation.swift:349`). Tailoring is Career Pass only.

**Pricing** [V ASC]. Both products are APPROVED.
- Resume Toolkit, `com.koinophobialabs.careerapp.resume_toolkit`, NON_CONSUMABLE, **$9.99**.
- 30-Day Career Pass, `com.koinophobialabs.careerapp.career_pass_30`, NON_RENEWING_SUBSCRIPTION, **$29.99**.

**Store screenshots** [V]: `assets/way-in-shot-1..5.png` at 1320×2868, from the 1.0.3 set (Profile, Onboarding, Welcome, Today, Applications).

**Demonstrations.**
1. `/Users/koi/Projects/koinophobia-labs-site/public/demo/masters/06-way-in-check-experience-fit.mp4`: simulator, 2026-09-10, 1.0-era UI.
2. `/Users/koi/Projects/koinophobia-labs-site/public/demo/way-in-fit.mp4` (web cut).
3. `/Users/koi/Koinophobia_Demo_QA/Initial_Batch_10/01_Way_In_First_Resume.mp4` and `07_Way_In_Deadline_Live_Activity.mp4`. The same files are on `/Volumes/KoiEvidence/KoinophobiaEvidence/PathOfTheMartialGod/Koinophobia_Demo_QA/Initial_Batch_10/`. These are superseded takes.

CREATIVE.md:98 excludes the 1.0 demo from new creative. Current-build captures are in `/Users/koi/Projects/way-in-commercialization-20261005/commercialization/product-captures/` (CREATIVE.md:125). Device purchase-sheet PNGs (sandbox prices) are in `/Volumes/KoiBuild/way-in/WO-0078-foot/Evidence/WO-0086b/M-0014-finish/stage-b-purchase-screenshots/`.

**Existing site page.** `app/way-in/page.tsx` (product slug `career-forge`).
- Hero: "Your experience. A clearer next move."
- Price line: "Free · 30-Day Career Pass $29.99, does not renew · Resume Toolkit $9.99"
- Three screenshots. **No privacy/ or support/ subroutes.**

---

## 3. Forget About It (`forget-about-it`, app id 6804360983, iPhone and Apple Watch)

**Status.**
- LIVE 1.1.1, current release `2026-10-13T14:25:08Z`, first released 2026-09-08 [V]. The store name is "ForgetAboutIt". https://apps.apple.com/us/app/forgetaboutit/id6804360983
- 2.1 (27) WAITING_FOR_REVIEW with manual release (`PROJECT_STATE.md:140`). The front matter at `:6` is stale.

**Icon.** `/Volumes/KoiBuild/forget-about-it/WO-0077-rings/ForgetAboutIt/Assets.xcassets/AppIcon.appiconset/ios-1024.png` → `assets/forget-about-it-icon.png`. A Watch 1024 icon is also at `ForgetAboutItWatch/.../w-1024.png`.

**Palette.** From `Shared/Support/DiaryTokens.swift`, light / dark:
- **Accent ("sauce", sampled from the icon):** `#A42C1B` / `#EF9A83` (:22). Text on accent: `#FFFFFF` / `#281C16` (:23).
- **Ink:** `#281C16` / `#F9F3E8` (:24).
- **Paper:** `#F9F3E8` / `#1C1815` (:25). This matches `LaunchBackground.colorset`.
- **Neutrals:** inset `#F0E6D6` / `#2A231F` (:26); muted `#6E5F52` / `#B5A89B` (:27); separator `#B7A99A` / `#796C61` (:28).
- **Status:** openLoop `#985113` / `#EFB574` (:33); saved `#596637` / `#B8C78B` (:37); alert `#B33528` / `#FFB3A4` (:40).

**Fonts.** The app's own rule: "the person's words are set in a serif, and everything the app says about them is not." (`DiaryTokens.swift:60-61`)

| Font | Use | Web substitute |
|---|---|---|
| New York (`design: .serif`) | the user's words, dates, titles (`DiaryTokens.swift:66,68,71`) | **Newsreader**: optical sizes, similar contrast, generous x-height; already loaded by the site |
| SF | all app chrome | **Inter** |

**Tone.** Short, dry, everyday imperatives. The thought is the hero and the app stays in the background. Examples:
- "Catch it before it goes." (`UI/Onboarding/OnboardingView.swift:38`)
- "Open. Capture. Carry on." (:39)
- "What nearly slipped away?" (`UI/Onboarding/FirstCaptureStep.swift:10`)
- Paywall: "Every word. Every year." (`Commerce/PlusViews.swift:35`)

**Truth.**
- **Live description:** "Catch a thought before it goes." It keeps your exact words in a private journal on iPhone and Apple Watch.
  - Type or dictate. On the Watch, speak, scribble or type.
  - Today, History and Memory search.
  - On-device rule-based reflections, shown visibly apart from your own words.
- **Free:** unlimited capture, all history, text search, basic stats, today's reflection and plain-text export.
- **Plus:** date and source filters, capture patterns, and earlier reflections.
- **Approved claims:** CREATIVE.md:48-62.
- **Do not claim** (CREATIVE.md:75-86):
  - never forget, ADHD, mental health
  - faster, instant, one tap
  - reminder(s)
  - sync, iCloud, backup, never lose
  - AI, writes itself
  - free forever, **no purchases**, trial, Premium, lifetime
  - encrypted, secure
  - worldwide, iPad, Mac app, Vision Pro
  - superlatives, ratings
- Always say "Plus", never "Pro" or "Premium" (:99).

**Pricing** [V ASC]. Group "Forget About It Plus"; both plans APPROVED, no intro offer.
- Plus Monthly, `…plus.monthly`, **$2.99**.
- Plus Annual, `…plus.annual`, **$24.99**.

The ledger records sales in the US and Canada only (`PROJECT_STATE.md:25`).

**Store screenshots** [V]: `assets/forget-about-it-shot-1..4.png` at 1320×2868 (today light, today dark, history, memory).

**Demonstrations.**
1. `/Volumes/KoiBuild/forget-about-it/WO-0077-rings/Design/Entrance/forget-about-it-entrance.mp4`: 4-second, silent brand entrance (pasta knot), 720×720. It is a brand asset, not a product demo.
2. `/Users/koi/Projects/koinophobia-labs-site/public/demo/masters/08-forget-about-it-capture-thought.mp4` and `09-forget-about-it-find-a-memory.mp4`: simulator, 2026-09-10, 1.0-era UI.
3. `/Users/koi/Projects/koinophobia-labs-site/public/forget-about-it/commercial.mp4`, with a poster image.

Device PNGs (iPhone 17 Pro Max, AX5 text size) in `/Volumes/KoiBuild/forget-about-it/WO-0077-rings/Evidence/WO-0087/M-0014/`:
- `ui-screenshots/0B68DED0-B3FD-4FC2-A29E-7F8391AC1857.png` (Today)
- `ui-screenshots/E42C3170-4C63-402D-A39D-EFCF35D02685.png` (Ask)

**Existing site page.** `app/forget-about-it/` with privacy/ and support/ (both modified locally, uncommitted).
- Hero: "Keep the thought. Come back to your day."
- Price line: **"Free · no purchases · no account" (`lib/products.ts:143`). This is FALSE now that Plus is on sale, and "no purchases" is on the do-not-claim list.**

---

## 4. Preaching to the Choir (`preaching-to-the-choir`, app id 6808442357, iPhone and iPad)

**Status.**
- LIVE 2.1, current release `2026-10-15T12:56:22Z`, first released 2026-09-21 [V]. https://apps.apple.com/us/app/preaching-to-the-choir/id6808442357
- Ledger: released by Blake on 2026-10-15 (`PROJECT_STATE.md:112,188`). No next version is recorded.

**Icon.** `/Volumes/KoiBuild/preaching-to-the-choir/WO-0079-name/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png` (1024) → `assets/preaching-to-the-choir-icon.png`.

**Palette.** From `App/Support/PrayerDesignSystem.swift`, light / dark; it matches `projects/preaching-to-the-choir/design/ptc-2.0/DESIGN-NOTES.md:41-46`.
- **Bone (background):** `#F4F0E7` / `#1A1817` (:16-18)
- **Paper (cards):** `#FBF9F2` / `#292624` (:19-21)
- **Ink (text and primary buttons):** `#171B25` / `#F4F0E7` (:22-24)
- **Muted:** `#5B595B` / `#B8B0A8` (:25-27)
- **Oxblood (the one accent, also Keeper):** `#6B131B` / `#E3858A` (:28-30)
- **Outline:** `#8A857D` (:12)

**Fonts.**

| Font | Use | Web substitute |
|---|---|---|
| New York | prayers (`App/Support/Tokens.swift:28`) | **Newsreader**, already used for the design canvas (`DESIGN-NOTES.md:49-50`) |
| SF | titles and chrome | **Inter** |

**Tone.** Quiet, reverent and plain, in the second person. It never claims to know the user's spiritual state and uses no streak, guilt or sales pressure. The app's own lint bans growth, streak and ranking words, and "unlock", "premium" and "trial". Examples:
- "What is on your heart?" (`App/Strings/ui.strings.json:1629`)
- "Your words stay exactly as you leave them." (:1632)
- "Pray the way you already do." (:147)
- "Without Keeper, every prayer stays yours to keep, read, search and export." (`paywall.strings.json:17`)

**Truth.**
- **Live description:** "Keep a record of what you are praying through, in your own words."
  - Write or record. On-device transcription is optional.
  - A dated journal with search, reflection notes, names, labels and threads.
  - Export with an optional passphrase, and Recently Deleted for 30 days.
  - No account, analytics, ads or tracking. An optional device lock. **No iCloud sync.**
- **Keeper:** Similar wording in search, and a Year view.
- **Do not claim** (there is no CREATIVE.md; taken from the ledger):
  - sync, a Mac app, or China availability (`PROJECT_STATE.md:86`)
  - "nothing leaves the phone": backups include the record (`DESIGN-NOTES.md:90`)
  - Full Circle, which is not approved (`DESIGN-NOTES.md:87`)
  - verified purchase or restore: never passed on a device (`PROJECT_STATE.md:79`)
  - the unapproved "About $2.08 a month"

**Pricing** [V ASC]. All APPROVED, no intro offer.
- Group "Keeper": Keeper monthly **$2.99**; Keeper annual **$24.99**.
- Keeper lifetime, NON_CONSUMABLE, **$79.00**.

**Store screenshots** [V]: `assets/preaching-to-the-choir-shot-1..5.png` at 1284×2778 (today, write, journal, prayer, privacy).

**Demonstrations.** No product videos exist. The only `.mp4` files are UI-test attachments under `Evidence/WO-0096/M-0014-fix/`. Best device PNGs (AX5) are in `/Volumes/KoiBuild/preaching-to-the-choir/WO-0079-name/Evidence/WO-0096/M-0014/ui-shield-aware-screenshots/`:
- `D86843D7-3834-4EEF-BFCD-7BEA7A567938.png` (Name)
- `BB270B38-FE23-4AD8-A555-C050AC275C57.png` (Keeper)
- `9BCBC7E5-BA20-426A-B02D-D042AD18ABEE.png` (Settings)

**Existing site page.** None. It is a lab entry that links to TestFlight with "Not yet: the App Store" (`lib/products.ts:254-262`). That is stale.

---

## 5. Old Dog (`old-dog`, app id 6813966822, Mac live; iPhone in review)

**Status.**
- Mac LIVE 1.2.0, current release `2026-10-14T21:59:10Z`, first released 2026-10-07 [V]. The lookup returns `mac-software`. https://apps.apple.com/us/app/old-dog/id6813966822
- iPhone 2.1 (10) WAITING_FOR_REVIEW (`PROJECT_STATE.md:115`). Until it is approved, the page must say the iPhone version is "coming to the App Store".

**Icon.**
- iOS: `/Volumes/KoiBuild/old-dog/WO-0083-iphone/OldDogiOS/Assets.xcassets/iOSAppIcon.appiconset/icon-1024.png` → `assets/old-dog-icon.png`.
- Mac: `OldDog/Assets.xcassets/AppIcon.appiconset/icon-512@2x.png` → `assets/old-dog-mac-icon.png`.

**Palette.** From `OldDog/Sources/Theme.swift`, light / dark:
- **Paper (background):** `#F5F4F1` / `#171D29` (:20)
- **Surface:** `#FFFFFF` / `#222B3B` (:21)
- **Navy ink:** `#18243A` / `#F3F1EC` (:22)
- **Slate (muted):** `#596476` / `#B7C1D1` (:23)
- **Rust (accent):** `#87421F` / `#F3BA91` (:24)
- **Tint:** `#EEE9E2` / `#30394B` (:25)
- **Line:** `#D6D8DD` / `#455065` (:26)
- **Sidebar navy:** `#142138` (:27)
- **Gold (iPhone call to action):** `#E3BA7D` (:28; `OldDogiOS/Sources/PhoneStyle.swift:64-65`)

CREATIVE.md:41 names the brand set as paper, navy, rust, gold and slate.

**Fonts.**

| Font | Use | Web substitute |
|---|---|---|
| New York (`design: .serif`) | headings (`Theme.swift:57`; `PhoneStyle.swift:13,48`) | **Source Serif 4**, a bookish optical-size serif with tabular figures |
| SF Pro | body | **Inter** |

**Tone.** Mature, warm and plain-spoken, like a good librarian. It is never cute and never urgent ("quietly weathered", CREATIVE.md:40). Examples:
- "There's more worth learning next." (`UnlockViews.swift:9`)
- "One-time purchase. Not a subscription." (:14)
- "Pick a starting point. About 15 seconds." (`PhoneRoot.swift:160`)

**Truth.**
- **Live description:** "You are never too old to learn something new."
  - Ten courses: personal finance, credit and debt, economics, AI, computer literacy, cybersecurity, professional communication, cooking, home maintenance and critical thinking.
  - Each course has two units and four objectives.
  - Learn, practise, demonstrate: mastery is per objective.
  - An optional placement check that "never awards lesson mastery".
  - In 1.2, the first course in each subject is free, and a one-time unlock opens everything, including future subjects.
  - Pre-1.2 users keep all ten courses.
- **Approved claims:** CREATIVE.md:18-27, including the taglines "Old Dog. New Tricks." and "A little wiser, every day."
- **Do not claim** (CREATIVE.md:31-37):
  - certified, certificate, accredited, full mastery, remember forever
  - Business course, Science course
  - **iPhone** (until 2.1 is live), iPad, sync, iCloud, AI tutor
  - financial advice
  - 5 stars, #1, downloads, thousands of
  - anytime anywhere, guaranteed
- "Free" now needs the qualifier that a paid unlock exists.
- CREATIVE.md:8-11 is stale: it still describes 1.1 as in review.

**Pricing** [V ASC]. Old Dog: all courses, `com.koinophobia.olddog.unlock`, NON_CONSUMABLE, APPROVED, **$9.99**. The ledger did not record this price; ASC is the source.

**Screenshots.**
- Store, Mac [V]: `assets/old-dog-shot-1..5.png` at 1440×900 (home-resume, course, lesson, practice, knowledge-map).
- iPhone device captures: `assets/old-dog-iphone-shot-1..3.png` (today, lesson, offer-price), from `/Volumes/KoiBuild/old-dog/WO-0083-iphone/evidence/WO-0104/reviewed/`. That folder also holds `six-designed-screens-sheet.jpg`, `map.png`, `mastered.png` and `practice-feedback.png`.

**Demonstrations.** **No video recordings exist anywhere searched.**

**Existing site page.** None. Old Dog is not in `lib/products.ts`, and there are no `public/` assets. A separate site repo exists: `/Users/koi/Projects/old-dog-release-site` (not inspected).

---

## 6. Teacher's Pet (`teachers-pet`, app id 6808981717, Mac)

**Status.** IN REVIEW, never released [V ASC].
- Version 1.1 is WAITING_FOR_REVIEW on MAC_OS, release MANUAL. Build 15, submission `cbe3f0e5` (`PROJECT_STATE.md:152`).
- 1.0 (12) was rejected (2.1(a), 2.3.6).
- The public lookup returns nothing, as expected.
- **The page must say "Coming to the Mac App Store".**

**Icon.** `/Volumes/KoiBuild/teachers-pet/WO-0116-first-minute/macos/TeachersPet/Assets.xcassets/AppIcon.appiconset/icon_1024.png` → `assets/teachers-pet-icon.png`.

**Palette.** From `macos/TeachersPet/Sources/Theme.swift`, light / dark:
- **Paper:** `#FAF9F4` / `#111D1B` (:21)
- **Cream / creamRaised:** `#F8F8F2` / `#FCFCF8` (:22-23)
- **Ink:** `#16332F` / `#E9EFEA` (:24)
- **Muted:** `#52615C` (:25)
- **Pine (brand core):** `#173F39` / `#9ED4C6` (:26)
- **Saffron (primary call to action):** `#F6C35B` / `#F5C460` (:72)
- **Coral:** `#F47F68`; coralText `#A83A2C` (:31, :35)
- **Soft teal:** `#7ECACA`; tealText `#1F5752` (:29, :44)
- **Ochre text:** `#6B4E12` (:45)
- **Acid:** `#D8EF73` (:37)
- **Sage:** `#EAF0E8` (:69)
- **Focus:** `#176BBA` (:74)

**Fonts.**

| Font | Use | Web substitute |
|---|---|---|
| Georgia-Bold | display, titles, subjects (`Theme.swift:116-118,127`) | Needs a Monotype webfont licence; use **Gelasio** (Georgia-metric) |
| New York | math (:123) | **Source Serif 4** |
| SF Pro | body | **Inter** |

**Tone.** A patient, scrupulously honest teacher, speaking to both child and parent. Examples:
- "Who's learning?" (`SchoolFirstRunView.swift:14`)
- "Learn with help. Check without it." (`TodayHomeView.swift:264`)
- "This is one supervised check—not a mastery grade or proof of learning." (`PacketLessonView.swift:1276`)

**Truth.** The ASC description is not public yet.
- "Your personal school at home."
- K–12 in maths, ELA, science and social studies: "13 grade levels. 52 courses. 318 units. 1,273 learning objectives."
- Learner profiles, adult passphrase protection, and lessons bundled and saved on the Mac.
- No account, ads, tracking or AI processing of school responses.
- Family Sharing.
- Promotional text: "A structured K–12 homeschool curriculum on your Mac: lessons, practice and progress for every learner in your family."

There is no CREATIVE.md. **Do not claim**, from the ledger:
- completeness of content (strict completion is 4/1,273 objectives, 0 human reviews; `PROJECT_STATE.md:105,254`)
- a self-guided school (:104)
- sync or cross-device (:210)
- learning gains
- accreditation, credit or a diploma (the listing disclaims these)
- any released or approved status

**Pricing** [V ASC]. Group "Teacher's Pet Family".
- Monthly Family **$34.99**; Annual Family **$299.00**.
- Annual intro offer: PAY_UP_FRONT, ONE_YEAR, from 2026-10-01. The listing and ledger give it as **$199 for the first year**.
- Both subscriptions currently show **READY_TO_SUBMIT**, not attached to review. The ledger last had them READY_FOR_REVIEW. The build 14/15 swaps may have left them off the submission. **Check this before launch.**

**Screenshots** [V, ASC-uploaded listing set]: `assets/teachers-pet-shot-1..5.png` at 1440×900 (subjects, course, learn, get-help, kindergarten-adult-note).

**Demonstrations.** No product videos. The only videos are UI-test attachments: `/Volumes/KoiEvidence/KoinophobiaEvidence/TeachersPet/teachers-pet-build9-evidence/ui-rerun-…-attachments/*.mp4`, from build 9, so old. Device PNGs:
- `/Volumes/KoiBuild/teachers-pet/WO-0116-first-minute/Evidence/WO-0116/after/first-minute-entry.png`
- `…/Evidence/WO-0116/after/math-lesson.png`

**Existing site page.** `app/lab/teachers-pet/page.tsx`: a lab page with the social card "A homeschool for one computer." It has no App Store link and no screenshots.

---

## 7. Dreamcatcher (`dreamcatcher`, app id 6821750717, iPhone and Watch)

**Status.** IN REVIEW, never released [V ASC]. The ASC name is "Dreamcatcher: Night Journal".
- 1.0.0 (11) and the Lucid Toolkit IAP were submitted 2026-10-15, both WAITING_FOR_REVIEW, release manual (`PROJECT_STATE.md:108`).
- The repo is at `/Users/koi/03_Apps/dreamcatcher`. `/Users/03_Apps/dreamcatcher` does not exist.
- CREATIVE.md:10: "nothing about Dreamcatcher is publishable until 1.0 is live". **That makes the page a "Coming to the App Store" page at most, and it needs Blake's OK.**

**Icon.** `/Users/koi/03_Apps/dreamcatcher/App/Resources/Assets.xcassets/AppIcon.appiconset/A-master-v3-1024.png` → `assets/dreamcatcher-icon.png`.

**Palette.** The shipping theme is **"Your way"** (D-0139), from `App/Design/YourWay.swift`, light / dark:
- **Ground:** `#F7F1E8` / `#12162C` (:6)
- **Ink:** `#1B2140` / `#F1E6D7` (:7, :16)
- **Secondary:** `#3A3F5C` / `#D8CDBF` (:8)
- **Eyebrow:** `#595267` / `#B9B0A4` (:9)
- **Gold:** `#805519` / `#E7B76A` (:11)
- **Lavender:** `#705C9A` / `#9C8BD0` (:12)
- **Hairline:** `#D3CBD0` / `#2A3052` (:13)

Core brand tokens (`App/Design/DreamTheme.swift`): night `#141A2E` (:20), ring `#A99BD6` (:21), cream `#F1E6D7` (:22), star `#E7B76A` (:23), backdropBottom `#0B0E1F` (:24), deepPanel `#262F57` (:26).

**Fonts.**

| Font | Use | Web substitute |
|---|---|---|
| New York (`design: .serif`) | dream text, dates, titles (D-0137; `DreamTheme.swift:37-47`; `YourWayTypography.swift:35`) | **Newsreader** (editorial italics) or Source Serif 4 |
| SF Pro | UI | **Inter** |

CREATIVE.md:61 ("SF Pro only") is stale.

**Tone.** Calm, adult, low-light and literary. Never mystical, clinical or hype (CREATIVE.md:43). Examples:
- "Catch the dreams you remember." (`Journal/JournalViews.swift:29`)
- "Your exact words." (`Capture/NightScene.swift:31`)
- "Notice one of these, and you might be dreaming." (`Design/YourWayScreens.swift:50`)
- Subtitle: "Catch dreams. Notice the next."

**Truth.**
- **Proposed claims** (CREATIVE.md:18-25), to be re-checked against the build: on-device speech; "No account. No analytics. Stays on your device."; Face ID lock; export; morning marks.
- Pricing may be stated as "Free to download; the Lucid Toolkit is a one-time purchase" (CREATIVE.md:25).
- **Do not claim** (CREATIVE.md:28-40):
  - proven, science-backed, control your dreams, spiritual, dream meaning, interpret
  - sleep quality, REM, smart alarm, better sleep, anxiety, therapy
  - remember every dream, AI, end-to-end encrypted
  - free forever, lifetime deal, 5 stars
  - feathers, beads or Native motifs on the mark

**Pricing** [V ASC]. Lucid Toolkit, `com.koinophobialabs.dreamcatcher.toolkit`, NON_CONSUMABLE, WAITING_FOR_REVIEW, **$9.99**. Family Sharing is off (D-0129).

**Screenshots** (physical iPhone 17 Pro Max, 1320×2868, SHA-256 matches `Evidence/WO-0106-b/SCREENSHOTS.md`):
- `assets/dreamcatcher-shot-1.png`: journal-empty, uploaded to the store
- `assets/dreamcatcher-shot-2.png`: signs, uploaded to the store
- `assets/dreamcatcher-shot-3.png`: checks, uploaded to the store
- `assets/dreamcatcher-shot-4.png`: toolkit, retained. A floating accessibility control partly covers its eyebrow.

The source folder is `/Volumes/KoiBuild/dreamcatcher/WO-0034-B11/Retained/xcresults/WO-0106-b/screenshots-original/`.

**Demonstrations.** No product videos. There are only UI-test recordings, such as `/Volumes/KoiEvidence/Dreamcatcher/WO-0034-YOURWAY-PHONE/collector-and-final-repairs-issue-evidence/testYWPausedLightDefault-recording.mp4` and `testYWPausedDarkDefault-recording.mp4`. These are issue evidence, not demos.

**Existing site page.** None.

---

## 8. "Make it me": Blake's voice

Paths are under `/Users/koi/Projects/koinophobia-labs-site/` unless given in full. That checkout is on branch `claude/martial-god-game-design-deaq5x` with uncommitted edits. Production is `origin/main` `0d444e2` (`projects/client-studio/chamber/00-SUMMARY.md:49`).

**Ten lines in his voice (verbatim).**
1. "Koinophobia is the fear of being ordinary. I named the studio after the thing I was running from, so I'd never get to forget it." (`app/blake/page.tsx:55-56`)
2. "The fear of an ordinary life, and what I did about it." (`app/blake/page.tsx:52`)
3. "Every product here started as something I needed the week I needed it." (`app/blake/page.tsx:21`)
4. "The simulator was green for weeks while the phone found two shipping defects in an hour." (`app/blake/page.tsx:29`)
5. "The agents are why one person can do this. They're not the pitch." (`app/blake/page.tsx:97`)
6. "Taste and judgment are the job." (`app/blake/page.tsx:102`)
7. "The simulator votes. The device decides." (`app/page.tsx:230`)
8. "Nothing here stayed an idea." (`app/page.tsx:122`)
9. "Tell me the idea. I'll tell you what it takes." (`app/page.tsx:302`)
10. "Fear ordinary." (`app/page.tsx:332`)

**Origin facts, as written.**
- "founder, builder, the only employee" (`app/blake/page.tsx:49`); "1 builder · 0 employees" (`app/page.tsx:143-144`).
- Chicago (`app/blake/page.tsx:67`); "Chicago, IL" (`lib/resume.json:6`).
- "three years in sportsbook operations in the sports-betting market"; "In July 2026 the role ended" (`app/blake/page.tsx:59-61`).
- "a list of tools I'd wished existed for years, a Mac, and a set of AI coding agents… By September, three of those tools were on the App Store." (`app/blake/page.tsx:61-63`)
- Earlham College, B.A. Global Management (`app/blake/page.tsx:70`; `lib/resume.json:71-79`).
- "designs, writes, builds, tests, and ships everything on this site" (`app/page.tsx:235-236`).
- Pitch voice: "I run a software studio. I've already shipped five products…" (`projects/client-studio/chamber/01-POSITIONING.md:15`).

**What not to say.**
- No clients, customers, download counts, user numbers, ratings, revenue or testimonials (`01-POSITIONING.md:5,64,69`).
- No invented team: "Koinophobia Labs is one builder" (`01-POSITIONING.md:48`).
- Banned words (`01-POSITIONING.md:101-108`): freelancer, side project, "digital transformation", synergy, 10x, guaranteed, "trusted by", clients.
- AI is not the pitch (`app/blake/page.tsx:97-102`; `01-POSITIONING.md:82`). Several product ledgers ban "AI" outright.
- Don't mention his age (`01-POSITIONING.md:110`).
- "Laid off in July" framing is an open question for Blake, not settled (`01-POSITIONING.md:118`).
- **Stale copy:** "three apps" appears at `app/blake/page.tsx:13` and `app/page.tsx:125,165,229`. Five are live.
- **Resume conflict:** `lib/resume.json:15-17` dates Koinophobia Labs "2025 – Present". That conflicts with the July 2026 start story.

**Site type and colour, for the "not normal AI font" brief.**
- Fonts, via `next/font/google` (`app/layout.tsx:2,20-40`): **Sora** is the studio voice, **Newsreader italic** is Blake's voice, and **JetBrains Mono** is for receipts.
- Tokens (`app/tokens.css:8-27`): void `#04060a`, ink `#eef4f7`, live cyan `#7fd8ea`, pulse violet `#9d6bff`, amber `#e2b45a`.
- `globals.css` and `tailwind.config.ts` still reference an unloaded `--font-inter` and an older gold, cyan and magenta palette.

---

## 9. Gaps and conflicts for the build

1. **The Forget About It site price line is false** ("no purchases") now that Plus is on sale at $2.99/$24.99. Fix it on the new page.
2. **No video at all** for Old Dog, Preaching to the Choir, Teacher's Pet or Dreamcatcher. The videos for Trendi, Way In and Forget About It are Sept-10 simulator recordings of pre-2.0 UI. Way In's are explicitly excluded from new creative (CREATIVE.md:98). New real-build recordings are needed for an honest "demonstrations" section.
3. **Teacher's Pet subscriptions are READY_TO_SUBMIT** in ASC, not attached to review. The build swaps may have dropped them. Pricing on the page depends on the IAP review.
4. **Dreamcatcher and Teacher's Pet are unreleased.** Use "Coming to the App Store" (Mac App Store for Teacher's Pet). Dreamcatcher's CREATIVE.md forbids publishing anything before 1.0 is live, so a teaser page needs Blake's OK.
5. **Old Dog iPhone is in review.** Don't claim iPhone yet. The Old Dog price is only in ASC ($9.99), not in the ledger.
6. **No pages exist yet** for Old Dog, Preaching to the Choir or Dreamcatcher. Preaching to the Choir's lab entry wrongly says it isn't on the App Store.
7. **Ledger front matter is stale** for Trendi, Way In, Forget About It, Old Dog and Dreamcatcher. Their CREATIVE.md claim lists predate 2.x, so Trendi's Take Two and similar new features need approval.
8. **Webfonts.** Every app except Trendi uses Apple-only New York and SF. The substitutes are Newsreader or Source Serif 4, and Inter. Trendi and Teacher's Pet use Georgia, so use Gelasio. The site already loads Newsreader, Sora and JetBrains Mono. Inter matches SF metrically, but it is the generic "AI font" Blake rejected. Let each page's character come from its serif or display face (and Hanken Grotesk for Trendi), and keep Inter, or the site's Sora, for small UI text only.
9. **Way In 2.1 is in review.** If it lands before the page ships, the store screenshots (1.0.3 set) will be stale.
