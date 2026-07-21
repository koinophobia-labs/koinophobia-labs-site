import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  emptySession,
  missingFields,
  nextQuestion,
  reduce,
  type EngineEvent,
} from "../lib/front-office/engine";
import {
  classifyProblemKind,
  extractBudgetRange,
  extractBusinessType,
  extractStudioFields,
  extractTimeline,
  extractUrl,
} from "../lib/front-office/extract";
import {
  frontOfficeStorageKey,
  parseFrontOfficeSession,
  FRONT_OFFICE_TTL_MS,
} from "../lib/front-office/storage";
import {
  buildIntakeFormData,
  draftAnswers,
  originNote,
  studioBrief,
  studioPolicy,
  studioRecommendation,
  validateStudioContact,
} from "../lib/front-office/studio-policy";
import {
  buildProductMatch,
  buildStudioHandoff,
  extractPersonalFields,
  matchProduct,
  personalOutcome,
  personalPolicy,
} from "../lib/front-office/personal-policy";
import type { FrontOfficePolicy, FrontOfficeSession } from "../lib/front-office/types";
import { products, getProduct, stageLabel, reachLabel, studio } from "../lib/dev/universe";
import { serviceOffers } from "../lib/commercial";

const NOW = 1_700_000_000_000;
const SID = "11111111-2222-4333-8444-555555555555";

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

function drive(policy: FrontOfficePolicy, events: EngineEvent[], start?: FrontOfficeSession) {
  let session = start ?? emptySession(policy.host, SID, NOW);
  for (const event of events) session = reduce(session, event, policy, NOW);
  return session;
}

/** Answer every question the engine asks, using canned per-field answers. */
function answerAll(policy: FrontOfficePolicy, session: FrontOfficeSession, answers: Record<string, { value: string; secondaryValue?: string; pairValue?: string }>) {
  let current = session;
  for (let i = 0; i < 12; i += 1) {
    const question = nextQuestion(current, policy);
    if (!question) break;
    const canned = answers[question.field];
    assert.ok(canned, `no canned answer for question "${question.id}" (field ${question.field})`);
    current = reduce(current, { type: "ANSWER", questionId: question.id, ...canned }, policy, NOW);
  }
  return current;
}

/* ================================================== engine mechanics */

test("a session starts at goal and an intent moves it into clarify", () => {
  const session = drive(studioPolicy, [{ type: "SELECT_INTENT", intent: "automate" }]);
  assert.equal(session.stage, "clarify");
  assert.equal(session.fields.problemKind, "manual_work");
});

test("questions are asked one at a time, at most once, only while missing", () => {
  let session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "My team wastes hours manually copying every booking into a spreadsheet." }]);
  const seen = new Set<string>();
  for (let i = 0; i < 12; i += 1) {
    const question = nextQuestion(session, studioPolicy);
    if (!question) break;
    assert.ok(!seen.has(question.id), `question ${question.id} asked twice`);
    seen.add(question.id);
    assert.ok(!session.fields[question.field], "asked about an already-filled field");
    session = reduce(session, { type: "ANSWER", questionId: question.id, value: `answer for ${question.field} with detail`, pairValue: question.pairField ? "This month" : undefined }, studioPolicy, NOW);
  }
  assert.equal(session.stage, "review");
});

test("information volunteered up front is never asked again", () => {
  const text = "Our tattoo studio's website example.com is outdated — budget around $2,000, need it this month.";
  const session = drive(studioPolicy, [{ type: "FREE_TEXT", text }]);
  // URL, budget, timeline, industry all extracted — their questions must not surface.
  assert.equal(session.fields.budgetRange, "$1,500-$3,500");
  assert.equal(session.fields.timeline, "This month");
  assert.equal(session.fields.industry, "Tattoo studio");
  assert.ok(session.fields.websiteUrl?.includes("example.com"));
  const askedFields: string[] = [];
  let current = session;
  for (let i = 0; i < 12; i += 1) {
    const question = nextQuestion(current, studioPolicy);
    if (!question) break;
    askedFields.push(question.field);
    current = reduce(current, { type: "ANSWER", questionId: question.id, value: "a concrete detailed answer", pairValue: question.pairField ? "Any" : undefined }, studioPolicy, NOW);
  }
  for (const already of ["budgetRange", "timeline", "industry", "websiteUrl"]) {
    assert.ok(!askedFields.includes(already), `re-asked ${already}`);
  }
});

