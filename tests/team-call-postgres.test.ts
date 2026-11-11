import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import type Stripe from "stripe";
import { seed } from "../lib/team/seed";
import { transaction } from "../lib/team/db";
import {
  activeLead,
  callState,
  saveCell,
  recordOutcome,
  publishDeal,
  publicDeal,
  markEngagement,
  callInbox,
} from "../lib/team/call-store";
import { createOfferCheckout } from "../lib/acquisition/service-checkout";
import { processStripeEvent } from "../lib/payments";
import { resolveCallCheckout } from "../lib/team/call-checkout";
import { optOut } from "../lib/team/store";
test("call mode real PostgreSQL integration", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0270-postgres-"));
  const net = createServer();
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
  const db = new Pool({ host: "127.0.0.1", port, database: "postgres" });
  const tx = <T>(fn: Parameters<typeof transaction<T>>[0]) =>
    transaction(fn, db);
  const data = seed(true),
    [owner, a, b] = data.partners;
  const proof = {
    confidence: "confirmed",
    measurement: "FAKE booking button returns a 404 page.",
    proof: {
      image: "data:image/png;base64,YQ==",
      captured_at: new Date().toISOString(),
    },
  };
  let code = "";
  try {
    for (const f of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
      "010_team_portal.sql",
      "012_team_password.sql",
      "014_team_call.sql",
    ])
      await db.query(readFileSync("db/" + f, "utf8"));
    await db.query(readFileSync("db/014_team_call.sql", "utf8"));
    for (const p of data.partners)
      await db.query(
        "insert into team_partners(id,name,email,role) values($1,$2,$3,$4)",
        [p.id, p.name, p.id + "@example.test", p.role],
      );
    for (const l of data.leads)
      await db.query(
        "insert into team_leads(id,partner_id,business,email,phone,website,data) values($1,$2,$3,$4,$5,$6,$7)",
        [
          l.id,
          l.partner_id,
          l.business,
          l.email,
          "3125550100",
          l.website,
          { ...l, evidence: [proof] },
        ],
      );
    for (const d of data.deals)
      await db.query(
        "insert into team_deals(id,partner_id,lead_id,services,price,monthly,approved,scope) values($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          d.id,
          d.partner_id,
          d.lead_id,
          JSON.stringify(d.services),
          d.price,
          d.monthly,
          d.approved,
          d.scope,
        ],
      );
    await t.test(
      "active state persists across readers and rejects cross-partner reads and writes",
      async () => {
        await tx((q) => activeLead(q, a, "lead-0"));
        assert.equal((await callState(db, a)).lead?.id, "lead-0");
        assert.equal((await callState(db, b)).lead, null);
        await assert.rejects(tx((q) => activeLead(q, b, "lead-0")));
        await assert.rejects(callState(db, b, "lead-0"));
        await tx((q) => activeLead(q, b, "lead-3"));
        assert.equal((await callState(db, a)).lead?.id, "lead-0");
        await tx((q) => activeLead(q, owner, "lead-3"));
        assert.equal((await callState(db, owner)).lead?.id, "lead-3");
        assert.equal((await callState(db, a)).lead?.id, "lead-0");
      },
    );
    await t.test(
      "client cell survives refresh; malformed and cross-partner updates rejected",
      async () => {
        await tx((q) => saveCell(q, a, "lead-0", "(312) 555-0188"));
        assert.equal((await callState(db, a)).details?.cell, "+13125550188");
        await assert.rejects(tx((q) => saveCell(q, b, "lead-0", "3125550188")));
        await assert.rejects(tx((q) => saveCell(q, a, "lead-0", "hello")));
      },
    );
    await t.test(
      "voicemail records note, stage and tomorrow follow-up; closed needs approval",
      async () => {
        await tx((q) => recordOutcome(q, a, "lead-0", "Voicemail"));
        const state = await callState(db, a);
        assert.equal(state.deal?.stage, "Contacted");
        assert.match(state.lead!.notes, /Call: Voicemail/);
        assert.ok(
          Date.parse(String(state.details?.follow_up_at)) - Date.now() >
            23 * 3600000,
        );
        await assert.rejects(
          tx((q) => recordOutcome(q, a, "lead-2", "Closed")),
        );
        await tx((q) => recordOutcome(q, a, "lead-0", "Closed"));
        assert.equal((await callState(db, a)).deal?.stage, "Won");
      },
    );
    await t.test(
      "approved catalog only; confirmed proof required; stable unique public code",
      async () => {
        await assert.rejects(tx((q) => publishDeal(q, a, "deal-2", true)));
        await assert.rejects(tx((q) => publishDeal(q, b, "deal-0", true)));
        await assert.rejects(tx((q) => publishDeal(q, a, "deal-0")));
        code = (await tx((q) => publishDeal(q, a, "deal-0", true))).code;
        assert.equal(
          (await tx((q) => publishDeal(q, a, "deal-0", true))).code,
          code,
        );
        assert.ok(await publicDeal(db, code.toUpperCase()));
        await db.query(
          "update team_leads set data=jsonb_set(data,'{evidence}','[]') where id='lead-3'",
        );
        await assert.rejects(tx((q) => publishDeal(q, b, "deal-3", true)));
      },
    );
    await t.test("failed rechecks suppress stale proof; latest canonical URL audit supplies fresh proof",async()=>{
      await db.query("update team_leads set data=data||$1::jsonb where id='lead-0'",[JSON.stringify({recheck:{status:'re-check failed',checked_at:new Date().toISOString(),confirmed_count:0}})]);
      assert.equal((await callState(db,a)).problem,null);
      await tx(q=>activeLead(q,a,"lead-0"));
      assert.equal((await callState(db,a)).lead?.recheck?.status,"re-check failed");
      await assert.rejects(tx(q=>saveCell(q,a,"lead-0","3125550188")));
      await assert.rejects(tx(q=>recordOutcome(q,a,"lead-0","Interested")));
      await assert.rejects(tx(q=>publishDeal(q,a,"deal-0",true)));
      assert.equal(await publicDeal(db,code),null);
      await assert.rejects(resolveCallCheckout("fix",{partner:a.id,deal:"deal-0"},code,db));
      await db.query("update team_leads set data=data||$1::jsonb where id='lead-0'",[JSON.stringify({recheck:{status:'confirmed',checked_at:new Date().toISOString(),confirmed_count:1}})]);
      await db.query("update team_leads set website='https://example.test' where id='lead-0'");
      await db.query("insert into team_site_checks(id,partner_id,data) values('fresh-proof','demo-a',$1)",[JSON.stringify({url:'https://example.test/',findings:[]})]);
      assert.equal((await callState(db,a)).problem,null);
      await db.query("update team_site_checks set data=$1 where id='fresh-proof'",[JSON.stringify({url:'https://example.test/',findings:[proof]})]);
      assert.equal((await callState(db,a)).problem,proof.measurement);
      await db.query("update team_leads set website='https://example.test/0',data=data||$1::jsonb where id='lead-0'",[JSON.stringify({recheck:{status:'confirmed',checked_at:new Date().toISOString(),confirmed_count:1}})]);
    });
    await t.test(
      "checkout validates page, price, partner, demo flag and prefills email only server-side",
      async () => {
        const refs = { partner: a.id, deal: "deal-0" };
        assert.equal(
          (await resolveCallCheckout("fix", refs, code, db)).email,
          "demo0@example.test",
        );
        await assert.rejects(resolveCallCheckout("care", refs, code, db));
        await assert.rejects(
          resolveCallCheckout("fix", { ...refs, partner: b.id }, code, db),
        );
        await db.query("update team_deal_pages set is_demo=true");
        await assert.rejects(resolveCallCheckout("fix", refs, code, db));
        await assert.rejects(resolveCallCheckout("fix", refs, undefined, db));
        await db.query("update team_deal_pages set is_demo=false");
      },
    );
    await t.test(
      "open / checkout reserve exactly one task due after two hours",
      async () => {
        await tx((q) => markEngagement(q, code, "opened"));
        await tx((q) => markEngagement(q, code, "opened"));
        await tx((q) => markEngagement(q, code, "checkout"));
        const row = (await db.query("select * from team_payment_followups"))
          .rows;
        assert.equal(row.length, 1);
        assert.ok(row[0].due_at - Date.now() > 7100000);
        assert.equal((await callInbox(db, a)).followups.length, 0);
        await db.query(
          "update team_payment_followups set due_at=now()-interval '1 minute'",
        );
        assert.equal((await callInbox(db, a)).followups.length, 1);
        assert.equal((await callInbox(db, b)).followups.length, 0);
        const s = await callState(db, a);
        assert.ok(s.page?.opened_at);
        assert.ok(s.page?.checkout_started_at);
      },
    );
    await t.test(
      "expired, lost, opt-out, unapproved and deactivated pages are inaccessible",
      async () => {
        await db.query(
          "update team_deal_pages set expires_at=now()-interval '1 second'",
        );
        assert.equal(await publicDeal(db, code), null);
        await assert.rejects(tx((q) => markEngagement(q, code, "checkout")));
        await db.query(
          "update team_deal_pages set expires_at=now()+interval '1 day'",
        );
        await db.query("update team_deals set stage='Lost' where id='deal-0'");
        assert.equal(await publicDeal(db, code), null);
        await db.query(
          "update team_deals set stage='Won',approved=false where id='deal-0'",
        );
        assert.equal(await publicDeal(db, code), null);
        await db.query("update team_deals set approved=true where id='deal-0'");
        await db.query(
          "update team_partners set active=false where id='demo-a'",
        );
        assert.equal(await publicDeal(db, code), null);
        await db.query(
          "update team_partners set active=true where id='demo-a'",
        );
      },
    );
    await t.test(
      "verified mocked Stripe event atomically pays deal, clears task, alerts owner, deactivates page; replay is safe",
      async () => {
        let metadata: Stripe.MetadataParam = {};
        const sessionId = "cs_test_" + crypto.randomUUID();
        const stripe = {
          checkout: {
            sessions: {
              create: async (input: Stripe.Checkout.SessionCreateParams) => {
                metadata = input.metadata!;
                assert.equal(input.customer_email, "fake@example.test");
                return {
                  id: sessionId,
                  url: "https://checkout.stripe.com/fake",
                };
              },
            },
          },
        } as unknown as Stripe;
        const payment = await createOfferCheckout(
          "fix",
          {
            source: "test",
            email: "fake@example.test",
            attribution: { partner: a.id, deal: "deal-0" },
          },
          "https://example.test",
          db,
          stripe,
        );
        const event = {
          id: "evt_" + crypto.randomUUID(),
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
              payment_intent: "pi_fake",
              customer_details: {
                name: "Fake buyer",
                email: "fake@example.test",
              },
            },
          },
        } as unknown as Stripe.Event;
        let notices = 0;
        const notify = async (
          notice: import("../lib/acquisition/intake").PaidAuditNotice,
        ) => {
          notices++;
          assert.equal(notice.team?.ownerEmail, "owner@example.test");
          return { ok: true, providerId: "mock-only" };
        };
        await processStripeEvent(event, db, notify);
        await processStripeEvent(event, db, notify);
        await processStripeEvent(
          { ...event, id: "evt_" + crypto.randomUUID() },
          db,
          notify,
        );
        const s = await callState(db, a);
        assert.equal(notices, 1);
        assert.equal(s.deal?.stage, "Client paid");
        assert.ok(s.page?.paid_at);
        assert.equal(s.commission, 11960);
        assert.equal(await publicDeal(db, code), null);
        assert.equal((await callInbox(db, a)).followups.length, 0);
        assert.equal((await callInbox(db, a)).alerts.length, 0);
        assert.equal((await callInbox(db, owner)).alerts.length, 1);
        assert.equal(
          (await db.query("select count(*)::int n from team_owner_alerts"))
            .rows[0].n,
          1,
        );
        assert.equal(
          (
            await db.query("select status from crm_payments where id=$1", [
              payment.id,
            ])
          ).rows[0].status,
          "paid",
        );
      },
    );
    await t.test(
      "opt-outs deny calls and publication and reassignment removes active read access",
      async () => {
        await tx((q) => optOut(q, a, "lead-2"));
        await assert.rejects(tx((q) => activeLead(q, a, "lead-2")));
        await assert.rejects(tx((q) => saveCell(q, a, "lead-2", "3125550100")));
        await db.query(
          "update team_active_leads set lead_id='lead-3' where partner_id='demo-a'",
        );
        assert.equal((await callState(db, a)).lead, null);
      },
    );
  } finally {
    await db.end();
    execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], {
      stdio: "ignore",
    });
    console.log("Retained call-mode synthetic database fixture: " + dir);
  }
});
