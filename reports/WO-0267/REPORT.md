# WO-0267 — Evidence-based site auditor

Work began after WO-0266 committed. Leadgen worktree: `/Volumes/KoiArchive/WO-0267/leadgen`, branch `studio/WO-0267-auditor`. Portal worktree: `/Volumes/KoiArchive/WO-0267/site`, branch `codex/wo-0267-auditor`, from production commit `282a061488eaf72902a91a6e86ffa025e1e2b0f3`, deployment `dpl_EYQfNwivp7XTQQUYgBBFRu9ntTzn`. No HQ ledger was changed.

## Measured accuracy

42 real public sites: 22 small-business controls, ten tricky/platform/SPA controls, eight known-bad endpoints, and two independently sourced Wix salon examples. Franklin Barbecue's rendered source verifies Squarespace coverage; Wix identifies Westfolk and Hiroshi in its [official showcase](https://www.wix.com/blog/hair-salon-websites). Labels and per-case outcomes are in `calibration.json`.

| Measure | Result |
|---|---:|
| Confirmed true positives | 5 |
| Confirmed false positives after corrections | 0 |
| Known positive conditions missed/unverified | 4 |
| Observed precision | **100% (5/5)** |
| Recall against labelled conditions | **55.6% (5/9)** |
| Cases left unverified | 12 |

The ≥95% precision target is met **on this sample**, not established for all websites. Five flags are a small positive sample. Recall covers the labelled conditions, not every possible defect on each site. Unavailable/challenged cases are reported explicitly and are not asserted healthy. Screenshots, rendered DOM and lab samples supplied the independent review; predefined certificate/status endpoints supplied positive ground truth. Review found one additional reproducible slow site. A storefront returning HTTP 404 was adjudicated negative for a dead-page claim because its rendered content contradicted that claim.

Confirmed public cases: wrong-host certificate, untrusted-root certificate, HTTP 404, HTTP 410, and repeated slow LCP. The slow case's two three-load medians were 7016 ms and 7572 ms LCP; the latter load median was 8449 ms. The missed cases were expired/self-signed certificate endpoints that did not produce two usable observations during the scored pass, a revoked-certificate endpoint accepted by the runtime, and an unavailable HTTP 500 test endpoint. An earlier separate expired-certificate smoke test did produce real warning proof; it is retained but not substituted into the scored pass.

## False positives found and fixed

All nine are recorded individually in `false-positives.json`, with public URLs and corrective results:

- Franklin Barbecue: a 15px edge spill was too weak to qualify. Require >24px overflow.
- Levain Bakery: a blank HTTP 200 response looked like a 980px zoomed-out layout. Require meaningful visible content and reject incomplete renders.
- Russ & Daughters, Dominique Ansel, Joe's Kansas City, Powell's, Strand and Papier: hidden, occluded, duplicate or unrelated controls looked overlapping. Check ancestor visibility, hit-test reachability, distinct labels and a common parent.
- Tartine: an HTTP 404 rendered a substantial storefront. Status alone cannot qualify that page without rendered error content.

Chromium's native error-page navigation can throw even after receiving a real 404/410. The checker now retains the main-document response status and real error-page pixels. Locally generated proxy failures are identified separately and can never become website 5xx findings. Serverless insecure-content flags are removed. Single-process browser instances are restarted between loads because reusing contexts was proven to fail.

## Shared behavior and evidence

One source package (`packages/site-auditor`) is packed into the portal's local dependency. Both applications use the same checks and confirmation rules. Mobile is 390×844; desktop is 1440×900. Layout is measured twice. Speed uses two independent groups of three fresh mobile loads when the first group is slow, reporting medians and excluding the checker's own robots-policy waiting. Browser LCP is a lab observation, not field CWV or measured lost revenue.

