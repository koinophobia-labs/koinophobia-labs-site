import { forgetRelease, trendiRelease, wayInRelease } from "@/lib/releases";
import {
  getProduct,
  products as universe,
  stageFamily,
  type Product,
} from "@/lib/dev/universe";

// The site layer over the evidence registry.
//
// lib/dev/universe.ts stays the single source of truth for status, evidence,
// verification dates, decisions and "not yet" lines. This file decides how each
// product is PRESENTED on koinophobialabs.com: which section it belongs to,
// the short card copy, the real App Store screens it may show, and the store
// link it points at. Nothing here may contradict the registry; tests check
// that every shipped product is stage "public" there, carries a store URL,
// and ships at least one authentic screenshot.
//
// Two sections, split by honesty rather than category:
//   shipped — a stranger can install it today.
//   lab     — everything else, at its real stage.

export type Section = "shipped" | "lab";

export type Screen = { src: string; alt: string };

export type AppStoreListing = {
  url: string;
  version: string;
  verifiedAt: string;
  /** One line under the badge. Prices come from the listing, never guessed. */
  priceLine: string;
};

export type SiteMeta = {
  section: Section;
  /** Route on this site. */
  href: string;
  /** One sentence for a card. */
  blurb: string;
  /** Platform chip. */
  platforms: string;
  /** Short status chip for a card. */
  chip: string;
  /** One mono receipt line for a lab card. */
  receipt?: string;
  /** The single "not yet" line a card shows. */
  notYetShort: string;
  screens: Screen[];
  appStore?: AppStoreListing;
  /** Authentic demo clip, cut from a QA-verified master. */
  demo?: {
    src: string;
    srcSmall: string;
    poster: string;
    seconds: number;
    master: string;
    captions: string[];
    alt: string;
  };
  /** Product-page copy that is not in the registry. */
  page?: {
    kicker: string;
    h1: string;
    lede: string;
    insightTitle: string;
    insightBody: string;
    blocks: Array<{ title: string; body: string }>;
    statusBody: string;
    secondaryAction?: { label: string; href: string; external?: boolean };
  };
};

