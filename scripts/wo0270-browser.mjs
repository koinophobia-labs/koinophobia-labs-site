import { createOfferCheckout } from "../lib/acquisition/service-checkout.ts";
import { processStripeEvent } from "../lib/payments.ts";
import { chromium } from "playwright";
import { Pool } from "pg";
import fs from "node:fs";
import assert from "node:assert/strict";
const root = "/Volumes/KoiArchive/WO-0270/evidence";
const db = new Pool({
  connectionString:
    process.env.WO0270_BROWSER_DATABASE ||
    "postgresql://127.0.0.1:55471/postgres",
});
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  if (process.argv[2] === "seed") {
    await db.query(fs.readFileSync("db/014_team_call.sql", "utf8"));
    const p = await browser.newPage({ viewport: { width: 1040, height: 700 } });
    await p.setContent(
      '<html><body style="margin:0;background:#f6f2e9;font:20px system-ui;color:#1c322b;padding:50px"><p style="letter-spacing:.2em">JUNIPER BICYCLE · FICTIONAL AUDIT FIXTURE</p><h1>Book your next tune-up.</h1><div style="padding:40px;border:3px solid #ab3a35;border-radius:20px;background:white"><small>BOOKING PAGE RESPONSE</small><h2>404 — This booking page is missing</h2><p>The booking button points here, but this page could not be found.</p></div><p>FAKE DATA · Screenshot proof for WO-0270 testing only.</p></body></html>',
    );
    const image = await p.screenshot({
      path: root + "/fake-auditor-proof.png",
    });
    const proof = {
      confidence: "confirmed",
      measurement: "The booking button opens a missing page (HTTP 404).",
      proof: {
        image: "data:image/png;base64," + image.toString("base64"),
        captured_at: new Date().toISOString(),
      },
    };
    await db.query(
      "update team_leads set phone='3125550100',data=data||$1::jsonb where id='lead-0'",
      [
        JSON.stringify({
          city: "Chicago",
          state: "IL",
          time_zone: "America/Chicago",
          fit_score: 90,
          evidence: [proof],
        }),
      ],
    );
    await db.query(
      "insert into team_call_details(lead_id,cell) values('lead-0','+13125550188') on conflict(lead_id) do nothing",
    );
    console.log("Fake screenshot and local lead fixture ready.");
  } else {
    const base = "http://localhost:3270";
    const desktop = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      phone = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      });
    async function login(context, email = "demo-a@example.test") {
      const r = await context.request.post(base + "/team/api/login", {
        headers: { origin: base },
        data: { email, password: "fake-portal-test-password" },
      });
      assert.equal(r.status(), 200, await r.text());
    }
    await login(desktop);
    await login(phone);
    const d = await desktop.newPage(),
      m = await phone.newPage();
    const errors = [];
    d.on("pageerror", (e) => errors.push(e.message));
    m.on("pageerror", (e) => errors.push(e.message));
    await d.goto(base + "/team/leads");
    await m.goto(base + "/team/call");
    await d
      .locator(".team-lead-row")
      .filter({ hasText: "Juniper Bicycle" })
      .click();
    await m.getByRole("heading", { name: "Juniper Bicycle · FAKE" }).waitFor();
    const start = Date.now();
    await m.getByLabel("Current call lead").selectOption("lead-2");
    await d
      .locator(".call-panel h2")
      .filter({ hasText: "Northstar" })
      .waitFor();
    const syncMs = Date.now() - start;
    await m.getByLabel("Current call lead").selectOption("lead-0");
    await d.locator(".call-panel h2").filter({ hasText: "Juniper" }).waitFor();
    const create = d.getByRole("button", { name: "Create deal page" });
    if (await create.count()) {
      await d.getByRole("checkbox").check();
      await create.click();
    }
    await m.getByRole("link", { name: "Text link", exact: true }).waitFor();
    const sms = await m
      .getByRole("link", { name: "Text link", exact: true })
      .getAttribute("href");
    assert.match(sms, /^sms:\+13125550188&body=/);
    assert.match(decodeURIComponent(sms), /\$299/);
    const publicUrl = await m.locator(".call-link a").getAttribute("href");
    const code = publicUrl.split("/").pop();
    await d.screenshot({ path: root + "/computer-call.png", fullPage: true });
    await m.screenshot({ path: root + "/phone-call.png", fullPage: true });
    const client = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await client.goto(base + "/go/" + code);
    await client.locator(".deal-proof").waitFor();
    await client.waitForFunction(
      () => document.querySelector(".deal-proof")?.complete,
    );
    await client.screenshot({
      path: root + "/client-deal.png",
      fullPage: true,
    });
    await m
      .locator(".call-payment-status")
      .filter({ hasText: "Opened" })
      .waitFor();
    assert.equal(
      await client
        .locator("body")
        .innerText()
        .then((t) => t.includes("demo0@example.test")),
      false,
    );
    const pay = await client
      .getByRole("link", { name: /^Pay \$/ })
      .getAttribute("href");
    assert.match(pay, /\/pay\/fix\?partner=demo-a&deal=deal-0&go=/);
    await client.getByRole("link", { name: /^Pay \$/ }).click();
    assert.match(client.url(), /\/pay\/fix/);
    assert.ok(
      (await client.locator("form").getAttribute("action")).includes(
        "go=" + code,
      ),
    );
    for (const page of [d, m, client])
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    const stranger = await browser.newContext();
    await login(stranger, "demo-b@example.test");
    const denied = await stranger.request.get(
      base + "/team/api/call-state?lead=lead-0",
    );
    assert.equal(denied.status(), 404);
    assert.deepEqual(errors, []);
    let metadata = {};
    const sessionId = "cs_test_browser_" + crypto.randomUUID();
    const payment = await createOfferCheckout(
      "fix",
      {
        source: "wo0270-fake-browser",
        email: "fake@example.test",
        attribution: { partner: "demo-a", deal: "deal-0" },
      },
      base,
      db,
      {
        checkout: {
          sessions: {
            create: async (input) => {
              metadata = input.metadata;
              return { id: sessionId, url: "https://checkout.stripe.com/fake" };
            },
          },
        },
      },
    );
    await db.query(
      "update team_deal_pages set checkout_started_at=now() where code=$1",
      [code],
    );
    await m
      .locator(".call-payment-status")
      .filter({ hasText: "Checkout started" })
      .waitFor();
    await processStripeEvent(
      {
        id: "evt_browser_" + crypto.randomUUID(),
        type: "checkout.session.completed",
        created: 1794337200,
        data: {
          object: {
            id: sessionId,
            metadata,
            mode: "payment",
            amount_total: 29900,
            currency: "usd",
            payment_status: "paid",
            payment_intent: "pi_" + payment.id,
            customer_details: {
              name: "Fake client",
              email: "fake@example.test",
            },
          },
        },
      },
      db,
      async () => ({ ok: true, providerId: "mock-no-send" }),
    );
    await m
      .locator(".call-payment-status")
      .filter({ hasText: "Paid ✅ — your $119.60 is on its way" })
      .waitFor();
    await d
      .locator(".call-payment-status")
      .filter({ hasText: "Paid ✅" })
      .waitFor();
    await m.screenshot({ path: root + "/phone-paid.png", fullPage: true });
    await d
      .locator(".call-panel")
      .screenshot({ path: root + "/computer-paid.png" });
    await client.goto(base + "/go/" + code);
    assert.match(
      await client.locator("body").innerText(),
      /no longer available/,
    );
    const owner = await browser.newContext();
    await login(owner, "owner@example.test");
    const ownerPage = await owner.newPage();
    await ownerPage.goto(base + "/team/leads");
    await ownerPage
      .getByRole("heading", { name: "New client — start the work" })
      .waitFor();
    await ownerPage
      .locator(".call-panel")
      .screenshot({ path: root + "/owner-alert.png" });

    fs.writeFileSync(
      root + "/browser-results.json",
      JSON.stringify(
        {
          syncMs,
          screenshots: [
            "computer-call.png",
            "phone-call.png",
            "client-deal.png",
          ],
          twoDeviceSync: true,
          smsPrefill: true,
          openedStatus: true,
          checkoutStatus: true,
          paidBothScreens: true,
          ownerAlert: true,
          paidDeactivation: true,
          payFlow: true,
          crossPartnerDenied: true,
          noOverflow: true,
          pageErrors: errors,
          code,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        syncMs,
        twoDeviceSync: true,
        smsPrefill: true,
        openedStatus: true,
        checkoutStatus: true,
        paidBothScreens: true,
        ownerAlert: true,
        paidDeactivation: true,
        payFlow: true,
        crossPartnerDenied: true,
        noOverflow: true,
        pageErrors: errors,
      }),
    );
  }
} finally {
  await db.end();
  await browser.close();
}
