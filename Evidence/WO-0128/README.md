# WO-0128 — app worlds v2

Branch: `studio/WO-0128-app-worlds`, from `61545da`. Scope: the seven app homes and their shared shell, assets, typography, truth assertions, and evidence. All working files were changed in this worktree. No merge, deployment, Vercel setting change, generated artwork, paid service, or Higgsfield call was made.

## The seven worlds

| World | What changed |
| --- | --- |
| Trendi / The Green Room | Centered 68vh listing shot, static key light and viewfinder corners, tracked Hanken headline, Gelasio italic aside, approved atmosphere art, dark-on-enamel CTA, storyboard strip, five teleprompter beats, and two Coach Pack cue cards. Only the large script heading dims; its inactive contrast still meets AA. |
| Way In / First Light on the Path | Midnight ground, cream path with rising screenshot waypoints, amber proof marks, mint ME mile markers, Source Serif 4, and separate purchase tickets. No motion, no auto-apply claim, and the free download retains its purchase limitation. |
| Forget About It / The Margin of the Day | A continuous diary gutter, open-thought rule, paper grain, overlapping day/night listing shots, Newsreader for the example thought and Instrument Sans for the app voice. The supplied four-second silent entrance plays once; reduced motion, decode failure, leaving view, or backgrounding preserves the still icon. Pricing is a diary entry; the sign-off is labelled Later. |
| Preaching to the Choir / The Loft at First Light | Symmetrical EB Garamond hero, approved plaster-light art, five-shot choir arc, Roman-numeral screenshot order, hymnal feature index, Keeper journal page, and explicit no-iCloud wording. Mobile uses the center shot and a swipe row. No invented founder quote; its receipt stands alone. |
| Old Dog / The Reading Room | The actual Mac icon, 300px navy desk sidebar, Literata display, Atkinson Hyperlegible UI, Mac-only demonstration, rust progress bar, ten subject catalog cards, placement qualification, and one-time purchase bookplate. |
| Teacher’s Pet / The Kitchen-Table Schoolhouse | Pine board, Gelasio headline with saffron highlight, real apple icon over a cropped Subjects image, Lexend body, and sticky Learn → Get help → Practice → Check → Result navigation with current-step state. Adult supervision, no diploma/accreditation, and pending-review pricing remain explicit. |
| Dreamcatcher / 3 a.m. | Approved curtain art, static eight-spoke hoop with 0.70/0.40 rings and one gold point, Instrument Serif/Spectral, actual cropped listing screenshots, and night → morning → daytime → tonight → night pricing. Morning review is verified in the supplied shot and source. The four Toolkit names come verbatim from shot 4, which is not displayed. |

The shell is a 44px studio bar with Apps, Blake, and one Work with me link. The footer has six real 48px labelled app icons. Cross-world links disable speculative prefetching so visiting one home does not preload other worlds’ route fonts. From Blake uses the inventory’s verbatim lines and the existing factual receipt.

## Defects 1–8

| Defect | Resolution / evidence |
| --- | --- |
| 1. Old Dog iPhone imagery | Only the real Mac icon and Mac listing screenshots are rendered. No iPhone screenshot exists in the world output. The sole iPhone sentence explicitly says it is coming, as WORLDS line 119 requires. Tested. |
| 2. Business / Courses planned row | Shot 5 is an exact 1440×752 crop of the inventory original, ending above the row. The original is not changed. Crop rectangle and hashes: [crops.json](crops.json). Browser and OCR review confirm the row is absent. |
| 3. Dreamcatcher AssistiveTouch | Shots 1–3 are exact rectangular crops of the inventory originals, removing the top strip containing the control and unused lower space. No inpainting, painting over, or reconstructed UI. Shot 4 is not displayed. Every crop is labelled and described in alt text. The old v1 image files remain untouched but are not rendered. |
| 4. Teacher’s Pet content totals | No curriculum totals occur in page copy. Listing shots 1 and 2 are cropped to omit embedded course, unit, and learning-step totals. Shots 3–5 show lesson content and adult instructions; lesson-step numbers and mathematical examples are not curriculum-completeness claims. OCR transcript: [screenshot-ocr.json](screenshot-ocr.json). |
| 5. Coming soon looks actionable | Both statuses are plain paragraph labels, with no fill, radius, arrow, link, button role, or store URL. A separate clearly labelled pricing anchor goes to the pricing section. `APP_PAGES_PRERELEASE` remains unchanged. Browser assertions verify the status DOM and styling. |
| 6. Stale listing screenshots | The pages identify the screenshots as “From the App Store listing” or “From the submitted listing”; no current-build-demo claim is made. No old simulator movie was reused. Store-set recapture remains a release follow-up; provided assets alone cannot establish a new current-device capture. |
| 7. Contrast traps | Trendi’s CTA uses aubergine text, with ≥5.33:1 at both gradient endpoints. Hero text was checked against every pixel of each scrim-composited art asset. The Trendi eyebrow uses approved rose (minimum 5.14:1), not pink over bright art. Paper separators/hairlines are decorative; interactive elements have underlines, text labels, and visible focus outlines. [contrast.json](contrast.json), [contrast-art-final.json](contrast-art-final.json). |
| 8. Duplicate navigation | The app homes use their own shell, not the studio Masthead/SiteFooter combination. Exactly Apps, Blake, Work with me appear in the bar. The browser asserts this on all 28 viewport/motion combinations. |

