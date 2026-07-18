import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveCompanionMotionState } from "../lib/companion/motion";
import { companionHostAllowed, resolveCompanionPageContext } from "../lib/companion/page-context";
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
    assert.ok(context.invitationDelayMs >= 12_000, route);
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
  assert.equal(companionHostAllowed("localhost"), true);
  assert.equal(companionHostAllowed("koinophobia.dev"), false);
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
  assert.match(companion, /aria-label=.*Open project concierge/);
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
  for (const event of ["koi_companion_viewed", "koi_companion_invitation_shown", "koi_companion_invitation_dismissed", "koi_companion_opened", "koi_companion_minimized", "koi_companion_action_selected"]) assert.match(companionSources, new RegExp(event));
  assert.doesNotMatch(companionSources, /businessName|primaryProblem|desiredOutcome|contactEmail|websiteUrl/);
});
