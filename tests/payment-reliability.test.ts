import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import type Stripe from "stripe";
import { createOfferCheckout } from "../lib/acquisition/service-checkout";
import { offers, type ServiceOffer } from "../lib/acquisition/services-config";
import { listLeads } from "../lib/acquisition/leads";
import { sendPaidAuditEmail, type PaidAuditNotice } from "../lib/acquisition/intake";
import { processStripeEvent } from "../lib/payments";

const hasPostgres = spawnSync("initdb", ["--version"]).status === 0;

test("payment reliability on real PostgreSQL", { skip: !hasPostgres }, async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "wo-0124-postgres-"));
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  let started = false;
  const pool = new Pool({ host: "127.0.0.1", port, database: "postgres", max: 6 });
  const notices: PaidAuditNotice[] = [];
  const notify = async (notice: PaidAuditNotice) => { notices.push(notice); return { ok: true, providerId: "mock" }; };
  async function fixture(offer: ServiceOffer = "revenue_leak_audit") {
    const id = `cs_test_${crypto.randomUUID().replaceAll("-", "")}`;
    let metadata: Stripe.MetadataParam | undefined;
    const stripe = { checkout: { sessions: { create: async (input: Stripe.Checkout.SessionCreateParams) => {
      metadata = input.metadata!;
      return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
    } } } } as unknown as Stripe;
    const payment = await createOfferCheckout(offer, { source: "test", email: "buyer@example.com" }, "https://example.com", pool, stripe);
    const event = { id: `evt_${crypto.randomUUID()}`, type: "checkout.session.completed", data: { object: {
      id, metadata, mode: offers[offer].mode, amount_total: offers[offer].amount, currency: "usd", subscription: offer === "monthly_support" ? `sub_${id}` : null, payment_status: "paid", payment_intent: `pi_${payment.id}`,
      customer_details: { name: "Test Buyer", email: "buyer@example.com" },
    } } } as unknown as Stripe.Event;
    return { payment, event };
  }
  const paymentRow = async (id: string) => (await pool.query("select * from crm_payments where id=$1", [id])).rows[0];
  try {
    execFileSync("initdb", ["-D", directory, "-A", "trust", "--no-locale", "-E", "UTF8"], { stdio: "ignore" });
    execFileSync("pg_ctl", ["-D", directory, "-l", join(directory, "server.log"), "-o", `-F -p ${port} -h 127.0.0.1 -k ${directory}`, "-w", "start"], { stdio: "ignore" });
    started = true;
    for (const file of ["001_crm_leads.sql", "002_crm_proposals.sql", "006_stripe_payments.sql"]) {
      await pool.query(readFileSync(join("db", file), "utf8"));
    }
    await t.test("retainer completion, renewal and cancellation dedupe concurrent and distinct event IDs", async () => {
      const { payment, event } = await fixture("monthly_support");
      const session = event.data.object as Stripe.Checkout.Session;
      const before = notices.length;
      await Promise.all(Array.from({ length: 4 }, (_, i) => processStripeEvent({ ...event, id: `${event.id}_${i}` }, pool, notify)));
      assert.equal(notices.length, before + 1);
      assert.equal(notices.at(-1)?.offer, "monthly_support");
      assert.equal((await paymentRow(payment.id)).status, "paid");
      const invoice = { id: `in_${payment.id}`, status: "paid", amount_paid: 50000, currency: "usd", billing_reason: "subscription_cycle", parent: { subscription_details: { subscription: session.subscription, metadata: session.metadata } } };
      const renewal = { id: `evt_invoice_${payment.id}`, type: "invoice.paid", created: 1792000000, data: { object: invoice } } as unknown as Stripe.Event;
      await Promise.all([processStripeEvent(renewal, pool, notify), processStripeEvent(renewal, pool, notify), processStripeEvent({ ...renewal, id: `${renewal.id}_different` }, pool, notify)]);
      assert.equal((await pool.query("select count(*)::int n,sum(amount)::int amount from crm_payments where lead_id=$1", [payment.leadId])).rows[0].n, 2);
      assert.equal((await pool.query("select sum(amount_paid)::int amount from crm_proposals where lead_id=$1", [payment.leadId])).rows[0].amount, 100000);
      assert.equal((await pool.query("select internal_notes from crm_leads where id=$1", [payment.leadId])).rows[0].internal_notes.match(/Renewal paid/g).length, 1);
      const cancel = { id: `evt_cancel_${payment.id}`, type: "customer.subscription.deleted", created: 1792100000, data: { object: { id: session.subscription, metadata: session.metadata } } } as unknown as Stripe.Event;
      await Promise.all([processStripeEvent(cancel, pool, notify), processStripeEvent(cancel, pool, notify), processStripeEvent({ ...cancel, id: `${cancel.id}_different` }, pool, notify)]);
      assert.equal((await pool.query("select internal_notes from crm_leads where id=$1", [payment.leadId])).rows[0].internal_notes.match(/Subscription cancelled/g).length, 1);
      assert.equal(notices.length, before + 1);
    });
    await t.test("renewals roll back atomically, retry, and initial invoice delivered before checkout is not double-counted", async () => {
      const { payment, event } = await fixture("monthly_support"), session = event.data.object as Stripe.Checkout.Session;
      const initial = { id: `evt_first_${payment.id}`, type: "invoice.paid", created: 1792000000, data: { object: { id: `in_first_${payment.id}`, billing_reason: "subscription_create", parent: { subscription_details: { subscription: session.subscription, metadata: session.metadata } } } } } as unknown as Stripe.Event;
      await processStripeEvent(initial, pool, notify);
      assert.equal((await paymentRow(payment.id)).status, "pending");
      await processStripeEvent(event, pool, notify);
      const renewal = { ...initial, id: `${initial.id}_renewal`, data: { object: { ...initial.data.object, id: `in_renew_${payment.id}`, billing_reason: "subscription_cycle", status: "paid", amount_paid: 50000, currency: "usd" } } } as unknown as Stripe.Event;
      let fail = true;
      const database = { query: pool.query.bind(pool), connect: async () => {
        const client = await pool.connect();
        return { release: () => client.release(), query: async (sql: string, values?: unknown[]) => {
          if (fail && sql.startsWith("update crm_leads set internal_notes")) { fail = false; throw Error("injected renewal failure"); }
          return client.query(sql, values);
        } };
      } };
      await assert.rejects(processStripeEvent(renewal, database, notify), /injected renewal failure/);
      assert.equal((await pool.query("select count(*)::int n from crm_payments where lead_id=$1", [payment.leadId])).rows[0].n, 1);
      assert.equal((await pool.query("select count(*)::int n from stripe_webhook_events where event_id=$1", [renewal.id])).rows[0].n, 0);
      await processStripeEvent(renewal, database, notify);
      assert.equal((await pool.query("select count(*)::int n from crm_payments where lead_id=$1", [payment.leadId])).rows[0].n, 2);
    });
    await t.test("failure after payment mutation rolls back the event, payment, summaries and email reservation; retry pays", async () => {
      const { payment, event } = await fixture();
      let fail = true;
      const database = { query: pool.query.bind(pool), connect: async () => {
        const client = await pool.connect();
        return { release: () => client.release(), query: async (sql: string, values?: unknown[]) => {
          if (fail && sql.startsWith("update crm_leads set payment_status")) { fail = false; throw Error("injected processing failure"); }
          return client.query(sql, values);
        } };
      } };
      const before = notices.length;
      await assert.rejects(processStripeEvent(event, database, notify), /injected processing failure/);
      assert.equal((await paymentRow(payment.id)).status, "pending");
      assert.equal((await pool.query("select * from stripe_webhook_events where event_id=any($1)", [[event.id, `paid-audit:${payment.id}`]])).rowCount, 0);
      assert.equal((await pool.query("select amount_paid from crm_proposals where id=$1", [payment.proposalId])).rows[0].amount_paid, 0);
      assert.equal(notices.length, before);
      assert.deepEqual(await processStripeEvent(event, database, notify), { duplicate: false });
      assert.equal((await paymentRow(payment.id)).status, "paid");
      assert.equal((await pool.query("select amount_paid from crm_proposals where id=$1", [payment.proposalId])).rows[0].amount_paid, 25000);
      assert.equal(notices.length, before + 1);
      assert.equal(notices.at(-1)?.bookingSubmitted, false);
    });
    await t.test("successful replay is a no-op and concurrent duplicate deliveries apply once", async () => {
      const { payment, event } = await fixture();
      const before = notices.length;
      const results = await Promise.all(Array.from({ length: 6 }, () => processStripeEvent(event, pool, notify)));
      assert.equal(results.filter(result => !result.duplicate).length, 1);
      const row = await paymentRow(payment.id);
      assert.equal(row.status, "paid");
      assert.deepEqual(await processStripeEvent(event, pool, notify), { duplicate: true });
      assert.deepEqual(await paymentRow(payment.id), row);
      assert.equal(notices.length, before + 1);
    });
    await t.test("different event IDs for one payment send one alert, including async success and submitted booking", async () => {
      const { payment, event } = await fixture();
      await pool.query("update crm_leads set notes='Booking recorded' where id=$1", [payment.leadId]);
      const before = notices.length;
      await Promise.all([processStripeEvent(event, pool, notify), processStripeEvent({ ...event, id: `${event.id}_async`, type: "checkout.session.async_payment_succeeded" } as unknown as Stripe.Event, pool, notify)]);
      assert.equal(notices.length, before + 1);
      assert.equal(notices.at(-1)?.bookingSubmitted, true);
      assert.equal(notices.at(-1)?.leadId, payment.leadId);
      assert.ok((await pool.query("select processed_at from stripe_webhook_events where event_id=$1", [`paid-audit:${payment.id}`])).rows[0].processed_at);
    });
    await t.test("legacy failed event rows with null processed_at remain retryable", async () => {
      const { payment, event } = await fixture();
      await pool.query("insert into stripe_webhook_events(event_id,event_type,processing_error) values($1,$2,'old failure')", [event.id, event.type]);
      assert.equal((await processStripeEvent(event, pool, notify)).duplicate, false);
      assert.equal((await paymentRow(payment.id)).status, "paid");
      const row = (await pool.query("select * from stripe_webhook_events where event_id=$1", [event.id])).rows[0];
      assert.ok(row.processed_at); assert.equal(row.processing_error, null);
    });
    await t.test("unpaid completion and non-audit payments do not send paid audit mail", async () => {
      const { payment, event } = await fixture();
      const before = notices.length;
      (event.data.object as Stripe.Checkout.Session).payment_status = "unpaid";
      await processStripeEvent(event, pool, notify);
      assert.equal((await paymentRow(payment.id)).status, "pending");
      (event.data.object as Stripe.Checkout.Session).payment_status = "paid";
      (event.data.object as Stripe.Checkout.Session).metadata!.offer = "other";
      await processStripeEvent({ ...event, id: `${event.id}_other` }, pool, notify);
      assert.equal((await paymentRow(payment.id)).status, "paid");
      assert.equal(notices.length, before);
    });
    await t.test("uncertain email delivery is recorded without retrying mail or undoing payment", async () => {
      const { payment, event } = await fixture(); let calls = 0;
      const fail = async () => { calls++; throw Error("uncertain network outcome"); };
      await processStripeEvent(event, pool, fail);
      await processStripeEvent(event, pool, fail);
      await processStripeEvent({ ...event, id: `${event.id}_again` }, pool, fail);
      assert.equal(calls, 1); assert.equal((await paymentRow(payment.id)).status, "paid");
      const row = (await pool.query("select * from stripe_webhook_events where event_id=$1", [`paid-audit:${payment.id}`])).rows[0];
      assert.equal(row.processed_at, null); assert.match(row.processing_error, /delivery uncertain/);
    });
    await t.test("expiry hides only unpaid abandoned audit-checkout leads; show abandoned restores them without deletion", async () => {
      const expired = await fixture(), pending = await fixture(), paid = await fixture(), ordinary = await fixture(), refunded = await fixture();
      await pool.query("update crm_leads set dedupe_key='manual-test' where id=$1", [ordinary.payment.leadId]);
      await processStripeEvent(paid.event, pool, notify);
      await processStripeEvent(refunded.event, pool, notify);
      await processStripeEvent({ ...refunded.event, id: `${refunded.event.id}_refund`, type: "charge.refunded" } as unknown as Stripe.Event, pool, notify);
      for (const item of [expired, paid, ordinary, refunded]) await processStripeEvent({ ...item.event, id: `${item.event.id}_expire`, type: "checkout.session.expired" } as unknown as Stripe.Event, pool, notify);
      assert.equal((await paymentRow(expired.payment.id)).status, "expired");
      assert.equal((await paymentRow(paid.payment.id)).status, "paid");
      const visible = (await listLeads({}, pool)).map(lead => lead.id);
      assert.ok(!visible.includes(expired.payment.leadId));
      for (const item of [pending, paid, ordinary, refunded]) assert.ok(visible.includes(item.payment.leadId));
      assert.ok((await listLeads({ abandoned: "show" }, pool)).some(lead => lead.id === expired.payment.leadId));
      assert.ok(!(await listLeads({ abandoned: "invalid" }, pool)).some(lead => lead.id === expired.payment.leadId));
      assert.equal((await pool.query("select count(*)::int count from crm_leads where id=$1", [expired.payment.leadId])).rows[0].count, 1);
    });
  } finally {
    await pool.end();
    if (started) execFileSync("pg_ctl", ["-D", directory, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
    t.diagnostic(`Retained local PostgreSQL test fixture: ${directory}`);
  }
});

