# Koinophobia Demo Batch 10

**COMPLETE — revised batch: exactly 10 accepted, independent evidence masters.**

Recorded September 10, 2026. **Trendi 4 · Way In 3 · Forget About It 3. Total raw footage: 1297.691667 seconds (21 minutes 37.692 seconds).**

## Recording inventory

| # | Master | Product | Duration | Evidence gate |
| --- | --- | --- | --- | --- |
| 01 | [01_Trendi_Idea_To_Hooks.mp4](01_Trendi_Idea_To_Hooks.mp4) | Trendi | 02:14.133 | PASS |
| 02 | [02_Trendi_Idea_To_Script.mp4](02_Trendi_Idea_To_Script.mp4) | Trendi | 02:43.967 | PASS |
| 03 | [03_Trendi_Idea_To_Caption.mp4](03_Trendi_Idea_To_Caption.mp4) | Trendi | 03:36.033 | PASS |
| 04 | [04_Trendi_Recall_Saved_Shot_Plan.mp4](04_Trendi_Recall_Saved_Shot_Plan.mp4) | Trendi | 05:28.533 | PASS |
| 05 | [05_Way_In_First_Resume.mp4](05_Way_In_First_Resume.mp4) | Way In | 02:22.133 | PASS |
| 06 | [06_Way_In_Check_Experience_Fit.mp4](06_Way_In_Check_Experience_Fit.mp4) | Way In | 01:40.367 | PASS |
| 07 | [07_Way_In_Deadline_Live_Activity.mp4](07_Way_In_Deadline_Live_Activity.mp4) | Way In | 01:08.900 | PASS |
| 08 | [08_Forget_About_It_Capture_Thought.mp4](08_Forget_About_It_Capture_Thought.mp4) | Forget About It | 00:55.767 | PASS |
| 09 | [09_Forget_About_It_Find_A_Memory.mp4](09_Forget_About_It_Find_A_Memory.mp4) | Forget About It | 00:43.867 | PASS |
| 10 | [10_Forget_About_It_Close_A_Loose_End.mp4](10_Forget_About_It_Close_A_Loose_End.mp4) | Forget About It | 00:43.992 | PASS |

## Corrected Trendi diagnosis

The initial batch incorrectly excluded Trendi as unavailable. The capture setup built Trendi with `CODE_SIGNING_ALLOWED=NO`. The simulator security log records Trendi keychain error **-34018**: “Client has neither application-identifier nor keychain-access-groups entitlements”. Its guest-session storage therefore failed before generation. This was a capture-build error, not evidence that the real Coach service could not work.

The recovery built the unchanged current **Trendi 0.2.2 (148)** source with normal project simulator signing. Three actual UI generation requests then completed, producing tailored hooks, scripts, captions and shot lists. The real free allowance moved **3 → 2 → 1 → 0** only on delivery. Recording 04 reopens a saved plan and makes no new-generation claim. No source logic, UI, server response, subscription entitlement or quota was changed to obtain these results. No production deployment or configuration was changed.

The original initial batch, including four superseded Way In recordings, is preserved outside the final folder at `/Users/koi/Koinophobia_Demo_QA/Initial_Batch_10/`. The final folder contains only these ten MP4s and this manifest.

## Build and recording provenance

