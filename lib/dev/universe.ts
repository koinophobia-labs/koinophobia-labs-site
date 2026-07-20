import { LINKS } from "@/lib/links";

// Single source of truth for the koinophobia.dev product universe.
//
// Rules this file exists to enforce:
//  1. ONE status vocabulary. Before this file, the same product carried three
//     different status labels across /, /now and /resume. A site whose stated
//     principle is "honest software" cannot contradict itself about what is
//     shipped.
//  2. Reach is a fact, not a mood. `reach` answers one question — who can use
//     this today, without asking Blake for anything? Everything else is
//     narrative.
//  3. No claim here may outrun what actually exists. If a build is not in a
//     tester's hands, this file does not say it is.
//
// Bump `universeLastUpdated` by hand whenever a status changes. Never a runtime
// date — a date that moves on its own is not evidence of anything.

export const universeLastUpdated = "July 20, 2026";

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

export type ProductIdentity = {
  /** Drives the per-product accent theme in dev-product.css. */
  theme: "forge" | "signal" | "arena" | "cave" | "studio";
  /** One line of visual intent, used as the page's mono kicker. */
  register: string;
};

export type Product = {
  slug: string;
  name: string;
  /** The one-line version. No feature lists. */
  tagline: string;
  identity: ProductIdentity;
  reach: Reach;
  /** Precise, specific status. Never a marketing word. */
  status: string;
  /** The human problem, told as something Blake watched happen. */
  problem: string;
  /** The opinion the product is an argument for. */
  thesis: string;
  /** Where it genuinely is, including what is blocked and why. */
  state: string[];
  /** Decisions and tradeoffs — the interesting part. */
  decisions: Array<{ call: string; why: string }>;
  /** What building it changed his mind about. */
  learned: string;
  /** Only links that actually work for a stranger. */
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
    status: "Public beta — live on the web, free to finish end to end",
    problem:
      "When my DraftKings role ended I had the same problem everyone in that seat has: a hundred scattered applications, no feedback, and advice too generic to act on. The job search is the highest-stakes project most people ever run, and almost nobody runs it as a project.",
    thesis:
      "A résumé tool that invents experience is worse than no tool. The useful thing is not generation — it's organizing evidence you already have into something a stranger can evaluate in six seconds.",
    state: [
      "Live at career-forge-lite.vercel.app. A stranger can walk in, build a dossier, generate role-specific drafts, and export a real DOCX and ZIP without talking to me.",
      "Released to production on July 19, 2026 (v0.10.0-beta.1) after a readiness sprint: early-win bullets, a lighter first-run profile, and in-product feedback capture.",
      "The generation engine is deterministic. There is no model writing your history — every claim traces to something you entered.",
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
        call: "Shipped an 'early win' before asking for real work.",
        why: "The product has to prove itself before it asks you to type for twenty minutes.",
      },
    ],
    learned:
      "I built this for myself first, which meant every feature was aimed at someone already motivated. The hardest problems turned out to be the first ninety seconds — not the output quality.",
    actions: [
      { label: "Open Career Forge", href: LINKS.careerForge, external: true, primary: true },
    ],
    notYet: [
      "No confirmed paying users. The paid tier exists as a hypothesis, not as revenue.",
      "The checkout path has never been verified end to end — it fail-closes rather than charging anyone.",
      "Lane suggestions still come from a fixed library, so an operations résumé gets tech-pivot lanes it didn't ask for. Known defect, not yet fixed.",
    ],
  },
  {
    slug: "trendi",
    name: "Trendi",
    tagline: "The gap between having an idea and pressing record.",
    identity: { theme: "signal", register: "Kinetic · spoken out loud" },
    reach: "limited",
    status: "iOS TestFlight beta — testers are on build 114",
    problem:
      "Most creators don't run out of ideas. They stall in the ninety seconds between having one and pressing record, because a thought in your head is not the same thing as words you can say on camera. I watched people abandon good ideas at exactly that gap, including me.",
    thesis:
      "Nobody needs another script generator. They need the specific sentence to open with. A coach in your pocket, not a script mill.",
    state: [
      "An iOS app in SwiftUI. You type the messy thought; it hands back hooks, a recordable script, a caption, and a simple shot plan.",
      "TestFlight testers are currently on build 114. Builds 115 and 116 are archived, validated, and reproducible from a clean checkout — but not uploaded.",
      "The upload is blocked on an Apple account problem, not a code problem: the signing account lost App Store Connect access for the team. It needs Blake at a keyboard with 2FA, and no amount of engineering fixes it.",
      "Build 116 passes its full suite — 883 tests, zero failures — and carries three P1 fixes testers have not received yet.",
    ],
    decisions: [
      {
        call: "Turned the newer generation pipeline back off before shipping 116.",
        why: "V2 wrote better copy and broke written-mode, leaked a default that assumed one platform, and rejected legitimate stories at the claims gate. A better sentence isn't worth a worse product. It serves V1 to everyone until that cluster is fixed.",
      },
      {
        call: "Built a claims gate that refuses to write things you can't back up.",
        why: "The fastest way to get a creator in trouble is to hand them a confident sentence about a result they never got.",
      },
      {
        call: "Kept it iOS-only and unpublished.",
        why: "It is easier to learn from ten creators who can reach me than from a public listing I can't support.",
      },
    ],
    learned:
      "Shipping and delivering are different verbs. I have a validated build that is better than the one people are using, and it has been stuck behind an account permission for days. Release infrastructure is part of the product, and I learned that the expensive way.",
    actions: [
      { label: "Read the full Trendi story", href: "/trendi", primary: true },
      { label: "Ask for beta access", href: LINKS.email },
    ],
    notYet: [
      "Not on the App Store, and not submitted for review.",
      "Testers are two builds behind the work that's finished.",
      "No paid tier, and no evidence yet of creators returning week over week.",
    ],
  },
  {
    slug: "you-know-ball",
    name: "You Know Ball",
    tagline: "Sports takes, scored honestly, by something that actually watches.",
    identity: { theme: "arena", register: "Scoreboard · argue and defend" },
    reach: "public",
    status: "Playable web demo — iOS build runs on one phone, mine",
    problem:
      "Sports takes are the most passionate opinions most people hold, and they evaporate into group-chat noise within an hour. Nobody keeps score. Nobody has to defend anything. The most fun argument you had this week left no trace.",
    thesis:
      "The fun isn't in being told you're right. It's in being made to defend a position by something that knows ball and doesn't flatter you. No participation trophies.",
    state: [
      "The web demo is playable right now, in a browser, with no account. Drop a take, the debate engine counters, your argument gets a transparent score.",
      "The engine is deterministic and mechanically neutral across five sports — 460 topics, five personalities, no model deciding who wins.",
      "Verified across 4,500 simulated games: a blind-play cohort wins about 2.4% of the time, an expert cohort 100%. That gap is the whole product — the score has to mean something.",
      "The iOS build (0.1.0, build 27) runs on my phone and nowhere else.",
    ],
    decisions: [
      {
        call: "Made the engine deterministic instead of generative.",
        why: "A scoring system you can't audit isn't a score, it's a vibe. If a player can't reconstruct why they lost, they stop caring about winning.",
      },
      {
        call: "Tuned it until blind play loses badly.",
        why: "Early on, someone who knew nothing could win a quarter of the time. That number is the honesty of the whole game, and I chased it from 16–27% down to under 5%.",
      },
      {
        call: "Betting guardrails from day one.",
        why: "I spent three years in sportsbook operations. I know exactly which sentence turns a game into something I don't want to have built.",
      },
    ],
    learned:
      "I built a scoring system before I had players, which meant I spent months optimizing a number nobody had complained about. The engine got genuinely good. The thing I still haven't proven is whether anyone comes back tomorrow.",
    actions: [
      { label: "Play the web demo", href: "/you-know-ball/play", primary: true },
      { label: "Open the standalone build", href: LINKS.ykbDemo, external: true },
    ],
    notYet: [
      "Never been on TestFlight. No outside player has ever installed the iOS build.",
      "Not submitted to the App Store.",
      "The only playtesting so far is mine and simulated. No evidence yet that real players return.",
    ],
  },
  {
    slug: "koi-cave",
    name: "Koi Cave",
    tagline: "A private operator brain that never leaves the machine.",
    identity: { theme: "cave", register: "Quiet · local-first, unlisted" },
    reach: "internal",
    status: "Internal build — not public, not distributed, no users but me",
    problem:
      "Every tool that promises to organize your work wants your work on its servers, on a subscription, forever. I wanted the leverage without renting my own context back from someone else.",
    thesis:
      "Personal infrastructure beats personal productivity apps. If the thing that knows the most about how I work is owned by a company, that's a dependency, not leverage.",
    state: [
      "A macOS app: notes, tasks, memory, and automations, running local-first. 1,269 tests green.",
      "The morning founder brief is certified with limitations — it survived every failure drill I could design, including corrupt caches, malformed events, and a disconnected mail provider.",
      "The build installed on my own machine predates the feature I just certified. The certified version isn't the one I use every morning yet.",
      "One known truth bug: items waiting on me for more than 72 hours drop out of the brief while it reports no urgent signal. That's the exact failure mode a brief exists to prevent.",
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
      "Certifying something is not the same as running it. I proved a feature worked and then didn't install it on my own laptop for weeks — which tells you the certification was for the report, not for me.",
    actions: [],
    notYet: [
      "No public build, no download, no waitlist. There is nothing to try.",
      "The live mail integration has never completed a real sync.",
      "It is a case study in how I build, not a product I'm offering.",
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/**
 * The studio is deliberately NOT in `products`. It is not something to try —
 * it's something to hire, and it lives on its own domain. Keeping it out of the
 * product list is the whole point of having two sites.
 */
export const studio = {
  name: "Koinophobia Labs",
  tagline: "The same operating idea, pointed at other people's businesses.",
  body: "Small businesses leak time and revenue through the exact friction I build against everywhere else — unclear sites, messy intake, follow-up that lives in someone's memory. The studio is where I do that work for clients, and it has its own front door.",
  href: LINKS.labs,
};