GET-only navigation follows redirects with normal desktop/mobile browser user agents. The proxy validates and pins DNS on every outbound connection, including subresources. Private/reserved addresses, credentials, action/login paths, non-GET requests and WebSockets are blocked. Service workers are disabled. Page/document/resource bounds and robots rules can cause abstention. Ordinary static metadata is never sufficient to qualify a lead.

Link observations must match URL, kind and error reason across distinct runs at least 600 seconds apart, with screenshots on both observations. Confirmed proof includes URL/time/viewport and a checked SHA-256. Leadgen saves private proof under `~/SalesPrivate/leadgen/auditor-v2`; the portal saves it with its existing site-check records and serves it through a partner/owner-scoped GET endpoint. Inline UI, copy findings, lead scoring and opener generation all gate on confirmation. Notes and legacy findings cannot populate “What’s broken.”

Portal link verification is durable across requests: run the same URL after the displayed retry time. There is no ten-minute HTTP request or new external scheduler. Leadgen retries observed pending action failures after the real interval. No synthetic timestamps or backdated observations were used.

## Imported-lead reconciliation

The historical batch is **64 candidates, not 64 imported rows**. The read-only production check confirmed **45 rows**; the prior import had rejected 19 minor-only candidates. All 64 were rechecked privately, including real WO-0255 action-link cases, with delayed retries and corrective reruns. The guarded update and committed read-back are in `recheck-counts.json`:

| Cohort | Reproduced original qualifier | Re-check failed / unqualified | Total |
|---|---:|---:|---:|
| Imported production leads | 11 | 34 | 45 |
| All historical candidates | 11 | 53 | 64 |
| Previously rejected, never imported | 0 | 19 | 19 |

Eleven candidates received corrective link checks; six link findings survived matching fresh proof at least ten minutes apart. Unavailable or contradictory renders stayed unverified. Read-back confirms 11 `confirmed` and 34 `re-check failed` imported records. Original leads, stages, attribution, notes and evidence are retained. Only additive `data.recheck` metadata is updated. Failed original qualifiers remain visible as “re-check failed”; stale openers are hidden and failed rows do not count toward refill inventory. All-stage suppression prevents reinsertion.

## Verification and release

- 69 leadgen TypeScript tests, nine Python supervisor tests, and 76 portal team tests pass with release package 2.0.3; release outputs are retained alongside this report.
- Real Chromium fictional fixtures cover responsive/no-meta content, overflow, overlapping siblings, cookie overlays and JS-rendered content.
- A production-mode local portal with an isolated fictional PostgreSQL database passed proof authorization, inline proof, mobile layout, owner failed count, stale-opener suppression, confirmed-only copy and UI → actual browser checker → stored result.
- No real login, sends, form submissions, Stripe changes, schema migrations or evidence deletion occurred. Existing payment/Connect tests remained green.
- Production must still match the pinned deployment and commit immediately before the single authorized deployment. The deployment receipt and post-deploy GET verification are recorded separately.

## Limits and retained material

Precision is deliberately favored over recall. The checker does not submit forms, complete bookings, solve challenges or infer failures behind authentication. Mixed-content confirmation is limited to blocked, visibly broken images; generic console warnings or unproven script impact are insufficient. Overlap detection is conservative and does not claim full accessibility coverage. TLS revocation is not comprehensively checked. Serverless headless-shell Chromium can produce no native warning pixels, leaving certificate failures unverified; the local full-browser lane captures native warnings. Missing proof is never replaced by a fabricated warning.

Initial disk checks showed approximately 61 GB free on KoiArchive and 20 GB internally. Estimated peak addition: 6 GB archive and 1 GB private proof. Headroom was monitored; all work stayed above the 10 GB reserve. Browser binaries, worktrees, node dependencies, build/test scratch and public calibration records stay on KoiArchive. Private prospect records remain under SalesPrivate. Nothing was deleted or pruned. Public calibration captures are retained at `/Volumes/KoiArchive/WO-0267/calibration*`; sample public and fictional proof is in `samples/` and `fixtures/`. No prospect PII appears in this report.