- Device for every master: real installed app on **iPhone 17 simulator, iOS 26.5 (23F77)**, named **Way In Journey Test**, UDID `46716BF7-906E-4576-8B0D-A344880C39D7`. These are simulator recordings, not physical-device claims.
- Trendi: bundle `app.aic.mobile`; source commit `f8343b629cbd6f23d8c83b9a4fa0a941793dd645`, archived unchanged into `/Users/koi/Koinophobia_Demo_QA/TrendiCurrentSource`. Release executable SHA-256 `45adcb0d82f28e0bb719e892f41b27d7e641faea6d956959ed8c8bbb4c67dac0`. Normal simulated application identifier `3TY4W55YC5.app.aic.mobile` permits its existing Keychain code to work.
- Way In: bundle `com.koinophobialabs.careerapp`; source `/Users/koi/Projects/career-forge-native-ci`, base commit `1c4f91dda0bc9287326f0b45c5e4b31ac27a2adf` with pre-existing local changes, built as found. Executable SHA-256 `5d83b049f82f28d7bcf6a378558e33167b583511427f6a21e3cb49524c2beb0b`.
- Forget About It: bundle `com.koinophobialabs.forgetaboutit`; source `/Users/koi/03_Apps/forget-about-it`, commit `6ff854fd6679a13a99fbf16847fcc774f93dbe71`, pre-existing Watch scheme change retained. Executable SHA-256 `c743fb9e7d515165e7b36729d941d14f66015b493b14adbb1f4ee01fe3f3ad7b`.
- Masters 01–09: **616×1338 portrait, 30 fps, H.264**, OBS 32.2.2 native Simulator window capture, Indistinguishable Quality / Hybrid MP4. Full device display is retained; only the 52-pixel Mac Simulator toolbar above it is excluded. Canvas and output match; no post-capture scaling, cropping or image replacement. This practical stable capture path replaced native recordings with timestamp regressions.
- Master 10: original native `simctl io recordVideo`, **1206×2622 HEVC MP4** with a valid presentation timeline and no audio stream.
- All masters are original recorder bytes, copied or renamed only. No trims, retiming, transcoding, compositing, captions, music, zooms, device frames, Blake footage, Higgsfield use or promotional edits. Codecs are lossy; originals are preserved losslessly relative to capture files.
- Only the simulator display was captured. Cursor capture was off and source audio muted; AAC tracks are digitally silent. Neutral demo inputs only. Native app and iOS UI, including status bars, keyboard, permissions, rounded screen corners and navigation, remain intact.
- The user-approved external XCUITest controller and native accessibility controls performed normal UI input and gestures. Long static holds caused by the UI controller waiting for app animations remain in some masters; these must not be described as model-generation latency. Prepared input in 02 and 03 is fully shown before the generation action.
- Each final file passed full decode and monotonic presentation-timestamp checks. Original-frame contact sheets, result frames, and the observed live interaction were reviewed for legibility, privacy and claim support. Audio and file hashes were verified. QA artifacts and rejected takes live separately in `/Users/koi/Koinophobia_Demo_QA/`.

## Evidence gate

Each entry passes all ten checks for its stated claim: real app; real input; real output; complete meaningful interaction without hidden manual intervention; legible screen; no private data; no unsupported product claim; pausable proof; clean footage for a future 5–12 second insert; unchanged original recording pixels. Visible review, copying, navigation or editing is part of the recorded workflow. Existing saved data is identified explicitly; it is never presented as newly generated output.

## 01 — Trendi: Idea To Hooks

| Field | Evidence |
| --- | --- |
| Number | 01 |
| Filename | `01_Trendi_Idea_To_Hooks.mp4` |
| Product | Trendi |
| Build/version | 0.2.2 (148), Release with normal simulator signing |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Type a neutral rough idea → Shape This Into a Video → live Coach Pack → read three tailored opening hooks. |
| Exact demo input | I turn a messy desk into a drawing spot: clear the surface, put back one sketchbook and one pen, and catch loose things in a tray. Give me three opening hooks for a before-and-after video. |
| Exact result shown | Coach Pack success cue: Your thought now has an angle, words to say and a plan to film. Hooks: 1. One sketchbook, one pen, zero excuses. 2. What happens when you clear everything but the sketchbook? 3. A messy desk was hiding a drawing spot the whole time. |
| Duration | 134.133333 seconds |
| Why useful to a viewer | Turn an unpolished video idea into three concrete ways to open it. |
| Suggested one-sentence short-form hook | One messy idea, three ways to make someone keep watching. |
| Suggested Blake cutaway / insert material | Cut away as the complete desk-reset brief is visible, before Shape This Into a Video. Preserve the real generation wait in the master; the final hook card supplies more than 12 seconds of clean proof. |
| Visible limitations | Current 0.2.2 (148) Release simulator build. Real free allowance moves from 3 to 2; no paid-access claim. The master includes a long clean hold while the separate UI controller waited for app animations; it is not generation latency. Generated wording is a creative draft to review. Script below the hook card is partially visible but is not this recording’s claim. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | 4,024 decoded frames; no timestamp regressions; complete visual and silent-audio QA passed. |
| Original capture | OBS_Raw/2026-09-10 16-22-06.mp4 |
| SHA-256 | `5921ad2d57a83de49f9fcce50615d4e06a687f40c9dfca83229c04d688dd2b96` |

