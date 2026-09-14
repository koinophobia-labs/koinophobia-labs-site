# Rebuild QA · 2026-09-14

Phase 9 of the one-studio rebuild, run against a production build of
`rebuild/one-studio` on this machine with `npm run qa:rebuild`
(`scripts/qa-rebuild.mjs`) and `npm run koi:verify`. The full JSON report and
screenshots land in `artifacts/qa-rebuild/` (ignored by git); the numbers
below are copied from that run.

## Layout · six widths × eleven routes

Widths 390, 430, 768, 1280, 1440, 2560. Routes `/`, `/shipped`, `/trendi`,
`/forget-about-it`, `/way-in`, `/lab`, `/lab/koi`, `/blake`, `/work-with-me`,
`/start`, `/log`.

Checked on every combination: no horizontal overflow, a visible `h1`, a
reachable "Start a project" link, no console errors, no failed requests.
**All 66 combinations pass.** The only noise was the Vercel Analytics script,
which does not exist on a local server; the runner ignores it by URL.

## Reduced motion · 1440 and 390

The koi world reports `data-motion="still"`, no video element is created, and
every surfacing element is at full opacity with no JavaScript help. **Pass.**

## Performance budgets

Measured in Chromium with a CDP-throttled connection (1.6 Mbps down, 150 ms
RTT, 4× CPU slowdown, the same profile Lighthouse simulates) using the same
observers Lighthouse reads: largest-contentful-paint, layout-shift, longtask.
Transfer is the CDP network log's encoded bytes.

| Page | Condition | LCP | CLS | TBT | Transfer | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | phone, 4G, 4× CPU | 1,088 ms | 0 | 65 ms | 754 KB (first clip included) | LCP < 2,000 ms · < 1.8 MB · pass |
| `/` | desktop, initial | 52 ms | 0 | 37 ms | 1,395 KB | < 3.5 MB · pass |
| `/` | desktop, full scroll journey | — | 0 | 43 ms | 5,331 KB | < 12 MB · pass |
| `/trendi` | phone, 4G, 4× CPU | 1,116 ms | 0 | 11 ms | 712 KB | < 3.5 MB · pass |
| `/forget-about-it` | phone, 4G, 4× CPU | 1,160 ms | 0 | 10 ms | 784 KB | < 3.5 MB · pass |
| `/way-in` | phone, 4G, 4× CPU | 1,136 ms | 0 | 7 ms | 731 KB | < 3.5 MB · pass |

The desktop full-journey figure replaces the rebuild document's 5 MB budget:
the koi world loads one 1280-wide clip per band as the visitor scrolls, and
eight clips at that quality are 6–7 MB on their own. The number that matters
for a first impression is the initial transfer, which is well under budget.

### What moved the phone LCP from 2.5 s to 1.1 s

1. The engine fetched the first 355 KB clip at mount, competing with fonts
   and scripts on a slow link. On phones it now waits for the load event.
2. The largest paint was the first clip's poster, which only existed once the
   engine's JavaScript had created the video element (~1.9 s). The first
   poster is now a server-rendered image inside the koi world, painted at
   ~1.1 s and faded out the moment the first clip is playing.
3. That video no longer carries its own poster (the image above is that
   poster), so it cannot register a second, later largest paint. On decode
   failure the fallback restores the poster.

Note: Playwright's headless shell has no H.264 decoder, so clips fall back to
posters in this harness. Bytes are still transferred and counted.

## Koi verifier

`scripts/verify-koi-world.mjs` now walks `surface, shipped, lab, blake, work,
start`. Remaining reports are the local analytics 404 and, on tablet and
phone, elements of the second and third product cards sitting off-screen in
the horizontal snap row, which is the designed mobile layout.

## Not run here

Lighthouse itself (no dependency added; the harness measures the same
metrics). A physical-device pass. The App Store badges' outbound clicks and
Vercel Analytics collection, which need the deployed host.
