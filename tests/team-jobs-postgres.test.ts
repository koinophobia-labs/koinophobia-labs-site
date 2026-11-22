import { confirmedEvidence } from "./auditor-fixtures";
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
import {
  ownerJobs,
  ownerJob,
  publicJob,
  saveOnboarding,
  jobAction,
  collectJobAlerts,
} from "../lib/team/jobs-store";
import { runJobVerification } from "../lib/team/jobs-verification";
import { snapshot, updateDeal } from "../lib/team/store";
import { optOut } from "../lib/team/store";
test("fulfillment on real PostgreSQL; fake payments and no mail sends", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0274-postgres-"));
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
  const proof = { ...confirmedEvidence(), verify_url: "https://fictional.example/" };
  let code = "";
  try {
    for (const f of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
      "010_team_portal.sql",
      "012_team_password.sql",
      "014_team_call.sql",
      "015_team_fulfillment.sql",
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
          { ...l, platform: "Wix", evidence: [proof] },
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
    await t.test(
      "failed rechecks suppress stale proof; latest canonical URL audit supplies fresh proof",
      async () => {
        await db.query(
          "update team_leads set data=data||$1::jsonb where id='lead-0'",
          [
            JSON.stringify({
              recheck: {
                status: "re-check failed",
                checked_at: new Date().toISOString(),
                confirmed_count: 0,
              },
            }),
          ],
        );
        assert.equal((await callState(db, a)).problem, null);
        await tx((q) => activeLead(q, a, "lead-0"));
        assert.equal(
          (await callState(db, a)).lead?.recheck?.status,
          "re-check failed",
        );
        await assert.rejects(tx((q) => saveCell(q, a, "lead-0", "3125550188")));
        await assert.rejects(
          tx((q) => recordOutcome(q, a, "lead-0", "Interested")),
        );
        await assert.rejects(tx((q) => publishDeal(q, a, "deal-0", true)));
        assert.equal(await publicDeal(db, code), null);
        await assert.rejects(
          resolveCallCheckout(
            "fix",
            { partner: a.id, deal: "deal-0" },
            code,
            db,
          ),
        );
        await db.query(
          "update team_leads set data=data||$1::jsonb where id='lead-0'",
          [
            JSON.stringify({
              recheck: {
                status: "confirmed",
                checked_at: new Date().toISOString(),
                confirmed_count: 1,
              },
            }),
          ],
        );
        await db.query(
          "update team_leads set website='https://example.test' where id='lead-0'",
        );
        await db.query(
          "insert into team_site_checks(id,partner_id,data) values('fresh-proof','demo-a',$1)",
          [JSON.stringify({ url: "https://example.test/", findings: [] })],
        );
        assert.equal((await callState(db, a)).problem, null);
        await db.query(
          "update team_site_checks set data=$1 where id='fresh-proof'",
          [JSON.stringify({ url: "https://example.test/", findings: [proof] })],
        );
        assert.equal((await callState(db, a)).problem, proof.measurement);
        await db.query(
          "update team_leads set website='https://example.test/0',data=data||$1::jsonb where id='lead-0'",
          [
            JSON.stringify({
              recheck: {
                status: "confirmed",
                checked_at: new Date().toISOString(),
                confirmed_count: 1,
              },
            }),
          ],
        );
      },
    );
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
      "paid job is idempotent; access and proof never enter partner snapshot",
      async () => {
        const jobs = await ownerJobs(db, owner);
        assert.equal(jobs.length, 1);
        const j = jobs[0];
        assert.equal(j.offer, "fix");
        assert.equal(j.stage, "Waiting on client access");
        assert.equal(
          new Date(j.deadline!).getTime() - new Date(j.paid_at).getTime(),
          72 * 3600000,
        );
        assert.equal(j.data.findings.length, 1);
        assert.equal(j.data.contact, "Fake buyer");
        assert.equal(j.data.platform, "Wix");
        assert.equal((await publicJob(db,j.code))?.partner_name,a.name);
        await assert.rejects(ownerJobs(db, a));
        await assert.rejects(ownerJob(db, b, j.id));
        await assert.rejects(
          tx((q) => jobAction(q, a, j.id, { action: "access" })),
        );
        const partnerSnapshot = await snapshot(db, a);
        assert.equal(
          partnerSnapshot.jobStatuses?.[0].stage,
          "Waiting on client access",
        );
        assert.equal(
          JSON.stringify(partnerSnapshot.jobStatuses).includes(j.code),
          false,
        );
        assert.deepEqual(Object.keys(partnerSnapshot.jobStatuses![0]).sort(), [
          "deal_id",
          "stage",
        ]);
        assert.ok(await publicJob(db, j.code));
        await db.query(
          "update team_jobs set code_expires_at=now()-interval '1 second'",
        );
        assert.equal(await publicJob(db, j.code), null);
        await assert.rejects(
          tx((q) =>
            saveOnboarding(q, j.code, {
              platform: "Wix",
              contact: "Fake Client",
              access: "Invite sent",
            }),
          ),
        );
        await tx((q) => jobAction(q, owner, j.id, { action: "renew" }));
        const renewed = (await ownerJobs(db, owner))[0];
        assert.notEqual(renewed.code, j.code);
        assert.equal(await publicJob(db, j.code), null);
        await tx((q) =>
          saveOnboarding(q, renewed.code, {
            platform: "Wix",
            contact: "Fake Client",
            cell: "3125550101",
            access: "Invite sent",
          }),
        );
        assert.equal(
          (await ownerJobs(db, owner))[0].data.access,
          "Invite sent",
        );
        await assert.rejects(
          tx((q) => jobAction(q, owner, j.id, { action: "deliver" })),
        );
        await assert.rejects(
          tx((q) => updateDeal(q, owner, "deal-0", { stage: "Delivered" })),
        );
      },
    );
    await t.test(
      "auditor failure blocks delivery; two passing fresh checks permit delivery without changing commission",
      async () => {
        const j = (await ownerJobs(db, owner))[0];
        await tx((q) => jobAction(q, owner, j.id, { action: "access" }));
        await tx((q) => jobAction(q, owner, j.id, { action: "fix-ready" }));
        await runJobVerification(db, j.id, async () => ({
          ok: false,
          at: new Date().toISOString(),
          reason: "Still broken",
          proofs: [],
        }));
        assert.equal((await ownerJobs(db, owner))[0].stage, "Fix ready");
        await assert.rejects(
          tx((q) => jobAction(q, owner, j.id, { action: "deliver" })),
        );
        await tx((q) => jobAction(q, owner, j.id, { action: "fix-ready" }));
        const pass = (at: string) => ({
          ok: true,
          at,
          reason: "Passed",
          proofs: [
            { url: proof.url, image: proof.proof!.image, captured_at: at },
          ],
        });
        await runJobVerification(db, j.id, async () =>
          pass(new Date(Date.now() - 600001).toISOString()),
        );
        assert.equal((await ownerJobs(db, owner))[0].stage, "Fix ready");
        let immediate = 0;
        await runJobVerification(db, j.id, async () => {
          immediate++;
          return pass(new Date().toISOString());
        });
        assert.equal(immediate, 0);
        await db.query(
          "update team_jobs set verification_due_at=now()-interval '1 second'",
        );
        await runJobVerification(db, j.id, async () =>
          pass(new Date().toISOString()),
        );
        assert.equal((await ownerJobs(db, owner))[0].stage, "Verified");
        await tx((q) => jobAction(q, owner, j.id, { action: "deliver" }));
        assert.equal((await callState(db, a)).deal?.stage, "Delivered");
        assert.equal((await callState(db, a)).commission, 11960);
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from team_job_messages where kind='fixed'",
            )
          ).rows[0].n,
          1,
        );
        await assert.rejects(
          tx((q) => jobAction(q, owner, j.id, { action: "deliver" })),
        );
      },
    );
    await t.test(
      "alerts are durable and idempotent; refund remains explicit draft only",
      async () => {
        const j = (await ownerJobs(db, owner))[0];
        await db.query(
          "update team_jobs set stage='Waiting on client access',access_since=now()-interval '8 days',deadline=now()-interval '1 second'",
        );
        await collectJobAlerts(db);
        await collectJobAlerts(db);
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from team_job_messages where kind in ('access','overdue')",
            )
          ).rows[0].n,
          2,
        );
        await tx((q) => jobAction(q, owner, j.id, { action: "refund-draft" }));
        assert.ok((await ownerJobs(db, owner))[0].data.refund_draft);
        await assert.rejects(
          tx((q) => jobAction(q, owner, j.id, { action: "refund-confirm" })),
        );
        await tx((q) =>
          jobAction(q, owner, j.id, {
            action: "refund-confirm",
            confirm: true,
          }),
        );
        assert.equal((await ownerJobs(db, owner))[0].stage, "Closed");
        assert.equal(
          (
            await db.query("select status from crm_payments where id=$1", [
              j.payment_id,
            ])
          ).rows[0].status,
          "paid",
        );
        assert.equal(
          await publicJob(db, (await ownerJobs(db, owner))[0].code),
          null,
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
