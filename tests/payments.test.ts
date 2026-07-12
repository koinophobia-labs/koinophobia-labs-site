import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { POST as createPaymentRoute } from "../app/api/crm/proposals/[id]/payments/route";
import { POST as webhookRoute } from "../app/api/stripe/webhook/route";
import {
  calculatePaymentAmount,
  createCheckout,
  processStripeEvent,
  type PaymentContext,
  type Queryable,
} from "../lib/payments";

const context: PaymentContext = {
  proposalId: "p1",
  leadId: "l1",
  proposalStatus: "accepted",
  proposalTitle: "Website build",
  total: 100000,
  amountPaid: 0,
  businessName: "Client",
  email: "client@example.com",
};
test("accepted proposals calculate deterministic deposit and remaining balance", () => {
  assert.equal(calculatePaymentAmount(context, "deposit"), 50000);
  assert.equal(
    calculatePaymentAmount({ ...context, amountPaid: 50000 }, "balance"),
    50000,
  );
  assert.throws(
    () =>
      calculatePaymentAmount({ ...context, proposalStatus: "sent" }, "deposit"),
    /PROPOSAL_NOT_ACCEPTED/,
  );
  assert.throws(
    () => calculatePaymentAmount(context, "deposit", 100001),
    /INVALID_PAYMENT_AMOUNT/,
  );
});
test("checkout creation uses server totals and durable metadata", async () => {
  const now = new Date(),
    queries: string[] = [],
    q = {
      query: async (sql: string, values: unknown[] = []) => {
        queries.push(sql);
        if (sql.startsWith("select p.id"))
          return {
            rows: [
              {
                proposal_id: "p1",
                lead_id: "l1",
                proposal_status: "accepted",
                proposal_title: "Website build",
                total: 100000,
                amount_paid: 0,
                business_name: "Client",
                email: "client@example.com",
              },
            ],
          };
        if (sql.startsWith("select * from crm_payments")) return { rows: [] };
        if (sql.startsWith("update crm_payments set stripe"))
          return {
            rows: [
              {
                id: values[2],
                proposal_id: "p1",
                lead_id: "l1",
                kind: "deposit",
                status: "pending",
                amount: 50000,
                currency: "usd",
                stripe_checkout_session_id: "cs_test",
                stripe_payment_intent_id: null,
                checkout_url: "https://checkout.stripe.test",
                created_at: now,
                updated_at: now,
              },
            ],
          };
        if (sql.startsWith("select coalesce"))
          return { rows: [{ paid: 0, pending: true, refunded: false }] };
        if (sql.startsWith("select total"))
          return { rows: [{ total: 100000 }] };
        return { rows: [] };
      },
    } as Queryable;
  let options: unknown;
  const client = {
    checkout: {
      sessions: {
        create: async (input: unknown, o: unknown) => {
          options = { input, o };
          return { id: "cs_test", url: "https://checkout.stripe.test" };
        },
      },
    },
  } as never;
  const payment = await createCheckout(
    "p1",
    { kind: "deposit" },
    "https://example.com",
    q,
    client,
  );
  assert.equal(payment.amount, 50000);
  assert.match(JSON.stringify(options), /paymentId/);
  assert.ok(queries.some((x) => x.includes("insert into crm_payments")));
});
test("webhook processing is idempotent", async () => {
  let calls = 0;
  const q = {
    query: async (sql: string) => {
      calls++;
      if (sql.startsWith("insert into stripe_webhook_events"))
        return { rows: [] };
      throw Error("duplicate should stop");
    },
  } as Queryable;
  const result = await processStripeEvent(
    { id: "evt_1", type: "checkout.session.completed" } as Stripe.Event,
    q,
  );
  assert.equal(result.duplicate, true);
  assert.equal(calls, 1);
});
test("payment creation requires CRM authentication",async()=>{const r=await createPaymentRoute(new NextRequest("https://example.com/api/crm/proposals/p1/payments",{method:"POST",body:"{}"}),{params:Promise.resolve({id:"p1"})});assert.equal(r.status,401)});
test("webhook rejects requests without a Stripe signature",async()=>{const r=await webhookRoute(new NextRequest("https://example.com/api/stripe/webhook",{method:"POST",body:"{}"}));assert.equal(r.status,400)});
