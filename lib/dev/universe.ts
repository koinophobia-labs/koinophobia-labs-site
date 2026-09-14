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
// live HTTP checks (see docs/RELEASE-TRUTH-RECONCILIATION.md for that audit
// trail). Re-verified 2026-07-26 for the Founder OS pass: Trendi moved to
// build 122, Career Forge grew a durable order store behind its closed
// checkout, Koi Cave's operator loop produced its first proof-checked receipt,
// and the front office joined the universe as a product in its own right.
// Refreshed 2026-08-13 for the Trendi release pass: build 132 became the
// certified free-launch candidate, while You Know Ball's historical Apple
// acceptance was preserved without guessing at its current distribution state.

export const universeLastUpdated = "September 13, 2026";

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

/**
 * The coarse, at-a-glance grouping over the fine ladder. Cards wear the family
 * chip; product pages print the precise stage beside it. The fine ladder stays
 * the source of truth — the family is a display projection, never a field a
 * product sets by hand (that would reopen the door to optimistic rounding).
 *
 * "archived" joins the day something is actually archived. An enum value with
 * no member is decoration.
 */
export type StageFamily = "exploring" | "building" | "testing" | "live" | "paused";

export const stageFamily: Record<Stage, StageFamily> = {
  concept: "exploring",
  local: "building",
  "internally-validated": "building",
  "release-candidate": "testing",
  uploaded: "testing",
  "internal-testers": "testing",
  "external-testers": "testing",
  public: "live",
  paused: "paused",
};

export const stageFamilyLabel: Record<StageFamily, string> = {
  exploring: "Exploring",
  building: "Building",
  testing: "Testing",
  live: "Live",
  paused: "Paused",
};

export type Evidence = {
  /** The specific claim this backs. */
  claim: string;
  /** Where it can be checked. A path, a log, an HTTP response — not a vibe. */
  source: string;
};

