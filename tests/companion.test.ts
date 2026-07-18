import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  ambientDrift,
  clampOffset,
  COMPANION_DRIFT_RADIUS,
  COMPANION_MAX_OFFSET,
  COMPANION_PROXIMITY_NUDGE,
  COMPANION_PROXIMITY_RADIUS,
  COMPANION_SCROLL_NUDGE,
  pointerInfluence,
  resolveCompanionMotionState,
  scrollInfluence,
} from "../lib/companion/motion";
import { companionHostAllowed, resolveCompanionPageContext } from "../lib/companion/page-context";
import { answerSiteQuestion, SITE_HELP_TOPICS } from "../lib/companion/site-help";
import {
  answerGroundedQuestion,
  compareServices,
  KNOWN_SERVICES,
  pageBrief,
  relevantWork,
  smallestNextStep,
} from "../lib/companion/site-knowledge";
import { serviceOffers, studioConfig, workProjects } from "../lib/commercial";
import {
  canShowCompanionInvitation,
  COMPANION_DISMISSAL_MS,
  COMPANION_INVITATION_COOLDOWN_MS,
  dismissCompanionInvitation,
  emptyCompanionSession,
  parseCompanionSession,
  recordCompanionInvitation,
} from "../lib/companion/session";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("page context enables intentional studio routes with deterministic copy", () => {
  const expected = new Map([
    ["/", "home"],
    ["/services", "services"],
    ["/work", "work"],
    ["/work/blackline-ritual", "work_detail"],
    ["/products", "products"],
    ["/audit", "audit"],
    ["/intake", "intake"],
    ["/demos/tattoo-studio", "demo"],
  ]);
  for (const [route, routeKey] of expected) {
    const context = resolveCompanionPageContext(route);
    assert.equal(context.enabled, true, route);
    assert.equal(context.routeKey, routeKey, route);
    assert.ok(context.invitationDelayMs >= 6_000, route);
    assert.ok(context.actions.some((action) => action.id === "concierge"), route);
  }
});

test("internal, personal, payment, product-demo, and dedicated concierge routes are suppressed", () => {
  for (const route of ["/crm", "/crm/leads/abc", "/crm/login", "/payment/success", "/payment/cancelled", "/api/intake", "/concierge", "/home", "/connect", "/resume", "/now", "/trendi", "/you-know-ball/play", "/unknown"]) {
    assert.equal(resolveCompanionPageContext(route).enabled, false, route);
  }
});

test("the studio host is explicit and local QA remains possible", () => {
  assert.equal(companionHostAllowed("koinophobialabs.com"), true);
  assert.equal(companionHostAllowed("www.koinophobialabs.com"), true);
  assert.equal(companionHostAllowed("koinophobia-labs-git-codex-196e0a-koinophobia999-8829s-projects.vercel.app"), true);
  assert.equal(companionHostAllowed("koinophobia-labs.vercel.app"), true);
  assert.equal(companionHostAllowed("localhost"), true);
  assert.equal(companionHostAllowed("koinophobia.dev"), false);
  assert.equal(companionHostAllowed("koinophobia-dev-git-main-example.vercel.app"), false);
  assert.equal(companionHostAllowed("example.com"), false);
});

test("companion session parsing migrates invalid versions to safe defaults", () => {
  const fallback = emptyCompanionSession();
  assert.deepEqual(parseCompanionSession(null), fallback);
  assert.deepEqual(parseCompanionSession('{"version":2,"hidden":true}'), fallback);
  const parsed = parseCompanionSession(JSON.stringify({ version: 1, hidden: false, minimized: false, invitationCount: 99, lastInvitationAt: 12, lastInvitationRoute: "services", dismissedUntil: 14 }));
  assert.equal(parsed.minimized, false);
  assert.equal(parsed.invitationCount, 2);
  assert.equal(parsed.lastInvitationRoute, "services");
});

test("invitation frequency caps, route deduplication, cooldown, and dismissal are deterministic", () => {
  const now = 1_000_000;
  const initial = emptyCompanionSession();
  assert.equal(canShowCompanionInvitation(initial, "home", now), true);
  const first = recordCompanionInvitation(initial, "home", now);
  assert.equal(canShowCompanionInvitation(first, "home", now + COMPANION_INVITATION_COOLDOWN_MS + 1), false);
  assert.equal(canShowCompanionInvitation(first, "services", now + COMPANION_INVITATION_COOLDOWN_MS - 1), false);
  assert.equal(canShowCompanionInvitation(first, "services", now + COMPANION_INVITATION_COOLDOWN_MS + 1), true);
  const second = recordCompanionInvitation(first, "services", now + COMPANION_INVITATION_COOLDOWN_MS + 1);
  assert.equal(canShowCompanionInvitation(second, "work", now + 2 * COMPANION_INVITATION_COOLDOWN_MS + 2), false);
  const dismissed = dismissCompanionInvitation(first, now);
  assert.equal(dismissed.dismissedUntil, now + COMPANION_DISMISSAL_MS);
  assert.equal(canShowCompanionInvitation(dismissed, "services", now + COMPANION_INVITATION_COOLDOWN_MS + 1), false);
});