## 02 — Trendi: Idea To Script

| Field | Evidence |
| --- | --- |
| Number | 02 |
| Filename | `02_Trendi_Idea_To_Script.mp4` |
| Product | Trendi |
| Build/version | 0.2.2 (148), Release with normal simulator signing |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Review the real neutral notebook brief → Shape This Into a Video → real Coach Pack → scroll through generated script → Copy Script. |
| Exact demo input | Video idea: turn leftover blank notebook pages into a pocket sketchbook. Cut the pages to one size, stack them, clip them together, then draw a tiny leaf. Write a short script I can say aloud. |
| Exact result shown | I grab the leftover blank pages from notebooks I've already finished. Cut them all down to one size — doesn't have to be perfect. Stack them up, clip them together, and you have a pocket sketchbook. Then I open to the first page and draw one tiny leaf. Just a leaf. That's it. No special supplies, no new purchase. I think the clip is the whole trick here — it keeps the pages together and gives it a real sketchbook feel without any binding. Confirmation: Script copied. |
| Duration | 163.966667 seconds |
| Why useful to a viewer | Turn a small craft idea into a spoken script ready to copy and adapt. |
| Suggested one-sentence short-form hook | Turn the idea in your notes into words you can actually say. |
| Suggested Blake cutaway / insert material | Cut away with the complete notebook brief visible before Shape This Into a Video. The full script card has a sustained readable hold; follow it with the real Copy Script confirmation. |
| Visible limitations | Real input was entered through native UI before this take and is fully visible before generation. The raw recording retains a long clean hold while the separate UI helper waited to scroll; that delay is not generation time. The entire script is readable in a held frame and its ending is shown again with the copy control. Generated wording is a draft to review and personalize. This proves generation and copying, not recording or publishing. Free allowance moved from 2 to 1. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | 4,918 decoded frames; no timestamp regressions; complete visual and silent-audio QA passed. |
| Original capture | OBS_Raw/2026-09-10 16-30-15.mp4 |
| SHA-256 | `9d1fae3ff414a2a35a19ddc1918e90648b7c8a9c9b959289f4ee3eb8a7a892bc` |

## 03 — Trendi: Idea To Caption

| Field | Evidence |
| --- | --- |
| Number | 03 |
| Filename | `03_Trendi_Idea_To_Caption.mp4` |
| Product | Trendi |
| Build/version | 0.2.2 (148), Release with normal simulator signing |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Review a real jar-reuse video idea → Shape This Into a Video → live Coach Pack → navigate to Caption → Copy Caption. |
| Exact demo input | Video idea: reuse a clean glass jar as a paintbrush holder. Show the empty jar, add a paper label, then sort brushes by size. Give me a short caption and a clear shot list. |
| Exact result shown | A clean glass jar, a paper label, and brushes sorted by size — that's the whole upgrade. #studiotips #paintbrushstorage #artorganization Confirmation: Caption copied. |
| Duration | 216.033333 seconds |
| Why useful to a viewer | Get a relevant caption with hashtags from the same idea used to plan the video. |
| Suggested one-sentence short-form hook | Your video idea can become a caption before you open the posting screen. |
| Suggested Blake cutaway / insert material | Cut away with the full jar-reuse brief visible before Shape This Into a Video. The caption card and Copy Caption confirmation near the end are the strongest insert material. |
| Visible limitations | Input was entered through native UI before the take and is visible before generation. The master includes the actual generation wait and a separate clean UI-controller wait before scrolling. Free allowance moved from 1 to 0 only after delivery. No social posting or performance claim. Other generated sections are visible as context; the caption is the specific demonstrated output. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | 6,481 decoded frames; no timestamp regressions; complete visual and silent-audio QA passed. |
| Original capture | OBS_Raw/2026-09-10 16-35-06.mp4 |
| SHA-256 | `b1dfd64914cba264b5108e410bbeeb88c4888ca96ce37d846ef0991baaec2351` |

