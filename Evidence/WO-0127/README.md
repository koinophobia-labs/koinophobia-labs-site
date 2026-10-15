# WO-0127 app homes — review evidence

Implemented in `/Volumes/KoiBuild/koinophobia-labs-site/WO-0127`, branch `studio/WO-0127-app-homes`, based on `origin/main` `44208b8`. The canonical checkout’s work files were not edited. Dependencies are reused through the WO-0126 node_modules symlink. Temporary work is under KoiBuild; KoiDev was not written. No evidence was removed.

Preview: https://koinophobia-labs-5hralvm7x-koinophobia999-8829s-projects.vercel.app

## Screenshots to review

These are the final captures at 1440×1000 and 390×844 viewport sizes, full-page, Chrome. Teacher’s Pet and Dreamcatcher were enabled only in local development. Earlier captures and diagnostic logs are retained separately; `review/` is the final set.

| App | Desktop | Phone |
|---|---|---|
| Trendi | [Desktop](review/trendi-desktop.png) | [Phone](review/trendi-phone.png) |
| Way In | [Desktop](review/way-in-desktop.png) | [Phone](review/way-in-phone.png) |
| Forget About It | [Desktop](review/forget-about-it-desktop.png) | [Phone](review/forget-about-it-phone.png) |
| Preaching to the Choir | [Desktop](review/preaching-to-the-choir-desktop.png) | [Phone](review/preaching-to-the-choir-phone.png) |
| Old Dog | [Desktop](review/old-dog-desktop.png) | [Phone](review/old-dog-phone.png) |
| Teacher’s Pet | [Desktop](review/teachers-pet-desktop.png) | [Phone](review/teachers-pet-phone.png) |
| Dreamcatcher | [Desktop](review/dreamcatcher-desktop.png) | [Phone](review/dreamcatcher-phone.png) |

Claims, prices, palettes, font substitutions, founder-note provenance and original asset hashes: [CLAIMS.md](CLAIMS.md). The supplied inventory is retained as [INVENTORY-source.md](INVENTORY-source.md).

## Verification

- Lint: no errors; existing unused `CRM_GOOGLE_PROVIDER` warning in auth.ts. `lint-review.log`.
- Typecheck: passes. `typecheck-review.log`.
- Build: local `npm run build -- --webpack` passes (`build-verified.log`). Default local Turbopack rejects a node_modules symlink outside the project root (`build.log`); dependencies were reused as instructed. Vercel’s regular `next build` uses Turbopack and succeeds with installed dependencies (`vercel-preview-final.log`).
- Full suite: `node --import tsx --test --test-reporter=tap tests/*.test.ts tests/*.test.mjs`: 229 tests, 227 passed, 2 known failures (`tests-review.tap`).
- Known failures: verification-age test for Teacher’s Pet and KOI; Trendi privacy/support publication-copy assertion. These remain unchanged. The Trendi version expectation was updated to the approved 2.1 status, and the listing-refresh test now reflects inventory-backed app homes without printed version claims.
- Five new tests verify rendered prices/terms against one config, forbid the false purchase claim in app/component/lib copy, verify the default release gate and discovery, check original assets and feature counts, and measure palette contrast at WCAG AA.
- Browser: all seven pages pass at both widths. No page overflow or page errors, correct serif headings, all gallery images decoded and optimized, exact DOM prices, correct download/coming state, mobile menu opens and closes with Escape. `review/browser-qa.json` and `browser-review.log`.
- Local production gate: five live homes return 200; both unreleased homes and their original/optimized promotional images return 404. Restored Way In support/privacy return 200. `production-gates.json`.
- Teacher’s Pet’s existing Cloudflare support/privacy destinations both returned HTTP 200.
- Disk: started with approximately 30.4 GB free on KoiBuild and 18.6 GB on Data. Estimated additional allocation under 2 GB; headroom remained above the 10 GB reserve throughout.

## Publication controls and local reproduction

`APP_PAGES_PRERELEASE = false` in `lib/app-homes.ts`. Neither new prerelease home is linked in the public app navigation or sitemap. Old Dog shows only Mac. Promotional original and optimized image URLs for the two unreleased apps are also gated by `proxy.ts`. Existing support/privacy and historical lab routes remain available.

Local prerelease review:

```sh
APP_PAGES_LOCAL_PREVIEW=1 TMPDIR=/Volumes/KoiBuild/koinophobia-labs-site/tmp/WO-0127 npm run dev -- --webpack -p 3128
QA_OUT=Evidence/WO-0127/new-review TMPDIR=/Volumes/KoiBuild/koinophobia-labs-site/tmp/WO-0127 node --import tsx scripts/capture-app-homes.ts
```

The local switch is ignored in production and on Vercel. New captures should use a new QA_OUT directory to preserve prior evidence.

## Remaining content gaps

- No current approved product videos; only the supplied real listing screenshots are shown. Way In’s supplied set is 1.0.3, and FAI’s supplied set predates 2.1. Updated screenshots remain desirable.
- Teacher’s Pet’s subscriptions are READY_TO_SUBMIT in the supplied inventory. Confirm attachment/review before launch. Its page presents planned pricing and remains unpublished.
- Dreamcatcher and Teacher’s Pet require Blake’s publication decision after release. Old Dog iPhone is not promoted.
- `lib/resume.json:17` still says `2025 – Present`, conflicting with the July 2026 origin narrative; left untouched as requested.
- The pre-existing `/lab/teachers-pet` historical content counts are stale. This work adds a separate, gated home and does not rewrite that historical page.
- Preview only. No production deployment or merge was performed.
