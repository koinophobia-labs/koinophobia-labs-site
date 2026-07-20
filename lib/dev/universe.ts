import { LINKS } from "@/lib/links";

// Single source of truth for the koinophobia.dev product universe.
//
// Rules this file exists to enforce:
//  1. ONE status vocabulary. Before this file, the same product carried three
//     different status labels across /, /now and /resume.
//  2. Reach is a fact, not a mood. `reach` answers one question — who can use
//     this today, without asking Blake for anything?
//  3. `stage` never collapses distinct release states. "Release-ready",
//     "uploaded", and "in a tester's hands" are three different things, and
//     conflating them is how the site started lying the first time.
//  4. NOTHING here may be published without a source. Every product carries
//     `verifiedAt` and `evidence[]`, and tests/dev-universe.test.ts fails the
//     build if either is missing or stale.
//
// Reconciled 2026-07-20 against release artifacts, Apple delivery logs, and
// live HTTP checks. Three claims from the previous pass were provably wrong and
// are corrected below — including one that UNDER-claimed. See docs/
// RELEASE-TRUTH-RECONCILIATION.md for the full audit trail.

export const universeLastUpdated = "July 20, 2026";

/** Who owns keeping these statuses honest. Rendered nowhere; asserted in tests. */
export const statusOwner = "Blake Taylor";

/**
 * How stale a status may be before the test suite fails, BY STAGE.
 *
 * A single window was the wrong shape. Trendi moved through builds 114 → 119 in
 * eight days; a 45-day allowance would have let "uploaded" sit there as an
 * archaeological artifact while CI stayed green. The rule has to be tight where
 * things move fast and loose where they genuinely don't.
 *
 * Read it as: how long can this claim stay true without anyone looking?
 * A product mid-release can change under you in a day. A paused one can't.
 *
 * The policy lives here, next to the stages it governs, so the tests read it
 * rather than re-encode it.
 */
export const STAGE_FRESHNESS_DAYS: Record<Stage, number> = {
  // Actively moving through release. Anything here can be wrong tomorrow.
  "release-candidate": 7,
  uploaded: 7,
  "internal-testers": 7,
  // Real outside users, but changes arrive in batches rather than hourly.
  "external-testers": 14,
  // Live or settled, but still worth re-checking monthly.
  public: 30,
  "internally-validated": 30,
  local: 30,
  // Deliberately dormant. Re-checking weekly would be theatre.
  paused: 90,
  concept: 90,
};

/**
 * Who can use this today, with no help from me.
 *
 * public   — anyone can open it right now.
 * limited  — real outside users, but through an invite or a beta gate.
 * internal — it runs, and so far I'm the only one it runs for.
 */
export type Reach = "public" | "limited" | "internal";

export const reachLabel: Record<Reach, string> = {
  public: "Anyone can use it",
  limited: "Invite / beta only",
  internal: "Runs for me only",
};

/**
 * The release ladder. Deliberately granular: an artifact can be uploaded and
 * accepted by Apple while still being in nobody's hands, and that distinction
 * is the single most common place a status quietly becomes a lie.
 */
export type Stage =
  | "concept"
  | "local"
  | "internally-validated"
  | "release-candidate"
  | "uploaded"
  | "internal-testers"
  | "external-testers"
  | "public"
  | "paused";

export const stageLabel: Record<Stage, string> = {
  concept: "Concept / experiment",
  local: "Local development",
  "internally-validated": "Internally validated",
  "release-candidate": "Release candidate",
  uploaded: "Uploaded, accepted by Apple",
  "internal-testers": "Available to internal testers",
  "external-testers": "Available to external testers",
  public: "Publicly available",
  paused: "Paused",
};

/** Rendering order, low to high. Used to sanity-check claims in tests. */
export const stageRank: Record<Stage, number> = {
  concept: 0,
  paused: 0,
  local: 1,
  "internally-validated": 2,
  "release-candidate": 3,
  uploaded: 4,
  "internal-testers": 5,
  "external-testers": 6,
  public: 7,
};

export type Evidence = {
  /** The specific claim this backs. */
  claim: string;
  /** Where it can be checked. A path, a log, an HTTP response — not a vibe. */
  source: string;
};

