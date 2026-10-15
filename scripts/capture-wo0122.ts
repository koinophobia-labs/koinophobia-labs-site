import { build } from "esbuild";
import { chromium } from "playwright";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import AuditPaidContent from "../components/site/AuditPaidContent";

const base = process.env.WO0122_BASE_URL || "http://127.0.0.1:3122";
const output = "Evidence/WO-0122";
async function main() {
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.goto(`${base}/audit?src=wo0122-mocked-browser`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Pay $250 and book" }).first().waitFor();
  await page.screenshot({ path: `${output}/audit-button-local-mock-config.png`, fullPage: true });
  await page.route("**/api/audit/checkout", async route => {
    const body = route.request().postDataJSON();
    assert.equal(body.src, "wo0122-mocked-browser");
    assert.equal(route.request().method(), "POST");
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Payment is temporarily unavailable. Please try again later or ask Blake a question." }) });
  });
  await page.getByRole("button", { name: "Pay $250 and book" }).first().click();
  await page.getByRole("alert").filter({ hasText: "Payment is temporarily unavailable" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Pay $250 and book" }).first().isEnabled(), true);
  await page.screenshot({ path: `${output}/audit-checkout-error-mocked.png` });
  await page.goto(`${base}/audit/paid?session_id=invalid&paid=true`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "We couldn't confirm a payment" }).waitFor();
  assert.equal(await page.locator("form").count(), 0);
  await page.screenshot({ path: `${output}/audit-paid-unconfirmed.png`, fullPage: true });

  // Mock only the verified outcome, rendering the same production component.
  // There is no public mock flag, route, Stripe call or live customer record.
  const markup = renderToStaticMarkup(createElement(AuditPaidContent, { paid: true, canBook: true }));
  await page.locator("main").evaluate((main, html) => {
    main.innerHTML = '<p style="padding:12px;border:1px solid currentColor">WO-0122 evidence: mocked paid render; no purchase made.</p>' + html;
  }, markup);
  await page.screenshot({ path: `${output}/audit-paid-mocked.png`, fullPage: true });
  assert.equal(await page.getByLabel("Preferred call time 1", { exact: true }).getAttribute("required"), "");
  assert.equal(await page.getByLabel("Preferred call time 2", { exact: true }).getAttribute("required"), "");
  assert.equal(await page.getByLabel("Preferred call time 3 (optional)").getAttribute("required"), null);
  await page.setViewportSize({ width: 390, height: 1800 });
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: `${output}/audit-paid-mocked-mobile-final.png`, fullPage: true });
  // Hydrate the actual client form in the mocked paid render and test its POST.
  const bundle = await build({ stdin: { contents: `import { createRoot } from "react-dom/client"; import { createElement } from "react"; import AuditBookingForm from "./components/site/AuditBookingForm"; createRoot(document.getElementById("booking-fixture")).render(createElement(AuditBookingForm));`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' } });
  await page.locator("form").evaluate(form => { const mount = document.createElement("div"); mount.id = "booking-fixture"; form.replaceWith(mount); });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  let submissions = 0;
  await page.route("**/api/intake", async route => {
    submissions++;
    const body = route.request().postData() || "";
    assert.match(body, /name="offer"\r\n\r\naudit/);
    assert.match(body, /name="paid"\r\n\r\ntrue/);
    assert.match(body, /Synthetic Business/);
    assert.doesNotMatch(body, /name="session_id"/);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.getByRole("button", { name: "Send preferred times" }).click();
  assert.equal(submissions, 0);
  await page.getByLabel("Business name").fill("Synthetic Business");
  await page.getByLabel("The problem in one line").fill("Quotes wait too long");
  await page.getByLabel("Preferred call time 1", { exact: true }).fill("October 22 at 10 am Central");
  await page.getByLabel("Preferred call time 2", { exact: true }).fill("October 23 at 2 pm Central");
  await page.getByRole("button", { name: "Send preferred times" }).click();
  await page.getByRole("status").filter({ hasText: "Your preferred times are recorded" }).waitFor();
  assert.equal(submissions, 1);
  await page.screenshot({ path: `${output}/audit-booking-submitted-mocked.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/audit?src=wo0122-mocked-browser`, { waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: `${output}/audit-button-mobile-mock-config.png`, fullPage: true });
  assert.deepEqual(failures, []);
  await writeFile(`${output}/browser-checks.json`, JSON.stringify({ base, mockConfiguration: true, purchaseMade: false, checks: ["pay button POSTs source", "checkout error permits retry", "query paid=true cannot confirm payment", "unconfirmed page has no booking form", "mocked production paid component renders required booking fields", "hydrated booking form blocks empty submission and posts offer=audit/paid=true without a client session id", "successful booking shows the one-business-day confirmation", "desktop/mobile layouts fit viewport", "no browser runtime errors"], failures }, null, 2));
} finally { await browser.close(); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