const site: Record<string, SiteMeta> = {
  trendi: {
    section: "shipped",
    href: "/trendi",
    blurb:
      "A content coach for iPhone. Say a messy thought; get one angle, three hooks, a script, a caption, and a shot plan. Then record it with the teleprompter.",
    platforms: "iPhone",
    chip: "Free · Pro $7.99/mo",
    notYetShort: "Not yet: posting, scheduling, or connecting social accounts. No promises about views.",
    screens: [
      { src: "/trendi/store/01-say-it-messy.jpg", alt: "Trendi home screen: Say it messy, with the messy-thought field and an example hook" },
      { src: "/trendi/store/03-pick-your-hook.jpg", alt: "Choosing a hook from a Coach Pack" },
      { src: "/trendi/store/04-own-the-script.jpg", alt: "Editing the script in your own words" },
      { src: "/trendi/store/05-press-record.jpg", alt: "Recording with the on-screen teleprompter" },
    ],
    appStore: {
      url: trendiRelease.url,
      version: trendiRelease.version,
      verifiedAt: trendiRelease.verifiedAt,
      priceLine: "Free · 3 Coach Packs a week · Trendi Pro $7.99/mo for 100",
    },
    demo: {
      src: "/demo/trendi-hooks.mp4",
      srcSmall: "/demo/trendi-hooks-360.mp4",
      poster: "/demo/trendi-hooks.jpg",
      seconds: 20,
      master: "01_Trendi_Idea_To_Hooks.mp4 · 0.2.2 (148) · QA PASS 2026-09-10",
      captions: ["One messy thought goes in", "The coach works on it", "Three real hooks come back"],
      alt: "A rough idea about resetting a messy desk is typed into Trendi, the coach runs, and a Coach Pack returns with an angle and three opening hooks.",
    },
    page: {
      kicker: "Trendi · Content coach · iPhone",
      h1: "Say it messy. Leave with words you can say on camera.",
      lede:
        "Most creators don't run out of ideas. They stall in the ninety seconds between having one and pressing record. Trendi is a coach for that gap: a rough thought in, a finishable draft in your own voice out.",
      insightTitle: "A thought in your head is not the same thing as words you can say.",
      insightBody:
        "Blake watched people abandon good ideas at exactly that gap, including himself. Nobody needed another script generator. They needed the specific sentence to open with.",
      blocks: [
        { title: "An angle", body: "The one point worth making, pulled out of the ramble." },
        { title: "Three hooks", body: "Three ways to open. Pick one, or edit one." },
        { title: "A script", body: "Editable, section by section, in your words." },
        { title: "A caption and a shot plan", body: "For the post, and for what to film in what order." },
        { title: "The teleprompter", body: "Record section by section or the whole script. Drafts stay in the on-device Vault." },
      ],
      statusBody:
        "On the App Store since 28 August 2026. Free includes three delivered Coach Packs per weekly period; the editor, Vault, and teleprompter stay available on Free. Trendi does not post, schedule, or connect to social accounts, and it promises nothing about views or growth. Pro renews monthly unless cancelled in your App Store settings.",
    },
  },
  "forget-about-it": {
    section: "shipped",
    href: "/forget-about-it",
    blurb:
      "A memory journal for your wrist. Raise the Watch, say the thought, and the day writes itself back to you that evening. No account. No server.",
    platforms: "iPhone + Apple Watch",
    chip: "Free",
    notYetShort: "Not yet: cloud backup. The journal lives on your devices; export your own copy from Settings.",
    screens: [
      { src: "/forget-about-it/store/1.jpg", alt: "Forget About It Today view: a dated list of captured thoughts with a short account of the day" },
      { src: "/forget-about-it/store/3.jpg", alt: "History: the days you captured" },
      { src: "/forget-about-it/store/4.jpg", alt: "Memory: the people and subjects you return to" },
    ],
    appStore: {
      url: forgetRelease.url,
      version: forgetRelease.version,
      verifiedAt: forgetRelease.verifiedAt,
      priceLine: "Free · no purchases · no account",
    },
    demo: {
      src: "/demo/forget-capture-find.mp4",
      srcSmall: "/demo/forget-capture-find-360.mp4",
      poster: "/demo/forget-capture-find.jpg",
      seconds: 16,
      master: "08_Forget_About_It_Capture_Thought.mp4 + 09_Find_A_Memory.mp4 · 1.0 (22) · QA PASS 2026-09-10",
      captions: ["Say it, or type it", "It's kept, in your words", "Find it later by one word"],
      alt: "A thought is typed into Forget About It and saved into the day's timeline; later, Memory is searched for one word and the exact original is found.",
    },
    page: {
      kicker: "Forget About It · Memory journal · iPhone + Apple Watch",
      h1: "Keep the thought. Come back to your day.",
      lede:
        "The thing you meant to remember disappears between the train, the meeting, and getting home. Raise your wrist and say it. That evening, the fragments come back as a day you can read.",
      insightTitle: "Fast capture only matters if you can return to what you kept.",
      insightBody:
        "Most note apps solve the first half. Forget About It keeps your exact words, in order, and writes a short account of the day beside them, with the names and subjects that kept coming up and the things you said you'd return to. Your words and the app's reading of them never merge.",
      blocks: [
        { title: "Capture", body: "Type or dictate on iPhone. Speak, scribble, or type on the Watch. Watch captures queue offline and sync when the phone is back." },
        { title: "Read back", body: "Today, History, Memory. The day in order, a short account beside it, the loose ends you named." },
        { title: "Keep it yours", body: "No account, no analytics, no server. Export your own copy from Settings." },
      ],
      statusBody:
        "On the App Store, version 1.0, free with no purchases. Apple also lists Mac and Vision compatibility; the app is built around iPhone and Apple Watch. There is no cloud recovery of a journal: the journal is excluded from backups on purpose, so export a copy if you'd miss it.",
    },
  },
  "career-forge": {
    section: "shipped",
    href: "/way-in",
    blurb:
      "A private career workspace. Turn the experience you actually have into a résumé a stranger can judge in six seconds, then track every application. Nothing invented.",
    platforms: "iPhone + iPad",
    chip: "Free · in-app purchases",
    notYetShort: "Not yet: applying to jobs for you. It won't promise interviews or offers, and it won't invent a line on your résumé.",
    screens: [
      { src: "/way-in/store/1.jpg", alt: "Way In Today view: next step, search pulse, and current target" },
      { src: "/way-in/store/2.jpg", alt: "Keeping career work organised" },
      { src: "/way-in/store/3.jpg", alt: "Working from real experience" },
    ],
    appStore: {
      url: wayInRelease.url,
      version: wayInRelease.version,
      verifiedAt: wayInRelease.verifiedAt,
      priceLine: "Free · 30-Day Career Pass $29.99, does not renew · Resume Toolkit $9.99",
    },
    demo: {
      src: "/demo/way-in-fit.mp4",
      srcSmall: "/demo/way-in-fit-360.mp4",
      poster: "/demo/way-in-fit.jpg",
      seconds: 18,
      master: "06_Way_In_Check_Experience_Fit.mp4 · 1.0 (9) · QA PASS 2026-09-10",
      captions: ["A real posting", "Checked against your real experience", "Supported, related, or not found yet"],
      alt: "A saved job posting is checked against a career profile in Way In; each requirement is marked supported with its source excerpt, related, or not found yet.",
    },
    page: {
      kicker: "Way In · Career workspace · iPhone + iPad",
      h1: "Your experience. A clearer next move.",
      lede:
        "The job search is the highest-stakes project most people ever run, and almost nobody runs it as a project. Way In is a private workspace that turns the experience you actually have into stronger applications, and keeps the search moving.",
      insightTitle: "A résumé tool that invents experience is worse than no tool.",
      insightBody:
        "The useful thing isn't generation. It's organising evidence you already have into something a stranger can evaluate in six seconds. So there is no language model in the résumé path. Deterministic logic builds every document from facts you approved.",
      blocks: [
        { title: "Start with your facts", body: "Build a Career Profile, import résumés, judge fit against a real posting." },
        { title: "Prepare with context", body: "Tailor without inventing. Interview questions grounded in your own stories. Scores explain their limits and are not hiring predictions." },
        { title: "Keep it moving", body: "Applications, follow-ups, rounds, outcomes, people." },
      ],
      statusBody:
        "On the App Store, version 1.0. Formerly Career Forge; the original web app is still live under the new name. Free includes résumé review and job-fit analysis; optional purchases unlock export, tailoring, interview preparation, and planning. Way In does not apply to jobs for you and does not promise interviews or offers.",
      secondaryAction: { label: "Open the web version", href: "https://career-forge-lite.vercel.app", external: true },
    },
  },
  "teachers-pet": {
    section: "lab",
    href: "/lab/teachers-pet",
    blurb:
      "A homeschool for one computer. The map covers 13 grades, 4 subjects, 52 courses, 318 units, and 1,273 objectives. The first course, Algebra Foundations, runs as a Mac app today.",
    platforms: "macOS",
    chip: "Mapped 1,273 · built 100",
    receipt: "macOS 0.2.0 (5) · registry v3.267.0 · Grade 7 sync evidence Sep 13",
    notYetShort: "Not yet: any distribution. No child has learned from it.",
    screens: [],
  },
  koi: {
    section: "lab",
    href: "/lab/koi",
    blurb:
      "A language model trained from random weights on a MacBook, on a corpus the studio owns. 298 commits, 25 versioned verdicts, most of them rejections. It cannot write a sentence yet. That is the thing being measured.",
    platforms: "Local · Apple M4",
    chip: "Research · not useful yet",
    receipt: "koi-0.1 · 869,504 params · perplexity 2.11 · latest verdict: bar FAILED, reverted",
    notYetShort: "Not yet: a sentence. Or a benchmark. Or anyone but Blake running it.",
    screens: [],
  },
  "you-know-ball": {
    section: "lab",
    href: "/lab/do-you-know-ball",
    blurb:
      "A sports-argument game where the opponent keeps score and remembers. Live as a web demo. iOS builds accepted by Apple, not yet released.",
    platforms: "Web · iOS pending",
    chip: "Web demo · iOS pending",
    receipt: "builds 26 and 27 accepted Jul 2026 · merged with Last Word Aug 30",
    notYetShort: "Not yet: an iOS release, or any tester record to report.",
    screens: [
      { src: "/proof/you-know-ball/mobile-play.png", alt: "You Know Ball web demo on a phone: a take, a counter, a score" },
    ],
  },
  "preaching-to-the-choir": {
    section: "lab",
    href: "https://testflight.apple.com/join/1eUCSez8",
    blurb: "A keeper, not a journal. Open TestFlight, build 66, approved for external testers.",
    platforms: "iPhone · iPad · Mac",
    chip: "TestFlight",
    receipt: "1.0 (66) · 543 tests, 0 failures",
    notYetShort: "Not yet: the App Store. Nothing is for sale.",
    screens: [],
  },
};

