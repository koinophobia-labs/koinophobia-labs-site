import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { paymentFixture } from "./fixtures/payments";
import { createOfferCheckout, verifyOfferPayment } from "../lib/acquisition/service-checkout";
import { offers, freeStraightAnswerAvailable, STRAIGHT_ANSWER_FREE_SLOTS, type NewServiceOffer, type ServiceOffer } from "../lib/acquisition/services-config";
import ServicePaidContent from "../components/site/ServicePaidContent";
import { handleServiceOnboarding } from "../lib/acquisition/service-onboarding";
import nextConfig from "../next.config";

async function fixture(offer: NewServiceOffer) {
  const f = paymentFixture();
  const payment = await createOfferCheckout(offer, { source: "services", email: "" }, "https://example.com", f.q, f.client);
  const session = { id: payment.stripeCheckoutSessionId, metadata: f.state.sessionInput!.metadata, mode: offers[offer].mode, amount_total: offers[offer].amount, currency: "usd", payment_status: "paid", subscription: offer === "monthly_support" ? "sub_fixture" : null, customer_details: { name: "Private Buyer", email: "private@example.com" } } as Stripe.Checkout.Session;
  const client = { checkout: { sessions: { retrieve: async () => session } } } as unknown as Stripe;
  return { ...f, payment, session, client };
}
for (const offer of ["straight_answer", "monthly_support"] as const) {
  test(`${offer}: checkout has exact server price, mode, metadata and handoff`, async () => {
    const f = await fixture(offer), input = f.state.sessionInput!;
    assert.equal(input.mode, offers[offer].mode);
    assert.equal(input.line_items![0].price_data!.unit_amount, offers[offer].amount);
    assert.equal(input.line_items![0].price_data!.currency, "usd");
    assert.equal(input.metadata!.offer, offer);
    assert.equal(input.metadata!.paymentId, f.payment.id);
    assert.equal(input.metadata!.leadId, f.payment.leadId);
    assert.equal(input.metadata!.proposalId, f.payment.proposalId);
    assert.match(input.success_url!, new RegExp(`${offers[offer].path}/paid`));
    if (offer === "monthly_support") {
      assert.deepEqual(input.line_items![0].price_data!.recurring, { interval: "month" });
      assert.deepEqual(input.subscription_data!.metadata, input.metadata);
      assert.equal(input.payment_intent_data, undefined);
    } else assert.ok(input.payment_intent_data);
  });
  test(`${offer}: paid, unpaid, invalid and unrelated paid pages fail closed`, async () => {
    const f = await fixture(offer);
    assert.ok(await verifyOfferPayment(offer, f.session.id, f.q, f.client));
    const html = renderToStaticMarkup(createElement(ServicePaidContent, { offer, paid: true }));
    assert.match(html, offer === "straight_answer" ? /Send your PRD/ : /Access contacts/);
    assert.doesNotMatch(html, /private@example.com|Private Buyer|cs_test_|sub_fixture/);
    for (const changes of [{ payment_status: "unpaid" }, { amount_total: 1 }, { currency: "eur" }, { mode: "setup" }, { metadata: { ...f.session.metadata, offer: "other" } }]) {
      const client = { checkout: { sessions: { retrieve: async () => ({ ...f.session, ...changes }) } } } as unknown as Stripe;
      assert.equal(await verifyOfferPayment(offer, f.session.id, f.q, client), null);
    }
    assert.equal(await verifyOfferPayment(offer, "invalid", f.q, f.client), null);
    assert.equal(await verifyOfferPayment(offer, undefined, f.q, f.client), null);
    assert.equal(await verifyOfferPayment(offer, f.session.id, { query: async () => ({ rows: [] }) }, f.client), null);
    assert.equal(await verifyOfferPayment(offer, f.session.id, f.q, { checkout: { sessions: { retrieve: async () => { throw Error(); } } } } as unknown as Stripe), null);
    const neutral = renderToStaticMarkup(createElement(ServicePaidContent, { offer, paid: false }));
    assert.match(neutral, /couldn&#x27;t confirm/); assert.doesNotMatch(neutral, /<form/);
  });
  test(`${offer}: onboarding verifies the tab session, rejects forged state, saves once`, async () => {
    const f = await fixture(offer), verified = (await verifyOfferPayment(offer, f.session.id, f.q, f.client))!;
    const form = new FormData();
    for (const [key, value] of Object.entries({ session_id: f.session.id, businessName: "Fixture", details: "Review this project", specLink: "https://example.com/spec", accessContacts: "Test owner, owner@example.com", email: "forged@example.com" })) form.set(key, value);
    let saves = 0, emails = 0;
    const deps = { verify: async (_offer: ServiceOffer, id?: string) => { assert.equal(id, f.session.id); return verified; }, save: async (_payment: unknown, input: { email: string }) => { assert.equal(input.email, "private@example.com"); return { created: ++saves === 1 }; }, email: async () => { emails++; return { ok: true, providerId: "mock" }; } };
    const request = new NextRequest("https://example.com/api/intake", { method: "POST" });
    assert.equal((await handleServiceOnboarding(request, form, offer, deps)).status, 200);
    assert.equal((await handleServiceOnboarding(request, form, offer, deps)).status, 200);
    assert.equal(emails, 1);
    assert.equal((await handleServiceOnboarding(request, form, offer, { ...deps, verify: async () => null })).status, 422);
    form.set(offer === "straight_answer" ? "specLink" : "accessContacts", offer === "straight_answer" ? "javascript:alert(1)" : "");
    assert.equal((await handleServiceOnboarding(request, form, offer, deps)).status, 422);
    assert.equal(saves, 2);
  });
}
test("free slots default to five; zero and negative close free requests", () => {
  assert.equal(STRAIGHT_ANSWER_FREE_SLOTS, 5);
  assert.equal(freeStraightAnswerAvailable(), true);
  assert.equal(freeStraightAnswerAvailable(1), true);
  assert.equal(freeStraightAnswerAvailable(0), false);
  assert.equal(freeStraightAnswerAvailable(-1), false);
});
test("services is a living route, not a retired redirect", async () => {
  const redirects = await nextConfig.redirects!();
  assert.equal(redirects.some(rule => rule.source === "/services"), false);
});