test("review edits update fields and clear the inferred flag", () => {
  let session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "My site foo.com is not converting at all lately" }]);
  assert.ok(session.inferred.includes("websiteUrl"));
  session = reduce(session, { type: "EDIT_FIELD", field: "websiteUrl", value: "https://corrected.com" }, studioPolicy, NOW);
  assert.equal(session.fields.websiteUrl, "https://corrected.com");
  assert.ok(!session.inferred.includes("websiteUrl"));
});

test("confirm at review requires completeness and routes by host", () => {
  const incomplete = { ...emptySession("studio", SID, NOW), stage: "review" as const };
  assert.notEqual(reduce(incomplete, { type: "CONFIRM_REVIEW" }, studioPolicy, NOW).stage, "consent");

  const personalDone = drive(personalPolicy, [
    { type: "FREE_TEXT", text: "I was laid off and need help rebuilding my résumé." },
    { type: "CONFIRM_REVIEW" },
  ]);
  // The personal host never collects contact — review confirms straight to done.
  assert.equal(personalDone.stage, "done");
});

test("submit transitions only run from consent, and errors are recoverable", () => {
  const base: FrontOfficeSession = { ...emptySession("studio", SID, NOW), stage: "consent" };
  const submitting = reduce(base, { type: "SUBMIT_STARTED" }, studioPolicy, NOW);
  assert.equal(submitting.stage, "submitting");
  const failed = reduce(submitting, { type: "SUBMIT_FAILED", message: "The intake could not be saved." }, studioPolicy, NOW);
  assert.equal(failed.stage, "error");
  assert.ok(failed.errorMessage);
  const recovered = reduce(failed, { type: "BACK_TO_REVIEW" }, studioPolicy, NOW);
  assert.equal(recovered.stage, "review");
  assert.equal(recovered.errorMessage, undefined);
  // A stray SUBMIT_STARTED from goal must not do anything.
  assert.equal(reduce(emptySession("studio", SID, NOW), { type: "SUBMIT_STARTED" }, studioPolicy, NOW).stage, "goal");
});

test("reset produces a fresh session with a new id", () => {
  const dirty = drive(studioPolicy, [{ type: "FREE_TEXT", text: "manually copying spreadsheets every week for reporting" }]);
  const fresh = reduce(dirty, { type: "RESET", sessionId: "99999999-8888-4777-9666-555555555555" }, studioPolicy, NOW);
  assert.equal(fresh.stage, "goal");
  assert.deepEqual(fresh.fields, {});
  assert.equal(fresh.sessionId, "99999999-8888-4777-9666-555555555555");
});

/* ==================================================== extraction */

test("problem kinds classify from plain language, and ambiguity stays unclassified", () => {
  assert.equal(classifyProblemKind("My website looks outdated and slow on mobile"), "website");
  assert.equal(classifyProblemKind("Leads disappear and nobody follows up on inquiries"), "lead_followup");
  assert.equal(classifyProblemKind("We manually copy every order into a spreadsheet and route emails by hand"), "manual_work");
  assert.equal(classifyProblemKind("I have an app idea and want to build an MVP"), "custom_product");
  assert.equal(classifyProblemKind("I know something is wrong with my business but I don't know what"), "unsure");
  assert.equal(classifyProblemKind("hello there"), undefined);
});

test("detectors capture urls, budgets, timelines, and business types conservatively", () => {
  assert.equal(extractUrl("check https://foo.example.com/page please"), "https://foo.example.com/page");
  assert.equal(extractUrl("my site is barbershop.com."), "barbershop.com");
  assert.equal(extractUrl("email me at hi@nowhere.com"), undefined);
  assert.equal(extractBudgetRange("our budget is about $2,500"), "$1,500-$3,500");
  assert.equal(extractBudgetRange("we charge a $50 no-show fee"), undefined);
  assert.equal(extractBudgetRange("budget around $5k"), "$3,500+");
  assert.equal(extractTimeline("we need this asap"), "This week");
  assert.equal(extractTimeline("just researching options"), "Just researching");
  assert.equal(extractBusinessType("I run a small tattoo shop downtown"), "Tattoo shop");
  assert.equal(extractBusinessType("my incredible thing"), undefined);
});