export type SiteProduct = Product & SiteMeta & { family: ReturnType<typeof familyOf> };

function familyOf(product: Product) {
  return stageFamily[product.stage];
}

const ordered = [
  "trendi",
  "forget-about-it",
  "career-forge",
  "teachers-pet",
  "koi",
  "you-know-ball",
  "preaching-to-the-choir",
];

export const siteProducts: SiteProduct[] = ordered.map((slug) => {
  const product = getProduct(slug);
  const meta = site[slug];
  if (!product || !meta) throw new Error(`lib/products.ts: ${slug} is not in the registry`);
  return { ...product, ...meta, family: familyOf(product) };
});

export const shippedProducts = siteProducts.filter((p) => p.section === "shipped");
export const labProducts = siteProducts.filter((p) => p.section === "lab");

export const getSiteProduct = (slug: string) => siteProducts.find((p) => p.slug === slug);

/** Registry products that intentionally get no card on the studio site. */
export const unlistedSlugs = universe
  .map((p) => p.slug)
  .filter((slug) => !ordered.includes(slug));

/**
 * The three engagement shapes the studio sells. Each one names the shipped
 * work that proves it; a shape without proof does not get listed.
 */
export const engagementShapes = [
  {
    slug: "app",
    title: "Build the app",
    body:
      "A native iPhone, Apple Watch, iPad, or Mac app, from first sketch to App Store review. Design, build, StoreKit, privacy, submission, the listing.",
    timeline: "Typically six to twelve weeks",
    proof: "Trendi, Forget About It, Way In",
  },
  {
    slug: "prototype",
    title: "Prove the idea",
    body:
      "A working prototype on a real device in one to two weeks, so you decide with your thumbs instead of a slide deck. You keep the code either way.",
    timeline: "One to two weeks",
    proof: "Trendi went from a note to an internal TestFlight in one month",
  },
  {
    slug: "model",
    title: "Put a model to work",
    body:
      "An AI feature or internal tool where the model does the writing and deterministic rules do the deciding, with a claims gate that refuses output the product can't stand behind.",
    timeline: "Two to six weeks",
    proof: "Trendi's coach pipeline, Way In's no-model résumé path, the studio's own release-truth audit",
  },
] as const;

export const engagementTerms = [
  { title: "Fixed price", body: "in writing before anything is built" },
  { title: "You talk to", body: "the person doing the work" },
  { title: "You own", body: "everything at handoff" },
] as const;

/** The one promise that appears on Home, Work with me, and Start. */
export const replyPromise = "within two business days";
