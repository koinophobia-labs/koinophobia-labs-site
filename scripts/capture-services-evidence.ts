import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import type Stripe from "stripe";
import { paymentFixture } from "../tests/fixtures/payments";
import { createOfferCheckout, verifyOfferPayment } from "../lib/acquisition/service-checkout";
import { offers, type ServiceOffer } from "../lib/acquisition/services-config";
import ServicePaidContent from "../components/site/ServicePaidContent";
import AuditPaidContent from "../components/site/AuditPaidContent";

// Visual-only local fixtures. No mock switch is exposed by application routes.
const base = process.env.EVIDENCE_BASE_URL || "http://127.0.0.1:3126";
const output = "Evidence/WO-0126";
mkdirSync(output, { recursive: true });
async function main() {
const browser = await chromium.launch({ headless: true, channel: process.env.EVIDENCE_BROWSER_CHANNEL || "chrome" });
const checks: object[] = [];
try {
  for (const [device, width, height] of [["desktop", 1440, 1000], ["phone", 390, 844]] as const) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    await page.goto(`${base}/services`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), "Services | Koinophobia Labs");
    assert.equal(await page.locator(".service-offers article").count(), 4);
    assert.equal(await page.getByRole("link", { name: "Request a free review", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Pay $250", exact: true }).count(), 1);
    if (device === "phone") {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      assert.ok(await page.locator("#site-nav").getByRole("link", { name: "Services", exact: true }).isVisible());
      await page.getByRole("button", { name: "Close", exact: true }).click();
    }
    await page.screenshot({ path: `${output}/services-${device}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "services horizontal overflow");
    checks.push({ page: "/services", device, horizontalOverflow: false });
    for (const offer of Object.keys(offers) as ServiceOffer[]) {
      const config = offers[offer], fixture = paymentFixture();
      const payment = await createOfferCheckout(offer, { source: "visual-fixture", email: "" }, base, fixture.q, fixture.client);
      const session = { id: payment.stripeCheckoutSessionId, metadata: fixture.state.sessionInput!.metadata, payment_status: "paid", amount_total: config.amount, currency: "usd", mode: config.mode } as Stripe.Checkout.Session;
      const stripe = { checkout: { sessions: { retrieve: async () => session } } } as unknown as Stripe;
      const verified = await verifyOfferPayment(offer, session.id, fixture.q, stripe);
      assert.ok(verified);
      await page.goto(`${base}${config.path}/paid`, { waitUntil: "networkidle" });
      assert.ok(await page.getByRole("heading", { name: "We couldn't confirm a payment" }).isVisible());
      await page.screenshot({ path: `${output}/${offer}-unpaid-${device}.png`, fullPage: true });
      // Render the same component used by the route after successful verification;
      // replace only the content section in the real built page shell.
      const html = renderToStaticMarkup(offer === "revenue_leak_audit" ? createElement(AuditPaidContent, { paid: Boolean(verified), canBook: true }) : createElement(ServicePaidContent, { paid: Boolean(verified), offer }));
      await page.locator("main > section").evaluate((element, html) => { element.outerHTML = html; }, html);
      await page.screenshot({ path: `${output}/${offer}-paid-mocked-${device}.png`, fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${offer} overflow`);
      checks.push({ page: `${config.path}/paid`, device, fixture: "mocked Stripe + CRM verification; actual paid component in built page shell", horizontalOverflow: false });
    }
    await page.close();
  }
  writeFileSync(`${output}/screenshot-checks.json`, JSON.stringify(checks, null, 2));
} finally { await browser.close(); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