test("the visitor's own words become the problem statement, never a rewrite", () => {
  const text = "People ask about booking on Instagram but most never finish.";
  const { fields } = extractStudioFields(text);
  assert.equal(fields.primaryProblem, text);
});

/* ============================================ commercial journeys */

const STUDIO_ANSWERS = {
  primaryProblem: { value: "Inquiries arrive but people never finish booking with us." },
  problemKind: { value: "lead_followup" },
  branchContext: { value: "Leads arrive through Instagram and the contact form, someone copies them into a spreadsheet, and replies go out days later.", secondaryValue: "Instagram, Gmail, Google Sheets" },
  impact: { value: "Two or three serious inquiries a week go cold before anyone replies." },
  desiredOutcome: { value: "Every inquiry gets a same-day reply with the details needed to book." },
  businessName: { value: "Blackline Studio", pairValue: "Tattoo studio" },
  budgetRange: { value: "$1,500-$3,500", pairValue: "This month" },
};

test("journey: uncertain booking-drop visitor reaches a truthful recommendation and a clean payload", () => {
  let session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "My business gets inquiries but a lot of people never finish booking." }]);
  assert.equal(session.fields.problemKind, "lead_followup", "should read this as a follow-up/conversion problem");
  // The first thing asked must be about the current inquiry/booking process.
  const first = nextQuestion(session, studioPolicy);
  assert.equal(first?.field, "branchContext");
  assert.match(first!.prompt(session), /inquiries arrive/i);

  session = answerAll(studioPolicy, session, STUDIO_ANSWERS);
  assert.equal(session.stage, "review");

  const { recommendation, offer } = studioRecommendation(session);
  assert.ok(["ai_automation", "revenue_leak_audit"].includes(recommendation.service), recommendation.service);
  assert.ok(["audit", "intake"].includes(recommendation.nextAction));
  if (offer) {
    // Price/timeline must be the canonical offer's, not conversation-invented.
    assert.ok(serviceOffers.some((item) => item.slug === offer.slug && item.price === offer.price));
  }

  session = reduce(session, { type: "CONFIRM_REVIEW" }, studioPolicy, NOW);
  assert.equal(session.stage, "consent");
  const form = buildIntakeFormData(session, { name: "Sam Client", email: "sam@example.com", websiteOrSocial: "instagram.com/blackline" }, { origin: "test" });
  assert.equal(form.get("companyWebsite"), "", "honeypot must stay empty");
  assert.equal(form.get("conciergeSessionId"), SID);
  assert.equal(form.get("email"), "sam@example.com");
  assert.ok(String(form.get("websiteOrSocial")).startsWith("https://"));
  assert.ok(String(form.get("biggestProblem")).includes("never finish booking"));
  const answers = JSON.parse(String(form.get("conciergeAnswers")));
  assert.equal(answers.problemKind, "lead_followup");
  assert.equal(answers.email, "sam@example.com");
});

test("journey: manual email routing is recognized as workflow automation", () => {
  let session = drive(studioPolicy, [
    { type: "FREE_TEXT", text: "My team keeps manually organizing customer emails and sending them to different employees." },
  ]);
  assert.equal(session.fields.problemKind, "manual_work");
  const first = nextQuestion(session, studioPolicy);
  assert.match(first!.prompt(session), /task repeats/i, "should ask how the work currently repeats");

  session = answerAll(studioPolicy, session, {
    ...STUDIO_ANSWERS,
    branchContext: { value: "Every email is read by the office manager, decided by memory, and forwarded; urgent ones sit for hours.", secondaryValue: "Gmail, Slack" },
  });
  const { recommendation } = studioRecommendation(session);
  assert.equal(recommendation.service, "ai_automation");
  const form = buildIntakeFormData(session, { name: "A", email: "a@b.co", websiteOrSocial: "a.co" }, {});
  assert.equal(form.get("serviceInterest"), "AI Workflow or Front Office");
});

