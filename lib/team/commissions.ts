import type { Queryable } from "../payments";
// Called only after verified payment mutation, within the same webhook transaction.
// The mapping stores identity only; amounts and refunded state always come from CRM.
export async function attributeTeamPayment(
  q: Queryable,
  paymentId: string,
  metadata: Record<string, string> | null | undefined,
) {
  if (!metadata?.partner || !metadata.deal) return;
  if (
    !(await q.query("select to_regclass('public.team_deals') as table_name"))
      .rows[0]?.table_name
  )
    return;
  const result = await q.query(
    "select * from team_deals where id=$1 and partner_id=$2 for update",
    [metadata.deal, metadata.partner],
  );
  const deal = result.rows[0];
  if (!deal) return; // Legacy Partner Desk IDs may not be imported yet.
  const services: Record<
    string,
    { id: string; amount: number; monthly: number }
  > = {
    fix: { id: "fix", amount: 29900, monthly: 0 },
    "tune-up": { id: "tune", amount: 75000, monthly: 0 },
    care: { id: "care", amount: 9900, monthly: 9900 },
  };
  const offer = services[metadata.offer];
  if (
    !offer ||
    !deal.approved ||
    deal.services.length !== 1 ||
    deal.services[0] !== offer.id ||
    deal.price !== offer.amount ||
    deal.monthly !== offer.monthly
  )
    throw Error("TEAM_ATTRIBUTION_MISMATCH");
  const payment = (
    await q.query(
      "select amount,currency,status from crm_payments where id=$1",
      [paymentId],
    )
  ).rows[0];
  if (
    !payment ||
    payment.status !== "paid" ||
    payment.currency !== "usd" ||
    payment.amount !== offer.amount
  )
    throw Error("TEAM_PAYMENT_MISMATCH");
  await q.query(
    "insert into team_payment_attributions(payment_id,deal_id) values($1,$2) on conflict(payment_id) do nothing",
    [paymentId, deal.id],
  );
  const mapped = (
    await q.query(
      "select deal_id from team_payment_attributions where payment_id=$1",
      [paymentId],
    )
  ).rows[0];
  if (mapped.deal_id !== deal.id)
    throw Error("TEAM_PAYMENT_ALREADY_ATTRIBUTED");
  await q.query(
    "update team_deals set stage=case when stage='Delivered' then stage else 'Client paid' end,updated_at=now() where id=$1",
    [deal.id],
  );
}