## 04 — Trendi: Recall Saved Shot Plan

| Field | Evidence |
| --- | --- |
| Number | 04 |
| Filename | `04_Trendi_Recall_Saved_Shot_Plan.mp4` |
| Product | Trendi |
| Build/version | 0.2.2 (148), Release with normal simulator signing |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Library → enter a search → open the matching saved desk-reset idea → navigate its persisted Coach Pack → read the complete five-shot filming plan. |
| Exact demo input | Library search: drawing spot. Selected saved idea: I turn a messy desk into a drawing spot: clear the surface, put back one sketchbook and one pen, and catch loose things in a tray. Give me three opening hooks for a before-and-after video. This is the real Coach Pack generated and saved during recording 01. |
| Exact result shown | The saved Coach Pack reopens with its original angle, hooks, script, caption and shot list. Exact five shots: 1. Wide overhead shot of the messy desk before anything is touched. 2. Close-up hand swipe clearing loose items off the surface. 3. Single sketchbook and pen placed back on the empty desk. 4. Loose items dropped into the tray from above. 5. Final wide overhead shot of the finished drawing spot. The app also shows: Adapt the plan: change any shot until it feels natural for you to film. |
| Duration | 328.533333 seconds |
| Why useful to a viewer | Return to a saved idea and recover the actual shots to film, without generating it again. |
| Suggested one-sentence short-form hook | When you are ready to film, your idea already has a shot list. |
| Suggested Blake cutaway / insert material | Cut away on the Library search, retain the matching idea being opened, then use the full held shot-list frame as the payoff. Describe this as reopening a saved plan, not a new generation. |
| Visible limitations | Retrieves the genuine artifact generated in recording 01; no new Coach generation or quota consumption. The checkmarks are the app’s fixed shot-list bullet icons, not proof any shots were filmed. Native Ready check and Drafting indicators appear, but this clip makes no finished-video claim. Raw recording includes long clean holds while the UI controller waited for app animations before its two scroll gestures. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | 9,855 decoded frames; no timestamp regressions; complete visual and silent-audio QA passed. |
| Original capture | OBS_Raw/2026-09-10 16-40-30.mp4 |
| SHA-256 | `a2eb7d5b5e8dcff2bb990b50def07ad153e0f2b2278e69eebb01bc5c5b9bec78` |

## 05 — Way In: First Resume

| Field | Evidence |
| --- | --- |
| Number | 05 |
| Filename | `05_Way_In_First_Resume.mp4` |
| Product | Way In |
| Build/version | 1.0 (9), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Reuse a saved practical-experience story → review and edit suggested wording → create a first résumé → correct the retained broader bullet visibly → reopen the saved draft. |
| Exact demo input | Saved story displayed in the builder: “At a community book swap, I sorted donated books by genre, labeled shelves, and helped visitors find titles.” Selected skills: Dependable support; Community outreach. Target: Program Assistant. Typed résumé wording: “Sorted donated books by genre, labeled shelves, and helped visitors find titles at a community book swap.” Contact, employer, dates, and education were left empty. |
| Exact result shown | “Your first resume is ready”; “Saved in Resume → My First Resume”; 1 experience section. Saved headline: “Program Assistant”. Summary: “Brings hands-on experience in dependable support and community outreach, with an interest in Program Assistant opportunities.” Skills: “Dependable support” and “Community outreach”. Final reopened Volunteer Experience contains exactly “Sorted donated books by genre, labeled shelves, and helped visitors find titles at a community book swap.” The broad duplicate was removed in the visible editor before the final result. |
| Duration | 142.133333 seconds |
| Why useful to a viewer | Turn practical experience into an editable starting résumé, retaining control over the wording. |
| Suggested one-sentence short-form hook | “Turn a real experience into a first résumé you can review and edit.” |
| Suggested Blake cutaway / insert material | Cut from Blake as “Make a resume” opens. For a short insert, pair the visible wording review/Create action with the “Your first resume is ready” receipt, and retain the final corrected draft as evidence. Do not imply the corrected final wording appeared without review. |
| Visible limitations | Starts at step 2 because the real app reuses an earlier saved story; the source story is visible. The builder initially suggests “Supported community outreach and coordinated volunteers or donations.” It retains that broader bullet alongside the edited one, requiring the on-camera correction shown. The editor also has a trailing-space typing issue; the visible editor value was entered and committed with a native keystroke, then reopened to verify persistence. This is an editable draft, not a claim of an automatically accurate, complete, or exported résumé. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 01_Way_In_First_Resume.mp4 |
| SHA-256 | `e9d247a917cf08d6523f805899fa57fda585c5ba6b68a24e51eee2c9edd41669` |

