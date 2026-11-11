// Isolated fake-data acceptance only. Never invoke against a hosted database.
import { Pool } from "pg";
import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createOfferCheckout } from "../lib/acquisition/service-checkout.ts";
import { processStripeEvent } from "../lib/payments.ts";
const root = "/Volumes/KoiArchive/WO-0274/evidence",
  base = "http://localhost:3274";
const db = new Pool({
  connectionString: "postgresql://127.0.0.1:55474/postgres",
});
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  if (process.argv[2] === "seed") {
    await db.query(fs.readFileSync("db/014_team_call.sql", "utf8"));
    await db.query(fs.readFileSync("db/015_team_fulfillment.sql", "utf8"));
    const p = await browser.newPage({ viewport: { width: 1040, height: 700 } });
    async function proof(after) {
      await p.setContent(
        `<body style="margin:0;background:#f4f1e9;font:22px system-ui;padding:50px;color:#21392e"><p>JUNIPER BICYCLE · FICTIONAL FIXTURE</p><h1>Book your next tune-up.</h1><section style="padding:40px;background:white;border:3px solid ${after ? "#438969" : "#b85540"};border-radius:18px"><h2>${after ? "Book an appointment" : "404 — Booking page not found"}</h2><p>${after ? "The booking page loads and shows available appointment options." : "The Book button opens this missing page."}</p></section><p>FAKE DATA · WO-0274 acceptance</p></body>`,
      );
      const b = await p.screenshot({
        path: `${root}/${after ? "after" : "before"}-proof.png`,
      });
      return "data:image/png;base64," + b.toString("base64");
    }
    const before = await proof(false);
    await proof(true);
    const finding = {
      check: "Dead contact / booking / order link",
      key: "http-404",
      url: "https://example.test/book",
      confidence: "confirmed",
      measurement: "The Book button opens a missing page (HTTP 404).",
      proof: { image: before, captured_at: new Date().toISOString() },
    };
    await db.query(
      "update team_leads set data=data||$1::jsonb where id='lead-0'",
      [JSON.stringify({ evidence: [finding] })],
    );
    let metadata;
    const sid = "cs_test_fulfillment_synthetic";
    const stripe = {
      checkout: {
        sessions: {
          create: async (input) => {
            metadata = input.metadata;
            return { id: sid, url: "https://checkout.stripe.com/fake" };
          },
        },
      },
    };
    await createOfferCheckout(
      "fix",
      {
        source: "fake-browser",
        email: "fake@example.test",
        attribution: { partner: "demo-a", deal: "deal-0" },
      },
      base,
      db,
      stripe,
    );
    await processStripeEvent(
      {
        id: "evt_fulfillment_fake",
        type: "checkout.session.completed",
        data: {
          object: {
            id: sid,
            metadata,
            mode: "payment",
            amount_total: 29900,
            currency: "usd",
            payment_status: "paid",
            payment_intent: "pi_fake_fulfillment",
            customer_details: {
              email: "fake@example.test",
              name: "Fake Client",
            },
          },
        },
      },
      db,
      async () => ({ ok: true, providerId: "mock-no-send" }),
    );
    console.log("Synthetic paid job seeded; no real payment or message.");
  } else {
    const j = (await db.query("select * from team_jobs limit 1")).rows[0];
    const owner = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      client = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
    const p = await owner.newPage(),
      c = await client.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    c.on("pageerror", (e) => errors.push(e.message));
    const login = await owner.request.post(base + "/team/api/login", {
      headers: { origin: base },
      data: {
        email: "owner@example.test",
        password: "fake-portal-test-password",
      },
    });
    assert.equal(login.status(), 200);
    const res = await c.goto(base + "/start/" + j.code);
    assert.match(res.headers()["x-robots-tag"], /noindex/);
    assert.equal(res.headers()["referrer-policy"], "no-referrer");
    assert.equal(await c.locator('input[type="password"]').count(), 0);
    await c.getByLabel("Website platform").selectOption("Wix");
    await c.getByLabel("Best contact name").fill("Casey · FAKE CLIENT");
    await c.getByLabel("Best contact email").fill("casey@example.test");
    await c.getByLabel("Cell for a call or text").fill("3125550101");
    await c.getByLabel("Access status").selectOption("Invite sent");
    await c.screenshot({
      path: root + "/client-onboarding-phone.png",
      fullPage: true,
    });
    await c.getByRole("button", { name: "Save next steps" }).click();
    await c
      .getByText("Received. Blake will confirm access and start the work.")
      .waitFor();
    assert.equal(
      await c.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await db.query(
      "update team_jobs set deadline=now()+interval '20 hours',access_since=now()-interval '25 hours'",
    );
    await p.goto(base + "/team/admin");
    await p.getByRole("heading", { name: "Jobs", exact: true }).waitFor();
    await p.screenshot({
      path: root + "/owner-jobs-digest.png",
      fullPage: true,
    });
    await p.goto(base + "/team/jobs/" + j.id);
    await p
      .getByRole("button", { name: "I confirmed contributor access" })
      .click();
    await p.getByRole("button", { name: "Fix ready — run auditor" }).waitFor();
    await p.screenshot({ path: root + "/owner-job-brief.png", fullPage: true });
    // Synthetic auditor outcomes only. Real checker predicates are separately tested.
    const now = Date.now(),
      after =
        "data:image/png;base64," +
        fs.readFileSync(root + "/after-proof.png").toString("base64");
    const pass = (at) => ({
      ok: true,
      at: new Date(at).toISOString(),
      reason: "Synthetic fixture pass",
      proofs: [
        {
          url: "https://example.test/book",
          image: after,
          captured_at: new Date(at).toISOString(),
        },
      ],
    });
    await db.query("update team_jobs set stage='Verified',verification=$1", [
      JSON.stringify([pass(now - 600001), pass(now)]),
    ]);
    await p.reload();
    await p
      .getByRole("button", { name: "Deliver with before / after" })
      .waitFor();
    await p.screenshot({
      path: root + "/owner-verified-before-after.png",
      fullPage: true,
    });
    await p
      .getByRole("button", { name: "Deliver with before / after" })
      .click();
    await p.getByText("Delivered", { exact: true }).waitFor();
    const partner = await browser.newContext();
    assert.equal(
      (
        await partner.request.post(base + "/team/api/login", {
          headers: { origin: base },
          data: {
            email: "demo-a@example.test",
            password: "fake-portal-test-password",
          },
        })
      ).status(),
      200,
    );
    assert.equal(
      (
        await partner.request.post(base + "/team/api/jobs", {
          headers: { origin: base },
          data: { id: j.id, action: "notes", notes: "Denied" },
        })
      ).status(),
      403,
    );
    assert.equal(
      (await partner.request.get(base + "/team/jobs/" + j.id)).status(),
      404,
    );
    const pp = await partner.newPage();
    await pp.goto(base + "/team/pipeline");
    await pp.getByText("Job: Delivered").waitFor();
    assert.equal((await pp.content()).includes("Casey · FAKE CLIENT"), false);
    await pp.screenshot({
      path: root + "/partner-delivered.png",
      fullPage: true,
    });
    await db.query(
      "update team_jobs set code_expires_at=now()-interval '1 second'",
    );
    await c.reload();
    await c.getByText("This invitation is unavailable or expired.").waitFor();
    assert.deepEqual(errors, []);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from team_job_messages where status='sent'",
        )
      ).rows[0].n,
      0,
    );
    fs.writeFileSync(
      root + "/browser-results.json",
      JSON.stringify(
        {
          onboarding: true,
          noPasswordFields: true,
          expiry: true,
          ownerDigest: true,
          fixBrief: true,
          syntheticBeforeAfter: true,
          deliveryQueue: true,
          partnerStatusOnly: true,
          noRealSends: true,
          errors,
        },
        null,
        2,
      ),
    );
    console.log("Browser acceptance passed with fake data only.");
  }
} finally {
  await browser.close();
  await db.end();
}