test("journey: 'I need a better website' gathers evidence before prescribing anything", () => {
  const session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "I need a better website." }]);
  assert.equal(session.stage, "clarify", "must ask, not recommend");
  const first = nextQuestion(session, studioPolicy);
  assert.equal(first?.field, "branchContext");
  assert.match(first!.prompt(session), /website today/i, "should ask what the current site fails to do");
});

test("the recommendation card's uncertainty names inferred and missing information", () => {
  const session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "Our site mysite.com isn't converting mobile visitors into bookings" }]);
  const complete = answerAll(studioPolicy, session, STUDIO_ANSWERS);
  const { uncertain } = studioRecommendation(complete);
  assert.ok(uncertain.some((line) => /read from your message/i.test(line)), "inferred fields must be flagged for checking");
});

/* ============================================== founder journeys */

test("journey: creator friction matches Trendi with honest availability and no invented access", () => {
  const extraction = extractPersonalFields("I struggle to turn ideas into things I can actually say on camera.");
  assert.equal(extraction.fields.productSlug, "trendi");

  const session = drive(personalPolicy, [{ type: "FREE_TEXT", text: "I struggle to turn ideas into things I can actually say on camera." }]);
  assert.equal(session.stage, "review");
  const match = buildProductMatch(session);
  assert.ok(match);
  const trendi = getProduct("trendi")!;
  assert.equal(match!.availability, `${stageLabel[trendi.stage]} · ${reachLabel[trendi.reach]}`);
  assert.ok(trendi.notYet.includes(match!.limitation), "limitation must be a canonical honesty line verbatim");
  assert.ok(match!.destination);
  assert.ok(!/testflight/i.test(match!.destination!.href), "must not fabricate beta access");
});

test("journey: layoff + résumé matches Career Forge and routes to the live product without guarantees", () => {
  const session = drive(personalPolicy, [{ type: "FREE_TEXT", text: "I was laid off and need help rebuilding my résumé." }]);
  const match = buildProductMatch(session);
  assert.equal(match?.slug, "career-forge");
  const cf = getProduct("career-forge")!;
  const primary = cf.actions.find((action) => action.primary)!;
  assert.equal(match!.destination!.href, primary.href, "destination must be the product's own primary action");
  assert.ok(!/guarantee|will get you|promise/i.test(`${match!.whyFit} ${match!.who} ${match!.availability}`));
});

test("journey: hiring intent becomes a studio handoff carrying the context, saving nothing", () => {
  const session = drive(personalPolicy, [
    { type: "FREE_TEXT", text: "Could Blake build one of these systems for my tattoo shop?" },
  ]);
  assert.equal(session.intent, "hire");
  assert.equal(session.stage, "review", "hire needs no clarification questions");
  const outcome = personalOutcome(session);
  assert.equal(outcome.kind, "handoff");
  const handoff = buildStudioHandoff(session);
  assert.ok(handoff.carried.includes("Tattoo shop"));
  assert.ok(handoff.carried.includes("build one of these systems"));
  assert.ok(handoff.href.startsWith(`${studio.href}/intake?`));
  assert.ok(handoff.href.includes("context="));
  // Nothing resembling contact data may be collected on this host.
  assert.ok(!("email" in session.fields) && !("name" in session.fields));
});

test("journey: a TestFlight request that cannot be honored gets the canonical status verbatim", () => {
  const session = drive(personalPolicy, [{ type: "FREE_TEXT", text: "Send me the You Know Ball TestFlight link." }]);
  const match = buildProductMatch(session);
  assert.equal(match?.slug, "you-know-ball");
  const ykb = getProduct("you-know-ball")!;
  assert.ok(match!.truthNote, "an unavailable request must be answered, not granted");
  assert.ok(match!.truthNote!.includes(ykb.status), "the truth note must quote the canonical status");
  assert.equal(match!.destination!.href, "/you-know-ball/play", "and offer the real destination");
});

