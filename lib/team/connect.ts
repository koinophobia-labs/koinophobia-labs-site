import type Stripe from "stripe";
import type { Pool, PoolClient } from "pg";
import type { Queryable } from "../payments";
import type { Partner } from "./types";
import { Fault, owner } from "./domain";
import { connectStripe, testEvent, assertConnectMode } from "./connect-client";

export const share = (amount: number) => Math.round(amount * 0.4);
export type ConnectPayment = {
  payment_id: string;
  partner_id: string;
  deal_id: string;
  amount: number;
  currency: string;
  source_type: "checkout" | "invoice";
  source_id: string;
  charge_id: string | null;
  transfer_id: string | null;
  transferred: number;
  reversed: number;
  offset_in: number;
  offset_out: number;
  loss: number;
  settled: boolean;
  error: string | null;
};
export const earned = (p: ConnectPayment) => share(p.amount) - share(p.loss);
export const paid = (p: ConnectPayment) =>
  p.transferred - p.reversed + p.offset_in - p.offset_out;
export const debt = (p: ConnectPayment) => Math.max(0, paid(p) - earned(p));
export const owed = (p: ConnectPayment) => Math.max(0, earned(p) - paid(p));
const idOf = (x: string | { id?: string } | null | undefined) =>
  typeof x === "string" ? x : x?.id;

