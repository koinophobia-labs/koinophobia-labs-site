# Dreamcatcher release recheck — 2026-11-22

The full test suite for the team/payment route restore detected that Dreamcatcher's
2026-10-21 verification was older than the existing 30-day public-release budget.
The freshness rule and test remain enforced.

The public [Apple Lookup API](https://itunes.apple.com/lookup?id=6821750717&country=us)
returned HTTP 200 and exactly one result on 2026-11-22:

- App ID: 6821750717
- Name: Dreamcatcher: Lucid Dreams
- Seller: BLAKE JIHAD TAYLOR
- Version: 2.4
- Current version release date: 2026-11-19T05:28:53Z
- Download price: 0.0 USD (Free)
- Listing: https://apps.apple.com/us/app/dreamcatcher-lucid-dreams/id6821750717

The public App Store page independently displayed version 2.4 and free download
with in-app purchases. Only the release facts and their matching expectations were
refreshed; this does not assert user counts, revenue, or purchase activity.

The complete API response is retained in the isolated worktree at
`Evidence/restore-team-pay-20261122/dreamcatcher-apple-lookup-20261122.json`.