test("journey: 'what is Blake building' answers from the now data", () => {
  const session = drive(personalPolicy, [{ type: "FREE_TEXT", text: "What is Blake working on right now?" }]);
  assert.equal(session.intent, "whats_building");
  const outcome = personalOutcome(session);
  assert.equal(outcome.kind, "now");
  assert.ok(outcome.kind === "now" && outcome.items.length > 0 && outcome.href === "/now");
});

test("no-model guarantee: the entire flow is deterministic modules with no AI import", () => {
  for (const file of [
    "lib/front-office/engine.ts",
    "lib/front-office/extract.ts",
    "lib/front-office/studio-policy.ts",
    "lib/front-office/personal-policy.ts",
    "lib/front-office/storage.ts",
  ]) {
    assert.doesNotMatch(read(file), /concierge\/ai|OPENAI|enhanceWithAI|fetch\(/, `${file} must stay deterministic and I/O-free`);
  }
});

/* ============================================ truth + isolation */

test("every product in the universe is reachable by the matcher and the goal chips", () => {
  const chipQuestion = personalPolicy.questions.find((question) => question.id === "goal")!;
  const chips = chipQuestion.chips!(emptySession("personal", SID, NOW));
  for (const product of products) {
    assert.ok(chips.some((chip) => chip.value === product.slug), `${product.slug} missing from goal chips`);
    const probe = matchProduct(`${product.name} ${product.tagline}`);
    assert.ok(probe, `${product.slug} has no working matcher`);
  }
});

test("the personal policy never imports commercial or concierge modules", () => {
  // Strip comments first — the header legitimately NAMES the modules it must
  // not import. What matters is that no import statement targets them.
  const sources = ["lib/front-office/personal-policy.ts", "lib/front-office/detect.ts"];
  for (const file of sources) {
    const code = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(code, /lib\/commercial|lib\/concierge|lib\/companion/, `${file} breaks host isolation`);
  }
});

test("prices and statuses appear nowhere in the front-office sources", () => {
  // Canonical data must be referenced, never copied. A dollar sign or a
  // stage sentence in these files would be a second source of truth.
  for (const file of ["lib/front-office/studio-policy.ts", "lib/front-office/personal-policy.ts"]) {
    const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(source, /\$\d/, `${file} hardcodes a price`);
    assert.doesNotMatch(source, /uploaded, accepted|internal testers|publicly available/i, `${file} hardcodes a status`);
  }
});

test("question prompts stay short, concrete, and free of filler", () => {
  const probe = emptySession("studio", SID, NOW);
  for (const policy of [studioPolicy, personalPolicy]) {
    for (const question of policy.questions) {
      const prompt = question.prompt({ ...probe, host: policy.host });
      assert.ok(prompt.length <= 90, `${question.id} prompt too long`);
      assert.match(prompt, /\?$/, `${question.id} must ask a question`);
      assert.doesNotMatch(prompt, /tell me more|elaborate|how can i (help|assist)|your needs/i, `${question.id} is filler`);
    }
  }
});

test("contact validation demands a usable reply path", () => {
  assert.deepEqual(validateStudioContact({ name: "A", email: "a@b.co", websiteOrSocial: "instagram.com/a" }), {});
  assert.ok(validateStudioContact({ name: "", email: "bad", websiteOrSocial: "" }).name);
  assert.ok(validateStudioContact({ name: "A", email: "bad", websiteOrSocial: "a.co" }).email);
});

test("the origin note carries host, path, and campaign params — never conversation text", () => {
  const note = originNote({ host: "koinophobialabs.com", pathname: "/services", search: "?utm_source=x&utm_campaign=y&secret=z" });
  assert.ok(note.includes("koinophobialabs.com/services"));
  assert.ok(note.includes("utm_source=x"));
  assert.ok(!note.includes("secret"));
});

test("draft answers map fields one-to-one onto the concierge schema", () => {
  const session = answerAll(
    studioPolicy,
    drive(studioPolicy, [{ type: "FREE_TEXT", text: "Inquiries never get followed up at our salon" }]),
    STUDIO_ANSWERS,
  );
  const answers = draftAnswers(session, { name: "N", email: "n@e.co", websiteOrSocial: "n.co" });
  assert.equal(answers.primaryProblem, session.fields.primaryProblem);
  assert.equal(answers.branchContext, session.fields.branchContext);
  assert.equal(answers.companyWebsite, "");
});

test("the review brief labels every collected field and flags inferences", () => {
  const session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "Our gym's site gym-site.com looks outdated on mobile" }]);
  const brief = studioBrief(session);
  const website = brief.find((line) => line.field === "websiteUrl");
  assert.ok(website?.inferred, "an extracted URL must display as inferred");
  assert.ok(brief.every((line) => line.label && line.editable));
});

