import { getProduct, type Evidence } from "@/lib/dev/universe";

// The build log: the chronological record of what actually happened across
// Blake's products, the studio, and this site.
//
// Register rules — this file is a RECORD, not a diary:
//  1. An entry describes something that happened, with a date a human typed.
//     No roadmap items, no intentions dressed as events.
//  2. Specific claims carry `evidence` with checkable sources, exactly like
//     lib/dev/universe.ts. Numbers that can't point at an artifact don't ship.
//  3. Entries are the same class of factual claim as the universe's `state[]`:
//     they publish via a reviewed PR. The first-person ESSAYS in lib/dev/lab.ts
//     keep their stricter dual gate (Blake must read each one) — that boundary
//     is deliberate and this file must never become a way around it.
//  4. Nothing is ever deleted to make the record look better. A wrong entry is
//     corrected by a newer entry that says what was wrong.
//
// Entries dated before July 26, 2026 were backfilled on July 26 from release
// records — delivery logs, merged PRs, health endpoints, session reports. The
// /log page says so. Newest first. Bump `logLastUpdated` by hand.

export const logLastUpdated = "September 14, 2026";

export type LogKind = "release" | "defect" | "decision" | "milestone" | "lesson";

export const logKindLabel: Record<LogKind, string> = {
  release: "Release",
  defect: "Defect",
  decision: "Decision",
  milestone: "Milestone",
  lesson: "Lesson",
};

/** Non-product surfaces an entry may belong to. */
export const LOG_SURFACES = ["site", "studio"] as const;

export type LogEntry = {
  slug: string;
  /** ISO date, human-typed. Never generated from the clock. */
  date: string;
  title: string;
  /** A product slug from lib/dev/universe.ts, or "site" / "studio". */
  product: string;
  kind: LogKind;
  /** What changed. */
  what: string;
  /** Why it mattered. */
  why: string;
  /** What was decided next. */
  next: string;
  evidence?: Evidence[];
};