## 06 — Way In: Check Experience Fit

| Field | Evidence |
| --- | --- |
| Number | 06 |
| Filename | `06_Way_In_Check_Experience_Fit.mp4` |
| Product | Way In |
| Build/version | 1.0 (9), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Edit a real saved job description → Save → expand full application plan → Refresh analysis → inspect supported matches, source excerpts, related experience, and gaps. |
| Exact demo input | Program Assistant at Demo Community Library, Demo City. Updated description typed on camera: “Sort donated books by genre. Label shelves and help visitors find titles. Keep accurate inventory records. Communicate clearly with visitors.” Existing saved experience used by the app: “Organized donated books by genre, labeled shelves, and helped visitors find titles at a community book swap.” The original practical story was “At a community book swap, I sorted donated books by genre, labeled shelves, and helped visitors find titles.” |
| Exact result shown | “Sort donated books by genre” and “Label shelves and help visitors find titles” are marked Supported, each with the original saved excerpt and provenance. “Keep accurate inventory records” is Not found yet. “Communicate clearly with visitors” is Related experience. Strongest matches and Meaningful gaps restate those findings; no numerical fit score appears. |
| Duration | 100.366667 seconds |
| Why useful to a viewer | See which requirements have supporting experience and which still need an example. |
| Suggested one-sentence short-form hook | “See what your experience supports—and which gaps still need an example.” |
| Suggested Blake cutaway / insert material | Cut away before Refresh analysis. Use the supported requirement with its source quote, followed by the meaningful-gaps card. The full edited posting is retained earlier in the master. |
| Visible limitations | Local analysis of the saved demo inputs. Source excerpts appear twice because both the career profile and first résumé contribute evidence. Related experience is not presented as full support. This does not prove hiring likelihood, employer evaluation, or general analysis accuracy. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 03_Way_In_Check_Experience_Fit.mp4 |
| SHA-256 | `f8f66a2a5cdf8f95cd337c764dbc2bbb6bd966ba88a32472e8d7c3f589e50e89` |

## 07 — Way In: Deadline Live Activity

| Field | Evidence |
| --- | --- |
| Number | 07 |
| Filename | `07_Way_In_Deadline_Live_Activity.mp4` |
| Product | Way In |
| Build/version | 1.0 (9), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Show a saved follow-up date → scroll to Deadline Live Activity → Start Deadline Live Activity → show real confirmation → lock simulator → complete the actual iOS permission prompt → wake Lock Screen and hold the running countdown. |
| Exact demo input | Saved Program Assistant follow-up for September 13, 2026 at 3:31 PM. The existing note “Demo follow-up: review the book-swap experience and list one inventory question before applying.” and date are shown before the action. Start Deadline Live Activity is tapped in the real app. |
| Exact result shown | “Tracking Follow up on Program Assistant on the Lock Screen and Dynamic Island.” The real Lock Screen shows the briefcase icon, native truncated heading “Follow up on Pr…”, subtitle “Program Assistant”, and a decreasing countdown (for example 71:50:32; final sampled frame 71:50:17). |
| Duration | 68.900000 seconds |
| Why useful to a viewer | Keep an application deadline visible outside the app. |
| Suggested one-sentence short-form hook | “Put your next application deadline on the Lock Screen.” |
| Suggested Blake cutaway / insert material | Cut away before Start Deadline Live Activity. Use the real start/confirmation followed by the awake Lock Screen countdown; approximately the last 15 seconds provide a clean readable result hold. |
| Visible limitations | iPhone simulator, not a physical phone. iOS asks “Do you want to continue to allow Live Activities from Way In?”; Always Allow is selected in the recording. The native always-on state briefly hides seconds as dashes; waking the display shows the ticking seconds. The long heading truncates naturally. This master proves Lock Screen display; it does not show a future deadline firing or prove physical-device behavior. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 07_Way_In_Deadline_Live_Activity.mp4 |
| SHA-256 | `a37e9ee42d2f3d21b296b47163c6f6212a8e0abd5917dd084c3f1317d6340ad7` |