export async function queueConnectPayment(
  q: Queryable,
  paymentId: string,
  sourceType: "checkout" | "invoice",
  sourceId: string,
) {
  await q.query(
    `insert into team_connect_payments(payment_id,partner_id,deal_id,amount,currency,source_type,source_id)
    select p.id,d.partner_id,d.id,p.amount,p.currency,$2,$3 from team_payment_attributions a
    join crm_payments p on p.id=a.payment_id join team_deals d on d.id=a.deal_id
    where p.id=$1 and p.status='paid' and p.currency='usd' on conflict do nothing`,
    [paymentId, sourceType, sourceId],
  );
}
export async function queueConnectLoss(q: Queryable, event: Stripe.Event) {
  testEvent(event);
  if (event.type === "charge.refunded") {
    const c = event.data.object as Stripe.Charge;
    await q.query(
      `insert into team_connect_losses(charge_id,refunded) values($1,$2)
      on conflict(charge_id) do update set refunded=greatest(team_connect_losses.refunded,excluded.refunded)`,
      [c.id, c.amount_refunded],
    );
  } else if (event.type === "charge.dispute.created") {
    const d = event.data.object as Stripe.Dispute;
    await q.query(
      `insert into team_connect_losses(charge_id,disputed) values($1,$2)
      on conflict(charge_id) do update set disputed=greatest(team_connect_losses.disputed,excluded.disputed)`,
      [idOf(d.charge), d.amount],
    );
  }
}
async function withLock<T>(
  database: Pool,
  work: (q: PoolClient) => Promise<T>,
) {
  const q = await database.connect();
  try {
    // One session lock covers planning, external calls and receipt commits.
    // Webhooks only enqueue inside their own transactions, avoiding lock cycles.
    await q.query("select pg_advisory_lock(hashtext('team-connect-money'))");
    return await work(q);
  } finally {
    await q
      .query("select pg_advisory_unlock(hashtext('team-connect-money'))")
      .catch(() => {});
    q.release();
  }
}
async function atomic<T>(q: Queryable, work: () => Promise<T>) {
  await q.query("begin");
  try {
    const x = await work();
    await q.query("commit");
    return x;
  } catch (e) {
    await q.query("rollback");
    throw e;
  }
}
async function partnerRow(q: Queryable, actor: Partner) {
  if (actor.role !== "partner" || !actor.active)
    throw new Fault("Only active partners can connect their own Stripe.", 403);
  const p = (
    await q.query(
      "select id from team_partners where id=$1 and active and role='partner'",
      [actor.id],
    )
  ).rows[0];
  if (!p) throw new Fault("Partner not found.", 404);
}
export async function onboard(
  database: Pool,
  actor: Partner,
  origin: string,
  client: Stripe = connectStripe(),
) {
  return withLock(database, async (q) => {
    await partnerRow(q, actor);
    let a = (
      await q.query("select * from team_connect_accounts where partner_id=$1", [
        actor.id,
      ])
    ).rows[0];
    if (!a) {
      // Durable creation timestamp bounds Stripe's 24-hour idempotency retention.
      const key = "connect-account:" + actor.id;
      await q.query(
        "insert into team_settings(key,value) values($1,$2) on conflict do nothing",
        [key, String(Date.now())],
      );
      const started = Number(
        (await q.query("select value from team_settings where key=$1", [key]))
          .rows[0].value,
      );
      if (Date.now() - started > 23 * 3600000)
        throw new Fault(
          "Account creation needs owner reconciliation before retrying.",
          409,
        );
      const account = await client.accounts.create(
        {
          type: "express",
          country: "US",
          capabilities: { transfers: { requested: true } },
          metadata: { partner_id: actor.id },
        },
        { idempotencyKey: key },
      );
      await q.query(
        `insert into team_connect_accounts(partner_id,stripe_account_id,charges_enabled,payouts_enabled,details_submitted)
        values($1,$2,$3,$4,$5) on conflict(partner_id) do nothing`,
        [
          actor.id,
          account.id,
          account.charges_enabled,
          account.payouts_enabled,
          account.details_submitted,
        ],
      );
      a = (
        await q.query(
          "select * from team_connect_accounts where partner_id=$1",
          [actor.id],
        )
      ).rows[0];
    }
    const base = new URL(origin);
    if (
      base.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(base.hostname)
    )
      throw Error("CONNECT_ORIGIN_INVALID");
    const url = base.origin + "/team/commissions";
    const link = await client.accountLinks.create({
      account: a.stripe_account_id,
      type: "account_onboarding",
      refresh_url: url + "?connect=refresh",
      return_url: url + "?connect=return",
    });
    return { url: link.url };
  });
}
export async function expressLogin(
  q: Queryable,
  actor: Partner,
  client: Stripe = connectStripe(),
) {
  await partnerRow(q, actor);
  const a = (
    await q.query(
      "select stripe_account_id from team_connect_accounts where partner_id=$1",
      [actor.id],
    )
  ).rows[0];
  if (!a) throw new Fault("Connect your Stripe first.", 409);
  return {
    url: (await client.accounts.createLoginLink(a.stripe_account_id)).url,
  };
}
export async function updateAccount(
  q: Queryable,
  accountId: string,
  client: Stripe,
) {
  if (
    !(
      await q.query(
        "select partner_id from team_connect_accounts where stripe_account_id=$1",
        [accountId],
      )
    ).rows[0]
  )
    return;
  // Fetch current flags instead of trusting an older account.updated payload.
  const a = await client.accounts.retrieve(accountId);
  await q.query(
    "update team_connect_accounts set charges_enabled=$2,payouts_enabled=$3,details_submitted=$4 where stripe_account_id=$1",
    [a.id, a.charges_enabled, a.payouts_enabled, a.details_submitted],
  );
}
async function sourceCharge(p: ConnectPayment, client: Stripe) {
  let pi: string | undefined;
  if (p.source_type === "checkout") {
    const s = await client.checkout.sessions.retrieve(p.source_id);
    assertConnectMode(s);
    if (
      s.payment_status !== "paid" ||
      s.amount_total !== p.amount ||
      s.currency !== p.currency
    )
      throw Error("SOURCE_CHECKOUT_MISMATCH");
    pi = idOf(s.payment_intent);
    if (!pi && s.invoice) pi = await invoiceIntent(idOf(s.invoice)!, p, client);
  } else pi = await invoiceIntent(p.source_id, p, client);
  if (!pi) throw Error("SOURCE_PAYMENT_INTENT_MISSING");
  const intent = await client.paymentIntents.retrieve(pi);
  assertConnectMode(intent);
  if (
    intent.status !== "succeeded" ||
    intent.amount_received !== p.amount ||
    intent.currency !== p.currency
  )
    throw Error("SOURCE_INTENT_MISMATCH");
  const charge = idOf(intent.latest_charge);
  if (!charge) throw Error("SOURCE_CHARGE_MISSING");
  return charge;
}
async function invoiceIntent(id: string, p: ConnectPayment, client: Stripe) {
  const i = await client.invoices.retrieve(id, {
    expand: ["payments.data.payment.payment_intent"],
  });
  assertConnectMode(i);
  if (
    i.status !== "paid" ||
    i.amount_paid !== p.amount ||
    i.currency !== p.currency
  )
    throw Error("SOURCE_INVOICE_MISMATCH");
  const legacy = i as Stripe.Invoice & { payment_intent?: string };
  const payments = i.payments?.data.filter((x) => x.status === "paid") ?? [];
  // Multiple/partial invoice payments need explicit reconciliation, never guess.
  if (i.payments?.has_more || payments.length > 1)
    throw Error("SOURCE_MULTIPLE_INVOICE_PAYMENTS");
  return idOf(payments[0]?.payment.payment_intent) || legacy.payment_intent;
}

