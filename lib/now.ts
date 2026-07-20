import { LINKS } from "@/lib/links";

// Single source of truth for the present-tense state of Blake's work.
// Rendered by /now (the full field report) and by the homepage "Right now"
// snapshot, so the two surfaces cannot quietly contradict each other.
//
// lastUpdated is a LITERAL, manually maintained string — never a runtime date.
// Bump it by hand whenever the copy below changes.

export const nowLastUpdated = "July 20, 2026";

export const nowHero = {
  heading: "What I'm doing now.",
  lede: "I'm in the proof stage: turning shipped products into real users, clients, feedback, and evidence — not more features.",
};

// First-person narrative of the current chapter. Transition, not tragedy bait.
export const nowChapter = [
  "My role at DraftKings ended in July 2026. Three years of high-volume sportsbook operations taught me exactly where products confuse people and where processes quietly break — and that ending turned into the push to build full-time instead of on the side.",
  "So this chapter is simple: go deeper on Koinophobia Labs and the products, keep a targeted search open for the right salary role, and — most importantly — move from having built things to proving they're actually useful to someone other than me.",
];

// Each entry feeds BOTH surfaces:
//  - `snapshot` is the one-line homepage "Right now" copy (kept verbatim).
//  - `stage` / `doingNow` / `nextProof` are the fuller /now field report.
export const nowActiveWork: Array<{
  name: string;
  stage: string;
  snapshot: string;
  doingNow: string;
  nextProof: string;
  href: string;
  cta: string;
  external?: boolean;
}> = [
  {
    name: "Koinophobia Labs",
    stage: "Selling and validating",
    snapshot:
      "Full-time on the studio since July 2026. Client work runs through the audit-first pipeline on the studio site.",
    doingNow:
      "Running audit-first outreach and real sales conversations with Chicago-area small businesses, and shaping structured inquiry, booking, and AI front-office systems for local service work.",
    nextProof:
      "The first repeatable paid engagement — a real business paying for a system that saves it time. Not another redesign.",
    href: LINKS.labs,
    cta: "Visit the studio",
    external: true,
  },
  {
    name: "Career Forge",
    stage: "Live beta",
    snapshot:
      "Released to production on July 19. Anyone can finish the workflow and export real documents. No paying users yet.",
    doingNow:
      "Packaging the paid tier and founding cohort, and sharpening it toward being the easiest résumé and job-prep experience to actually finish.",
    nextProof:
      "External users completing the full workflow, trusting the output, and paying because it materially simplifies their search.",
    href: LINKS.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    name: "Trendi",
    stage: "TestFlight beta · release blocked",
    snapshot:
      "Testers are on build 114. Builds 115 and 116 are finished and stuck behind an Apple account problem.",
    doingNow:
      "Clearing the upload block so testers get the build that's actually done, then getting it in front of the first ten creators and listening for one thing: whether the words it gives back are good enough to record.",
    nextProof:
      "Creators using the output to publish, repeatedly — not another layer of polish.",
    href: "/products/trendi",
    cta: "See Trendi",
  },
  {
    name: "You Know Ball",
    stage: "Web demo live · iOS unreleased",
    snapshot:
      "Playable in a browser today. The iOS build runs on exactly one phone — mine — and has never been on TestFlight.",
    doingNow:
      "The debate engine, scoring, replay, receipts, and daily-play systems are built, and the web demo is live. The iOS build has never reached an outside tester, so the honest next step is getting it into hands, not adding to it.",
    nextProof:
      "Real players returning to argue, sharing their receipts, and caring about the outcome.",
    href: "/products/you-know-ball",
    cta: "See You Know Ball",
  },
];

// The homepage renders this exact list from the shared source above.
export const nowSnapshot = nowActiveWork.map((item) => ({
  label: item.name,
  line: item.snapshot,
}));

export const nowProof = [
  "A first repeatable paid studio engagement.",
  "External Career Forge users finishing the whole workflow — and paying for it.",
  "Trendi's finished build actually in testers' hands, then ten creators using it.",
  "A You Know Ball build installed by someone who isn't me.",
  "A salary role aligned with customer-facing AI and implementation work.",
];

export const nowProfessional = {
  line: "I'm still open to the right salary role — building the studio and staying open to strong work aren't in conflict. The clearest fits:",
  lanes: [
    "Customer Experience AI",
    "AI implementation",
    "Product support / operations",
    "Trust & safety",
    "Workflow automation",
    "Customer-facing AI product",
  ],
};

export const nowLearning = [
  {
    title: "Shipping isn't proving demand.",
    body: "A product can be technically complete and commercially unproven at the same time. This chapter is about closing that gap, not widening it.",
  },
  {
    title: "Distribution is part of the product.",
    body: "Getting it in front of the right person is not a step after the work. It is the work.",
  },
  {
    title: "Honest labels build more trust than launch language.",
    body: "\"Live beta\" and \"TestFlight-ready\" earn more credibility than a confident \"launched\" that isn't quite true.",
  },
  {
    title: "The easiest workflow usually wins.",
    body: "People reach for the tool that removes the most friction, not the one with the most power.",
  },
  {
    title: "AI should reduce repeated decisions, not judgment.",
    body: "The best systems take the busywork and leave the human call intact.",
  },
];

export const nowNotDoing = [
  "Starting another product before the current ones are validated.",
  "Calling a deployment customer proof.",
  "Polishing away the lived problems that created these products.",
  "Turning every conversation into a sales pitch.",
  "Pretending the job search and the founder journey aren't happening at the same time.",
];

export const nowOpenDoor = {
  heading: "Open door",
  lede: "Good reasons to get in touch right now:",
  reasons: [
    "You want to test one of the products.",
    "You run a business with messy intake or follow-up.",
    "You're hiring for a customer-facing AI or implementation role.",
    "You're building something similar and want to compare notes.",
  ],
};