export type ProductIdentity = {
  theme: "forge" | "signal" | "arena" | "cave" | "studio" | "memory" | "school" | "model" | "keeper";
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
    name: "Way In",
    tagline: "The job-search system I needed the week I lost my job.",
    identity: { theme: "forge", register: "Structural · built under pressure" },
    reach: "public",
    stage: "public",
    status: "Way In is available on the App Store for iPhone and iPad, version 1.0. The legacy Career Forge web destination now also displays Way In",
    verifiedAt: "2026-09-10",
    evidence: [
      { claim: "Public iPhone and iPad release", source: "https://apps.apple.com/us/app/way-in-career-hub/id6807942376 — public US listing and Apple Lookup API, checked 2026-09-10" },
      { claim: "Legacy web destination remains available under the Way In name", source: "https://career-forge-lite.vercel.app — HTTP 200 and Way In branding, checked 2026-09-10" },
    ],
    problem:
      "When my DraftKings role ended I had the same problem everyone in that seat has: a hundred scattered applications, no feedback, and advice too generic to act on. The job search is the highest-stakes project most people ever run, and almost nobody runs it as a project.",
    thesis:
      "A résumé tool that invents experience is worse than no tool. The useful thing is not generation — it's organizing evidence you already have into something a stranger can evaluate in six seconds.",
    state: [
      "Career Forge is now named Way In. The original web destination still works; the native iPhone and iPad app has a separately verified public App Store listing.",
      "Build a Career Profile from approved facts, review resumes and job fit, prepare for interviews, and track applications and follow-ups.",
      "Free iOS access includes resume review and job-fit analysis. Optional App Store purchases unlock export, tailoring, interview preparation, and planning. The 30-Day Career Pass does not auto-renew.",
      "The July 2026 checkout closure and certification decisions below are development history, not a statement about today's web checkout. Current web offers are shown by the web product itself.",
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
        why: "The audit found a paying customer could get nothing and leave no trace. A checkout that refuses to open is a bad day; one that charges and delivers nothing is a refund, an apology, and someone's trust.",
      },
      {
        call: "Pinned the sales authorization to a commit hash.",
        why: "An approval that survives unrelated deploys isn't an approval, it's a permission slip that never expires. Every merge re-closes the store until a human re-certifies the journey on the code that's actually running.",
      },
    ],
    learned:
      "I built this for myself first, so every feature aimed at someone already motivated, and the hardest problems turned out to be the first ninety seconds rather than the output quality. The sharper lesson came later: I shipped a working payment button and never once asked what happens if the customer's browser doesn't come back.",
    actions: [
      { label: "Explore Way In for iPhone & iPad", href: "https://koinophobialabs.com/way-in", external: true, primary: true },
      { label: "Open Way In web (formerly Career Forge)", href: LINKS.careerForge, external: true },
    ],
    notYet: [
      "Way In does not apply to jobs for you or guarantee interviews or offers.",
      "Website clicks do not establish installs, paid purchases, or job outcomes; those measures have not been reconciled here.",
    ],
  },
  {
    slug: "trendi",
    name: "Trendi",
    tagline: "The gap between having an idea and pressing record.",
    identity: { theme: "signal", register: "Kinetic · spoken out loud" },
    reach: "public",
    stage: "public",
    status: "Available on the App Store for iPhone: version 0.2.1, iOS 17.0 or later. Free with optional Trendi Pro",
    verifiedAt: "2026-09-10",
    evidence: [{ claim: "Public release, compatibility, Free and Pro allowances", source: "https://apps.apple.com/us/app/trendi-content-coach/id6776299336 — public US listing and Apple Lookup API, checked 2026-09-10" }],
    problem:
      "Most creators don't run out of ideas. They stall in the ninety seconds between having one and pressing record, because a thought in your head is not the same thing as words you can say on camera. I watched people abandon good ideas at exactly that gap, including me.",
    thesis:
      "Nobody needs another script generator. They need the specific sentence to open with. A coach in your pocket, not a script mill.",
    state: [
      "Type or speak a rough thought to get an angle, three hooks, an editable script, a caption, and a simple shot plan.",
      "Record section by section or as a full script with the teleprompter. Keep ideas and drafts in the on-device Vault.",
      "Free includes three successful Coach Packs per weekly allowance period. Optional monthly Pro provides 100 Coach Packs each month. The editor, saved work, and teleprompter stay available on Free.",
      "The July 2026 TestFlight story remains in the dated build log; Trendi reached the public App Store on August 28, 2026.",
    ],
    decisions: [
      {
        call: "Turned the newer generation pipeline back off before shipping.",
        why: "V2 wrote better copy and broke written-mode, leaked a default that assumed one platform, and rejected legitimate stories at the claims gate. A better sentence isn't worth a worse product.",
      },
      {
        call: "Count a gate as passed only when it runs on the phone.",
        why: "The simulator suite was green for weeks while the first hours on real hardware found two shipping defects. The simulator votes; the device decides.",
      },
      {
        call: "Started with a small iPhone testing group in July 2026.",
        why: "That early testing period helped expose recording defects before the public release.",
      },
    ],
    learned:
      "Shipping and delivering are different verbs, and I learned it the expensive way — with a finished build sitting behind an account permission for days. The newer lesson is that even my own evidence expires: I retired a whole theory about how builds reached my phone after reading one CLI flag's documentation, because the app inventory I'd trusted turned out to be filtered.",
    actions: [{ label: "Explore Trendi, Free & Pro", href: "https://koinophobialabs.com/trendi", external: true, primary: true }],
    notYet: ["No automatic posting, scheduling, or social-account connections.", "No guaranteed views, followers, revenue, or audience growth."],
  },
  {
    slug: "forget-about-it",
    name: "Forget About It",
    tagline: "Keep the thought before it slips away.",
    identity: { theme: "memory", register: "Personal · kept on your devices" },
    reach: "public",
    stage: "public",
    status: "Available on the App Store, version 1.0. Free for iPhone with an Apple Watch companion; works offline",
    verifiedAt: "2026-09-10",
    evidence: [{ claim: "Public release, devices, and journal features", source: "https://apps.apple.com/us/app/forgetaboutit/id6804360983 — public US listing and Apple Lookup API, checked 2026-09-10" }],
    problem: "A thought can disappear before you reach somewhere to write it down. The fragments you do save can be just as hard to find again.",
    thesis: "Make capture quick enough for the moment, then let the day become something you can read back.",
    state: ["Capture by text or speech on iPhone, or speak, scribble, or type on Apple Watch.", "Watch captures queue offline and sync when your iPhone reconnects. Your words stay separate from the app's interpretation.", "The app has no account, analytics, or server. The journal stays on your devices and can be exported from Settings."],
    decisions: [{ call: "Preserve the original words.", why: "The app's reading of a day belongs beside the captures, without replacing them." }, { call: "Keep the journal on device.", why: "Private memories should not need an account or a server to be useful." }],
    learned: "Fast capture only helps when you can return to what you kept. Both ends of that path matter.",
    actions: [{ label: "Explore Forget About It", href: "https://koinophobialabs.com/forget-about-it", external: true, primary: true }],
    notYet: ["No cloud account or server recovery of a journal.", "The journal is excluded from backups; save your own copy from Settings."],
  },
  {
    slug: "you-know-ball",
    name: "You Know Ball",
    tagline: "Sports takes, scored honestly, by something that actually watches.",
    identity: { theme: "arena", register: "Scoreboard · argue and defend" },
    reach: "public",
    stage: "uploaded",
    status:
      "Public web demo. Apple's July 2026 upload responses prove iOS builds 26 and 27 were accepted; current processing, tester assignment and distribution are unverified",
    verifiedAt: "2026-09-10",
    evidence: [
      { claim: "The public web demo responds; native distribution remains unverified", source: "https://you-know-ball-orpin.vercel.app — HTTP 200, checked 2026-09-10. The Apple acceptance records below are explicitly July 2026 history, not current distribution receipts." },
      {
        claim: "Builds 26 and 27 were accepted by App Store Connect",
        source:
          "Apple's own 409 responses: the 2026-07-16 upload log reports previousBundleVersion 26, and the 2026-07-19 log reports 27 — Apple naming builds it had already accepted",
      },
      {
        claim: "The public web demo is still live",
        source:
          "HTTP 200 from https://you-know-ball-orpin.vercel.app, checked 2026-08-13",
      },
      {
        claim: "Current Apple-side distribution state is unverified",
        source:
          "No authenticated App Store Connect query, current processing receipt, beta-group record or tester record was available during the 2026-08-13 evidence refresh; do not infer zero testers",
      },
      {
        claim: "Build 27 runs on my own phone with its save intact",
        source:
          "devicectl reports 0.1.0 (27) installed; the pre-install container backup and post-install diff were byte-identical (2026-07-17 session record)",
      },
    ],
    problem:
      "Sports takes are the most passionate opinions most people hold, and they evaporate into group-chat noise within an hour. Nobody keeps score. Nobody has to defend anything. The most fun argument you had this week left no trace.",
    thesis:
      "The fun isn't in being told you're right. It's in being made to defend a position by something that knows ball and doesn't flatter you. No participation trophies.",
    state: [
      "The web demo is playable right now, in a browser, with no account. Drop a take, the debate engine counters, your argument gets a transparent score.",
      "The engine is deterministic and mechanically neutral across five sports — no model deciding who wins, and a score a player can reconstruct.",
      "On iOS, builds 26 and 27 were uploaded and accepted by App Store Connect. Their current processing, tester-assignment and distribution state was not independently re-verified on August 13.",
      "Build 27 does run on my own phone — through a save-preserving developer install, which is how I caught the engine promising a comeback bonus it never actually paid. That's fixed, along with clutch-time framing for final possessions, on the unmerged branch.",
      "At the July 26 check, the recent engine work was unmerged to main and its working repository had no remote; the August 13 distribution refresh did not treat local source state as Apple-side evidence.",
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
      "I uploaded two builds to Apple without preserving a durable record of what happened after acceptance — and until I went looking for evidence, I'd have told you confidently that nothing had ever been uploaded at all. Not knowing the state of your own release is its own kind of failure.",
    actions: [
      { label: "Play the web demo", href: "/you-know-ball/play", primary: true },
      { label: "Open the standalone build", href: LINKS.ykbDemo, external: true },
    ],
    notYet: [
      "Current App Store Connect processing and tester assignment are unverified; no current receipt or beta-group record was available in the August 13 evidence refresh.",
      "A current public iOS release has not been verified here.",
      "No current external-tester or install record was available; do not infer either zero testers or successful distribution.",
      "The engine numbers I'd want to quote here — cohort win rates, tournament results — I can't currently point at an artifact for, so I'm not quoting them.",
    ],
  },
  {
    slug: "concierge",
    name: "Labs Concierge",
    tagline: "An AI front desk that would rather refuse than guess.",
    identity: { theme: "studio", register: "Structured · consent-gated" },
    reach: "public",
    stage: "public",
    status:
      "Available on both sites as the koi front office, with an existing studio inquiry path",
    verifiedAt: "2026-09-10",
    evidence: [
      { claim: "Public concierge and founder front-office entry points are available", source: "https://koinophobialabs.com/concierge and https://koinophobia.dev — HTTP 200 and public entry points checked 2026-09-10. Historical implementation evidence follows." },
      {
        claim: "The front office leads the studio's concierge page",
        source:
          "SSR fetch of koinophobialabs.com/concierge renders the concierge-page hero, checked 2026-07-26",
      },
      {
        claim: "Shipped to production through reviewed PRs",
        source:
          "koinophobia-labs-site PRs #35–#39, merged 2026-07-20/21 with production deploys verified from those exact SHAs",
      },
      {
        claim: "The ease-of-use audit and its fixes are on the record",
        source:
          "2026-07-21 audit scored the first release 63/100 across ten visitor journeys; all nine defects closed in PR #39 (docs/FRONT_OFFICE.md)",
      },
    ],
    problem:
      "Every business front door forces a bad choice: a dead form that flattens a messy situation into dropdown fields, or a chat widget that cheerfully improvises answers it has no right to give. My studio needed a front door too, and I wasn't willing to ship either.",
    thesis:
      "An assistant at the front desk should extract, clarify, and route — never invent. Deterministic understanding first, one question at a time, and nothing leaves the page until the visitor says send.",
    state: [
      "Runs on both domains as the koi companion's front office: a messy first message becomes clarifying questions, then a structured brief the visitor can edit, then an honest recommendation.",
      "On the studio site it fills the exact same intake pipeline as the form — no shadow schema, no second lead system. On this site it collects no contact information at all, and hands hire-intent to the studio with the context carried over.",
      "It refuses honestly. A budget that doesn't fit is told a smaller or outside solution is the better call, and a question the site's own data can't answer gets a clarification instead of a guess.",
      "Days after shipping it, I audited it like a stranger and scored it 63 out of 100 — the front door was hidden behind an unlabeled fish. Nine fixes later, every existing help CTA opens it directly and the koi wears a label.",
    ],
    decisions: [
      {
        call: "Deterministic extraction before any conversation.",
        why: "A front desk that misremembers your budget is worse than a form. The understanding layer is code I can test, not vibes I can prompt.",
      },
      {
        call: "Zero network calls before consent.",
        why: "Nothing is created, scored, or sent until the visitor reviews the brief and says so. An abandoned conversation leaves no trace — which is the point.",
      },
      {
        call: "Typing first, suggestion chips second.",
        why: "The audit caught the free-text box buried under seven chips, two hundred pixels below the fold on a small phone. People think in sentences; the machine adapts, not the person.",
      },
    ],
    learned:
      "Conversion surfaces rot faster than any other code. The release that felt finished scored 63 out of 100 once I walked through it as six different strangers — and every point it gained back came from fixes a visitor would actually feel, not from new features.",
    actions: [
      { label: "Meet it on the studio site", href: LINKS.labs, external: true, primary: true },
    ],
    notYet: [
      "Current paid-conversion results are not established by this page.",
      "The five-human benchmark hasn't run — every score so far is my own adversarial walkthrough, and I already know how that can fool me.",
      "It only answers from what the sites already publish. Ask it something the pages don't know and it tells you so.",
    ],
  },
  {
    slug: "koi-cave",
    name: "Koi Cave",
    tagline: "A private operator brain that never leaves the machine.",
    identity: { theme: "cave", register: "Quiet · local-first, unlisted" },
    reach: "internal",
    stage: "local",
    status: "Private development project. No public download is offered here; the technical build record below is dated July 2026",
    verifiedAt: "2026-09-10",
    evidence: [{ claim: "Public site offers a development record, not a download", source: "https://koinophobia.dev/products/koi-cave — public development page and its absence of a download action checked 2026-09-10. Technical notes below are preserved as July 26, 2026 history; no newer binary or signing claim is made." }],
    problem:
      "Every tool that promises to organize your work wants your work on its servers, on a subscription, forever. I wanted the leverage without renting my own context back from someone else.",
    thesis:
      "Personal infrastructure beats personal productivity apps. If the thing that knows the most about how I work is owned by a company, that's a dependency, not leverage.",
    state: [
      "July 26, 2026 record: A macOS app: notes, tasks, memory, and automations, running local-first.",
      "July 26, 2026 record: The operator loop closed for the first time on July 23: a typed command becomes a validated packet, passes an approval gate, runs a repo-inspection worker, and comes back as a receipt that a separate validator re-checks from artifacts on disk.",
      "July 26, 2026 record: That work is deliberately unmerged. The last gate is human hands — me typing the command into the composer myself — before it lands on main.",
      "July 26, 2026 record: The morning founder brief is certified with limitations — it survived every failure drill I could design, including corrupt caches, malformed events, and a disconnected mail provider.",
      "July 26, 2026 record: One known truth bug remains: items waiting on me for more than 72 hours drop out of the brief while it reports no urgent signal. That's the exact failure mode a brief exists to prevent.",
      "July 26, 2026 record: The mail integration has never completed a real sync. The stored config holds a client ID and no tokens, so every brief it has ever produced was built from local state.",
    ],
    decisions: [
      {
        call: "Local-first, with no hosted fallback.",
        why: "The moment there's a sync server, the privacy claim becomes a policy instead of an architecture.",
      },
      {
        call: "Made the worker unable to complete its own commands.",
        why: "A system that grades its own homework converges on flattery. Receipts exist only when a validator re-reads the artifacts from disk — a failed check becomes an honest not-healthy receipt, never a quiet success.",
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
      "No public download is offered here.",
      "The July 2026 signing, operator-loop, and mail-sync notes have not been reverified for a newer build.",
    ],
  },
  {
    slug: "teachers-pet",
    name: "Teacher's Pet",
    tagline: "A homeschool for one computer.",
    identity: { theme: "school", register: "Patient · one course at a time" },
    reach: "internal",
    stage: "local",
    status:
      "A macOS build (0.2.0, build 5) runs the first course, Algebra Foundations, on Blake's machine. The K–12 map is complete; the school is not",
    verifiedAt: "2026-09-13",
    evidence: [
      {
        claim: "The curriculum map counts 13 grades, 4 subjects, 52 courses, 318 units, 1,273 objectives",
        source:
          "curriculum/sealed/v3.267.0/K12_CURRICULUM_REGISTRY.json in teachers-pet-personal-school-0.266, counted directly on 2026-09-13; matches curriculum/school/inventory.json",
      },
      {
        claim: "100 objectives are complete; 864 have had substantive review across 36 courses",
        source:
          "curriculum/school/inventory.json (COMPLETE 100 · PARTIAL 1173) and README status 'PARTIAL SCHOOL — EXPANSION IN PROGRESS', read 2026-09-13",
      },
      {
        claim: "Algebra Foundations runs as a macOS app and its golden path passed QA",
        source:
          "macos/ALGEBRA_RELEASE_QA.md (build 4 golden-path checks all Pass) and macos/TeachersPet.xcodeproj MARKETING_VERSION 0.2.0 / CURRENT_PROJECT_VERSION 5, read 2026-09-13",
      },
      {
        claim: "No TestFlight upload has been made",
        source:
          "macos/ALGEBRA_RELEASE_QA.md: 'No TestFlight upload was performed'; Apple package validation only (macos/release-evidence/build-4/apple-validation.json)",
      },
    ],
    problem:
      "A full education for one child, on one Mac, that never asks a parent to be the teacher. The map for that is thirteen grades wide. Building it is a course at a time.",
    thesis:
      "The size of the promise and the size of the product should sit on the same page until they match. 1,273 is the map. 100 is the school.",
    state: [
      "The sealed curriculum registry maps 13 grades, 4 subjects, 52 courses, 318 units, and 1,273 objectives. The registry labels itself a structurally validated draft map and claims no jurisdictional alignment, no credit, and no learning-improvement outcome.",
      "Algebra Foundations is the first complete course: four lessons, guided practice, independent checks, cumulative review, explicit unlocks, and device-local save and resume.",
      "100 objectives are complete and 864 have had substantive review across 36 courses. The rest are mapped, not built.",
      "Grade 7 synchronisation evidence was recorded on 2026-09-13.",
    ],
    decisions: [
      {
        call: "Seal the map before building the school.",
        why: "A curriculum that grows while it's being taught can't be checked. The registry is versioned and sealed so every objective has one identity, and the inventory counts against it instead of against a mood.",
      },
      {
        call: "Ship one course to a real device before touching the second.",
        why: "A macOS app that teaches algebra end to end is a smaller claim than a K–12 school, and it's a claim a person can verify in an afternoon.",
      },
    ],
    learned:
      "The map was the easy part and it looked like the hard part. Turning one course into something that survives a child pressing the wrong button is where the time goes.",
    actions: [],
    notYet: [
      "No TestFlight or App Store distribution of any kind; the macOS build runs only on Blake's machine.",
      "No child has learned from it, and no learning outcome is claimed.",
      "1,173 of the 1,273 objectives are mapped but not complete.",
    ],
  },
  {
    slug: "koi",
    name: "KOI",
    tagline: "A language model taught to read from random weights, on a laptop.",
    identity: { theme: "model", register: "Measured · rejections are receipts" },
    reach: "internal",
    stage: "local",
    status:
      "A from-scratch pretraining program running on one Apple M4. The largest documented runs are a few million parameters; the README says it is not useful yet",
    verifiedAt: "2026-09-13",
    evidence: [
      {
        claim: "Weights began random, on a corpus the studio owns; no external weights",
        source:
          "koi-model README and run manifests (initialization: random, external_weights_used: false), read 2026-09-13",
      },
      {
        claim: "koi-0.1 is 869,504 parameters, trained 1,500 steps in 75 s, held-out perplexity 2.11",
        source: "koi-model README run record for koi-0.1 (4 layers, 4 heads, 128 dims, block 128, vocab 512), read 2026-09-13",
      },
      {
        claim: "Most versioned experiments end in rejection, and the latest reverted itself",
        source:
          "koi-model EXPERIMENTS.md (~25 versioned verdicts, e.g. 'koi-0.10 — REJECTED for promotion, falsifier fired') and the 2026-08-24 commit 'MORPH-1 VERDICT: bar FAILED at diagnose 5/8 — reverted per the rule'",
      },
      {
        claim: "The receipts exist on disk",
        source:
          "~20 *-receipt.json files at the koi-model root and 76 receipt files in koi-epoch3-receipts; 18 experiment worktrees governed by koi-lanes/LANES.md, listed 2026-09-13",
      },
    ],
    problem:
      "Everyone uses language models. Almost nobody outside a lab has trained one from nothing and watched what a small one actually learns. I wanted to know, with numbers I produced myself, instead of taking the field's word for it.",
    thesis:
      "A model this size is not a product. It is an instrument for finding out how learning fails, and a negative result written down is worth more than a demo that flatters.",
    state: [
      "The tokenizer, the decoder-only transformer, the training loop, and the local inference server on 127.0.0.1:11500 are all the studio's own code.",
      "koi-0.1: 869,504 parameters, loss 6.24 to 0.743 over 1,500 steps, held-out perplexity 2.11, verdict-rule accuracy 0.85 against a 0.50 baseline.",
      "Later runs reach roughly 4.9 million parameters; a 30-million-parameter variant is referenced in the experiment log.",
      "Not learned: long-range agent closure (0.12 against a 0.10 baseline) and free-generation format validity (0.00). Verbatim echo failed and the copy wall is characterised.",
      "Eighteen experiment lanes run as git worktrees against one certified baseline, one heavy job at a time, because the machine has one GPU.",
    ],
    decisions: [
      {
        call: "A falsifier that reverts the change when the bar isn't cleared.",
        why: "A research log where every experiment succeeds is a diary. The rule is written down, the bar is written down, and the commit that fails it reverts itself.",
      },
      {
        call: "Own corpus, random weights, no shortcuts.",
        why: "Fine-tuning someone else's model would answer a different question. The point is to watch learning start from nothing and know exactly what went in.",
      },
    ],
    learned:
      "The interesting results were the failures. The model learned to satisfy a verdict rule quickly and could not write a well-formed sentence at all, which says more about what a small model finds easy than any success would have.",
    actions: [],
    notYet: [
      "It cannot generate useful text. The README says so and this page says so.",
      "No model has been published, served to anyone but Blake, or compared against an external benchmark.",
      "The 30-million-parameter variant is referenced in the log but its results are not summarised here.",
    ],
  },
  {
    slug: "preaching-to-the-choir",
    name: "Preaching to the Choir",
    tagline: "A keeper, not a journal.",
    identity: { theme: "keeper", register: "Quiet · returns to what you noticed" },
    reach: "limited",
    stage: "external-testers",
    status:
      "Version 1.0 (66) is approved and available to external testers through an open TestFlight link",
    verifiedAt: "2026-09-13",
    evidence: [
      {
        claim: "Build 66 is approved for external testing with a public join link",
        source:
          "docs/release/Release-verification.md in preaching-to-the-choir: Apple reports VALID, APPROVED, IN_BETA_TESTING; public link https://testflight.apple.com/join/1eUCSez8, read 2026-09-13",
      },
      {
        claim: "The preflight suite passes",
        source: "docs/release/Release-verification.md: 543 tests, 1 skip, 0 failures; implementation through Slice 38 (98a885c)",
      },
    ],
    problem:
      "Journals ask you to write. Most days you don't. What you do have is a handful of things you noticed, and nowhere that keeps them without demanding an entry.",
    thesis:
      "Keep what you noticed, notice what returns, and never ask for a paragraph. The app should be quieter than the thought.",
    state: [
      "Modules: Capture, Noticing, Returns, Horizons, Sync, Export, Telemetry, Commerce, governed by a spec whose spine outranks every other document.",
      "iPhone and iPad primary, with a Mac target and a widget extension. SQLite with full-text search, a job runner, and a banned-word linter that refuses any user-visible string that reads like a literal.",
      "A Keeper tier is configured in StoreKit at $2.99 a month, $24.99 a year, or $79 once. It is not on sale anywhere yet.",
    ],
    decisions: [
      {
        call: "A linter for the words, not just the code.",
        why: "The product's voice is the product. If a string can fail a build, the voice can't drift while nobody is looking.",
      },
    ],
    learned:
      "TestFlight approval is not release. It is the last place a stranger can tell you the thing you built is not the thing you described, and it is worth staying there a while.",
    actions: [
      { label: "Join the TestFlight", href: "https://testflight.apple.com/join/1eUCSez8", external: true, primary: true },
    ],
    notYet: [
      "Not on the App Store, and no App Store submission is claimed.",
      "The Keeper tier is configured, not sold; no purchase has been made by anyone.",
      "No tester feedback is summarised here.",
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
 * it's something to hire, and it lives on its own domain. (Its front office IS
 * in the universe, because anyone can walk up and use that today.)
 */
export const studio = {
  name: "Koinophobia Labs",
  tagline: "The same operating idea, pointed at other people's businesses.",
  body: "Small businesses leak time and revenue through the exact friction I build against everywhere else — unclear sites, messy intake, follow-up that lives in someone's memory. The studio is where I do that work for clients, and it has its own front door.",
  href: LINKS.labs,
};
