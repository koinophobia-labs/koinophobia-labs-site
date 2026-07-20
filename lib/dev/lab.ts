// Experiments and field notes for koinophobia.dev.
//
// Two rules:
//  1. An experiment goes here only if it actually ran. Nothing aspirational,
//     nothing "exploring", no roadmap disguised as curiosity.
//  2. A field note describes something that happened, with the specifics
//     intact. These are build logs, not essays — if a note can't name what
//     broke, what number moved, or what decision got made, it doesn't ship.
//
// Bump `labLastUpdated` by hand. Newest notes first.

export const labLastUpdated = "July 20, 2026";

export type Experiment = {
  name: string;
  kind: string;
  body: string;
  finding: string;
  /** Where you can see it, if anywhere. Empty means there's nothing to show. */
  href?: string;
  external?: boolean;
  live?: string;
};

export const experiments: Experiment[] = [
  {
    name: "The koi",
    kind: "Interface · running on this domain",
    body: "A companion fish that swims the page and answers questions about what you're looking at. The hard part wasn't the answers — it was the motion. Early versions chased the cursor, which reads as needy and makes a page feel like it's watching you.",
    finding:
      "Anchored, non-chasing motion made it feel like a resident instead of a widget. A throttled browser tab exposed an opacity bug that only appeared when frames were starved.",
    live: "Live on koinophobialabs.com",
  },
  {
    name: "Debate tournament harness",
    kind: "Simulation · You Know Ball",
    body: "To find out whether the scoring in You Know Ball meant anything, I ran cohorts of simulated players against the debate engine — one that argued at random, one that argued well — across every sport.",
    finding:
      "4,500 games. Blind play won 2.36%, expert play won 100%, every sport. Before the rebuild, blind play was winning 16–27%, which meant the score was mostly noise.",
  },
  {
    name: "Claims gate",
    kind: "Guardrail · Trendi",
    body: "A check that sits between a creator's rough thought and the script that comes back, refusing to produce sentences that assert results the person never claimed.",
    finding:
      "It works, and it overcorrects. It was rejecting legitimate 'my client' stories as unbacked claims — one of the reasons the newer generation pipeline is currently switched off.",
  },
  {
    name: "Contrast checker",
    kind: "Build tooling · this site",
    body: "A script that walks every declared foreground/background pair on the site and fails if any of them drops below WCAG AA. It started as a one-off after I shipped a muted grey nobody could read.",
    finding:
      "It caught exactly that, again, on the dark surfaces — the muted token had to move from #726e85 to #807c94 to clear 4.5:1. Taste is not a substitute for a ratio.",
  },
  {
    name: "Headless UI puppet",
    kind: "Automation · Trendi",
    body: "A way to drive the iOS app through its real interface and capture the results without a human at the machine — built because demo footage kept needing me to be physically present and awake.",
    finding:
      "It records a genuine run of the product rather than a mockup. It also taught me that a test runner attached to a simulator can generate very convincing fake engagement data, which is a good thing to know before you cite any number.",
  },
];

export type Note = {
  slug: string;
  date: string;
  title: string;
  /** One-line summary used on the index. */
  hook: string;
  tag: string;
  body: string[];
};

