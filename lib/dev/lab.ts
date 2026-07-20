// Experiments and field notes for koinophobia.dev.
//
// Two rules:
//  1. An experiment goes here only if it actually ran. Nothing aspirational,
//     nothing "exploring", no roadmap disguised as curiosity.
//  2. A field note describes something that happened, with the specifics
//     intact — and every specific must be checkable. Numbers I cannot point at
//     an artifact for do not get published, however good they sound.
//
// PUBLICATION GATE: these notes are written in Blake's first person and make
// factual claims about private product history. `published: false` keeps a note
// in the repo but off the site, pending his sign-off. Nothing is ever deleted to
// resolve a review. See docs/FIELD-NOTES-REVIEW.md.
//
// Reconciled 2026-07-20. Bump `labLastUpdated` by hand. Newest notes first.

export const labLastUpdated = "July 20, 2026";

export type Experiment = {
  name: string;
  kind: string;
  body: string;
  finding: string;
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
    body: "To find out whether the scoring in You Know Ball meant anything, I ran cohorts of simulated players against the debate engine — one arguing at random, one arguing well — across every sport, and compared how often each cohort won.",
    finding:
      "A cohort that knew nothing was winning far too often for the score to mean anything, and closing that gap became the actual product work. I'm not publishing the specific rates here: when I went to source them for this page, I couldn't point at the run that produced them.",
  },
  {
    name: "Claims gate",
    kind: "Guardrail · Trendi",
    body: "A check that sits between a creator's rough thought and the script that comes back, refusing to produce sentences that assert results the person never claimed.",
    finding:
      "It works, and it overcorrects. It was rejecting legitimate 'my client' stories as unbacked claims — one of the reasons the newer generation pipeline is still switched off in builds 117, 118 and 119.",
  },
  {
    name: "Contrast checker",
    kind: "Build tooling · this site",
    body: "A script that walks every declared foreground/background pair on the site and fails if any of them drops below WCAG AA. It started as a one-off after I shipped a muted grey nobody could read.",
    finding:
      "It caught exactly that, again, on the dark surfaces — the muted token had to move from #726e85 to #807c94 to clear 4.5:1. Taste is not a substitute for a ratio.",
  },
  {
    name: "Release-truth audit",
    kind: "Process · this site",
    body: "Before publishing this site I went back through release artifacts, Apple's own upload logs, code-signing output and live HTTP checks, and compared what I found against what the site said about each product.",
    finding:
      "Three of four product statuses were wrong — including one that undersold. The site claimed no You Know Ball build had ever been uploaded; Apple's logs name two it had already accepted. Every status here now carries a verification date and a source, enforced by tests.",
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
  hook: string;
  tag: string;
  /** False keeps the note in the repo but off the site, pending Blake's review. */
  published: boolean;
  body: string[];
};

