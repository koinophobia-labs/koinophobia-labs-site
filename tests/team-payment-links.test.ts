import test from "node:test";
import assert from "node:assert/strict";
import type { Deal } from "../lib/team/types";
import { quotePaymentLink } from "../lib/team/payment-links";
const deal: Deal = {
  id: "deal_123",
  partner_id: "partner-123",
  lead_id: "lead-123",
  services: ["fix"],
  price: 29900,
  monthly: 0,
  approved: true,
  scope: "One fix",
  stage: "Quote sent",
  lost_reason: "",
  created_at: "",
  updated_at: "",
};
for (const [service, path, price, monthly] of [
  ["fix", "fix", 29900, 0],
  ["tune", "tune-up", 75000, 0],
  ["care", "care", 9900, 9900],
] as const)
  test(`${service} creates attributed production link`, () => {
    assert.equal(
      quotePaymentLink({ ...deal, services: [service], price, monthly }),
      `https://koinophobialabs.com/pay/${path}?partner=partner-123&deal=deal_123`,
    );
  });
test("unapproved, custom, bundled, changed-price, paid and malformed deals have no link", () => {
  for (const changes of [
    { approved: false },
    { services: ["site"], price: 250000 },
    { services: ["fix", "care"] },
    { price: 1 },
    { monthly: 9900 },
    { partner_id: "x&deal=other" },
    { id: "a".repeat(81) },
    { stage: "Client paid" as const },
    { stage: "Delivered" as const },
    { stage: "Lost" as const },
  ])
    assert.equal(quotePaymentLink({ ...deal, ...changes }), null);
});