export const notes: Note[] = [
  {
    slug: "three-labels-one-product",
    date: "July 20, 2026",
    title: "My site was lying about my own products",
    hook: "An honesty audit that started with a contradiction I put there myself.",
    tag: "This site",
    body: [
      "I have a principle written on my homepage: real status labels, documented decisions, no invented proof. I went looking at how the site actually described my work and found You Know Ball carrying three different statuses on one domain — \"in development\" on the home page, \"TestFlight builds shipping\" on the now page, \"TestFlight + live web MVP\" on the résumé.",
      "Only one of those could be true, and it turned out to be none of them. No You Know Ball build has ever reached TestFlight — not build 26, which I froze, and not build 27, which runs on exactly one phone: mine. Zero outside people have installed it. The phrase had drifted in because it described something I intended, and then it sat there long enough to sound like a fact.",
      "That's the failure mode with honest labels. Nobody sets out to overclaim. You write the optimistic version on a Tuesday when it's nearly true, and then the build gets blocked and the sentence doesn't.",
      "So there's now one file that defines status for every product, one vocabulary, and a question each product has to answer before anything else: who can use this today without asking me for something? Everything else on the page is narrative. That one is a fact.",
    ],
  },
  {
    slug: "shipping-and-delivering",
    date: "July 18, 2026",
    title: "Shipping and delivering are different verbs",
    hook: "A validated Trendi build has been stuck behind an account permission for days.",
    tag: "Trendi",
    body: [
      "Build 116 of Trendi is done. Full suite green — 883 tests, zero failures. The archive is built, validated, and reproducible from a clean checkout. It carries three P1 fixes.",
      "Nobody has it. The upload fails with an Apple account error: the signing identity lost App Store Connect access for the team. It isn't a code problem, and there's no engineering that gets around it. It needs me at a keyboard with a second factor.",
      "Meanwhile the people testing Trendi are on build 114, which predates all of it. For days I've had a better product than the one my testers are using, and every hour of that gap is invisible from the outside — from a tester's view, nothing has happened.",
      "The lesson isn't about Apple. It's that I treated release infrastructure as the boring part after the work, and it turned out to be the part that decides whether the work exists for anyone else.",
    ],
  },
  {
    slug: "turning-off-the-better-version",
    date: "July 17, 2026",
    title: "I turned off the version that wrote better",
    hook: "Trendi's newer generation pipeline is finished, and disabled on purpose.",
    tag: "Trendi",
    body: [
      "Trendi has a second-generation pipeline that produces noticeably better copy. It is currently serving to zero percent of devices, deliberately, because I switched it off before shipping build 116.",
      "It broke written mode entirely, leaked an onboarding default that assumed one platform, and its claims gate started rejecting people's real stories about their own clients as unsupported assertions.",
      "Every one of those is small. Together they make the product worse than the old pipeline that writes flatter sentences and works. So the flag went back to 1 and the better writer sits in the dark.",
      "I've watched teams ship the impressive half of a feature because the impressive half is the part that demos. The honest version of shipping is that a feature is done when its worst path is acceptable, not when its best path is exciting.",
    ],
  },
  {
    slug: "tuning-until-beginners-lose",
    date: "July 15, 2026",
    title: "I tuned a game until beginners lost badly",
    hook: "Blind play was winning a quarter of the time. That number was the product.",
    tag: "You Know Ball",
    body: [
      "You Know Ball scores how well you defend a sports take. Early on I ran cohorts of simulated players against the debate engine and found that a cohort arguing at random — no knowledge, no structure — was winning between 16 and 27 percent of games.",
      "That's a fine number for a slot machine and a fatal one for a game about knowing ball. If someone who doesn't watch can win a quarter of the time, the score isn't measuring anything, and everyone can feel that even if they can't name it.",
      "The rebuild pushed blind play down to 2.36% across 4,500 games, with expert play winning every sport. The gap between those two numbers is the entire value of the thing.",
      "What I'd flag about my own work here: I spent months making a scoring system honest before a single outside person had played it. The engine got genuinely good. Whether anyone comes back tomorrow is still completely unproven, and that's a harder problem than the one I chose to solve.",
    ],
  },
  {
    slug: "certified-not-installed",
    date: "July 13, 2026",
    title: "I certified a feature I wasn't using",
    hook: "Koi Cave's morning brief passed every failure drill. My own laptop runs a build from June.",
    tag: "Koi Cave",
    body: [
      "I put the morning founder brief in Koi Cave through every failure drill I could design: no cache, corrupt cache, malformed events, disconnected mail, double refresh, navigation mid-load. It passed all of them. 1,269 tests green.",
      "Then I noticed the copy of Koi Cave installed on my machine was built in June and predates the feature entirely. I had certified something I had never actually lived with.",
      "The drills also surfaced a real truth bug that no amount of test coverage would have made me care about the same way: items waiting on me for more than 72 hours silently drop out of the brief, and the brief then reports no urgent signal. A tool whose job is to surface what's stuck will confidently tell you nothing is stuck.",
      "I wrote it down instead of quietly fixing it, because a documented failure is safer than an undocumented one. But the honest read is that certification was an artifact I produced, not a thing I trusted enough to run.",
    ],
  },
];

export const getNote = (slug: string) => notes.find((n) => n.slug === slug);