## Verification

- `npm ci` completed first. No dependency versions changed.
- `npx tsx --test tests/app-homes.test.ts tests/site-audit.test.ts tests/redirects.test.ts`: **20 passed, 0 failed**. [tests-shipping.log](tests-shipping.log). Existing price, paid-limit, prohibited-claim, prerelease, and palette assertions are retained; founder assertions now require the spec’s exact lines. Added world composition, screenshot exclusion, renewal, font isolation, and motion assertions.
- `npx tsc --noEmit`: **exit 0, no diagnostics**. [typecheck-shipping.log](typecheck-shipping.log) is intentionally empty.
- `npm run build`: **exit 0**, Next 16.2.12, all routes built. [build-shipping.log](build-shipping.log).
- Playwright against `next start` at `127.0.0.1:3128`: all seven pages at **1440×1000 and 390×844**, with both `no-preference` and `reduce`: **28 passing page checks**. No horizontal overflow, clipped headings/actions, broken images, page errors, duplicate nav, or animations under reduced motion. Way In has no animations in either mode. Teacher’s Pet navigation updates its active step. [browser-verified.log](browser-verified.log), [final browser report](shots/final/browser-qa.json).
- **463 rendered HTML text contrast checks** pass, plus **9 image/gradient/motion contrast checks**. These checks cover website text; they do not purport to recertify text inside the supplied product screenshots.
- **42 definitive PNGs** are under [shots/final/](shots/final/): 28 full-page screenshots and 14 hero crops. Earlier review screenshots and logs remain preserved in `review-1/`, `review-2/`, and directly under `shots/`.
- Every rendered copy block and the OCR transcript of every displayed listing image is traced in [CLAIMS.md](CLAIMS.md). Source documents are preserved under [sources/](sources/).

## Implementation decisions and limits

- Each route loads two approved world families through `next/font/google` in its layout. Trendi additionally uses the already-loaded JetBrains Mono for eyebrows. The spec’s common Newsreader quote and JetBrains Mono receipt are treated as shared shell typography alongside Sora. This resolves the otherwise conflicting two-world-font examples and shared-sign-off requirement; the interpretation was raised in-session. Instrument Sans substitutes for the spec’s Source Sans 3/Public Sans because those two families were not on Blake’s approved list. No Inter font or old Inter variable remains in production source.
- The installed Next.js guides became available when npm finished. The font, image, and layout guides were read before implementation; official web docs were also consulted while installation was finishing.
- Two incremental builds encountered a Next/Turbopack-generated JetBrains Mono import error (`next/font/google queries have exactly one entry`). Fresh-output builds succeeded, including the final build. Failed output directories and logs were preserved; no dependency/config workaround was introduced. This is a reproducibility limitation to watch if a CI runner restores old build output.
- New device/store captures and current-build demo recordings were not available. The website uses the supplied real listing assets with provenance labels, plus the approved FAI brand entrance. Each world also has its own social image: an exact copy of its final 1440px hero screenshot, linked by its Open Graph and Twitter metadata. These are browser captures, not generated artwork.
- Disk checks stayed above the requested reserves. Before installation: about 29.4 GB free on KoiBuild and 16.9 GB internal; estimated additional allocation below 4 GB / 1 GB respectively. Final capture checks: about 28.1 GB / 15.3 GB. No evidence was deleted or moved for space.

## Reproduce

Run the required tests/typecheck/build from the worktree. Start production with `npm run start -- --hostname 127.0.0.1 --port 3128`. `node scripts/capture-app-worlds.mjs shots/<new-pass>` preserves a new browser evidence pass; `node scripts/audit-app-world-contrast.mjs` audits HTML text and `node scripts/audit-app-world-art.mjs` audits the supplied art, scrims, CTA endpoints, and inactive script heading. `node scripts/write-app-world-claims.mjs shots/final` builds the claim ledger from captured copy and the retained screenshot OCR. Crop generation is reproducible with `scripts/prepare-app-world-assets.mjs` while the inventory source assets are available.
