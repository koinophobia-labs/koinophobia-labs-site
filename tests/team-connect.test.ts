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
import { createOfferCheckout } from "../lib/acquisition/service-checkout";
import { processStripeEvent } from "../lib/payments";
import {
  onboard,
  expressLogin,
  connectSnapshot,
  drainConnect,
  retryConnect,
  updateAccount,
} from "../lib/team/connect";
import { connectStripe } from "../lib/team/connect-client";
import { recordPayout } from "../lib/team/store";

test("Connect acceptance: real PostgreSQL, Stripe boundary mocked, no sends", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0258-pg-"));
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
  const db = new Pool({
    host: "127.0.0.1",
    port,
    database: "postgres",
    max: 12,
  });
  const fake = seed(true),
    [owner, a, b] = fake.partners;
  const sessions = new Map<string, Record<string, unknown>>(),
    intents = new Map<string, Record<string, unknown>>(),
    charges = new Map<string, Record<string, unknown>>(),
    invoices = new Map<string, Record<string, unknown>>();
  const accounts = new Map<string, Record<string, unknown>>();
  const transfers = new Map<
      string,
      { id: string; params: Stripe.TransferCreateParams }
    >(),
    reversals = new Map<string, { id: string; amount: number }>();
  const links: Stripe.AccountLinkCreateParams[] = [],
    logins: string[] = [];
  let accountCreates = 0,
    failReversal = false,
    uncertainTransfer = false;
  const client = {
    accounts: {
      create: async (p: Stripe.AccountCreateParams) => {
        accountCreates++;
        const x = {
          id: "acct_fake_" + (p.metadata as Stripe.MetadataParam).partner_id,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        };
        accounts.set(x.id, x);
        return x;
      },
      retrieve: async (id: string) => accounts.get(id),
      createLoginLink: async (id: string) => {
        logins.push(id);
        return { url: "https://connect.stripe.com/express/fake" };
      },
    },
    accountLinks: {
      create: async (p: Stripe.AccountLinkCreateParams) => {
        links.push(p);
        return { url: "https://connect.stripe.com/setup/fake" };
      },
    },
    checkout: {
      sessions: {
        create: async (p: Stripe.Checkout.SessionCreateParams) => {
          const id = "cs_test_" + crypto.randomUUID();
          sessions.set(id, {
            ...p,
            id,
            amount_total: p.line_items![0].price_data!.unit_amount,
            currency: "usd",
            payment_status: "paid",
            livemode: false,
          });
          return { id, url: "https://checkout.stripe.com/fake" };
        },
        retrieve: async (id: string) => sessions.get(id),
      },
    },
    paymentIntents: { retrieve: async (id: string) => intents.get(id) },
    charges: { retrieve: async (id: string) => charges.get(id) },
    invoices: { retrieve: async (id: string) => invoices.get(id) },
    transfers: {
      create: async (
        p: Stripe.TransferCreateParams,
        o: Stripe.RequestOptions,
      ) => {
        const key = o.idempotencyKey!;
        if (!transfers.has(key))
          transfers.set(key, { id: "tr_fake_" + transfers.size, params: p });
        if (uncertainTransfer) {
          uncertainTransfer = false;
          throw Error("network after acceptance");
        }
        return transfers.get(key);
      },
      createReversal: async (
        _id: string,
        p: Stripe.TransferCreateReversalParams,
        o: Stripe.RequestOptions,
      ) => {
        if (failReversal)
          throw Object.assign(Error("insufficient"), {
            code: "balance_insufficient",
          });
        const key = o.idempotencyKey!;
        if (!reversals.has(key))
          reversals.set(key, {
            id: "trr_fake_" + reversals.size,
            amount: p.amount!,
          });
        return reversals.get(key);
      },
    },
  } as unknown as Stripe;
  const notify = async () => {
    throw Error("No sends");
  };
  const event = (
    type: string,
    object: unknown,
    id = "evt_fake_" + crypto.randomUUID(),
  ) =>
    ({
      id,
      type,
      livemode: false,
      created: 1794344000,
      data: { object },
    }) as Stripe.Event;
  const run = (e: Stripe.Event) => processStripeEvent(e, db, notify, client);
  async function fixture(offer: "fix" | "care" = "fix") {
    const who = offer === "fix" ? a : b,
      deal = offer === "fix" ? "deal-0" : "deal-3";
    const payment = await createOfferCheckout(
      offer,
      {
        source: "test",
        email: "fake@example.test",
        attribution: { partner: who.id, deal },
      },
      "https://example.test",
      db,
      client,
    );
    const s = sessions.get(payment.stripeCheckoutSessionId!)!;
    const pi = "pi_fake_" + payment.id,
      ch = "ch_fake_" + payment.id;
    s.payment_intent = pi;
    s.subscription = offer === "care" ? "sub_fake_" + payment.id : null;
    intents.set(pi, {
      id: pi,
      status: "succeeded",
      amount_received: payment.amount,
      currency: "usd",
      latest_charge: ch,
      livemode: false,
    });
    charges.set(ch, {
      id: ch,
      paid: true,
      amount: payment.amount,
      currency: "usd",
      amount_refunded: 0,
      disputed: false,
      payment_intent: pi,
      metadata: s.metadata,
      livemode: false,
    });
    return {
      payment,
      s,
      pi,
      ch,
      event: event("checkout.session.completed", s),
    };
  }
  async function ready(who = a) {
    await onboard(db, who, "https://example.test", client);
    const x = accounts.get("acct_fake_" + who.id)!;
    x.payouts_enabled = true;
    x.details_submitted = true;
    await run(event("account.updated", { id: x.id }));
  }
  const row = async (id: string) =>
    (await connectSnapshot(db, owner)).payments.find(
      (p) => p.payment_id === id,
    )!;
  try {
    for (const f of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
      "010_team_portal.sql",
      "011_team_connect.sql",
      "011_team_connect.sql",
    ])
      await db.query(readFileSync(join("db", f), "utf8"));
    for (const p of fake.partners)
      await db.query(
        "insert into team_partners(id,name,email,role) values($1,$2,$3,$4)",
        [p.id, p.name, p.id + "@example.test", p.role],
      );
    for (const l of fake.leads)
      await db.query(
        "insert into team_leads(id,partner_id,business,website,data) values($1,$2,$3,$4,$5)",
        [l.id, l.partner_id, l.business, l.website, l],
      );
    for (const d of fake.deals)
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
      "onboarding is own-account, idempotent, hosted, flags only; Express login scopes",
      async () => {
        await assert.rejects(
          onboard(db, owner, "https://example.test", client),
          /active partners/,
        );
        await Promise.all([
          onboard(db, a, "https://example.test", client),
          onboard(db, a, "https://example.test", client),
        ]);
        assert.equal(accountCreates, 1);
        assert.equal(links.length, 2);
        assert.equal(links[0].type, "account_onboarding");
        assert.equal(links[0].account, "acct_fake_demo-a");
        assert.match(
          links[0].refresh_url!,
          /team\/commissions\?connect=refresh/,
        );
        assert.deepEqual(
          Object.keys(
            (await db.query("select * from team_connect_accounts")).rows[0],
          ).sort(),
          [
            "charges_enabled",
            "details_submitted",
            "partner_id",
            "payouts_enabled",
            "stripe_account_id",
          ],
        );
        await expressLogin(db, a, client);
        assert.deepEqual(logins, ["acct_fake_demo-a"]);
        await assert.rejects(expressLogin(db, b, client));
      },
    );
    const first = await fixture();
    await t.test(
      "unconnected payment remains owed; account.updated backfills automatically",
      async () => {
        await run(first.event);
        assert.equal(transfers.size, 0);
        assert.equal((await row(first.payment.id)).owed, 11960);
        await ready();
        assert.equal(transfers.size, 1);
        assert.equal((await row(first.payment.id)).owed, 0);
        assert.equal((await row(first.payment.id)).paid, 11960);
      },
    );
    await t.test(
      "same and different event-ID concurrent replays make one transfer with charge and deal",
      async () => {
        await Promise.all([
          run(first.event),
          run({ ...first.event, id: "evt_replay_different" }),
          drainConnect(db, client),
        ]);
        assert.equal(transfers.size, 1);
        const x = [...transfers.values()][0].params;
        assert.equal(x.amount, 11960);
        assert.equal(x.source_transaction, first.ch);
        assert.equal(x.transfer_group, "deal-0");
        assert.equal(x.destination, "acct_fake_demo-a");
      },
    );
    await t.test(
      "partial refund reverses 40% once, then increasing cumulative refund is incremental",
      async () => {
        const c = charges.get(first.ch)!;
        c.amount_refunded = 5000;
        const e = event("charge.refunded", c);
        await run(e);
        await run({ ...e, id: "evt_refund_duplicate" });
        assert.equal((await row(first.payment.id)).reversed, 2000);
        assert.equal((await row(first.payment.id)).earned, 9960);
        c.amount_refunded = 10000;
        await run(event("charge.refunded", c));
        assert.equal((await row(first.payment.id)).reversed, 4000);
        assert.equal(reversals.size, 2);
      },
    );
    await t.test(
      "partial dispute overlap caps recovery; balance failure creates owed back",
      async () => {
        failReversal = true;
        charges.get(first.ch)!.disputed = true;
        await run(
          event("charge.dispute.created", {
            id: "dp_fake",
            charge: first.ch,
            amount: 20000,
          }),
        );
        const p = await row(first.payment.id);
        assert.equal(p.loss, 20000);
        assert.equal(p.owed_back, 4000);
        assert.equal(p.reversed, 4000);
        await run(
          event("charge.dispute.created", {
            id: "dp_fake",
            charge: first.ch,
            amount: 20000,
          }),
        );
        assert.equal((await row(first.payment.id)).owed_back, 4000);
      },
    );
    await t.test(
      "next payment nets negative balance atomically and does not recover twice",
      async () => {
        const next = await fixture();
        await run(next.event);
        assert.equal((await row(next.payment.id)).transferred, 7960);
        assert.equal((await row(next.payment.id)).offset_in, 4000);
        assert.equal((await row(first.payment.id)).owed_back, 0);
        await drainConnect(db, client);
        assert.equal((await row(first.payment.id)).offset_out, 4000);
        failReversal = false;
      },
    );
    await t.test(
      "Care initial invoice not doubled; renewal pays once and resolves invoice payment charge",
      async () => {
        await ready(b);
        const f = await fixture("care");
        const metadata = f.s.metadata;
        const i = {
          id: "in_initial",
          billing_reason: "subscription_create",
          status: "paid",
          amount_paid: 9900,
          currency: "usd",
          livemode: false,
          parent: {
            subscription_details: { subscription: f.s.subscription, metadata },
          },
        };
        await run(event("invoice.paid", i));
        const before = transfers.size;
        await run(f.event);
        assert.equal(transfers.size, before + 1);
        const pi = "pi_renewal",
          ch = "ch_renewal";
        intents.set(pi, {
          id: pi,
          livemode: false,
          status: "succeeded",
          amount_received: 9900,
          currency: "usd",
          latest_charge: ch,
        });
        charges.set(ch, {
          id: ch,
          paid: true,
          livemode: false,
          amount: 9900,
          currency: "usd",
          amount_refunded: 0,
          disputed: false,
        });
        const renewal = {
          ...i,
          id: "in_renewal",
          billing_reason: "subscription_cycle",
          payments: {
            has_more: false,
            data: [{ status: "paid", payment: { payment_intent: pi } }],
          },
        };
        invoices.set("in_renewal", renewal);
        const e = event("invoice.paid", renewal);
        await Promise.all([run(e), run({ ...e, id: "evt_renewal_duplicate" })]);
        assert.equal(transfers.size, before + 2);
        const r = (await connectSnapshot(db, b)).payments.find(
          (x) => x.source_id === "in_renewal",
        )!;
        assert.equal(r.transferred, 3960);
        assert.equal(r.charge_id, ch);
        charges.get(ch)!.amount_refunded = 9900;
        await run(event("charge.refunded", charges.get(ch)));
        assert.equal((await row(r.payment_id)).reversed, 3960);
      },
    );
    await t.test(
      "ambiguous Stripe success retries immutable operation key and makes exactly one transfer",
      async () => {
        const f = await fixture();
        const before = transfers.size;
        uncertainTransfer = true;
        await assert.rejects(run(f.event), /CONNECT_PROCESSING_RETRY/);
        assert.equal(transfers.size, before + 1);
        assert.equal((await row(f.payment.id)).transferred, 0);
        await run(f.event);
        assert.equal(transfers.size, before + 1);
        assert.equal((await row(f.payment.id)).transferred, 11960);
      },
    );
    await t.test(
      "role scope excludes other accounts, transfers and reversals; retries owner-only",
      async () => {
        const s = await connectSnapshot(db, a);
        assert.ok(s.payments.every((x) => x.partner_id === a.id));
        assert.equal(s.accounts.length, 1);
        assert.ok(
          s.operations.every((x) =>
            s.payments.some((p) => p.payment_id === x.payment_id),
          ),
        );
        await assert.rejects(retryConnect(db, a, client), /Only Blake/);
        await retryConnect(db, owner, client);
      },
    );
    await t.test(
      "stale account.updated payload cannot restore disabled payouts",
      async () => {
        accounts.get("acct_fake_demo-a")!.payouts_enabled = false;
        await run(
          event("account.updated", {
            id: "acct_fake_demo-a",
            payouts_enabled: true,
            details_submitted: true,
          }),
        );
        assert.equal(
          (await connectSnapshot(db, a)).accounts[0].payouts_enabled,
          false,
        );
        accounts.get("acct_fake_demo-a")!.payouts_enabled = true;
        await updateAccount(db, "acct_fake_demo-a", client);
      },
    );
    await t.test(
      "refund before payment webhook suppresses transfer",
      async () => {
        const f = await fixture();
        charges.get(f.ch)!.amount_refunded = 29900;
        await run(event("charge.refunded", charges.get(f.ch)));
        const before = transfers.size;
        await run(f.event);
        assert.equal(transfers.size, before);
        // Existing CRM correctly refuses to resurrect refunded payments. No queue is
        // necessary, but queued refunds are also guarded by the charge read.
      },
    );
    await t.test(
      "live event and key are refused; automatic mode blocks manual payout",
      async () => {
        await assert.rejects(
          run({ ...first.event, livemode: true }),
          /LIVE_EVENT/,
        );
        const oldKey = process.env.STRIPE_SECRET_KEY,
          oldEnabled = process.env.STRIPE_CONNECT_ENABLED;
        try {
          process.env.STRIPE_CONNECT_ENABLED = "true";
          process.env.STRIPE_SECRET_KEY = "sk_live_fake_not_a_secret";
          assert.throws(connectStripe, /TEST_KEY/);
          await assert.rejects(
            recordPayout(db, owner, "deal-0", 1),
            /Automatic Stripe/,
          );
        } finally {
          if (oldKey === undefined) delete process.env.STRIPE_SECRET_KEY;
          else process.env.STRIPE_SECRET_KEY = oldKey;
          if (oldEnabled === undefined)
            delete process.env.STRIPE_CONNECT_ENABLED;
          else process.env.STRIPE_CONNECT_ENABLED = oldEnabled;
        }
      },
    );
    await t.test(
      "disputed flag before its webhook holds funds until the proportional amount is known",
      async () => {
        const f = await fixture();
        charges.get(f.ch)!.disputed = true;
        const before = transfers.size;
        await assert.rejects(run(f.event), /CONNECT_PROCESSING_RETRY/);
        assert.equal(transfers.size, before);
        await run(
          event("charge.dispute.created", {
            id: "dp_delayed",
            charge: f.ch,
            amount: 5000,
          }),
        );
        assert.equal((await row(f.payment.id)).transferred, 9960);
        assert.equal((await row(f.payment.id)).loss, 5000);
      },
    );
    await t.test(
      "database receipt failure after Stripe success retries the durable intent without duplicate transfer",
      async () => {
        const f = await fixture();
        const before = transfers.size;
        await db.query(`create function fake_receipt_failure() returns trigger language plpgsql as $$ begin
        if new.payment_id='${f.payment.id}' and new.transferred>0 then raise exception 'injected receipt failure'; end if; return new; end $$`);
        await db.query(
          "create trigger fake_receipt before update on team_connect_payments for each row execute function fake_receipt_failure()",
        );
        await assert.rejects(run(f.event), /CONNECT_PROCESSING_RETRY/);
        assert.equal(transfers.size, before + 1);
        assert.equal((await row(f.payment.id)).transferred, 0);
        await db.query("drop trigger fake_receipt on team_connect_payments");
        await run(f.event);
        assert.equal(transfers.size, before + 1);
        assert.equal((await row(f.payment.id)).transferred, 11960);
      },
    );
    await t.test(
      "partial refund before paid delivery transfers remaining proportional commission",
      async () => {
        const f = await fixture();
        charges.get(f.ch)!.amount_refunded = 5000;
        await run(event("charge.refunded", charges.get(f.ch)));
        await run(f.event);
        const p = await row(f.payment.id);
        assert.equal(p.loss, 5000);
        assert.equal(p.transferred, 9960);
        assert.equal(p.owed, 0);
      },
    );
    await t.test(
      "full debt can consume a payment without a zero-dollar Stripe transfer",
      async () => {
        const f = await fixture("care");
        await run(f.event);
        failReversal = true;
        charges.get(f.ch)!.amount_refunded = 9900;
        await run(event("charge.refunded", charges.get(f.ch)));
        const next = await fixture("care"),
          before = transfers.size;
        await run(next.event);
        assert.equal(transfers.size, before);
        assert.equal((await row(next.payment.id)).offset_in, 3960);
        assert.equal((await row(f.payment.id)).owed_back, 0);
        failReversal = false;
        // If the netting payment is refunded later, the recovered debt must reappear.
        charges.get(next.ch)!.amount_refunded = 9900;
        await run(event("charge.refunded", charges.get(next.ch)));
        assert.equal((await row(next.payment.id)).owed_back, 3960);
        const later = await fixture("care");
        await run(later.event);
        assert.equal((await row(next.payment.id)).owed_back, 0);
      },
    );
    await t.test(
      "legacy manual payout holds a payment rather than paying it twice",
      async () => {
        await db.query(
          "insert into team_payouts(id,partner_id,deal_id,amount,recorded_by) values('fake-legacy','demo-b','deal-3',1,'owner')",
        );
        const f = await fixture("care"),
          before = transfers.size;
        await run(f.event);
        assert.equal(transfers.size, before);
        assert.match((await row(f.payment.id)).error!, /Manual payout/);
      },
    );
    await t.test(
      "uncertain operation beyond retention freezes further money moves for owner review",
      async () => {
        const f = await fixture();
        uncertainTransfer = true;
        await assert.rejects(run(f.event));
        await db.query(
          "update team_connect_operations set created_at=now()-interval '25 hours' where payment_id=$1",
          [f.payment.id],
        );
        const before = transfers.size;
        await drainConnect(db, client);
        assert.equal(transfers.size, before);
        assert.match((await row(f.payment.id)).error!, /owner reconciliation/);
      },
    );
  } finally {
    await db.end();
    execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], {
      stdio: "ignore",
    });
  }
});
