# WO-0327 — Site truth sources

Verified 2026-11-18. Branch preview only.

## Seven live apps

Each US iTunes lookup returned HTTP 200, resultCount 1, the requested trackId, and seller BLAKE JIHAD TAYLOR. The site’s current count derives from `shippedProducts.length`; both offer proof lists use those same records.

| App | ID | Public version | Current version released (UTC) | Lookup |
| --- | --- | --- | --- | --- |
| Old Dog | 6813966822 | 2.3 | 2026-11-18T18:28:19Z | [Apple](https://itunes.apple.com/lookup?id=6813966822&country=us) |
| Way In: Resume & Job Search | 6807942376 | 2.6 | 2026-11-18T18:18:20Z | [Apple](https://itunes.apple.com/lookup?id=6807942376&country=us) |
| Teacher's Pet Personal School | 6808981717 | 1.2 | 2026-11-18T19:14:36Z | [Apple](https://itunes.apple.com/lookup?id=6808981717&country=us) |
| ForgetAboutIt | 6804360983 | 2.4.4 | 2026-11-18T18:27:57Z | [Apple](https://itunes.apple.com/lookup?id=6804360983&country=us) |
| Preaching to the Choir | 6808442357 | 2.3 | 2026-11-14T18:22:57Z | [Apple](https://itunes.apple.com/lookup?id=6808442357&country=us) |
| Dreamcatcher: Lucid Dreams | 6821750717 | 2.3 | 2026-11-14T18:27:59Z | [Apple](https://itunes.apple.com/lookup?id=6821750717&country=us) |
| Trendi: Content Coach | 6776299336 | 2.7 | 2026-11-14T22:05:52Z | [Apple](https://itunes.apple.com/lookup?id=6776299336&country=us) |

## Trendi 2.7

The current public listing description confirms AI script writing, Trend radar angles (subject to availability), templates, teleprompter recording with the real face/voice, backgrounds/blur, vertical video export, and on-device Take Two. Free: 3 AI scripts/week and basic Take Two. Pro: up to 100 AI scripts per subscription month, deeper Take Two, full library and premium backgrounds. Annual: US $39.99/year with a seven-day free trial for eligible subscribers; Monthly: US $7.99/month. Apple shows local price and eligibility. Cancel at least 24 hours before the trial/period ends to avoid renewal.

The listing distinguishes optional AI writing sent to Trendi’s service and Anthropic after consent from on-device Take Two. It excludes posting/scheduling, captions, timeline editing and AI avatars. No audience-performance guarantee is added. The editor pivot remains future work.

Screenshots below are exact Apple CDN downloads from the screenshots attached to that 2.7 listing, requested at 900×1956. The source filenames retain “2.6”; they are the screenshots Apple serves for 2.7, not new in-app captures or images claimed to depict an Annual paywall. Existing assets are preserved.

- `public/apps/trendi/v27-shot-1.jpg`: [Apple CDN](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/69/ba/04/69ba048d-d103-2d79-20a0-6bc7025d41cf/01-trendi-studio-2.6.png/900x1956bb.jpg), SHA-256 `de93d71131716006cbd2c52d949df5f81a4ece5037946f34d9bb09fa307e69f3`.
- `public/apps/trendi/v27-shot-2.jpg`: [Apple CDN](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/89/78/12/897812b5-fb19-cb17-319d-e24fd9273f8b/03-blur-hero.png/900x1956bb.jpg), SHA-256 `34ea07ccafccfa16bdd95267ff7945f9ea6cb53a894b9b7d9d0de5d4578a51d6`.
- `public/apps/trendi/v27-shot-3.jpg`: [Apple CDN](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/39/d1/87/39d187d2-195b-d5f5-2ca5-d869c34619c2/05-trendi-pro-2.6.png/900x1956bb.jpg), SHA-256 `1ea88c4c6cf180ba0a9348b4fb849daadf3366013fa3d0c59578a81f5eb29f60`.

## Voice and call placeholder

TASTE.md rule 14: public studio voice is “I.” Public studio navigation, offers, homepage, metadata and form messages use that voice. Historical logs, legal/privacy policies and partner scripts are retained. No legal terms, pricing policy, tracking or analytics behavior changes. The unsupported “100 downloads. Paying subscribers.” line is replaced with a link-verifiable invitation to open the listings.

The repository has no public call-now phone number or approved booking URL. `lib/acquisition/audit-config.ts` explicitly has an empty `AUDIT_BOOKING_URL`; its preferred-times form is gated behind a paid audit. Lead phone numbers in the private caller portal are prospects, not a studio contact number. `/work-with-us` therefore retains the current audit offer and intake routes and stages a disabled “Call Blake · coming soon” button with a visible explanation. It has no href, click handler, phone number or invented booking destination. Blake’s Wave 2 choice is still pending.

## Evidence boundary

Raw lookups, original screenshots, before/after browser captures, checks and REPORT.md are retained at `/Users/koi/KoinophobiaLabs/reports/WO-0327/`. Release fallbacks are refreshed from Apple; unrelated feature evidence retains its original dates. Before captures render the verified production source `672a20f8f0cb8b415e1f2f6d2c03ddd2a5d9ab3f` locally at 375×900 and 1440×900. The original dirty primary checkout is untouched.