## 08 — Forget About It: Capture Thought

| Field | Evidence |
| --- | --- |
| Number | 08 |
| Filename | `08_Forget_About_It_Capture_Thought.mp4` |
| Product | Forget About It |
| Build/version | 1.0 (22), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Start in Today → type an idea → Save → hold the real confirmation, verbatim memory, and day summary. |
| Exact demo input | “Idea: make a tiny herb garden from reused jars.” The earlier neutral completed thought “Remember to rinse the empty jars.” is already present. |
| Exact result shown | Saved; Today contains “Idea: make a tiny herb garden from reused jars.” at 2:57 PM. Exact native day summary: The idea that stuck: “make a tiny herb garden from reused jars”. The earlier jar-rinsing thought remains struck through. |
| Duration | 55.766667 seconds |
| Why useful to a viewer | Preserve an idea in its original words and see it in the day’s timeline. |
| Suggested one-sentence short-form hook | “Keep the idea before it disappears.” |
| Suggested Blake cutaway / insert material | Cut away as the empty “What are you about to forget?” field receives focus. Around 33–45 seconds contains Save, confirmation, and the readable original; use the master to choose precise later edit boundaries. |
| Visible limitations | Typed simulator capture. The single-line field scrolls horizontally while typing; the full original is readable after Save. Summary behavior is demonstrated only for this clear Idea phrase. No cloud sync, broad AI-understanding, voice, Watch, or reminder-delivery claim. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 08_Forget_About_It_Capture_Thought.mp4 |
| SHA-256 | `dc08b87ce45f4357316a07936d168d277e9cf080c49917580b6f159a106328ef` |

## 09 — Forget About It: Find A Memory

| Field | Evidence |
| --- | --- |
| Number | 09 |
| Filename | `09_Forget_About_It_Find_A_Memory.mp4` |
| Product | Forget About It |
| Build/version | 1.0 (22), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Start in Today → type a location memory → Save → open Memory → enter a search term → hold the matching original. |
| Exact demo input | Memory typed: “The spare sketchbook is in the green tote.” Search typed: “sketchbook”; the real field auto-capitalizes it to “Sketchbook”. |
| Exact result shown | Saved confirmation and the new original in Today; Memory reports “3 kept · 1 day · 1 closed”. Searching “Sketchbook” displays “1 MATCH” and exactly “The spare sketchbook is in the green tote.”, Today, 3:42 PM. |
| Duration | 43.866667 seconds |
| Why useful to a viewer | Retrieve a saved detail using a word you remember. |
| Suggested one-sentence short-form hook | “Remember one word, and find the detail you saved.” |
| Suggested Blake cutaway / insert material | Cut away before saving the location note. A later 5–12 second insert can use opening Memory, entering Sketchbook, and holding the exact matching original; the full capture-and-save interaction remains earlier in the master. |
| Visible limitations | Exact-word search on three local neutral memories; this does not demonstrate semantic search, a large archive, cloud sync, or the physical location of an object. The single-line capture input scrolls while typing. The original text is fully readable in the result. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 09_Forget_About_It_Find_A_Memory.mp4 |
| SHA-256 | `dac74a8bfb4334bb7984e0f8bb26737517811675be20d18a59a517b6729e0af0` |

