import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import type Stripe from "stripe";
import {
  invite,
  passwordLogin,
  sessionActor,
  hashPassword,
  verifyPassword,
  rateLimit,
  requestMagicLink,
  consumeMagicLink,
  cookieOptions,
  digest,
} from "../lib/team/auth";
import {
  snapshot,
  scopedDeal,
  saveQuote,
  updateDeal,
  recordPayout,
  optOut,
  importAssigned,
} from "../lib/team/store";
import { transaction } from "../lib/team/db";
import { seed } from "../lib/team/seed";
import { commission } from "../lib/team/domain";
import { createOfferCheckout } from "../lib/acquisition/service-checkout";
import { processStripeEvent } from "../lib/payments";
const importFixture = (suffix = "one") => ({
  business: `FAKE Imported ${suffix}`,
  phone: "3125550199",
  email: "",
  website: `https://fake-import-${suffix}.test`,
  channel: "Online",
  notes: "Fictional finding.",
  created_at: "2026-11-10T12:00:00Z",
  vertical: "salon",
  city: "Austin",
  state: "TX",
  time_zone: "America/Chicago",
  metro: "austin,TX",
  draft_email: "Fictional draft",
  reply_to: "blake@koinophobialabs.com",
  evidence: [
    {
      check: "Mobile viewport",
      url: `https://fake-import-${suffix}.test`,
      measured_at: "2026-11-10T12:00:00Z",
      measurement: "No device-width viewport.",
      severity: 25,
      impact: "May be hard to use on a phone.",
    },
  ],
  contact_route: {
    kind: "phone",
    value: "3125550199",
    name: "",
    source_url: `https://fake-import-${suffix}.test`,
    measured_at: "2026-11-10T12:00:00Z",
  },
  fit_score: 32,
  score_reason: "Measured finding.",
  suggested_offer: {
    id: "fix",
    name: "The Fix",
    price: 29900,
    cadence: "once",
  },
  opener: "A measured issue.",
  source_url: "https://example.test/source",
  discovered_at: "2026-11-10T12:00:00Z",
});
test("team portal real PostgreSQL acceptance", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0257-postgres-")),
    net = createServer();
  await new Promise<void>((r) => net.listen(0, "127.0.0.1", r));
  const port = (net.address() as { port: number }).port;
  await new Promise<void>((r) => net.close(() => r()));
  execFileSync(
    "initdb",
    ["-D", dir, "-A", "trust", "--no-locale", "-E", "UTF8"],
    { stdio: "ignore" },
  );
  execFileSync(
    "pg_ctl",
    [
      "-D",
      dir,
      "-l",
      join(dir, "server.log"),
      "-o",
      `-F -p ${port} -h 127.0.0.1 -k ${dir}`,
      "-w",
      "start",
    ],
    { stdio: "ignore" },
  );
  const db = new Pool({
      host: "127.0.0.1",
      port,
      database: "postgres",
      max: 8,
    }),
    fake = seed(true),
    [owner, a, b] = fake.partners;
  const tx = <T>(work: Parameters<typeof transaction<T>>[0]) =>
    transaction(work, db);
  const notify = async () => {
    throw Error("No email sends allowed in partner payment tests");
  };
  async function paymentFixture(
    offer: "fix" | "care" = "fix",
    dealId = "deal-0",
  ) {
    const id = "cs_test_" + crypto.randomUUID();
    let metadata: Stripe.MetadataParam = {};
    const client = {
      checkout: {
        sessions: {
          create: async (input: Stripe.Checkout.SessionCreateParams) => {
            metadata = input.metadata!;
            return { id, url: "https://checkout.stripe.com/c/pay/" + id };
          },
        },
      },
    } as unknown as Stripe;
    const payment = await createOfferCheckout(
      offer,
      {
        source: "test",
        email: "fake@example.test",
        attribution: {
          partner: dealId === "deal-3" ? b.id : a.id,
          deal: dealId,
        },
      },
      "https://example.test",
      db,
      client,
    );
    const event = {
      id: "evt_" + crypto.randomUUID(),
      type: "checkout.session.completed",
      created: 1794337200,
      data: {
        object: {
          id,
          metadata,
          mode: offer === "care" ? "subscription" : "payment",
          amount_total: offer === "care" ? 9900 : 29900,
          currency: "usd",
          subscription: offer === "care" ? "sub_" + id : null,
          payment_status: "paid",
          payment_intent: "pi_" + payment.id,
          customer_details: { name: "Fake buyer", email: "fake@example.test" },
        },
      },
    } as unknown as Stripe.Event;
    return { payment, event };
  }
  try {
    for (const f of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
    ])
      await db.query(readFileSync(join("db", f), "utf8"));
    await t.test(
      "additive migration can run twice without altering CRM columns",
      async () => {
        const before = (
          await db.query(
            "select table_name,column_name,data_type from information_schema.columns where table_name like 'crm_%' order by table_name,column_name",
          )
        ).rows;
        await db.query(readFileSync("db/010_team_portal.sql", "utf8"));
        await db.query(readFileSync("db/010_team_portal.sql", "utf8"));
        assert.deepEqual(
          (
            await db.query(
              "select table_name,column_name,data_type from information_schema.columns where table_name like 'crm_%' order by table_name,column_name",
            )
          ).rows,
          before,
        );
      },
    );
    for (const p of fake.partners)
      await db.query(
        "insert into team_partners(id,name,email,role) values($1,$2,$3,$4)",
        [p.id, p.name, p.id + "@example.test", p.role],
      );
    for (const l of fake.leads)
      await db.query(
        "insert into team_leads(id,partner_id,business,email,phone,website,data) values($1,$2,$3,$4,$5,$6,$7)",
        [l.id, l.partner_id, l.business, l.email, l.phone, l.website, l],
      );
    for (const d of fake.deals)
      await db.query(
        "insert into team_deals(id,partner_id,lead_id,services,price,monthly,approved,scope,stage) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          d.id,
          d.partner_id,
          d.lead_id,
          JSON.stringify(d.services),
          d.price,
          d.monthly,
          d.approved,
          d.scope,
          d.stage,
        ],
      );
    await t.test(
      "salted strong KDF; no plaintext; correct and wrong passwords",
      async () => {
        const h = await hashPassword("fake-test-password-only");
        assert.notEqual(h, await hashPassword("fake-test-password-only"));
        assert.ok(!h.includes("fake-test"));
        assert.ok(await verifyPassword("fake-test-password-only", h));
        assert.ok(!(await verifyPassword("wrong", h)));
        await assert.rejects(hashPassword("short"));
      },
    );
    await t.test(
      "owner creates invitation; partner cannot; forged owner role ignored",
      async () => {
        await assert.rejects(
          invite(db, a, { name: "Fake", email: "bad@example.test" }),
          /Only Blake/,
        );
        const i = await invite(db, owner, {
          name: "Fake invite",
          email: "invite@example.test",
          role: "owner",
        });
        const row = (
          await db.query("select * from team_partners where id=$1", [i.id])
        ).rows[0];
        assert.equal(row.role, "partner");
        assert.equal(row.invite_hash, digest(i.code));
        assert.equal(row.override_rate, "0");
      },
    );
    await t.test(
      "invite is one-use, expiring, and binds email; password then logs in",
      async () => {
        const i = await invite(db, owner, {
          name: "Fake accept",
          email: "accept@example.test",
        });
        await assert.rejects(
          passwordLogin(
            db,
            "wrong@example.test",
            "fake-test-password-only",
            i.code,
          ),
        );
        const value = await tx((q) =>
          passwordLogin(
            q,
            "accept@example.test",
            "fake-test-password-only",
            i.code,
          ),
        );
        assert.equal((await sessionActor(db, value))?.id, i.id);
        await assert.rejects(
          passwordLogin(
            db,
            "accept@example.test",
            "fake-test-password-only",
            i.code,
          ),
        );
        assert.ok(
          await passwordLogin(
            db,
            "accept@example.test",
            "fake-test-password-only",
          ),
        );
        await assert.rejects(passwordLogin(db, "accept@example.test", "wrong"));
        assert.ok(
          !(
            await db.query(
              "select invite_hash from team_partners where id=$1",
              [i.id],
            )
          ).rows[0].invite_hash,
        );
      },
    );
    await t.test("expired invite is rejected", async () => {
      const i = await invite(db, owner, {
        name: "Fake expired",
        email: "expired@example.test",
      });
      await db.query(
        "update team_partners set invite_expires_at=now()-interval '1 second' where id=$1",
        [i.id],
      );
      await assert.rejects(
        passwordLogin(
          db,
          "expired@example.test",
          "fake-test-password-only",
          i.code,
        ),
      );
    });
    await t.test(
      "concurrent invite replay grants exactly one session",
      async () => {
        const i = await invite(db, owner, {
          name: "Fake concurrent",
          email: "concurrent@example.test",
        });
        const results = await Promise.allSettled(
          Array.from({ length: 2 }, () =>
            tx((q) =>
              passwordLogin(
                q,
                "concurrent@example.test",
                "fake-test-password-only",
                i.code,
              ),
            ),
          ),
        );
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      },
    );
    await t.test(
      "durable rate limiter rejects concurrent excess attempts",
      async () => {
        const r = await Promise.allSettled(
          Array.from({ length: 12 }, () => rateLimit(db, "fake-rate", 8)),
        );
        assert.equal(r.filter((x) => x.status === "fulfilled").length, 8);
        await assert.rejects(rateLimit(db, "fake-rate", 8));
      },
    );
    await t.test(
      "magic link is invite-only, hashed, one-use; injected delivery only",
      async () => {
        const links: string[] = [];
        const send = async (_email: string, url: string) => {
          links.push(url);
        };
        await requestMagicLink(
          db,
          "absent@example.test",
          "https://example.test",
          send,
        );
        assert.equal(links.length, 0);
        await requestMagicLink(
          db,
          "demo-a@example.test",
          "https://example.test",
          send,
        );
        assert.equal(links.length, 1, "one request sends exactly one email");
        const token = new URL(links[0]).searchParams.get("token")!;
        assert.equal(
          (await db.query("select token_hash from team_login_tokens")).rows[0]
            .token_hash,
          digest(token),
        );
        const session = await tx((q) => consumeMagicLink(q, token));
        assert.equal((await sessionActor(db, session))?.id, a.id);
        await assert.rejects(consumeMagicLink(db, token));
      },
    );
    await t.test("magic sends are deduplicated across concurrent requests for 60 seconds", async () => {
      const email = "magic-dedup@example.test";
      const invited = await invite(db, owner, { name: "Fake dedup", email });
      const links: string[] = [];
      const send = async (_email: string, url: string) => { links.push(url); };
      await Promise.all(Array.from({ length: 8 }, () =>
        requestMagicLink(db, email, "https://example.test", send),
      ));
      assert.equal(links.length, 1);
      await requestMagicLink(db, email, "https://example.test", send);
      assert.equal(links.length, 1, "fast repeat after response is suppressed too");
      assert.equal((await db.query("select count(*)::int as n from team_login_tokens where partner_id=$1", [invited.id])).rows[0].n, 1);
      await db.query("update team_rate_limits set reset_at=now()-interval '1 second' where key=$1", [digest("magic-send:" + invited.id)]);
      await requestMagicLink(db, email, "https://example.test", send);
      assert.equal(links.length, 2, "a deliberate request after the cooldown can resend");
    });
    await t.test("uncertain delivery does not resend immediately or invalidate a delivered link", async () => {
      const email = "magic-timeout@example.test";
      await invite(db, owner, { name: "Fake timeout", email });
      let calls = 0, delivered = "";
      const send = async (_email: string, url: string) => {
        calls++;
        delivered = new URL(url).searchParams.get("token")!;
        throw Error("Simulated timeout after acceptance");
      };
      await assert.rejects(requestMagicLink(db, email, "https://example.test", send), /unavailable/);
      await requestMagicLink(db, email, "https://example.test", send);
      assert.equal(calls, 1);
      const session = await consumeMagicLink(db, delivered);
      assert.equal((await sessionActor(db, session))?.email, email);
    });
    await t.test(
      "expired sessions and deactivated accounts lose access immediately",
      async () => {
        const session = await passwordLogin(
          db,
          "accept@example.test",
          "fake-test-password-only",
        );
        await db.query(
          "update team_sessions set expires_at=now()-interval '1 second' where token_hash=$1",
          [digest(session)],
        );
        assert.equal(await sessionActor(db, session), null);
        const next = await passwordLogin(
          db,
          "accept@example.test",
          "fake-test-password-only",
        );
        await db.query(
          "update team_partners set active=false where email='accept@example.test'",
        );
        assert.equal(await sessionActor(db, next), null);
        assert.equal(cookieOptions.httpOnly, true);
        assert.equal(cookieOptions.sameSite, "lax");
        assert.equal(cookieOptions.path, "/team");
      },
    );
    await t.test(
      "SQL snapshot and direct reads isolate every partner and remove hashes",
      async () => {
        const s = await snapshot(db, a);
        assert.equal(s.deals.length, 3);
        assert.ok(s.leads.every((l) => l.partner_id === a.id));
        assert.equal(s.partners.length, 1);
        assert.doesNotMatch(
          JSON.stringify(s),
          /password_hash|invite_hash|token_hash/,
        );
        await assert.rejects(scopedDeal(db, b, "deal-0"), /not found/);
        await assert.rejects(
          updateDeal(db, b, "deal-0", { stage: "Lost", reason: "fake" }),
          /not found/,
        );
        assert.equal((await snapshot(db, owner)).deals.length, 4);
      },
    );
    await t.test(
      "partners cannot approve quotes or record payouts or client paid",
      async () => {
        await assert.rejects(
          updateDeal(db, a, "deal-0", { action: "approve" }),
          /Only Blake/,
        );
        await assert.rejects(recordPayout(db, a, "deal-0", 1), /Only Blake/);
        await assert.rejects(
          updateDeal(db, a, "deal-0", { stage: "Client paid" }),
          /automatically/,
        );
      },
    );
    await t.test(
      "quote creation is scoped and catalog price is server-owned",
      async () => {
        await assert.rejects(
          saveQuote(db, b, { lead_id: "lead-0", services: ["fix"] }),
          /not found/,
        );
        const { id } = await saveQuote(db, a, {
          lead_id: "lead-0",
          services: ["fix"],
          price: 1,
          approved: true,
          partner_id: b.id,
        });
        const d = await scopedDeal(db, a, id);
        assert.equal(d.price, 29900);
        assert.equal(d.approved, false);
        assert.equal(d.partner_id, a.id);
        await assert.rejects(
          updateDeal(db, a, id, { stage: "Won" }),
          /one stage/,
        );
      },
    );
    await t.test(
      "mocked paid checkout automatically advances and owes exactly 40%; retries dedupe",
      async () => {
        const { event } = await paymentFixture();
        assert.equal(
          commission(await snapshot(db, a), await scopedDeal(db, a, "deal-0"))
            .owed,
          0,
        );
        await Promise.all([
          processStripeEvent(event, db, notify),
          processStripeEvent(event, db, notify),
          processStripeEvent(
            {
              ...event,
              id: event.id + "async",
              type: "checkout.session.async_payment_succeeded",
            } as Stripe.Event,
            db,
            notify,
          ),
        ]);
        const s = await snapshot(db, a),
          d = await scopedDeal(db, a, "deal-0");
        assert.equal(d.stage, "Client paid");
        assert.equal(commission(s, d).owed, 11960);
        assert.equal(s.payments.filter((p) => p.deal_id === d.id).length, 1);
      },
    );
    await t.test(
      "payout is bounded and serialized; commission uses CRM payment records",
      async () => {
        const r = await Promise.allSettled([
          tx((q) => recordPayout(q, owner, "deal-0", 10000)),
          tx((q) => recordPayout(q, owner, "deal-0", 10000)),
        ]);
        assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
        assert.equal(
          commission(await snapshot(db, a), await scopedDeal(db, a, "deal-0"))
            .owed,
          1960,
        );
      },
    );
    await t.test(
      "Care first invoice is not doubled; each renewal adds 40% exactly once",
      async () => {
        const { event } = await paymentFixture("care", "deal-3"),
          s = event.data.object as Stripe.Checkout.Session;
        const invoice = {
          id: "in_fake_first",
          billing_reason: "subscription_create",
          amount_paid: 9900,
          currency: "usd",
          status: "paid",
          parent: {
            subscription_details: {
              subscription: s.subscription,
              metadata: s.metadata,
            },
          },
        };
        const first = {
          id: "evt_fake_first",
          type: "invoice.paid",
          created: 1794337200,
          data: { object: invoice },
        } as unknown as Stripe.Event;
        await processStripeEvent(first, db, notify);
        await processStripeEvent(event, db, notify);
        assert.equal(
          commission(await snapshot(db, b), await scopedDeal(db, b, "deal-3"))
            .owed,
          3960,
        );
        for (let i = 0; i < 2; i++) {
          const renewal = {
            ...first,
            id: "evt_renewal_" + i,
            data: {
              object: {
                ...invoice,
                id: "in_renewal_" + i,
                billing_reason: "subscription_cycle",
              },
            },
          } as unknown as Stripe.Event;
          await Promise.all([
            processStripeEvent(renewal, db, notify),
            processStripeEvent(
              { ...renewal, id: renewal.id + "duplicate" },
              db,
              notify,
            ),
          ]);
        }
        assert.equal(
          commission(await snapshot(db, b), await scopedDeal(db, b, "deal-3"))
            .owed,
          11880,
        );
        assert.equal((await snapshot(db, b)).payments.length, 3);
      },
    );
    await t.test(
      "invalid attribution rolls back paid event and CRM payment; retry works",
      async () => {
        const { event, payment } = await paymentFixture();
        await db.query("update team_deals set approved=false where id=$1", [
          "deal-0",
        ]);
        await assert.rejects(
          processStripeEvent(event, db, notify),
          /ATTRIBUTION_MISMATCH/,
        );
        assert.equal(
          (
            await db.query("select status from crm_payments where id=$1", [
              payment.id,
            ])
          ).rows[0].status,
          "pending",
        );
        assert.equal(
          (
            await db.query(
              "select * from stripe_webhook_events where event_id=$1",
              [event.id],
            )
          ).rows.length,
          0,
        );
        await db.query("update team_deals set approved=true where id=$1", [
          "deal-0",
        ]);
        await processStripeEvent(event, db, notify);
      },
    );
    await t.test(
      "refund is reflected directly in earned and owed without duplicate payment data",
      async () => {
        const { event, payment } = await paymentFixture();
        await processStripeEvent(event, db, notify);
        const before = commission(
          await snapshot(db, a),
          await scopedDeal(db, a, "deal-0"),
        ).earned;
        const refund = {
          id: "evt_refund_fake",
          type: "charge.refunded",
          data: { object: { metadata: { paymentId: payment.id } } },
        } as unknown as Stripe.Event;
        await processStripeEvent(refund, db, notify);
        assert.equal(
          commission(await snapshot(db, a), await scopedDeal(db, a, "deal-0"))
            .earned,
          before - 11960,
        );
      },
    );
    await t.test(
      "owner-only import preserves format; rejects whole invalid batch; global dedupe",
      async () => {
        await assert.rejects(importAssigned(db, a, a.id, [importFixture()]));
        await assert.rejects(
          tx((q) =>
            importAssigned(q, owner, a.id, [
              importFixture(),
              { ...importFixture("bad"), evidence: [] },
            ]),
          ),
        );
        assert.equal(
          (
            await db.query(
              "select * from team_leads where business like 'FAKE Imported%'",
            )
          ).rows.length,
          0,
        );
        const r = await tx((q) =>
          importAssigned(q, owner, a.id, [importFixture()]),
        );
        assert.equal(r.imported, 1);
        const again = await tx((q) =>
          importAssigned(q, owner, b.id, [importFixture()]),
        );
        assert.equal(again.duplicates, 1);
        const l = (await snapshot(db, a)).leads.find(
          (l) => l.business === "FAKE Imported one",
        )!;
        assert.equal(l.time_zone, "America/Chicago");
        assert.ok(l.evidence?.length);
      },
    );
    await t.test(
      "opt-outs cross partners and block new imports, quotes and outreach stages",
      async () => {
        await db.query("update team_leads set email=$1 where id=$2", [
          "demo0@example.test",
          "lead-3",
        ]);
        await optOut(db, a, "lead-0");
        assert.equal(
          (await snapshot(db, b)).leads.find((l) => l.id === "lead-3")
            ?.opted_out,
          true,
        );
        await assert.rejects(
          saveQuote(db, a, { lead_id: "lead-0", services: ["fix"] }),
          /opted out/,
        );
        await assert.rejects(optOut(db, b, "lead-0"), /not found/);
        const imported = (await snapshot(db, a)).leads.find(
          (l) => l.business === "FAKE Imported one",
        )!;
        await optOut(db, a, imported.id);
        const r = await tx((q) =>
          importAssigned(q, owner, b.id, [importFixture("two")]),
        );
        assert.equal(r.suppressed, 1);
      },
    );
    await t.test(
      "down migration removes only portal tables; CRM payment history survives; up restores",
      async () => {
        const before = (
          await db.query("select count(*)::int n from crm_payments")
        ).rows[0].n;
        await db.query(readFileSync("db/010_team_portal.down.sql", "utf8"));
        assert.equal(
          (
            await db.query(
              "select tablename from pg_tables where schemaname='public' and tablename like 'team_%'",
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select count(*)::int n from crm_payments")).rows[0]
            .n,
          before,
        );
        await db.query(readFileSync("db/010_team_portal.sql", "utf8"));
        assert.ok(
          (await db.query("select to_regclass('public.team_deals') t")).rows[0]
            .t,
        );
      },
    );
  } finally {
    await db.end();
    execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], {
      stdio: "ignore",
    });
    t.diagnostic("Retained PostgreSQL fixture: " + dir);
  }
});