test("paid audit alert uses SITE-01 internal recipient, fixed content and no card data", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    assert.equal(body.to, "blake@example.com");
    assert.equal(body.from, "Existing Leads <leads@example.com>");
    assert.equal(body.subject, "Paid: Revenue Leak Audit $250");
    assert.match(body.text, /CRM: https:\/\/koinophobialabs.com\/crm\/leads\/lead-123/);
    assert.match(body.text, /Booking form submitted: Yes/);
    assert.match(body.text, /Name: Test Buyer\nEmail: buyer@example.com/);
    assert.doesNotMatch(JSON.stringify(body), /card|last4|payment_method|pi_/);
    assert.equal((init.headers as Record<string, string>)["Idempotency-Key"], "paid-audit/payment-123");
    return Response.json({ id: "mock" });
  });
  const previous = { ...process.env };
  try {
    process.env.RESEND_API_KEY = "test-only"; process.env.CONTACT_TO_EMAIL = "blake@example.com";
    process.env.CONTACT_FROM_EMAIL = "Existing Leads <leads@example.com>";
    process.env.NEXT_PUBLIC_SITE_URL = "https://koinophobialabs.com";
    assert.equal((await sendPaidAuditEmail({ paymentId: "payment-123", leadId: "lead-123", bookingSubmitted: true, name: "Test Buyer", email: "buyer@example.com" })).ok, true);
  } finally { process.env = previous; }
});