## 10 — Forget About It: Close A Loose End

| Field | Evidence |
| --- | --- |
| Number | 10 |
| Filename | `10_Forget_About_It_Close_A_Loose_End.mp4` |
| Product | Forget About It |
| Build/version | 1.0 (22), Release |
| Device/simulator | iPhone 17, iOS 26.5 (23F77), Way In Journey Test; full ID above |
| Workflow demonstrated | Start on empty Today → enter a thought → Save → open Memory → mark the automatically collected loose end done → return to Today. |
| Exact demo input | “Remember to rinse the empty jars.” |
| Exact result shown | Saved confirmation; the original text in Today; the same text under STILL OPEN in Memory; after checking it, Done, “1 kept · 1 day · 1 closed”, and “Nothing spotted as open”; original text remains struck through in Today. |
| Duration | 43.991667 seconds |
| Why useful to a viewer | Close an unfinished item while preserving its original words in the timeline. |
| Suggested one-sentence short-form hook | “Save the thought, close the loose end, and keep the original words.” |
| Suggested Blake cutaway / insert material | Cut away before typing into “What are you about to forget?”. Approximately 25–38 seconds contains the STILL OPEN item, completion action, and Done/result; select exact boundaries later from the untouched original. |
| Visible limitations | Typed simulator workflow. Local interpretation recognizes this explicit reminder phrase. The recording proves the app’s completed state, not that a real-world chore happened. No timed notification delivery or Watch capture is demonstrated. |
| Evidence standard | **PASS — all ten checks for the stated claim and limitations.** |
| Technical QA | Previously accepted original; byte-for-byte preservation reverified. Visual, playback, timestamp and privacy checks remain applicable. |
| Original capture | Original accepted master: 10_Forget_About_It_Close_A_Loose_End.mp4 |
| SHA-256 | `a1a4a0869d1f693fec4c3143126f3f06117f8dfdd76c6b46d3e7cfe6cb999f6c` |

## Attempts rejected or superseded

- **Original Trendi Coach failures:** rejected because the capture build lacked normal Keychain signing support. Corrected with unchanged build 148; successful actual outputs now occupy 01–04. The original exhausted guest installation was not reset.
- **Trendi generic Hook Styles and incomplete notebook capture:** excluded as weaker or incomplete demonstrations. No saved templates were passed off as fresh AI output.
- **Trendi script-input setup take (`2026-09-10 16-25-22.mp4`):** excluded after a clipboard/focus-control failure; no generation was performed in that rejected take. The clean input was prepared through native UI before accepted recording 02.
- **Way In tailoring:** encountered the real access gate; no purchase, fake entitlement or tailored success state was created. Cover-letter/interview ideas were not accepted because no complete accessible workflow was verified.
- **Four initially accepted Way In masters superseded for product priority:** Save Job Workspace, Review Resume, Plan Follow Up, Save Contact Context. They remain preserved in the initial batch archive.
- **Technical retakes:** native simulator recordings with presentation timestamp regressions; an early résumé editing/debugging take; an initial inaccessible Save control take; a fit-analysis take with a practice preamble treated as a requirement; and Live Activity takes with an unrelated Apple Intelligence notification or dim setup screen. Accepted replacements preserve the original pixels; no broken recording was repaired by retiming or UI replacement.
- **Physical paired Watch capture:** unavailable and not included. No simulator result is presented as proof of a physical paired-Watch workflow.

## Strongest three for the first content batch

1. **01 — Trendi Idea to Hooks:** clear creative input, actual generation, three readable choices.
2. **06 — Way In Check Experience Fit:** supported requirements with source excerpts and an honest missing-example gap.
3. **09 — Forget About It Find a Memory:** direct capture-to-retrieval proof using the exact word “sketchbook”.

Suggested later edits must retain the input/action/result evidence needed for each claim. These masters do not establish hiring success, real vacancies or contacts, physical Watch behavior, future notification delivery, social reach, general AI accuracy, or paid access.
