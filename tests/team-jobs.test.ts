import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  deadlineFor,
  onboardingInput,
  jobAlerts,
  deliveryReady,
  fixBrief,
  type Job,
} from "../lib/team/jobs-domain";
import { newJobCode } from "../lib/team/jobs-store";
import { resolvedFinding, verifyJobPass } from "../lib/team/jobs-verification";
import { jobMessage, drainJobMail } from "../lib/team/jobs-mail";
import type { Audit, Rendered } from "@koinophobia/site-auditor";
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=";
const finding = {
  check: "Dead contact / booking / order link",
  key: "http-404",
  url: "https://example.test/book",
  measurement: "Fake Book button returns HTTP 404.",
  confidence: "confirmed",
  proof: { image, captured_at: "2026-11-10T10:00:00Z" },
};
const job = (): Job => ({
  id: "job",
  payment_id: "payment",
  proposal_id: "proposal",
  partner_id: "partner",
  deal_id: "deal",
  business: "Fictional Workshop",
  website: "https://example.test",
  offer: "fix",
  stage: "Waiting on client access",
  paid_at: "2026-11-10T10:00:00Z",
  deadline: "2026-11-13T10:00:00Z",
  access_since: "2026-11-10T10:00:00Z",
  code: newJobCode(),
  code_expires_at: "2026-12-10T10:00:00Z",
  revision: 0,
  verification: [],
  verification_due_at: null,
  data: { buyer_email: "fake@example.test", findings: [finding] },
});
const audit = (): Audit => ({
  run_id: "test",
  version: "test",
  url: finding.url,
  final_url: finding.url,
  measured_at: new Date().toISOString(),
  findings: [],
  observations: [],
  notes: [],
  samples: [
    { lcp: 1000, load: 1000 },
    { lcp: 1000, load: 1000 },
    { lcp: 1000, load: 1000 },
  ],
  home: {
    status: 200,
    url: finding.url,
    text: "Book your appointment",
    title: "Booking",
    heading: "Book",
    proof: { image, captured_at: new Date().toISOString() },
    screen: 390,
    width: 390,
    overflow: 0,
    overlaps: 0,
    scale: 1,
    mixedBroken: 0,
  } as Rendered,
});
test("elapsed deadlines survive DST; custom jobs require quote deadline", () => {
  assert.equal(
    deadlineFor("fix", "2026-11-01T05:00:00Z"),
    "2026-11-04T05:00:00.000Z",
  );
  assert.equal(
    deadlineFor("tune-up", "2026-11-01T05:00:00Z"),
    "2026-11-08T05:00:00.000Z",
  );
  assert.equal(deadlineFor("new-site", new Date()), null);
  assert.equal(
    deadlineFor("new-site", new Date(), "2026-12-01T00:00:00Z"),
    "2026-12-01T00:00:00.000Z",
  );
});
test("unguessable unique codes and no password fields or credential payload", () => {
  assert.equal(new Set(Array.from({ length: 1000 }, newJobCode)).size, 1000);
  assert.match(newJobCode(), /^[\w-]{43}$/);
  const src = readFileSync("components/team/Onboarding.tsx", "utf8");
  assert.doesNotMatch(src, /type=["']password/);
  assert.match(src, /Never send passwords/);
  assert.throws(() => onboardingInput({ password: "not-stored" }));
  assert.throws(() => onboardingInput({ platform: "wrong", contact: "Fake" }));
  assert.equal(
    onboardingInput({
      platform: "Wix",
      contact: "Fake Client",
      access: "Invite sent",
    }).access,
    "Invite sent",
  );
});
test("24h alerts, overdue, access nudge and refund-review have exact boundaries", () => {
  const j = job();
  assert.deepEqual(jobAlerts(j, Date.parse(j.paid_at) + 86400000 - 1), []);
  assert.deepEqual(jobAlerts(j, Date.parse(j.paid_at) + 86400000), ["access"]);
  assert.deepEqual(jobAlerts(j, Date.parse(j.deadline!) - 86400000), [
    "due-soon",
    "access",
  ]);
  assert.deepEqual(jobAlerts(j, Date.parse(j.deadline!)), [
    "overdue",
    "access",
  ]);
  assert.ok(
    jobAlerts(j, Date.parse(j.paid_at) + 7 * 86400000).includes(
      "refund-review",
    ),
  );
  j.stage = "Delivered";
  assert.deepEqual(jobAlerts(j, Date.now()), []);
});
test("absence of findings cannot pass bot blocks, missing measurements, unknown checks or reproduced problems", () => {
  assert.equal(resolvedFinding(finding, audit()), true);
  for (const patch of [
    { error: "unavailable" },
    { incomplete: true },
    { status: 403 },
    { proof: undefined },
    { title: "Just a moment...", text: "Checking your browser" },
  ]) {
    const a = audit();
    Object.assign(a.home!, patch);
    assert.equal(resolvedFinding(finding, a), false);
  }
  const a = audit();
  a.findings = [
    { ...finding, confidence: "couldn't verify" } as Audit["findings"][0],
  ];
  assert.equal(resolvedFinding(finding, a), false);
  assert.equal(
    resolvedFinding({ ...finding, check: "Unknown future check" }, audit()),
    false,
  );
});
test("each purchased exact URL is checked and after screenshot retained", async () => {
  const j = job();
  let called = "";
  const r = await verifyJobPass(j, async (url) => {
    called = url;
    return audit();
  });
  assert.equal(called, finding.url);
  assert.equal(r.ok, true);
  assert.equal(r.proofs[0].image, image);
});
test("delivery requires two successful fresh checks separated by ten minutes and matching proof count", () => {
  const j = job(),
    now = Date.now();
  j.stage = "Verified";
  const pass = (at: number) => ({
    ok: true,
    at: new Date(at).toISOString(),
    reason: "",
    proofs: [
      { url: finding.url, image, captured_at: new Date(at).toISOString() },
    ],
  });
  j.verification = [pass(now - 600000), pass(now)];
  assert.equal(deliveryReady(j, now), true);
  j.verification[0].ok = false;
  assert.equal(deliveryReady(j, now), false);
  j.verification[0] = pass(now - 599999);
  assert.equal(deliveryReady(j, now), false);
  j.verification[0] = pass(now - 600000);
  assert.equal(deliveryReady(j, now + 86400000), false);
});
test("only paying buyer gets onboarding and handoff; internal alerts go only to Blake; no network sends in tests", async () => {
  const j = job();
  assert.equal(jobMessage(j, "next").to, "fake@example.test");
  assert.match(jobMessage(j, "next").text, /Never send passwords/);
  assert.equal(jobMessage(j, "overdue").to, "blake@koinophobialabs.com");
  j.verification = [
    { ok: true, at: "", reason: "", proofs: [] },
    {
      ok: true,
      at: "",
      reason: "",
      proofs: [{ url: finding.url, image, captured_at: "" }],
    },
  ];
  const fixed = jobMessage(j, "fixed");
  assert.equal(fixed.attachments?.length, 2);
  assert.match(fixed.text, /\/pay\/care/);
  let calls = 0;
  await drainJobMail(
    {
      query: async () => {
        calls++;
        return { rows: [] };
      },
    },
    async () => {
      throw Error("Must never send");
    },
  );
  assert.equal(calls, 0);
  assert.match(
    fixBrief({ ...j, data: { ...j.data, platform: "Wix" } })[0],
    /Wix Editor/,
  );
});