export const notes: Note[] = [
  {
    slug: "three-labels-one-product",
    date: "July 20, 2026",
    title: "My site was wrong about my own products — in both directions",
    hook: "An honesty audit that found the overclaim I expected and an underclaim I didn't.",
    tag: "This site",
    published: true,
    body: [
      "I have a principle written on my homepage: real status labels, documented decisions, no invented proof. So before publishing this version of the site I went looking at how it actually described my work, expecting to find a few places where I'd been generous with myself.",
      "I found those. You Know Ball was carrying three different statuses on one domain — \"in development\" on the home page, \"TestFlight builds shipping\" on the now page, \"TestFlight + live web MVP\" on the résumé. That's the failure mode with honest labels: nobody sets out to overclaim, you write the optimistic version on a Tuesday when it's nearly true, and then the build gets blocked and the sentence doesn't.",
      "So I corrected it hard. I wrote that no You Know Ball build had ever reached TestFlight, that not one outside person had installed it, and I put that on the site as the honest version.",
      "That was also wrong. Going through Apple's own upload logs, I found two 409 responses rejecting a re-upload — and Apple names the build it already has each time. On July 16 it says the previous version is 26. On July 19 it says 27. Apple was telling me, in its own error messages, that it had accepted two builds I'd convinced myself were never delivered.",
      "The correction I'd been proud of was a different kind of inaccuracy. Both versions had the same root cause: I was writing status from memory instead of from artifacts. Confident self-criticism turns out to be just as unreliable as confident marketing — it feels rigorous, which is worse, because nobody thinks to check the claim that makes you look bad.",
      "Every product status on this site now carries a date and a source, and the test suite fails if either is missing or goes stale. Not because that makes me honest, but because I've now demonstrated twice that my memory of my own release state isn't evidence.",
    ],
  },
  {
    slug: "shipping-and-delivering",
    date: "July 18, 2026 · updated July 20",
    title: "Shipping and delivering are different verbs",
    hook: "A finished Trendi build sat behind an account permission for days. Then finishing the upload turned out not to finish the job either.",
    tag: "Trendi",
    published: true,
    body: [
      "Build 116 of Trendi was done. Full suite green, archive built and validated, three P1 fixes in hand. Nobody had it. The upload failed with an Apple account error — the signing identity had lost App Store Connect access — and there's no engineering that gets around that. It needed me at a keyboard with a second factor.",
      "Meanwhile the people testing Trendi were on build 114, which predated all of it. For days I had a better product than the one my testers were using, and every hour of that gap was invisible from the outside.",
      "That's resolved now. Build 118 is uploaded, imported clean, and installed from TestFlight — I can open it on my phone.",
      "And it's still not signed off. The last gate is a clean-state data-isolation check: create a user, put real data in, sign out, sign in as somebody genuinely different, confirm nothing leaks, come back. The first half passed every step. The second half never ran, because it needs a second real Apple account on the test device and I didn't have one.",
      "So the lesson got longer. I thought the distinction was between shipping and delivering. It's actually a chain — built, uploaded, processed, installed, verified — and every link is a place where work that is genuinely finished can sit and look, from the outside, like nothing happened at all.",
    ],
  },
  {
    slug: "turning-off-the-better-version",
    date: "July 17, 2026",
    title: "I turned off the version that wrote better",
    hook: "Trendi's newer generation pipeline is finished, and disabled on purpose.",
    tag: "Trendi",
    published: true,
    body: [
      "Trendi has a second-generation pipeline that produces noticeably better copy. It is currently serving to zero percent of devices, deliberately. Builds 117, 118 and 119 all ship with the V1 client.",
      "It broke written mode entirely, leaked an onboarding default that assumed one platform, and its claims gate started rejecting people's real stories about their own clients as unsupported assertions.",
      "Every one of those is small. Together they make the product worse than the old pipeline that writes flatter sentences and works. So the flag went back to 1 and the better writer sits in the dark.",
      "I've watched teams ship the impressive half of a feature because the impressive half is the part that demos. The honest version of shipping is that a feature is done when its worst path is acceptable, not when its best path is exciting.",
    ],
  },
  {
    slug: "tuning-until-beginners-lose",
    date: "July 15, 2026",
    title: "I tuned a game until beginners lost badly",
    hook: "Blind play was winning far too often. That number was the product.",
    tag: "You Know Ball",
    // HELD: the original version cited specific cohort win rates and a game
    // count I could not trace to any artifact during the 2026-07-20 audit.
    // Rewritten without them; still needs Blake to confirm the story is right
    // before it goes up.
    published: false,
    body: [
      "You Know Ball scores how well you defend a sports take. Early on I ran cohorts of simulated players against the debate engine and found that a cohort arguing at random — no knowledge, no structure — was winning a large share of games.",
      "That's a fine result for a slot machine and a fatal one for a game about knowing ball. If someone who doesn't watch can win regularly, the score isn't measuring anything, and everyone can feel that even if they can't name it.",
      "The rebuild pushed blind play down sharply, with expert play winning consistently. The gap between those two is the entire value of the thing.",
      "What I'd flag about my own work here: I spent months making a scoring system honest before a single outside person had played it. The engine got genuinely good. Whether anyone comes back tomorrow is still completely unproven, and that's a harder problem than the one I chose to solve.",
    ],
  },
  {
    slug: "certified-not-installed",
    date: "July 13, 2026",
    title: "I certified a feature against every failure but the real one",
    hook: "Koi Cave's morning brief passed every failure drill. The integration that would make it real has never connected.",
    tag: "Koi Cave",
    // HELD: the original claimed Blake's laptop ran a June build — that was true
    // when written and is now false (the current build is installed). Rewritten
    // around what still holds. Tone is the most self-critical on the site and
    // the subject is an unreleased private tool, so this needs his call.
    published: false,
    body: [
      "I put the morning founder brief in Koi Cave through every failure drill I could design: no cache, corrupt cache, malformed events, disconnected mail, double refresh, navigation mid-load. It passed all of them.",
      "Then I looked at what it had actually been running against. The mail integration has never completed a sync — the stored config holds a client ID and no tokens, and the file the sync writes to has never been created. Every brief the tool has ever produced was built from local seed state.",
      "So the drills tested how it behaves when the data is missing, which turns out to be the only state it has ever been in. That's not a useless result. It is a much smaller one than 'certified'.",
      "The drills also surfaced a real truth bug: items waiting on me for more than 72 hours silently drop out of the brief, and the brief then reports no urgent signal. A tool whose job is to surface what's stuck will confidently tell you nothing is stuck.",
      "I wrote it down instead of quietly fixing it, because a documented failure is safer than an undocumented one.",
    ],
  },
];

/** Only these render on /notes. Held notes stay in the repo, off the site. */
export const publishedNotes = notes.filter((note) => note.published);

export const getNote = (slug: string) =>
  publishedNotes.find((n) => n.slug === slug);