test("motion state prioritizes interaction and reduced motion without randomness", () => {
  assert.equal(resolveCompanionMotionState({ open: true, invitationVisible: true, reducedMotion: true, ambientState: "sleeping" }), "listening");
  assert.equal(resolveCompanionMotionState({ open: false, invitationVisible: true, reducedMotion: true, ambientState: "sleeping" }), "inviting");
  assert.equal(resolveCompanionMotionState({ open: false, invitationVisible: false, reducedMotion: true, ambientState: "noticing" }), "resting");
  assert.equal(resolveCompanionMotionState({ open: false, invitationVisible: false, reducedMotion: false, ambientState: "sleeping" }), "sleeping");
  assert.doesNotMatch(read("components/companion/KoiCompanion.tsx"), /Math\.random/);
});

test("basic site questions use deterministic published answers", () => {
  assert.ok(SITE_HELP_TOPICS.length >= 8);
  const pricing = answerSiteQuestion("How much does a website project cost?");
  assert.equal(pricing.id, "pricing");
  assert.equal(pricing.matched, true);
  assert.match(pricing.answer, /Final scope, price, and timing are confirmed by Blake/);
  const audit = answerSiteQuestion("What is the revenue leak audit?");
  assert.equal(audit.id, "audit");
  assert.equal(audit.href, "/audit");
  const unknown = answerSiteQuestion("Can you tell me the weather?");
  assert.equal(unknown.matched, false);
  assert.equal(unknown.href, "/concierge");
});