export const logEntries: LogEntry[] = [
  {
    slug: "one-studio-rebuild-live",
    date: "2026-09-14",
    title: "The rebuild is live. One studio, one domain.",
    product: "site",
    kind: "release",
    what: "Pull request #57 merged to main and Vercel deployed it. koinophobialabs.com now leads with the three App Store apps, reports the lab at its real stage, and carries the koi renders, the analytics events, the social card, the RSS feed, and the build-time App Store versions. koinophobia.dev redirects into it, permanently.",
    why: "For six weeks the studio site sold website audits while the apps were live on the store. The proof and the studio are in one place now.",
    next: "Watch the sixteen events for a month, then decide whether cinematic mode costs readers. Confirm the GitHub Actions billing lock is lifted so CI runs on the next change.",
    evidence: [
      { claim: "Production serves the merge commit", source: "Vercel deployment dpl_4Rsus7xrC9JLGtmnvK1RLMsbe7Jd for 12d0241, target production, 2026-09-14" },
      { claim: "Redirects fire on the live hosts", source: "curl 2026-09-14: /services, /intake, /products, /about, /work, /concierge, /now return 308 to the new pages; koinophobia.dev/, /products/trendi, /about, /log return 308 to koinophobialabs.com" },
      { claim: "CI did not run on the pull request", source: "GitHub annotation 'The job was not started because your account is locked due to a billing issue'; the CI steps were reproduced in a clean clone instead (docs/evidence/REBUILD_QA_2026-09-14.md)" },
    ],
  },
  {
    slug: "one-studio-rebuild-pull-request",
    date: "2026-09-14",
    title: "The rebuild reaches a pull request",
    product: "site",
    kind: "milestone",
    what: "All nine phases of the one-studio rebuild landed on one branch and went up for review: one registry, one domain, the App Store apps leading, the lab at its real stage, sixteen analytics events, a social card per page, an RSS feed, build-time App Store versions, five new koi renders, and a QA harness that passes at six widths with a phone LCP of 1.1 seconds.",
    why: "Production still runs the site that sells website audits. Nothing here is live until the merge, and the merge is a human's call.",
    next: "Merge, attach koinophobia.dev to the same Vercel project, verify the host redirect on the live domain, and confirm the analytics events arrive.",
    evidence: [
      { claim: "The pull request exists with the full verification record", source: "https://github.com/koinophobia-labs/koinophobia-labs-site/pull/57, opened 2026-09-14" },
      { claim: "The QA numbers are on the branch", source: "docs/evidence/REBUILD_QA_2026-09-14.md and docs/koi/HIGGSFIELD_2026-09-14.md at b1670cf" },
    ],
  },
  {
    slug: "one-studio-rebuild-begins",
    date: "2026-09-13",
    title: "The two sites become one studio",
    product: "site",
    kind: "decision",
    what: "Started the rebuild that folds koinophobia.dev into koinophobialabs.com: the three App Store apps lead, the lab reports its real stage, the small-business audit offer is retired, and every product card reads from one registry.",
    why: "A one-person studio with two homes splits its proof in half. The apps were live on the store while the studio site was still selling website audits.",
    next: "Ship phases 0–5 on the rebuild branch, then the domain merge and redirects.",
    evidence: [
      { claim: "The rebuild plan and its audit are on the record", source: "The rebuild document and homepage prototype published 2026-09-13; branch rebuild/one-studio in koinophobia-labs-site" },
    ],
  },
  {
    slug: "three-apps-verified-public",
    date: "2026-09-10",
    title: "Way In, Trendi, and Forget About It verified public on the App Store",
    product: "studio",
    kind: "milestone",
    what: "All three released apps were checked against Apple's public US listings and the Lookup API, and the site's customer paths were completed: App Store buttons, authentic store screenshots, and accurate Free and Pro allowances.",
    why: "Website copy about a release is a claim; the listing is the evidence. The check moved every product page from 'in preparation' language to dated, verifiable status.",
    next: "Read versions from the Lookup API at build time so the site can never drift from the store again.",
    evidence: [
      { claim: "Trendi is public on the App Store", source: "https://apps.apple.com/us/app/trendi-content-coach/id6776299336 — public US listing and Apple Lookup API, checked 2026-09-10" },
      { claim: "ForgetAboutIt is public on the App Store", source: "https://apps.apple.com/us/app/forgetaboutit/id6804360983 — public US listing, checked 2026-09-10" },
      { claim: "Way In is public on the App Store", source: "https://apps.apple.com/us/app/way-in-career-hub/id6807942376 — public US listing, checked 2026-09-10" },
      { claim: "The customer-path deploy landed on main", source: "koinophobia-labs-site commit f985a1f, 2026-09-10" },
    ],
  },
  {
    slug: "way-in-native-resubmission",
    date: "2026-09-03",
    title: "Way In native build 6 resubmitted; the web app takes the new name",
    product: "career-forge",
    kind: "release",
    what: "The native iPhone and iPad app was bumped to build 6 for App Store resubmission, and the Career Forge web app was renamed Way In so both surfaces carry one name.",
    why: "Two names for one product is the kind of small lie that compounds. The rename closed it before the native listing went public.",
    next: "Verify the public listing, then retire every remaining 'Career Forge' string on the site.",
    evidence: [
      { claim: "Build 6 was prepared for resubmission", source: "career-forge-native-ci commit 'Add native Way In iOS app and bump to build 6 for App Store resubmission', 2026-09-03" },
    ],
  },
  {
    slug: "trendi-public-app-store",
    date: "2026-08-28",
    title: "Trendi reaches the public App Store",
    product: "trendi",
    kind: "release",
    what: "Trendi: Content Coach went public on the App Store for iPhone: free with three Coach Packs per weekly period, and an optional Trendi Pro subscription.",
    why: "Every earlier entry about Trendi is about builds that reached a tester. This is the first one a stranger could install.",
    next: "Watch whether the output gets used to publish, repeatedly, before adding a single feature.",
    evidence: [
      { claim: "Public listing exists", source: "https://apps.apple.com/us/app/trendi-content-coach/id6776299336, public since 2026-08-28 per the site's Trendi release commit 248975a (2026-08-30)" },
    ],
  },
  {
    slug: "founder-os-slice-one",
    date: "2026-07-26",
    title: "The site became a founder OS",
    product: "site",
    kind: "release",
    what: "Rebuilt the koinophobia.dev homepage as a control room — current focus, every product with its real stage, this log, and a start-here router by visitor type. Re-verified every product status against artifacts on the same day, because two of them were about to trip their own freshness alarms.",
    why: "The work was scattered across apps, chats, and release logs where nobody could see it. A founder's public record should be the evidence, not a summary of it.",
    next: "Keep the log alive with every working session, and get Project Reach Back into the constellation once there's a checkable paragraph of truth about it.",
    evidence: [
      {
        claim: "The statuses were about to go stale by the site's own rules",
        source:
          "lib/dev/universe.ts stage budgets: Trendi and You Know Ball carry 7-day windows, last verified 2026-07-20",
      },
    ],
  },
  {
    slug: "trendi-three-uploads",
    date: "2026-07-25",
    title: "Three TestFlight uploads in one evening — two of them fixes",
    product: "trendi",
    kind: "release",
    what: "Build 120 shipped Record Mode's beta package to TestFlight. The first pass on the phone found a paid-for coach script rendering as five empty sections — fixed in 121. Then the live camera preview showed sideways on the front sensor while recordings stayed upright — fixed in 122 by letting Apple's rotation coordinator drive the preview.",
    why: "Both defects were invisible in the simulator and surfaced within hours of a genuine install. Weeks of green automated runs had voted; the device decided.",
    next: "A deliberate on-device update pass and the focused record → playback → share gate list on build 122 before any external tester touches it.",
    evidence: [
      {
        claim: "All three builds were uploaded and accepted on July 25",
        source:
          "altool delivery UUIDs e5cbeefe (120), caa3229b (121), d811be60 (122); App Store Connect processed each VALID",
      },
      {
        claim: "The archives exist",
        source: "~/Library/Developer/Xcode/Archives/2026-07-25/Trendi-0.1.0-{120,121,122}.xcarchive",
      },
    ],
  },
  {
    slug: "studio-packets-and-crm-auth",
    date: "2026-07-25",
    title: "Sales packets, and a real login for the CRM",
    product: "studio",
    kind: "release",
    what: "Qualified studio leads now produce a founder-ready sales packet instead of a raw CRM row, and the private CRM moved from a shared secret to staged Google authentication.",
    why: "The gap between “a lead exists” and “Blake can walk into the conversation prepared” was manual work that happened at the worst possible time. And a shared secret is the kind of debt that gets more embarrassing the longer the CRM matters.",
    next: "Retire the legacy secret fallback entirely once the staged rollout proves out.",
    evidence: [
      {
        claim: "Both landed on main through reviewed PRs",
        source: "koinophobia-labs-site #40 (merge b0bfa8e) and #41 (merge 8018cdf), 2026-07-25",
      },
    ],
  },
  {
    slug: "koi-cave-operator-loop",
    date: "2026-07-23",
    title: "Koi Cave's operator loop closed for the first time",
    product: "koi-cave",
    kind: "milestone",
    what: "A typed command became a validated packet, passed an approval gate, ran a repo-inspection worker against the real Trendi checkout, and came back as a receipt that a separate validator re-checked from artifacts on disk. The worker cannot declare its own success.",
    why: "This is the difference between a notes app and an operator brain: work you can delegate and then verify without trusting the thing that did it.",
    next: "The loop stays unmerged until the human-hands gate runs — Blake typing the command into the composer himself. No more feature work before that.",
    evidence: [
      {
        claim: "The first live receipt exists with proof artifacts",
        source: "KOI_CAVE_OPERATOR_LOOP_V1_REPORT.md; receipt 7F044DA9, proof directory present 2026-07-26",
      },
    ],
  },
  {
    slug: "front-office-ships-and-gets-audited",
    date: "2026-07-21",
    title: "The koi got a front office — then an audit took it apart",
    product: "concierge",
    kind: "release",
    what: "Both sites' koi became a structured front desk: messy thought → one-question-at-a-time clarifying → an editable brief → an honest recommendation, with nothing sent before consent. Days later, a ten-journey walkthrough scored it 63/100 — the front door was hidden behind an unlabeled fish — and all nine defects it found were fixed and merged the same day.",
    why: "Conversion surfaces rot fastest, and the only way to know is to walk in as a stranger. The score wasn't the embarrassment; shipping without the walkthrough was.",
    next: "A five-human benchmark before the flow gets called done — automated self-scoring already fooled me once.",
    evidence: [
      {
        claim: "Shipped and fixed through reviewed PRs with verified production deploys",
        source: "koinophobia-labs-site #38 (front office) and #39 (all nine audit defects), merged 2026-07-21",
      },
      {
        claim: "The audit and fix list are on the record",
        source: "docs/FRONT_OFFICE.md and the 2026-07-21 ease-of-use audit (63/100 weighted, ten journeys)",
      },
    ],
  },
  {
    slug: "release-truth-reconciliation",
    date: "2026-07-20",
    title: "The site was wrong about my own products — in both directions",
    product: "site",
    kind: "lesson",
    what: "An audit of every product claim against artifacts found three of four statuses wrong, including an underclaim: the site said no You Know Ball build had ever been uploaded, while Apple's own 409 logs named two it had already accepted. Every status now carries a verification date and evidence, and the test suite fails when either goes stale.",
    why: "Writing status from memory produced both flattery and false modesty. Confident self-criticism turned out to be as unreliable as confident marketing — and harder to catch, because nobody fact-checks the sentence that makes you look bad.",
    next: "Statuses only move when someone looks at artifacts, and the freshness budgets make “someone looked” a dated, testable claim.",
    evidence: [
      {
        claim: "The full audit trail is in the repo",
        source: "docs/RELEASE-TRUTH-RECONCILIATION.md, committed with PR #36",
      },
    ],
  },
  {
    slug: "career-forge-closes-checkout",
    date: "2026-07-20",
    title: "Career Forge closed its own store",
    product: "career-forge",
    kind: "decision",
    what: "An audit found the $49 fulfillment path ran entirely in the buyer's browser — close the tab on the way back from Stripe and the license was never issued, with nothing recording it. Checkout was closed the same day, and reopening was tied to a demonstrated end-to-end journey rather than to configuration.",
    why: "A checkout that refuses to open is a bad day. One that charges and delivers nothing is a refund, an apology, and someone's trust.",
    next: "Build the durable order store, then re-certify the journey on the deployed code. (Update, July 26: the store now exists and passes its health checks; the certification is pinned to an exact commit, so checkout stays closed until the journey is re-proven on the code that's running.)",
    evidence: [
      {
        claim: "The brake and its reason are live and inspectable",
        source:
          "career-forge-lite#28 (3c66a77); GET /api/commerce-health returns canSellSafely:false with the pinned-commit reasons, checked 2026-07-26",
      },
    ],
  },
  {
    slug: "dev-becomes-a-laboratory",
    date: "2026-07-20",
    title: "koinophobia.dev became a product laboratory",
    product: "site",
    kind: "release",
    what: "The personal site grew from four routes to a full universe: product pages with per-product visual worlds, honest stage + reach on everything, a lab of experiments, and its own sitemap. Every product status became a dated, evidenced claim.",
    why: "One click past the homepage, visitors used to land in studio chrome with contradictory labels. The two-site story broke exactly where curiosity started.",
    next: "Keep the universe as the single source of truth — every other surface renders from it or disagrees with it loudly in tests.",
    evidence: [
      {
        claim: "Shipped as one reviewed PR",
        source: "koinophobia-labs-site #36, squash-merged 2026-07-20 (4adb896) with a verified production deploy",
      },
    ],
  },
  {
    slug: "career-forge-beta-one",
    date: "2026-07-19",
    title: "Career Forge v0.10.0-beta.1 ships",
    product: "career-forge",
    kind: "release",
    what: "The beta line went to production after a readiness sprint: early-win bullets so the first session produces something usable, and a first-run profile where nine fields became optional and collapsed.",
    why: "People were abandoning at a wall of empty textareas. Completion beats completeness — a shorter form that gets finished outperforms a smarter one that doesn't.",
    next: "Watch whether strangers finish the workflow, and treat the paid path as unproven until it's demonstrated end to end.",
    evidence: [
      {
        claim: "The release is tagged",
        source: "career-forge-lite tag v0.10.0-beta.1 at b1be8b2, deployed to career-forge-lite.vercel.app",
      },
    ],
  },
  {
    slug: "trendi-118-lands",
    date: "2026-07-19",
    title: "Trendi build 118 finally lands on TestFlight",
    product: "trendi",
    kind: "release",
    what: "After an Apple account permission stranded two finished builds for days, build 118 uploaded, processed clean, and installed from TestFlight.",
    why: "For days the testers' build was three releases behind the best one on this machine, and that gap was invisible from the outside. Shipping and delivering are different verbs.",
    next: "Close the clean-state isolation gate — which needs a second real Apple account — before calling any build the release candidate.",
    evidence: [
      {
        claim: "118 was installed from TestFlight",
        source: "TestFlight app page record: Version 0.1.0 (118), release date Jul 19 2026, 90-day expiry",
      },
    ],
  },
  {
    slug: "ykb-comeback-bonus",
    date: "2026-07-17",
    title: "You Know Ball promised a bonus it never paid",
    product: "you-know-ball",
    kind: "defect",
    what: "The +2 comeback bonus — an elite take while trailing big — turned out to be dead code behind a flag that nothing disables, while the result card kept promising it (and quoted the wrong number). Fixed by paying it as an independent modifier, with the copy and the mechanic reading from one constant. Verified on a real device through a save-preserving install: the mid-battle scene state survived the upgrade byte for byte.",
    why: "A promise in the UI is a claim about the system. If the copy and the mechanic can drift apart, the score stops being a score.",
    next: "The fix sits on the unmerged branch with the clutch-finish work; the release step is still a tester group, not more engine.",
    evidence: [
      {
        claim: "The fix is committed",
        source: "banter-bot-content-expansion commit 7fa7873 on feature/content-depth-expansion",
      },
    ],
  },
  {
    slug: "studio-live-payments",
    date: "2026-07-11",
    title: "The studio can take real money",
    product: "studio",
    kind: "milestone",
    what: "Stripe moved from a test sandbox to the live account: a durable webhook endpoint, live keys in production, and the CRM's proposal → deposit flow verified end to end with a real checkout session — tamper and replay checks included.",
    why: "An intake pipeline that ends at “we'll invoice you somehow” isn't a pipeline. The studio can now be paid the moment the work is agreed.",
    next: "Say it plainly on the record: infrastructure that CAN take payment is not a customer. The proof this system is waiting for is a signed engagement, not a webhook.",
    evidence: [
      {
        claim: "The live webhook endpoint exists and processed real events",
        source:
          "Stripe live endpoint we_1TsDzb… at koinophobia.dev/api/stripe/webhook; a real checkout.session.expired was delivered and replay-verified 2026-07-11/12",
      },
    ],
  },
];

/** Newest-first is the file's contract; this just refuses to render a mistake. */
export const orderedLogEntries = [...logEntries].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
);

export const latestLogEntries = (count: number) => orderedLogEntries.slice(0, count);

/** Display name for an entry's surface: a product name, this site, or the studio. */
export const logProductLabel = (entry: LogEntry): string => {
  if (entry.product === "site") return "This site";
  if (entry.product === "studio") return "The studio";
  return getProduct(entry.product)?.name ?? entry.product;
};
