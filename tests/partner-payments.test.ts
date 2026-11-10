import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { paymentFixture } from "./fixtures/payments";
import { createOfferCheckout, verifyOfferPayment } from "../lib/acquisition/service-checkout";
import { partnerOffers, isPartnerOffer, parsePartnerAttribution } from "../lib/acquisition/partner-offers";
import { partnerCheckoutHandler } from "../lib/acquisition/partner-checkout-handler";
import Pay from "../app/pay/[offer]/page";
import Success from "../app/pay/success/page";
import Cancel from "../app/pay/cancel/page";
const refs = { partner: "partner_123", deal: "deal-456", lead: "lead_789" };
const origin = "https://koinophobialabs.com";
test("offer routes allow only the fixed catalog", () => {
  for (const offer of ["fix", "tune-up", "care"]) assert.ok(isPartnerOffer(offer));
  for (const offer of ["FIX", "tune", "__proto__", "constructor", "../care", ""]) assert.equal(isPartnerOffer(offer), false);
});
test("attribution is allow-listed, capped, duplicate-safe and cannot override CRM IDs", () => {
  assert.deepEqual(parsePartnerAttribution(new URLSearchParams(refs)), refs);
  assert.deepEqual(parsePartnerAttribution(new URLSearchParams()), {});
  assert.ok(parsePartnerAttribution(new URLSearchParams({ partner: "A".repeat(80) })));
  for (const query of ["partner=", "partner=a&partner=b", "partner=a%26deal%3Db", "partner=%0A", "partner=abc%20def", "partner=%E2%98%83", `partner=${"a".repeat(81)}`, "paymentId=forged", "amount=1", "mode=payment", "partner=%3Cscript%3E", "lead=a.b"]) assert.equal(parsePartnerAttribution(new URLSearchParams(query)), null, query);
});
for (const offer of ["fix", "tune-up", "care"] as const) {
  test(`${offer}: server amount, currency, mode, attribution and handoffs`, async () => {
    const { q, client, state } = paymentFixture();
    const payment = await createOfferCheckout(offer, { source: "partner-payment", email: "", attribution: refs }, origin, q, client);
    const input = state.sessionInput!;
    assert.equal(input.mode, partnerOffers[offer].mode);
    assert.equal(input.line_items![0].price_data!.unit_amount, partnerOffers[offer].amount);
    assert.equal(input.line_items![0].price_data!.currency, "usd");
    assert.equal(input.line_items![0].quantity, 1);
    assert.deepEqual(input.metadata, { offer, ...refs, paymentId: payment.id, proposalId: payment.proposalId, leadId: payment.leadId, kind: "balance" });
    assert.deepEqual(offer === "care" ? input.subscription_data!.metadata : input.payment_intent_data!.metadata, input.metadata);
    assert.deepEqual(input.line_items![0].price_data!.recurring, offer === "care" ? { interval: "month" } : undefined);
    assert.equal(input.success_url, `${origin}/pay/success?offer=${offer}&session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(input.cancel_url, `${origin}/pay/cancel?offer=${offer}&partner=partner_123&deal=deal-456&lead=lead_789`);
    assert.ok(state.queries.some(x => x.sql.startsWith("with lead") && x.values[11] === `Partner attribution: ${JSON.stringify(refs)}`));
    assert.equal(state.options!.idempotencyKey, `crm-payment-${payment.id}`);
    const session = { id: payment.stripeCheckoutSessionId, amount_total: partnerOffers[offer].amount, currency: "usd", mode: partnerOffers[offer].mode, payment_status: "paid", metadata: input.metadata } as unknown as Stripe.Checkout.Session;
    const reader = (changes = {}) => ({ checkout: { sessions: { retrieve: async () => ({ ...session, ...changes }) } } }) as unknown as Stripe;
    assert.ok(await verifyOfferPayment(offer, session.id, q, reader()));
    for (const changes of [{ payment_status: "unpaid" }, { amount_total: 1 }, { mode: "setup" }, { currency: "eur" }, { metadata: { ...input.metadata, offer: "other" } }]) assert.equal(await verifyOfferPayment(offer, session.id, q, reader(changes)), null);
  });
}
function handlerFixture() {
  let calls = 0, reads = 0;
  const f = paymentFixture();
  const deps = { available: () => true, limit: async () => ({ allowed: true, remaining: 4, resetAt: "" }), create: async (...args: Parameters<typeof createOfferCheckout>) => { calls++; return createOfferCheckout(args[0], args[1], args[2], f.q, f.client); }, readback: async (id: string) => { reads++; return { id, livemode: false, amount_total: 29900, currency: "usd", mode: "payment" as const, metadata: { offer: "fix" }, payment_status: "unpaid" as const, status: "open" as const, recurring: null }; } };
  return { deps, calls: () => calls, reads: () => reads };
}
function request(query = "", accept = "text/html", requestOrigin = origin) { return new NextRequest(`${origin}/pay/fix/checkout${query}`, { method: "POST", headers: { origin: requestOrigin, accept }, body: "amount=1&offer=care" }); }
const context = (offer = "fix") => ({ params: Promise.resolve({ offer }) });
test("checkout POST redirects to Stripe, or returns persisted readback for JSON clients", async () => {
  const f = handlerFixture(), handler = partnerCheckoutHandler(f.deps);
  const html = await handler(request("?partner=p&deal=d"), context());
  assert.equal(html.status, 303); assert.match(html.headers.get("location")!, /^https:\/\/checkout.stripe.com\//);
  assert.equal(html.headers.get("cache-control"), "no-store"); assert.equal(f.reads(), 0);
  const json = await handler(request("?partner=p", "application/json"), context());
  assert.equal(json.status, 200); assert.equal((await json.json()).checkout.amount_total, 29900); assert.equal(f.reads(), 1);
});
test("route rejects unknown offers, malformed references and cross-origin requests before creating sessions", async () => {
  const f = handlerFixture(), handler = partnerCheckoutHandler(f.deps);
  assert.equal((await handler(request(), context("other"))).status, 404);
  assert.equal((await handler(request("?partner=a&partner=b"), context())).status, 422);
  assert.equal((await handler(request("", "text/html", "https://evil.example"), context())).status, 403);
  assert.equal(f.calls(), 0);
});
test("checkout fails closed on unavailable configuration, limiter denial and failures", async () => {
  const f = handlerFixture();
  for (const [changes, expected] of [[{ available: () => false }, 503], [{ limit: async () => ({ allowed: false, remaining: 0, resetAt: "" }) }, 429], [{ limit: async () => { throw Error("unavailable"); } }, 503]] as const) assert.equal((await partnerCheckoutHandler({ ...f.deps, ...changes })(request(), context())).status, expected);
  assert.equal(f.calls(), 0);
});
test("offer page is a form without GET mutations; invalid references cannot start checkout", async () => {
  const good = renderToStaticMarkup(await Pay({ params: Promise.resolve({ offer: "care" }), searchParams: Promise.resolve(refs) }));
  assert.match(good, /Subscribe for \$99\/month/); assert.match(good, /method="post"/); assert.match(good, /partner=partner_123/);
  const invalid = renderToStaticMarkup(await Pay({ params: Promise.resolve({ offer: "fix" }), searchParams: Promise.resolve({ partner: ["a", "b"] }) }));
  assert.doesNotMatch(invalid, /<form/); assert.match(invalid, /invalid references/);
});
test("unverified success never claims paid; cancel preserves attribution", async () => {
  const success = renderToStaticMarkup(await Success({ searchParams: Promise.resolve({}) }));
  assert.doesNotMatch(success, /Paid\./); assert.match(success, /couldn’t confirm/);
  const cancel = renderToStaticMarkup(await Cancel({ searchParams: Promise.resolve({ offer: "fix", ...refs }) }));
  assert.match(cancel, /\/pay\/fix\?partner=partner_123/);
});
