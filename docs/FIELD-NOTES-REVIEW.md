# Field Notes — review before merge

**Status: ALL FIVE NOTES HELD. None is publicly reachable. Nothing deleted.**

> Updated 2026-07-20 (second pass). Previously only two notes were held. Blake's
> call: hold all five. He has personally read none of them, and a byline he
> hasn't checked is exactly the claim this site exists not to make. Claude does
> not get to be ghostwriter-in-residence by default.
>
> A note now publishes only when **both** flags are true in `lib/dev/lab.ts`:
> `published: true` **and** `approvedByBlake: true`. Both default to false for
> any new note, and a test asserts nothing reaches the site without them.
>
> While the set is empty, `/notes` is removed from the nav, hidden on the home
> page, and omitted from the sitemap. The route still resolves and explains
> itself for anyone arriving from a bookmark.
>
> The per-note recommendations below stand as drafting notes — they describe
> what Claude found, not permission to publish.

Every field note on koinophobia.dev is written in Blake's first person, makes
factual claims about private product history, and is published under his name.
Claude drafted all of them from documented events; Blake has not read them.

**To publish one:** set BOTH `published: true` and `approvedByBlake: true` on
that note in `lib/dev/lab.ts`. Setting only `published` does nothing — the site
will still refuse to render it, and a test enforces that.

Legend on each note below: **REVISED** = corrected during the 2026-07-20
reconciliation and now accurate · **accurate as-is** = re-verified, no changes
needed. Every note is **HELD** regardless until you've read it.

---

## 1. `three-labels-one-product` — "My site was wrong about my own products"

**Recommendation: REVISED → HELD pending your read.** This is the site's
thesis note and the one most worth your attention.

| Flag | Detail |
|---|---|
| Factual claims | Quotes the three contradictory YKB statuses; cites Apple's 409 responses naming previousBundleVersion 26 and 27. Both verified 2026-07-20. |
| Correction made | The original said "No You Know Ball build has ever reached TestFlight — not build 26, not build 27." **That was false.** Apple accepted both. The note now tells that story instead. |
| Self-criticism | High and deliberate: "Confident self-criticism turns out to be just as unreliable as confident marketing." Reads as rigorous rather than self-flagellating, but it is you admitting on your own site that you published two wrong versions of the same fact. |
| Staleness risk | Low. It describes a completed audit. |
| Private history | Discloses that your own site misstated your release state. Nothing about clients or third parties. |

**Judgement call for you:** this note is the strongest argument the site makes
and also the most exposing. If you'd rather not publish a note about being wrong
twice, the site still works without it — but the "honest software" principle
gets noticeably thinner.

---

## 2. `shipping-and-delivering` — "Shipping and delivering are different verbs"

**Recommendation: REVISED → HELD pending your read.**

| Flag | Detail |
|---|---|
| Factual claims | Build 116 blocked by an App Store Connect account error; testers on 114; build 118 now uploaded and installed; isolation gate half-run. All verified. |
| Correction made | The original ended with 116 stuck and unresolved. That is now stale — 118 shipped. The note carries an updated ending and a dual date ("July 18 · updated July 20"). |
| Self-criticism | Moderate. "I treated release infrastructure as the boring part." Fair, not harsh. |
| Staleness risk | **Medium-high.** The moment the User B isolation leg runs, paragraph four is out of date. Re-check when that test completes. |
| Private history | Names an Apple account permission failure. Unflattering to nobody but the process. |

---

## 3. `turning-off-the-better-version` — "I turned off the version that wrote better"

**Recommendation: accurate as-is → HELD pending your read.**

| Flag | Detail |
|---|---|
| Factual claims | V2 pipeline disabled; builds 117/118/119 all ship the V1 client. **Independently re-verified** in the shipped Info.plist of all three archives. |
| Self-criticism | Low. This one makes you look good — it's a discipline story. |
| Staleness risk | Medium. Goes stale the day V2 is re-enabled. |
| Private history | Describes internal V2 defects (written-mode break, platform-default leak, claims-gate false positives). Reasonable to disclose; nothing about a customer. |

---

## 4. `tuning-until-beginners-lose` — "I tuned a game until beginners lost badly"

**Recommendation: HELD** — and additionally needs a content decision, below.

| Flag | Detail |
|---|---|
| Why held | The original cited **"16–27% down to under 5%"**, **"2.36%"**, and **"4,500 simulated games"**. During the audit I could not trace any of those to an artifact in the workspace — no report, no run log, no receipt. They came from a prior session's summary, not from evidence. |
| Action taken | Rewritten with the numbers removed. The story survives; the precision does not. |
| What you decide | Either (a) point me at the tournament run that produced those figures and I restore them with a source, or (b) publish the qualitative version, or (c) leave it held. |
| Self-criticism | Moderate: "I spent months making a scoring system honest before a single outside person had played it." True and, given the YKB status, pointed. |

**This is the clearest example of why the review exists.** The numbers were
persuasive, plausible, and unsourceable — exactly the kind of claim that
survives because it flatters the work.

---

## 5. `certified-not-installed` — "I certified a feature against every failure but the real one"

**Recommendation: HELD** — and additionally needs a content decision, below.

| Flag | Detail |
|---|---|
| Why held | The original's punchline — "My own laptop runs a build from June" — **is now false.** `~/Applications/Koi Cave.app` is stamped Jul 13 2026 and built from HEAD `350269a`. That gap was closed the same night the report was written. |
| Action taken | Rewritten around what still holds: Gmail has never synced (config has a client ID and no tokens, the sync file was never created), so every brief ever produced ran on local seed state; and the >72h truth bug remains. Both verified. |
| Self-criticism | **Highest on the site.** The original said certification "was for the report, not for me." The revision is softer but still says the drills only ever tested the one state the tool has ever been in. |
| Private history | Koi Cave is unreleased, undistributed, and has no users. This note discloses a named defect in a private tool. That is entirely your call to make public. |
| Staleness risk | Low once corrected, but it will need another pass if you connect Gmail. |

---

## Cross-cutting flags

- **Every note speaks as you.** None were written by you. If the voice is off
  anywhere, that is a drafting failure, not a stylistic choice — tell me and
  I'll rewrite rather than defend.
- **Two notes disclose defects in unreleased products** (#3 Trendi V2, #5 Koi
  Cave). Neither involves a client, a customer, or a third party.
- **The dated notes will drift.** `/notes` shows a "last updated" stamp, but
  individual notes carry their own dates and no test can tell you a *story* has
  gone stale. #2 and #3 are the two to re-read after the next Trendi release.
- **Nothing was deleted.** All five notes are intact in `lib/dev/lab.ts` behind
  the two-flag gate, with full bodies. A test asserts a held note keeps its
  body, title and hook — "held" can never quietly become "emptied".
- **The gate is default-deny.** Any note added later starts at
  `published: false, approvedByBlake: false`. Nothing Claude writes reaches the
  public site by default, ever.