test("the global companion mounts once and lazy-loads the existing shared concierge", () => {
  const layout = read("app/layout.tsx");
  const companion = read("components/companion/KoiCompanion.tsx");
  const panel = read("components/companion/KoiCompanionPanel.tsx");
  const flow = read("components/concierge/ConciergeFlow.tsx");
  assert.equal((layout.match(/<KoiCompanion\s*\/>/g) || []).length, 1);
  assert.match(companion, /dynamic\(\(\) => import\("@\/components\/companion\/KoiCompanionPanel"\)/);
  assert.match(panel, /dynamic\(\(\) => import\("@\/components\/concierge\/ConciergeFlow"\)/);
  assert.match(panel, /<ConciergeFlow entry=/);
  assert.match(flow, /CONCIERGE_STORAGE_KEY/);
  assert.match(flow, /saveDraft\(\{ version: 1, sessionId, savedAt: Date\.now\(\), step, stage: "questions", answers: next \}\)/);
});

test("keyboard, focus, dismissal, reduced-motion, print, and safe-area protections are present", () => {
  const companion = read("components/companion/KoiCompanion.tsx");
  const panel = read("components/companion/KoiCompanionPanel.tsx");
  const css = read("app/koi-companion.css");
  assert.match(companion, /aria-label=.*Open Koinophobia Labs site guide/);
  assert.match(companion, /pointermove/);
  assert.match(companion, /translate3d/);
  // Anchored motion, not cursor chasing: the controller must use the bounded
  // influence helpers and must NOT set its target from raw pointer coordinates.
  assert.match(companion, /pointerInfluence/);
  assert.match(companion, /clampOffset/);
  assert.match(companion, /scrollInfluence/);
  assert.doesNotMatch(companion, /targetX = desiredCenterX|event\.clientX \+/);
  assert.match(companion, /Math\.atan2/);
  assert.match(companion, /shortestTurn/);
  assert.match(companion, /--koi-heading/);
  assert.match(companion, /koi-companion-trigger__steer/);
  assert.doesNotMatch(css, /koi-companion-trigger::before/);
  assert.match(css, /koi-companion-swim/);
  assert.match(css, /koi-companion-tail/);
  assert.match(css, /rotate\(var\(--koi-heading/);
  assert.match(companion, /aria-haspopup="dialog"/);
  assert.match(panel, /event\.key === "Escape"/);
  assert.match(panel, /event\.key !== "Tab"/);
  assert.match(panel, /triggerRef|onClose/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media print/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /100dvh/);
});

test("companion analytics remain categorical and exclude visitor answers", () => {
  const companionSources = read("components/companion/KoiCompanion.tsx") + read("components/companion/KoiCompanionPanel.tsx");
  for (const event of [
    "koi_companion_viewed",
    "koi_companion_invitation_shown",
    "koi_companion_invitation_dismissed",
    "koi_companion_opened",
    "koi_companion_minimized",
    "koi_companion_action_selected",
    "koi_site_question_answered",
    "koi_companion_page_understood",
    "koi_companion_services_compared",
    "koi_companion_relevant_work_selected",
  ]) assert.match(companionSources, new RegExp(event));
  assert.doesNotMatch(companionSources, /businessName|primaryProblem|desiredOutcome|contactEmail|websiteUrl/);
  // The relevant-work finder must never send the visitor's free-text intent.
  assert.doesNotMatch(companionSources, /trackStudioEvent\([^)]*workIntent/);
});

// --- Grounded site knowledge (audit U1–U3, C2) ---------------------------

test("site knowledge is derived from commercial.ts, not hand-typed", () => {
  assert.equal(KNOWN_SERVICES.length, serviceOffers.length);
  for (const service of KNOWN_SERVICES) {
    const source = serviceOffers.find((offer) => offer.slug === service.slug);
    assert.ok(source, service.slug);
    assert.equal(service.price, source.price);
    assert.equal(service.timeline, source.timeline);
  }
  // Pricing answer reflects live studioConfig numbers, not literals.
  const pricing = answerGroundedQuestion("how much does a website cost");
  assert.ok(pricing.answer.includes(studioConfig.auditPrice));
  assert.ok(pricing.answer.includes(studioConfig.websiteRange));
});

test("service comparison is grounded and steers uncertainty to the audit", () => {
  const cmp = compareServices("audit", "website");
  assert.ok(cmp);
  assert.equal(cmp.a.slug, "audit");
  assert.equal(cmp.b.slug, "website");
  assert.match(cmp.recommendation, new RegExp(studioConfig.auditPrice.replace("$", "\\$")));
  // Identical or unknown slugs return null rather than a fabricated comparison.
  assert.equal(compareServices("audit", "audit"), null);
  assert.equal(compareServices("audit", "not-a-service"), null);
});

test("relevant work ranks concept builds by real capability signal", () => {
  const matches = relevantWork("messy inquiries routing and structured intake");
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].slug, "blackline-ritual"); // structured intake project
  assert.ok(matches.every((match) => workProjects.some((project) => project.slug === match.slug)));
  assert.ok(matches.every((match) => match.href === `/work/${match.slug}`));
});

test("page briefs and next steps are page-specific and non-empty", () => {
  const services = pageBrief("services");
  assert.ok(services.facts.length >= serviceOffers.length);
  const workDetail = pageBrief("work_detail", "blackline-ritual");
  assert.match(workDetail.summary, /Blackline Ritual/);
  // Smallest next step for proof pages points at a service, not a forced build.
  assert.equal(smallestNextStep("work").href, "/services");
  assert.match(smallestNextStep("audit").href, /audit/);
});

test("routes expose distinct, page-appropriate copilot intents", () => {
  assert.deepEqual(resolveCompanionPageContext("/services").copilot, ["understand", "compare", "next_step"]);
  assert.deepEqual(resolveCompanionPageContext("/work").copilot, ["understand", "relevant_work", "next_step"]);
  assert.deepEqual(resolveCompanionPageContext("/products").copilot, ["understand", "next_step"]);
  // Work-detail carries the slug so answers can name the project.
  assert.equal(resolveCompanionPageContext("/work/blackline-ritual").slug, "blackline-ritual");
});

// --- Motion is anchored, never a cursor follower (audit M1) ----------------

test("pointer influence is capped and vanishes beyond the proximity radius", () => {
  const anchor = { x: 1000, y: 700 };
  // Cursor far away → zero influence (no chasing).
  const far = pointerInfluence({ x: 100, y: 100 }, anchor);
  assert.equal(far.active, false);
  assert.equal(far.x, 0);
  assert.equal(far.y, 0);
  // Cursor extremely close → still bounded by the nudge cap.
  const near = pointerInfluence({ x: 1002, y: 701 }, anchor);
  assert.ok(near.active);
  assert.ok(Math.hypot(near.x, near.y) <= COMPANION_PROXIMITY_NUDGE + 1e-9);
  // Across a sweep of distances, displacement never exceeds the cap.
  for (let d = 1; d < COMPANION_PROXIMITY_RADIUS * 2; d += 7) {
    const infl = pointerInfluence({ x: anchor.x - d, y: anchor.y }, anchor);
    assert.ok(Math.hypot(infl.x, infl.y) <= COMPANION_PROXIMITY_NUDGE + 1e-9, `d=${d}`);
  }
});

test("total offset, drift, and scroll influence stay within hard caps", () => {
  assert.ok(COMPANION_DRIFT_RADIUS < COMPANION_MAX_OFFSET);
  const clamped = clampOffset(999, -999);
  assert.ok(Math.hypot(clamped.x, clamped.y) <= COMPANION_MAX_OFFSET + 1e-9);
  const small = clampOffset(3, 4);
  assert.deepEqual(small, { x: 3, y: 4 });
  for (let t = 0; t < 20000; t += 137) {
    const drift = ambientDrift(t);
    assert.ok(Math.hypot(drift.x, drift.y) <= COMPANION_DRIFT_RADIUS + 1e-9, `t=${t}`);
  }
  assert.ok(Math.abs(scrollInfluence(9999)) <= COMPANION_SCROLL_NUDGE + 1e-9);
  assert.ok(Math.abs(scrollInfluence(-9999)) <= COMPANION_SCROLL_NUDGE + 1e-9);
  assert.equal(Math.sign(scrollInfluence(100)), -1); // scroll down → koi rises
});

test("the motion controller never targets raw pointer coordinates", () => {
  const companion = read("components/companion/KoiCompanion.tsx");
  assert.doesNotMatch(companion, /event\.clientX \+|desiredCenterX/);
  assert.match(companion, /pointerInfluence/);
  assert.match(companion, /clampOffset/);
});