export type ProductIdentity = {
  theme: "forge" | "signal" | "arena" | "cave" | "studio";
  register: string;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  identity: ProductIdentity;
  reach: Reach;
  stage: Stage;
  /** One precise sentence. Never a marketing word. */
  status: string;
  /** ISO date the status was last checked against artifacts. */
  verifiedAt: string;
  /** What proves the current status. Rendered on the page. */
  evidence: Evidence[];
  problem: string;
  thesis: string;
  state: string[];
  decisions: Array<{ call: string; why: string }>;
  learned: string;
  actions: Array<{ label: string; href: string; external?: boolean; primary?: boolean }>;
  /** Things that are NOT true yet. Rendered verbatim, on purpose. */
  notYet: string[];
};

export const products: Product[] = [
  {
    slug: "career-forge",
    name: "Career Forge",
    tagline: "The job-search system I needed the week I lost my job.",
    identity: { theme: "forge", register: "Structural · built under pressure" },
    reach: "public",
    stage: "public",
    status:
      "Live on the web, in live commerce mode — a $49 Career Reset link is enabled in production",
    verifiedAt: "2026-07-20",
    evidence: [
      {
        claim: "The site is live and serving",
        source: "HTTP 200 from career-forge-lite.vercel.app, checked 2026-07-20",
      },
      {
        claim: "Production is in live commerce mode, not test mode",
        source:
          "/pricing renders “Founding paid beta · Career Reset only” and “$49”, a string the code emits only when commerceMode === \"live\"",
      },
      {
        claim: "Released build",
        source: "origin/main b1be8b2, tagged v0.10.0-beta.1",
      },
      {
        claim: "Fulfillment could fail silently after payment",
        source:
          "Audit 2026-07-20: live checkout returns a Payment Link and never learns the outcome; the webhook 503s without STRIPE_WEBHOOK_SECRET, which was never provisioned. Fix open as career-forge-lite#28",
      },
    ],
    problem:
      "When my DraftKings role ended I had the same problem everyone in that seat has: a hundred scattered applications, no feedback, and advice too generic to act on. The job search is the highest-stakes project most people ever run, and almost nobody runs it as a project.",
    thesis:
      "A résumé tool that invents experience is worse than no tool. The useful thing is not generation — it's organizing evidence you already have into something a stranger can evaluate in six seconds.",
    state: [
      "Live at career-forge-lite.vercel.app. A stranger can walk in, build a dossier, generate role-specific drafts, and export a real DOCX and ZIP without talking to me.",
      "Released to production on July 19, 2026 (v0.10.0-beta.1) after a readiness sprint: early-win bullets and a lighter first-run profile.",
      "The generation engine is deterministic. There is no model writing your history — every claim traces to something you entered.",
      "Production is in live commerce mode with a working $49 payment link — and an audit on July 20 found the fulfillment path behind it runs entirely in the buyer's browser. Close the tab on the way back from Stripe and the license is never issued, with nothing recording that it happened. A fix that refuses to sell unless the deployment can prove delivery is written and open for review; until it lands, checkout stays closed.",
    ],
    decisions: [
      {
        call: "Deterministic engine, no LLM in the résumé path.",
        why: "A hallucinated job title on a résumé is not a bug you can apologize for later. Giving up fluency to guarantee zero fabrication was the easiest trade I've made.",
      },
      {
        call: "Made the first-run profile shorter, not smarter.",
        why: "People were abandoning at a wall of empty textareas. Nine of them are now optional and collapsed. Completion beats completeness.",
      },
      {
        call: "Kept everything client-side — no accounts, no server-side career data.",
        why: "It's the right call for privacy and it's the reason I know almost nothing about how the product is actually used. I traded my own visibility for the user's, on purpose, and I'd make the trade again while admitting what it costs me.",
      },
      {
        call: "Closed checkout rather than leaving a warning next to a live buy button.",
        why: "The audit found a paying customer could get nothing and leave no trace. A checkout that refuses to open is a bad day; one that charges and delivers nothing is a refund, an apology, and someone's trust. \"No database\" was the right call for career data and I carried it one step too far, into the one place that needed a record.",
      },
    ],
    learned:
      "I built this for myself first, so every feature aimed at someone already motivated, and the hardest problems turned out to be the first ninety seconds rather than the output quality. The sharper lesson came later: I shipped a working payment button and never once asked what happens if the customer's browser doesn't come back.",
    actions: [
      { label: "Open Career Forge", href: LINKS.careerForge, external: true, primary: true },
    ],
    notYet: [
      "I cannot tell you whether anyone has ever paid. There is no order database by design, so the only system that knows is Stripe, and I have not reconciled it. Treat “paying customers” as unestablished in both directions.",
      "Worse: until the July 20 fix lands, I could not have told you whether a payment failed to deliver either. Nothing logged it.",
      "I have collected zero beta feedback. It saves to the tester's own browser and never reaches me — a design decision I did not think through.",
      "No confirmed job outcome. Nobody has told me this got them hired.",
      "Lane suggestions still come from a fixed library, so an operations résumé gets tech-pivot lanes it didn't ask for. Known defect, not yet fixed.",
    ],
  },
  {
    slug: "trendi",
    name: "Trendi",
    tagline: "The gap between having an idea and pressing record.",
    identity: { theme: "signal", register: "Kinetic · spoken out loud" },
    reach: "limited",
    stage: "internal-testers",
    status: "Build 118 is on TestFlight and installed internally. No external testers yet",
    verifiedAt: "2026-07-20",
    evidence: [
      {
        claim: "Build 118 uploaded, processed, and installed from TestFlight",
        source:
          "TestFlight app page screenshot showing Version 0.1.0 (118), release date Jul 19 2026, 90-day expiry, with an Open button",
      },
      {
        claim: "Builds 114–119 exist as archives",
        source: "~/Library/Developer/Xcode/Archives/2026-07-{12,17,19}/Trendi-0.1.0-1*.xcarchive",
      },
      {
        claim: "The data-isolation gate is incomplete",
        source:
          "PENDING-beta-user-handoff.md — “Status: PENDING — User B unavailable”, cross-user rows all read “Not run”",
      },
    ],
    problem:
      "Most creators don't run out of ideas. They stall in the ninety seconds between having one and pressing record, because a thought in your head is not the same thing as words you can say on camera. I watched people abandon good ideas at exactly that gap, including me.",
    thesis:
      "Nobody needs another script generator. They need the specific sentence to open with. A coach in your pocket, not a script mill.",
    state: [
      "An iOS app in SwiftUI. You type the messy thought; it hands back hooks, a recordable script, a caption, and a simple shot plan.",
      "Build 118 was uploaded to App Store Connect, imported clean, and is installed from TestFlight on my own device. That makes it available to internal testers — which today means me.",
      "Build 119 already exists: an isolation-hardened release candidate, archived and validated. It has never been uploaded, and its three commits exist only on this machine.",
      "The clean-state data-isolation gate is unfinished. The User A leg passed all seventeen steps it could run; step eighteen needed a second, genuinely different Apple account on the test phone, and there wasn't one. No cross-user conclusion is possible until that runs.",
      "The newer generation pipeline is still switched off — builds 117, 118 and 119 all ship with the V1 client.",
    ],
    decisions: [
      {
        call: "Turned the newer generation pipeline back off before shipping.",
        why: "V2 wrote better copy and broke written-mode, leaked a default that assumed one platform, and rejected legitimate stories at the claims gate. A better sentence isn't worth a worse product.",
      },
      {
        call: "Refused to call 118 the internal release candidate.",
        why: "It's uploaded, it's installed, and it still isn't signed off, because the cross-user half of the isolation test never ran. An untested isolation boundary is exactly the kind of thing that looks fine until it very much isn't.",
      },
      {
        call: "Kept it iOS-only and unpublished.",
        why: "It is easier to learn from ten creators who can reach me than from a public listing I can't support.",
      },
    ],
    learned:
      "Shipping and delivering are different verbs, and I learned it the expensive way — with a finished build sitting behind an account permission for days. What I'd add now is that finishing the upload didn't finish the job either: 118 is in TestFlight and still isn't cleared, because the last gate needs a second person, not more code.",
    actions: [
      { label: "Read the full Trendi story", href: "/trendi", primary: true },
      { label: "Ask for beta access", href: LINKS.email },
    ],
    notYet: [
      "Not on the App Store, and not submitted for review.",
      "No external testers. The only device it has ever run on through TestFlight is mine.",
      "Data isolation between two users is unproven — the second half of that test has never been run.",
      "Build 119, the isolation-hardened candidate, is not uploaded and not backed up anywhere but this Mac.",
    ],
  },
  {
    slug: "you-know-ball",
    name: "You Know Ball",
    tagline: "Sports takes, scored honestly, by something that actually watches.",
    identity: { theme: "arena", register: "Scoreboard · argue and defend" },
    reach: "public",
    stage: "uploaded",
    status:
      "Web demo is public. Builds 26 and 27 were accepted by Apple, but reached no tester",
    verifiedAt: "2026-07-20",
    evidence: [
      {
        claim: "Builds 26 and 27 were accepted by App Store Connect",
        source:
          "Apple's own 409 responses: the 2026-07-16 upload log reports previousBundleVersion 26, and the 2026-07-19 log reports 27 — Apple naming builds it had already accepted",
      },
      {
        claim: "No delivery receipt or tester assignment survives",
        source:
          "No success log, no App Store Connect record on this machine; processing state and group assignment unverified",
      },
      {
        claim: "The iOS work is unmerged and unbacked-up",
        source: "banter-bot-content-expansion has no git remote configured; main sits at cf74ac4",
      },
    ],
    problem:
      "Sports takes are the most passionate opinions most people hold, and they evaporate into group-chat noise within an hour. Nobody keeps score. Nobody has to defend anything. The most fun argument you had this week left no trace.",
    thesis:
      "The fun isn't in being told you're right. It's in being made to defend a position by something that knows ball and doesn't flatter you. No participation trophies.",
    state: [
      "The web demo is playable right now, in a browser, with no account. Drop a take, the debate engine counters, your argument gets a transparent score.",
      "The engine is deterministic and mechanically neutral across five sports — no model deciding who wins, and a score a player can reconstruct.",
      "On iOS, builds 26 and 27 were uploaded and accepted by App Store Connect. I never confirmed they finished processing, never assigned them to a tester group, and nobody has installed either one.",
      "None of the recent engine work is merged to main, and the repository has no remote — it exists on this machine and nowhere else.",
    ],
    decisions: [
      {
        call: "Made the engine deterministic instead of generative.",
        why: "A scoring system you can't audit isn't a score, it's a vibe. If a player can't reconstruct why they lost, they stop caring about winning.",
      },
      {
        call: "Tuned it until blind play loses badly.",
        why: "Early on, someone who knew nothing could win often enough that the score wasn't measuring anything. Closing that gap is the whole product, and it's the work I'm proudest of and least able to show you.",
      },
      {
        call: "Betting guardrails from day one.",
        why: "I spent three years in sportsbook operations. I know exactly which sentence turns a game into something I don't want to have built.",
      },
    ],
    learned:
      "I uploaded two builds to Apple and then never took the last step of putting either in front of a person — and until I went looking for evidence, I'd have told you confidently that nothing had ever been uploaded at all. Not knowing the state of your own release is its own kind of failure.",
    actions: [
      { label: "Play the web demo", href: "/you-know-ball/play", primary: true },
      { label: "Open the standalone build", href: LINKS.ykbDemo, external: true },
    ],
    notYet: [
      "Never confirmed past Apple's processing step, and never assigned to a tester group.",
      "Not submitted to the App Store.",
      "No outside player has installed the iOS build. Confirmed testers: zero.",
      "The engine numbers I'd want to quote here — cohort win rates, tournament results — I can't currently point at an artifact for, so I'm not quoting them.",
    ],
  },
  {
    slug: "koi-cave",
    name: "Koi Cave",
    tagline: "A private operator brain that never leaves the machine.",
    identity: { theme: "cave", register: "Quiet · local-first, unlisted" },
    reach: "internal",
    stage: "internally-validated",
    status: "Internal build — dev-signed and un-notarized, so it cannot run on another Mac",
    verifiedAt: "2026-07-20",
    evidence: [
      {
        claim: "Not distributable to anyone",
        source:
          "codesign shows “Apple Development: BLAKE JIHAD TAYLOR”; spctl -a returns rejected; stapler reports no ticket",
      },
      {
        claim: "The installed app is current, not stale",
        source: "~/Applications/Koi Cave.app binary stamped Jul 13 2026, built from HEAD 350269a",
      },
      {
        claim: "Certified with limitations, and the mail path never ran",
        source:
          "MORNING_FOUNDER_BRIEF_CERTIFICATION_REPORT.md; gmail-oauth-config.json holds a clientID and no tokens",
      },
    ],
    problem:
      "Every tool that promises to organize your work wants your work on its servers, on a subscription, forever. I wanted the leverage without renting my own context back from someone else.",
    thesis:
      "Personal infrastructure beats personal productivity apps. If the thing that knows the most about how I work is owned by a company, that's a dependency, not leverage.",
    state: [
      "A macOS app: notes, tasks, memory, and automations, running local-first.",
      "The morning founder brief is certified with limitations — it survived every failure drill I could design, including corrupt caches, malformed events, and a disconnected mail provider.",
      "It is signed with a development certificate and not notarized, which means Gatekeeper rejects it on any Mac but this one. There is nothing to hand anyone even if I wanted to.",
      "One known truth bug remains: items waiting on me for more than 72 hours drop out of the brief while it reports no urgent signal. That's the exact failure mode a brief exists to prevent.",
      "The mail integration has never completed a real sync. The stored config holds a client ID and no tokens, so every brief it has ever produced was built from local state.",
    ],
    decisions: [
      {
        call: "Local-first, with no hosted fallback.",
        why: "The moment there's a sync server, the privacy claim becomes a policy instead of an architecture.",
      },
      {
        call: "Certified it with the limitations written down instead of fixing them first.",
        why: "A known, documented failure is safer than an undocumented one. The report says what it doesn't do.",
      },
      {
        call: "Kept it off every public surface.",
        why: "It has no users, no URL, and no store presence. Putting it on a product page would be inventory-padding, and this site doesn't do that.",
      },
    ],
    learned:
      "I certified a feature against every failure I could imagine and never connected the one integration that would have made it real. The drills tested how it behaves when the data is missing, which turns out to be the only state I've ever actually run it in.",
    actions: [],
    notYet: [
      "No public build, no download, no waitlist. There is nothing to try.",
      "Never notarized, so it cannot be installed by anyone else even privately.",
      "The live mail integration has never completed a sync, so the feature has never run against real data.",
      "It is a case study in how I build, not a product I'm offering.",
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export type FreshnessResult = {
  product: string;
  stage: Stage;
  verifiedAt: string;
  ageDays: number;
  allowedDays: number;
  fresh: boolean;
  /** Names the product, the stage, the dates, and what to actually do. */
  message: string;
};

/**
 * Evaluate one product against its stage's freshness budget.
 *
 * Deliberately returns a result rather than refreshing anything. A verification
 * date may only move after a human has looked at evidence — a function that
 * auto-bumped it would convert this whole system back into decoration.
 */
export function checkFreshness(product: Product, now: number = Date.now()): FreshnessResult {
  const allowedDays = STAGE_FRESHNESS_DAYS[product.stage];
  const ageDays = Math.floor((now - Date.parse(product.verifiedAt)) / 86_400_000);
  const fresh = ageDays <= allowedDays;

  return {
    product: product.name,
    stage: product.stage,
    verifiedAt: product.verifiedAt,
    ageDays,
    allowedDays,
    fresh,
    message: fresh
      ? `${product.name} — stage "${product.stage}" verified ${product.verifiedAt} (${ageDays}d old, limit ${allowedDays}d).`
      : [
          `STALE STATUS: ${product.name}`,
          `  stage:        ${product.stage} (${stageLabel[product.stage]})`,
          `  verified at:  ${product.verifiedAt} — ${ageDays} days ago`,
          `  allowed age:  ${allowedDays} days for this stage`,
          `  what to do:   re-check ${product.name} against release artifacts`,
          `                (archives, Apple delivery logs, live HTTP, signing),`,
          `                update status/evidence if it moved, then set`,
          `                verifiedAt to today in lib/dev/universe.ts.`,
          `  do NOT just bump the date — the date is a claim that someone looked.`,
        ].join("\n"),
  };
}

export const staleProducts = (now: number = Date.now()) =>
  products.map((p) => checkFreshness(p, now)).filter((r) => !r.fresh);

/**
 * You Know Ball is the only product whose page carries a scoreboard, because
 * it's the only one whose thesis is a number. These are release facts rather
 * than gameplay statistics — every one is checkable, which the engine numbers
 * currently are not.
 */
export const arenaScoreboard = [
  { label: "Builds Apple accepted", value: "2" },
  { label: "Reached a tester", value: "0" },
  { label: "Outside players", value: "0" },
  { label: "App Store review", value: "None" },
];

/**
 * The studio is deliberately NOT in `products`. It is not something to try —
 * it's something to hire, and it lives on its own domain.
 */
export const studio = {
  name: "Koinophobia Labs",
  tagline: "The same operating idea, pointed at other people's businesses.",
  body: "Small businesses leak time and revenue through the exact friction I build against everywhere else — unclear sites, messy intake, follow-up that lives in someone's memory. The studio is where I do that work for clients, and it has its own front door.",
  href: LINKS.labs,
};