/* ==================================================== persistence */

test("sessions round-trip through storage with host separation and TTL", () => {
  const session = drive(studioPolicy, [{ type: "FREE_TEXT", text: "manual data entry is eating our week in the office" }]);
  const raw = JSON.stringify(session);
  assert.deepEqual(parseFrontOfficeSession(raw, "studio", NOW), session);
  assert.equal(parseFrontOfficeSession(raw, "personal", NOW), null, "a studio session must not load on the personal host");
  assert.equal(parseFrontOfficeSession(raw, "studio", NOW + FRONT_OFFICE_TTL_MS + 1), null, "expired sessions must not restore");
  assert.equal(parseFrontOfficeSession("{broken", "studio", NOW), null);
  assert.notEqual(frontOfficeStorageKey("studio"), frontOfficeStorageKey("personal"));
});

test("a session saved mid-submit restores at review, never in a phantom submitting state", () => {
  const submitting = { ...drive(studioPolicy, [{ type: "FREE_TEXT", text: "manual copying of client emails all day" }]), stage: "submitting" as const };
  const restored = parseFrontOfficeSession(JSON.stringify(submitting), "studio", NOW);
  assert.equal(restored?.stage, "review");
});

/* ==================================== usability-audit regression guards */

test("audit A: 'never actually book' classifies as a follow-up problem, no categorization detour", () => {
  assert.equal(
    classifyProblemKind("people message us but half of them never actually book and idk why"),
    "lead_followup",
  );
});

test("audit B: intake-shaped pain classifies, and 'we run a tattoo shop' yields the business type", () => {
  const text = "we run a tattoo shop and my wife has to go through emails and instagram because people leave out size placement references and all kinds of stuff";
  assert.equal(classifyProblemKind(text), "manual_work");
  assert.equal(extractBusinessType(text), "Tattoo shop");
});

test("audit: bare establishment nouns and 'we have/own' phrasings are captured", () => {
  assert.equal(extractBusinessType("could Blake make something like this for my gym"), "Gym");
  assert.equal(extractBusinessType("we have a bakery on the north side"), "Bakery");
});

test("audit E: 'in two weeks' maps to a timeline and the $200 custom app gets the honest refusal", () => {
  assert.equal(extractTimeline("need a full custom app in two weeks"), "This month");
  const session = {
    ...emptySession("studio", SID, NOW),
    fields: {
      problemKind: "custom_product",
      primaryProblem: "need a full custom app in two weeks and my budget is like $200",
      branchContext: "an app for my customers to order ahead",
      impact: "losing orders",
      desiredOutcome: "an app in the store",
      businessName: "Test",
      industry: "Startup",
      budgetRange: "Under $500",
      timeline: "This month",
    },
  };
  const { recommendation } = studioRecommendation(session);
  assert.equal(recommendation.service, "not_a_fit", "This-month urgency must not dodge the feasibility answer");
});

test("audit E: longer runways get a visible mismatch note instead of silence", () => {
  const session = {
    ...emptySession("studio", SID, NOW),
    fields: {
      problemKind: "custom_product",
      primaryProblem: "custom portal for my clients, small budget",
      branchContext: "clients need a portal for uploads and status",
      impact: "hours of email back and forth",
      desiredOutcome: "clients self-serve",
      businessName: "Test",
      industry: "Agency",
      budgetRange: "Under $500",
      timeline: "1-2 months",
    },
  };
  const { mismatch } = studioRecommendation(session);
  assert.ok(mismatch, "an under-budget custom request must be named, not buried");
  assert.doesNotMatch(mismatch!, /unfortunately|sorry/i, "respectful, not apologetic");
});

