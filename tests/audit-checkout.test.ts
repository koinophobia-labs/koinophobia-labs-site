import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { paymentFixture } from "./fixtures/payments";
import { createAuditCheckout, verifyAuditPayment, auditBookingInput, saveAuditBooking, parseAuditCheckout, AUDIT_SESSION_COOKIE } from "../lib/acquisition/audit-checkout";
import { auditCheckoutHandler } from "../lib/acquisition/audit-checkout-handler";
import { handleAuditBooking } from "../lib/acquisition/audit-booking-handler";
import { processStripeEvent } from "../lib/payments";
import AuditPaidContent from "../components/site/AuditPaidContent";
import { POST as intakeRoute } from "../app/api/intake/route";

const origin = "https://example.com";
const request = (body = {}, headers = {}) => new NextRequest(`${origin}/api/audit/checkout`, { method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const allowed = async () => ({ allowed: true, remaining: 4, resetAt: new Date().toISOString() });
async function fixture() {
  const f = paymentFixture();
  const payment = await createAuditCheckout({ source: "chamber & partners", email: "" }, origin, f.q, f.client);
  const session = { id: payment.stripeCheckoutSessionId!, payment_status: "paid", mode: "payment", amount_total: 25000, currency: "usd", metadata: f.state.sessionInput!.metadata, customer_details: { email: "private@example.com", name: "Private Buyer" }, custom_fields: [], payment_intent: "pi_fixture" } as unknown as Stripe.Checkout.Session;
  const client = { checkout: { sessions: { retrieve: async () => session } } } as unknown as Stripe;
  return { ...f, payment, session, retrievalClient: client };
}

test("public route creates a CRM lead, $250 balance and Stripe session through createCheckout", async () => {
  const f = paymentFixture();
  const route = auditCheckoutHandler({ available: () => true, limit: allowed, create: (input, host) => createAuditCheckout(input, host, f.q, f.client) });
  const response = await route(request({ src: "chamber & partners", amount: 1, currency: "eur", offer: "other" }));
  assert.equal(response.status, 200);
  assert.match((await response.json()).url, /^https:\/\/checkout.stripe.com\//);
  const input = f.state.sessionInput!;
  assert.equal(input.mode, "payment"); assert.equal(input.customer_email, undefined);
  assert.equal(input.line_items![0].price_data!.unit_amount, 25000);
  assert.equal(input.line_items![0].price_data!.currency, "usd");
  assert.equal(input.line_items![0].price_data!.product_data!.name, "Revenue Leak Audit");
  assert.equal(input.metadata!.paymentId, f.state.payment!.id);
  assert.equal(input.payment_intent_data!.metadata!.paymentId, f.state.payment!.id);
  assert.equal(input.custom_fields![0].key, "buyer_name"); assert.notEqual(input.custom_fields![0].optional, true);
  assert.equal(input.success_url, `${origin}/audit/paid?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(new URL(input.cancel_url!).searchParams.get("src"), "chamber & partners");
  assert.equal(input.automatic_tax, undefined); assert.equal(input.shipping_address_collection, undefined);
  const lead = f.state.queries.find(x => x.sql.startsWith("with lead"))!;
  assert.equal(lead.values[2], "chamber & partners"); assert.equal(lead.values[3], ""); assert.equal(lead.values[4], "revenue_leak_audit");
  assert.doesNotMatch(lead.sql, /next_action/);
  assert.equal(f.state.payment!.kind, "balance");
  assert.match(response.headers.get("set-cookie")!, /HttpOnly/i);
  assert.match(response.headers.get("set-cookie")!, /SameSite=lax/i);
});

test("checkout validates optional email/source, defaults source, and uses supplied email only", async () => {
  assert.deepEqual(parseAuditCheckout({}), { source: "audit", email: "" });
  for (const input of [null, { src: "x".repeat(161) }, { src: [] }, { email: "bad" }, { email: 4 }]) assert.equal(parseAuditCheckout(input), null);
  const f = paymentFixture();
  await createAuditCheckout(parseAuditCheckout({ email: "BUYER@example.com" })!, origin, f.q, f.client);
  assert.equal(f.state.sessionInput!.customer_email, "buyer@example.com");
});

test("checkout rejects cross-site, invalid, oversized, rate-limited and unavailable requests before Stripe", async () => {
  let writes = 0;
  const deps = { available: () => true, limit: allowed, create: async () => { writes++; throw Error("must not run"); } };
  assert.equal((await auditCheckoutHandler(deps)(request({}, { origin: "https://outside.example" }))).status, 403);
  assert.equal((await auditCheckoutHandler(deps)(request({ email: "bad" }))).status, 422);
  assert.equal((await auditCheckoutHandler(deps)(request({ src: "x".repeat(5000) }))).status, 413);
  assert.equal((await auditCheckoutHandler({ ...deps, limit: async () => ({ ...await allowed(), allowed: false }) })(request())).status, 429);
  assert.equal((await auditCheckoutHandler({ ...deps, available: () => false })(request())).status, 503);
  assert.equal((await auditCheckoutHandler({ ...deps, limit: async () => { throw Error("db down"); } })(request())).status, 503);
  assert.equal(writes, 0);
});

test("paid, unpaid, invalid and unrelated sessions render appropriate confirmation without customer data", async () => {
  const f = await fixture();
  const verified = await verifyAuditPayment(f.session.id, f.q, f.retrievalClient);
  assert.ok(verified);
  const html = renderToStaticMarkup(createElement(AuditPaidContent, { paid: Boolean(verified), canBook: true }));
  assert.match(html, /Paid: Revenue Leak Audit, \$250/);
  assert.match(html, /Business name/); assert.match(html, /preferredTime2/);
  assert.match(html, /within one business day/); assert.match(html, /receipt comes from Stripe/);
  assert.doesNotMatch(html, /private@example.com|Private Buyer|cs_test_|pi_fixture/);
  for (const changes of [{ payment_status: "unpaid" }, { amount_total: 1 }, { currency: "eur" }, { metadata: { ...f.session.metadata, offer: "other" } }]) {
    const client = { checkout: { sessions: { retrieve: async () => ({ ...f.session, ...changes }) } } } as unknown as Stripe;
    assert.equal(await verifyAuditPayment(f.session.id, f.q, client), null);
  }
  assert.equal(await verifyAuditPayment("invalid", f.q, f.retrievalClient), null);
  assert.equal(await verifyAuditPayment(f.session.id, f.q, { checkout: { sessions: { retrieve: async () => { throw Error("not found"); } } } } as unknown as Stripe), null);
  assert.equal(await verifyAuditPayment(f.session.id, { query: async () => ({ rows: [] }) }, f.retrievalClient), null);
  const neutral = renderToStaticMarkup(createElement(AuditPaidContent, { paid: false }));
  assert.match(neutral, /couldn&#x27;t confirm a payment/); assert.doesNotMatch(neutral, /<form/);
});

test("existing checkout.session.completed processing marks audit payment and CRM summaries paid, once", async () => {
  const f = await fixture();
  const event = { id: "evt_audit", type: "checkout.session.completed", data: { object: f.session } } as Stripe.Event;
  await processStripeEvent(event, f.q);
  assert.equal(f.state.payment!.status, "paid");
  assert.ok(f.state.queries.some(x => x.sql.startsWith("update crm_proposals set amount_paid") && x.values[0] === 25000 && x.values[1] === "paid"));
  assert.ok(f.state.queries.some(x => x.sql.startsWith("update crm_leads set payment_status") && x.values[0] === "paid"));
  assert.equal((await processStripeEvent(event, f.q)).duplicate, true);
});

function bookingForm() {
  const form = new FormData();
  for (const [k, v] of Object.entries({ offer: "audit", paid: "true", businessName: "Synthetic Business", biggestProblem: "Quotes wait too long", preferredTime1: "October 22 at 10 am Central", preferredTime2: "October 23 at 2 pm Central", email: "forged@example.com", session_id: "forged" })) form.set(k, v);
  return form;
}
test("booking stores verified session and Stripe contact on the same lead; validates required times", async () => {
  const f = await fixture(), verified = (await verifyAuditPayment(f.session.id, f.q, f.retrievalClient))!;
  const form = bookingForm(), parsed = auditBookingInput(form, verified);
  assert.equal(parsed.input!.email, "private@example.com"); assert.match(parsed.input!.notes!, new RegExp(f.session.id));
  assert.equal(parsed.input!.source, "chamber & partners");
  let writes = 0;
  const q = { query: async (sql: string, values: unknown[] = []) => { writes++; assert.match(sql, /update crm_leads/); assert.equal(values[6], verified.leadId); assert.match(String(values[5]), /Checkout Session: cs_test_/); return { rows: writes === 1 ? [{ id: verified.leadId }] : [] }; } };
  assert.equal((await saveAuditBooking(verified, parsed.input!, q)).created, true);
  assert.equal((await saveAuditBooking(verified, parsed.input!, q)).created, false);
  form.delete("preferredTime2"); assert.ok(auditBookingInput(form, verified).errors?.preferredTimes);
});

test("intake handoff rejects forged paid state and only notifies once after durable booking", async () => {
  const f = await fixture(), verified = (await verifyAuditPayment(f.session.id, f.q, f.retrievalClient))!;
  let emails = 0, saves = 0;
  const req = request({}, { cookie: `${AUDIT_SESSION_COOKIE}=${f.session.id}` });
  const deps = { verify: async (id?: string) => { assert.equal(id, f.session.id); return verified; }, save: async () => ({ created: ++saves === 1 }), email: async () => { emails++; return { ok: true as const, providerId: "mock-email" }; } };
  assert.equal((await handleAuditBooking(req, bookingForm(), "req", deps)).status, 200);
  assert.equal((await handleAuditBooking(req, bookingForm(), "req", deps)).status, 200);
  assert.equal(emails, 1);
  assert.equal((await handleAuditBooking(req, bookingForm(), "req", { ...deps, verify: async () => null })).status, 422);
  const forged = new NextRequest(`${origin}/api/intake`, { method: "POST", headers: { origin }, body: bookingForm() });
  assert.equal((await intakeRoute(forged)).status, 422);
});
