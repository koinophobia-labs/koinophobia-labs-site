import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/concierge/evaluate/route";
import { checkConciergeRateLimit, resetConciergeApiStateForTests } from "../lib/concierge/api-state";
import { isTrustedMutationRequest } from "../lib/security/origin";

const answers = {
  problemKind: "website",
  primaryProblem: "The current website is unclear and visitors do not complete the inquiry form.",
  branchContext: "Mobile visitors cannot quickly understand the offer or find the right call to action.",
  impact: "Qualified traffic is not becoming a dependable stream of inquiries.",
  currentTools: "WordPress, Google Analytics",
  desiredOutcome: "Create a clear mobile-first path from visit to qualified inquiry.",
  businessName: "API Test Co",
  industry: "Professional services",
  websiteUrl: "https://example.com",
  budgetRange: "$1,500-$3,500",
  timeline: "1-2 months",
  name: "API Tester",
  email: "api@example.com",
  companyWebsite: "",
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://example.com/api/concierge/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://example.com", ...headers },
    body: JSON.stringify(body),
  });
}

test("evaluation API validates and returns a deterministic recommendation without an AI key", async () => {
  resetConciergeApiStateForTests();
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const response = await POST(request({ sessionId: "00000000-0000-4000-8000-000000000010", currentStep: "complete", answers }));
  const payload = await response.json();
  if (previous) process.env.OPENAI_API_KEY = previous;
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.evaluation.source, "deterministic");
  assert.equal(payload.evaluation.recommendation.service, "website_rebuild");
});

test("evaluation API rejects invalid, honeypot, and cross-site requests", async () => {
  resetConciergeApiStateForTests();
  assert.equal((await POST(request({}))).status, 422);
  assert.equal((await POST(request({ sessionId: "00000000-0000-4000-8000-000000000011", currentStep: "complete", answers: { ...answers, companyWebsite: "spam.example" } }))).status, 400);
  assert.equal((await POST(request({ sessionId: "00000000-0000-4000-8000-000000000012", currentStep: "complete", answers }, { "sec-fetch-site": "cross-site" }))).status, 403);
});

test("same-origin validation works behind a trusted reverse proxy without allowing cross-site requests", () => {
  const proxied = new NextRequest("http://localhost:3000/api/concierge/evaluate", {
    method: "POST",
    headers: { origin: "https://koinophobialabs.com", host: "localhost:3000", "x-forwarded-host": "koinophobialabs.com", "x-forwarded-proto": "https" },
  });
  assert.equal(isTrustedMutationRequest(proxied), true);
  const crossSite = new NextRequest("https://koinophobialabs.com/api/concierge/evaluate", {
    method: "POST",
    headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
  });
  assert.equal(isTrustedMutationRequest(crossSite), false);
});

test("evaluation API deduplicates a repeated session and answer set", async () => {
  resetConciergeApiStateForTests();
  const body = { sessionId: "00000000-0000-4000-8000-000000000013", currentStep: "complete", answers };
  const first = await (await POST(request(body))).json();
  const second = await (await POST(request(body))).json();
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.deepEqual(second.evaluation.recommendation, first.evaluation.recommendation);
});

test("evaluation API accepts a strict Responses API enhancement without changing the deterministic route", async () => {
  resetConciergeApiStateForTests();
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  const content = JSON.stringify({
    qualificationSummary: "API Test Co needs a clearer mobile conversion path before qualified visitors can reliably become inquiries.",
    primaryProblem: "The current website does not convert qualified visitors.",
    impact: "Qualified traffic is being lost.",
    desiredOutcome: "Create a dependable inquiry path.",
    currentTools: ["WordPress", "Google Analytics"],
  });
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.text.format.type, "json_schema");
    return Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: content }] }] });
  };
  try {
    const response = await POST(request({ sessionId: "00000000-0000-4000-8000-000000000014", currentStep: "complete", answers }));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.evaluation.source, "ai_assisted");
    assert.equal(payload.evaluation.recommendation.service, "website_rebuild");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("evaluation API falls back safely when the AI provider is unavailable", async () => {
  resetConciergeApiStateForTests();
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  try {
    const response = await POST(request({ sessionId: "00000000-0000-4000-8000-000000000015", currentStep: "complete", answers }));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.evaluation.source, "fallback");
    assert.equal(payload.evaluation.recommendation.service, "website_rebuild");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("evaluation rate limiter caps a public client within its window", () => {
  resetConciergeApiStateForTests();
  for (let index = 0; index < 12; index += 1) assert.equal(checkConciergeRateLimit("rate-test", 1000), false);
  assert.equal(checkConciergeRateLimit("rate-test", 1000), true);
  assert.equal(checkConciergeRateLimit("rate-test", 1000 + 10 * 60 * 1000), false);
});