type Operation = {
  id: string;
  payment_id: string;
  kind: "transfer" | "reversal";
  parameters: Record<string, unknown>;
  offsets: { payment_id: string; amount: number }[];
  status: string;
  created_at: Date;
};
async function execute(q: Queryable, op: Operation, client: Stripe) {
  if (op.status !== "pending") return;
  if (Date.now() - new Date(op.created_at).getTime() > 23 * 3600000) {
    await q.query(
      "update team_connect_operations set status='review' where id=$1",
      [op.id],
    );
    await q.query(
      "update team_connect_payments set error='Uncertain Stripe operation: owner reconciliation required' where payment_id=$1",
      [op.payment_id],
    );
    return;
  }
  let stripeId: string;
  try {
    if (op.kind === "transfer")
      stripeId = (
        await client.transfers.create(
          op.parameters as unknown as Stripe.TransferCreateParams,
          { idempotencyKey: op.id },
        )
      ).id;
    else {
      const { transfer, ...params } = op.parameters;
      stripeId = (
        await client.transfers.createReversal(
          String(transfer),
          params as Stripe.TransferCreateReversalParams,
          { idempotencyKey: op.id },
        )
      ).id;
    }
  } catch (e) {
    // Only a definite balance rejection creates nettable debt. Network/5xx
    // failures remain pending, and cannot be netted while outcome is uncertain.
    if (
      op.kind === "reversal" &&
      (e as { code?: string }).code === "balance_insufficient"
    ) {
      await q.query(
        "update team_connect_operations set status='insufficient' where id=$1",
        [op.id],
      );
      return;
    }
    throw e;
  }
  await atomic(q, async () => {
    if (op.kind === "transfer") {
      const offset = op.offsets.reduce((s, x) => s + x.amount, 0);
      await q.query(
        "update team_connect_payments set transfer_id=$2,transferred=$3,offset_in=$4,settled=true,error=null where payment_id=$1",
        [op.payment_id, stripeId, op.parameters.amount, offset],
      );
      for (const x of op.offsets)
        await q.query(
          "update team_connect_payments set offset_out=offset_out+$2 where payment_id=$1",
          [x.payment_id, x.amount],
        );
    } else
      await q.query(
        "update team_connect_payments set reversed=reversed+$2,error=null where payment_id=$1",
        [op.payment_id, op.parameters.amount],
      );
    await q.query(
      "update team_connect_operations set status='done',stripe_id=$2 where id=$1",
      [op.id, stripeId],
    );
  });
}
async function plan(
  q: Queryable,
  id: string,
  p: ConnectPayment,
  kind: Operation["kind"],
  parameters: Record<string, unknown>,
  offsets: Operation["offsets"] = [],
) {
  await q.query(
    `insert into team_connect_operations(id,payment_id,kind,parameters,offsets) values($1,$2,$3,$4,$5) on conflict do nothing`,
    [
      id,
      p.payment_id,
      kind,
      JSON.stringify(parameters),
      JSON.stringify(offsets),
    ],
  );
  return (
    await q.query("select * from team_connect_operations where id=$1", [id])
  ).rows[0] as Operation;
}
export async function drainConnect(
  database: Pool,
  client: Stripe = connectStripe(),
  partnerId: string | null = null,
) {
  return withLock(database, async (q) => {
    const partners = (
      await q.query(
        `select distinct p.partner_id from team_connect_payments p where ($1::text is null or p.partner_id=$1)`,
        [partnerId],
      )
    ).rows;
    for (const { partner_id } of partners) {
      try {
        const pending = (
          await q.query(
            `select o.* from team_connect_operations o join team_connect_payments p on p.payment_id=o.payment_id
          where p.partner_id=$1 and o.status in ('pending','review') order by o.created_at,o.id`,
            [partner_id],
          )
        ).rows as Operation[];
        if (pending.some((o) => o.status === "review")) continue;
        for (const op of pending) await execute(q, op, client);
        if (
          (
            await q.query(
              `select 1 from team_connect_operations o join team_connect_payments p on p.payment_id=o.payment_id where p.partner_id=$1 and o.status in ('pending','review')`,
              [partner_id],
            )
          ).rows[0]
        )
          continue;
        let rows = (
          await q.query(
            "select * from team_connect_payments where partner_id=$1 order by created_at,payment_id",
            [partner_id],
          )
        ).rows as ConnectPayment[];
        for (const p of rows) {
          const chargeId = p.charge_id || (await sourceCharge(p, client));
          const charge = await client.charges.retrieve(chargeId);
          assertConnectMode(charge);
          if (
            !charge.paid ||
            charge.amount !== p.amount ||
            charge.currency !== p.currency
          )
            throw Error("SOURCE_CHARGE_MISMATCH");
          const l = (
            await q.query(
              "select * from team_connect_losses where charge_id=$1",
              [chargeId],
            )
          ).rows[0];
          // A Charge's boolean does not reveal a partial dispute amount. Wait
          // for its signed dispute event rather than over-reversing the payment.
          if (charge.disputed && !l?.disputed)
            throw Error("DISPUTE_EVENT_PENDING");
          const loss = Math.min(
            p.amount,
            Math.max(
              p.loss,
              charge.amount_refunded,
              l?.refunded || 0,
              l?.disputed || 0,
            ),
          );
          await q.query(
            "update team_connect_payments set charge_id=$2,loss=$3 where payment_id=$1",
            [p.payment_id, chargeId, loss],
          );
          p.charge_id = chargeId;
          p.loss = loss;
          const reverse = Math.min(p.transferred - p.reversed, debt(p));
          if (p.transfer_id && reverse > 0) {
            const op = await plan(
              q,
              `connect-reverse:${p.payment_id}:${share(loss)}:${p.reversed}`,
              p,
              "reversal",
              {
                transfer: p.transfer_id,
                amount: reverse,
                metadata: { payment_id: p.payment_id },
              },
            );
            await execute(q, op, client);
          }
        }
        const account = (
          await q.query(
            `select a.* from team_connect_accounts a join team_partners p on p.id=a.partner_id where a.partner_id=$1 and p.active`,
            [partner_id],
          )
        ).rows[0];
        if (!account?.details_submitted || !account.payouts_enabled) continue;
        rows = (
          await q.query(
            "select * from team_connect_payments where partner_id=$1 order by created_at,payment_id",
            [partner_id],
          )
        ).rows as ConnectPayment[];
        for (const p of rows.filter((x) => !x.settled)) {
          // Historic manual payouts cannot safely be allocated to individual
          // payments. Hold the entire deal for owner reconciliation.
          if (
            (
              await q.query(
                "select id from team_payouts where deal_id=$1 limit 1",
                [p.deal_id],
              )
            ).rows[0]
          ) {
            await q.query(
              "update team_connect_payments set error='Manual payout exists: owner reconciliation required' where payment_id=$1",
              [p.payment_id],
            );
            continue;
          }
          let available = owed(p);
          if (!available) continue;
          const offsets: Operation["offsets"] = [];
          for (const old of rows.filter((x) => x.payment_id !== p.payment_id)) {
            const amount = Math.min(available, debt(old));
            if (amount) {
              offsets.push({ payment_id: old.payment_id, amount });
              available -= amount;
            }
          }
          if (!available) {
            await atomic(q, async () => {
              await q.query(
                "update team_connect_payments set settled=true,offset_in=$2,error=null where payment_id=$1",
                [p.payment_id, owed(p)],
              );
              for (const x of offsets)
                await q.query(
                  "update team_connect_payments set offset_out=offset_out+$2 where payment_id=$1",
                  [x.payment_id, x.amount],
                );
            });
          } else {
            const op = await plan(
              q,
              `connect-transfer:${p.payment_id}`,
              p,
              "transfer",
              {
                amount: available,
                currency: p.currency,
                destination: account.stripe_account_id,
                source_transaction: p.charge_id,
                transfer_group: p.deal_id,
                metadata: { payment_id: p.payment_id },
              },
              offsets,
            );
            await execute(q, op, client);
          }
          rows = (
            await q.query(
              "select * from team_connect_payments where partner_id=$1 order by created_at,payment_id",
              [partner_id],
            )
          ).rows as ConnectPayment[];
        }
      } catch {
        // Do not expose Stripe payloads, bank details or customer information.
        await q.query(
          "update team_connect_payments set error='Stripe processing needs retry or owner review' where partner_id=$1 and (not settled or loss>0)",
          [partner_id],
        );
        throw Error("CONNECT_PROCESSING_RETRY");
      }
    }
    return { ok: true };
  });
}
export async function retryConnect(
  database: Pool,
  actor: Partner,
  client: Stripe = connectStripe(),
) {
  owner(actor);
  return drainConnect(database, client);
}
export async function connectSnapshot(q: Queryable, actor: Partner) {
  const scope = actor.role === "owner" ? null : actor.id;
  const accounts = (
    await q.query(
      "select * from team_connect_accounts where ($1::text is null or partner_id=$1)",
      [scope],
    )
  ).rows;
  const payments = (
    await q.query(
      "select * from team_connect_payments where ($1::text is null or partner_id=$1) order by created_at desc",
      [scope],
    )
  ).rows as ConnectPayment[];
  const operations = (
    await q.query(
      `select o.id,o.payment_id,o.kind,o.status,o.stripe_id,o.created_at,(o.parameters->>'amount')::int amount
    from team_connect_operations o join team_connect_payments p on p.payment_id=o.payment_id where ($1::text is null or p.partner_id=$1) order by o.created_at desc`,
      [scope],
    )
  ).rows;
  return {
    accounts,
    payments: payments.map((p) => ({
      ...p,
      earned: earned(p),
      paid: paid(p),
      owed: owed(p),
      owed_back: debt(p),
    })),
    operations,
  };
}
export type ConnectSnapshot = Awaited<ReturnType<typeof connectSnapshot>>;
