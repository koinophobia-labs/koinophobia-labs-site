import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/team/seed";
import {
  quoteDraft,
  transition,
  commission,
  cents,
  scoped,
  getDeal,
} from "../lib/team/domain";
test("unpaid quote owes zero, money uses integer cents", () => {
  const d = seed(true);
  assert.equal(commission(d, d.deals[0]).owed, 0);
  for (const v of [-1, 0, 0.5, NaN, Infinity, "100"])
    assert.throws(() => cents(v));
});
test("40 percent rounds aggregate cents, payouts reduce owed and overrides stay disabled", () => {
  const d = seed(true);
  d.payments.push(
    { id: "x", deal_id: "deal-0", amount: 1, received_at: "" },
    { id: "y", deal_id: "deal-0", amount: 1, received_at: "" },
  );
  d.partners[1].override_rate = 0.1;
  assert.equal(commission(d, d.deals[0]).earned, 1);
  assert.equal(commission(d, d.deals[0]).override, 0);
  assert.equal(commission(d, d.deals[1]).owed, 20000);
});
test("scoped reads exclude other partners and credential hashes", () => {
  const d = seed(true);
  d.partners[1].code_hash = "fake";
  assert.equal(scoped(d, d.partners[1]).deals.length, 3);
  assert.ok(!scoped(d, d.partners[1]).partners[0].code_hash);
  assert.throws(() => getDeal(d, d.partners[2], "deal-0"));
});
test("pipeline requires sequential stages and approval before quote sent", () => {
  const d = seed(true),
    deal = d.deals[2],
    p = d.partners[1];
  assert.throws(() => transition(d, p, deal, "Won"));
  transition(d, p, deal, "Site check sent");
  assert.throws(() => transition(d, p, deal, "Quote sent"), /approve/);
});
test("lost requires reason and closed deals are terminal", () => {
  const d = seed(true),
    deal = d.deals[0],
    p = d.partners[1];
  assert.throws(() => transition(d, p, deal, "Lost"));
  transition(d, p, deal, "Lost", "No budget");
  assert.equal(deal.lost_reason, "No budget");
  assert.throws(() => transition(d, p, deal, "Lead"), /closed/);
});
test("received payments prevent marking a deal lost; delivery is owner-only", () => {
  const d = seed(true),
    deal = d.deals[1];
  assert.throws(
    () => transition(d, d.partners[0], deal, "Lost", "test"),
    /received/,
  );
  assert.throws(
    () => transition(d, d.partners[1], deal, "Delivered"),
    /Only Blake/,
  );
  transition(d, d.partners[0], deal, "Delivered");
  assert.equal(deal.stage, "Delivered");
});
test("bundle distinguishes initial charge and recurring cadence; custom work has no invented price", () => {
  const q = quoteDraft(["fix", "care"]);
  assert.equal(q.price, 39800);
  assert.equal(q.monthly, 9900);
  assert.equal(quoteDraft(["app", "fix"]).price, null);
  for (const input of [[], ["ghost"], ["fix", "fix"]])
    assert.throws(() => quoteDraft(input));
});