test("audit J: 'make something like this for my gym' is hiring intent with the context carried", () => {
  const extraction = extractPersonalFields("could Blake make something like this for my gym");
  assert.equal(extraction.intent, "hire");
  assert.equal(extraction.fields.industry, "Gym");
  const session = drive(personalPolicy, [
    { type: "FREE_TEXT", text: "could Blake make something like this for my gym" },
  ]);
  const outcome = personalOutcome(session);
  assert.equal(outcome.kind, "handoff");
  assert.ok(outcome.kind === "handoff" && outcome.handoff.carried.includes("Gym"));
});

test("audit J: the goal chips include a hiring path, and choosing it lands on the handoff", () => {
  const chips = personalPolicy.questions[0].chips!(emptySession("personal", SID, NOW));
  const hireChip = chips.find((chip) => chip.value === "studio");
  assert.ok(hireChip, "a visitor whose phrasing dodges every pattern still needs a hiring chip");
  const session = drive(personalPolicy, [
    { type: "FREE_TEXT", text: "hello" },
    { type: "ANSWER", questionId: "goal", value: "studio" },
  ]);
  assert.equal(personalOutcome(session).kind, "handoff");
});

test("audit F: no-contact language is noticed, acknowledged, and never rendered or submitted", () => {
  const { fields } = extractStudioFields("I'm just looking, don't contact me");
  assert.equal(fields.contactReluctance, "noted");
  const session = { ...emptySession("studio", SID, NOW), fields: { ...fields, primaryProblem: "just looking" } };
  assert.ok(!studioBrief(session).some((line) => line.field === "contactReluctance"), "not a brief line");
  const answers = draftAnswers(session, { name: "T", email: "t@e.co", websiteOrSocial: "t.co" });
  assert.ok(!("contactReluctance" in answers), "never leaves the browser");
});

test("audit: the goal screen leads with the visitor's own words, chips beneath", () => {
  const chat = read("components/front-office/FrontOfficeChat.tsx");
  const goalBlock = chat.slice(chat.indexOf('data-stage="goal"'), chat.indexOf('/* ------------------------------------------------------------ clarify */'));
  assert.ok(goalBlock.indexOf("ffo__ask") < goalBlock.indexOf("ffo__chips"), "free text must render before the intent chips");
  assert.doesNotMatch(chat, /\$\{remaining\} details to go/, "no arithmetic at the visitor");
});

test("audit: 'send' belongs only to the button that sends", () => {
  const studioSource = read("components/front-office/StudioFrontOffice.tsx");
  assert.match(studioSource, /Looks right — continue/);
  assert.match(studioSource, /Send the brief to Blake/);
  assert.doesNotMatch(studioSource, /This is right — send it to Blake/);
  assert.match(studioSource, /from your message/, "the inference flag speaks plain language");
  assert.doesNotMatch(studioSource, />inferred</, "the jargon chip is gone");
});

test("audit: every existing help CTA now lands on the front office at /concierge", () => {
  const page = read("app/concierge/page.tsx");
  assert.match(page, /ConciergePageFlow/);
  const flow = read("components/concierge/ConciergePageFlow.tsx");
  assert.ok(flow.indexOf("StudioFrontOffice") < flow.indexOf("seven-question"), "front office leads; steps remain a toggle");
  assert.match(flow, /mode === "steps"/, "the step-by-step flow stays directly linkable");
});

test("audit: a plain tap on the studio koi opens the conversation, not a launcher", () => {
  const companion = read("components/companion/KoiCompanion.tsx");
  assert.match(companion, /: "front_office"\);/, "trigger taps must land on the front office");
});

test("audit: the personal koi wears a visible label while resting", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.match(koi, /devkoi__label/);
  assert.match(koi, /Ask the koi</);
  const css = read("app/dev-koi.css");
  assert.match(css, /\.devkoi__label/);
});

test("missing required fields drive the clarify loop until complete", () => {
  let session = drive(studioPolicy, [{ type: "SELECT_INTENT", intent: "not_sure" }]);
  assert.ok(missingFields(session, studioPolicy).length > 0);
  session = answerAll(studioPolicy, session, STUDIO_ANSWERS);
  assert.equal(missingFields(session, studioPolicy).length, 0);
  assert.equal(session.stage, "review");
});
