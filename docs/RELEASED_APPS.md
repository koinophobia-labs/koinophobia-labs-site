# Released app customer paths

Verified September 10, 2026. Both domains use this repository; `next.config.ts` selects the founder routes by host. Continue using the existing GitHub CI and Vercel integration. This change does not deploy or alter app releases.

| Product | Public US listing | Version | Website |
| --- | --- | --- | --- |
| Trendi | https://apps.apple.com/us/app/trendi-content-coach/id6776299336 | 0.2.1 | `/trendi` |
| ForgetAboutIt | https://apps.apple.com/us/app/forgetaboutit/id6804360983 | 1.0 | `/forget-about-it` |
| Way In: Career Hub | https://apps.apple.com/us/app/way-in-career-hub/id6807942376 | 1.0 | `/way-in` |

Apple's current listing descriptions and compatibility sections are the source for features, devices, Free/Pro allowances and purchase language. Prices are intentionally left to the app's purchase sheet. Reverify listings before changing these claims. The founder's existing `/products/career-forge` story route and `https://career-forge-lite.vercel.app` web destination remain valid; the latter now displays Way In.

## Existing media

- `public/*/store/*.jpg`: authentic screenshots from each current Apple listing, downloaded at Apple's 600-pixel rendition. No UI was generated or substituted.
- `public/forget-about-it/commercial.mp4`: unchanged 15-second commercial attached to the existing “Forget About It Released” task on September 9. Its fictional scene and illustrative graphics are labeled as dramatization; current app screens appear separately. The poster is a frame from the same video.
- `public/trendi/trendi-final-demo.mp4`: existing July 2026 capture, retained as dated history in an expandable section. It is not presented as the current shipping interface. Social preview imagery now uses a current store screenshot too.

## Measurement

The existing `@vercel/analytics` integration receives `product_page_view` with bounded `product` and `surface` fields, and `app_store_click` with bounded `product` and `placement` fields. No freeform customer content enters these events. Story-page views use `surface: "story"`.

A page view is a website visit; an outbound click is download intent. Neither is an install, activation, subscription, purchase, revenue result or unique customer. Keep app and App Store outcome reports separate. The website does not inspect app data.

Browser QA verified nine real collector HTTP 200 responses: one product-page event and one hero download click for each app on the studio domain, plus one story-page event per app on the founder domain. The local implementation was mapped to the existing host only inside the QA browser; no public deployment was involved. These events carry `qa: true`, ordinary pageviews were suppressed, and QA events must be excluded from customer reporting. Collector acceptance was verified; dashboard aggregates and app outcomes were not asserted.

## Local verification

Use Node 22 and `npm ci`, then `npm run build` and `npm run start -- --hostname 127.0.0.1 --port 3100`. In an isolated checkout that shares installed dependencies by symlink, `npm run build -- --webpack` avoids Turbopack's external-root restriction.

Run `QA_BASE_URL=http://127.0.0.1:3100 node scripts/qa-customer-path.mjs` with local Chrome installed. `QA_OUTPUT` selects an evidence folder; `QA_CDP` can attach a dedicated QA Chrome instance. The script maps both actual domains to the local build only inside its browser context, exercising host rewrites and links. It blocks analytics during regression tests and uses fixture responses for inquiry success/failure, so it never creates a production lead or sends an email.

Existing CI remains unchanged. The regression suite covers both domains at desktop and mobile sizes, download destinations, native video playback, visible keyboard focus, support/privacy links and existing inquiry states. Server-side intake and security behavior remain covered by the repository tests.
