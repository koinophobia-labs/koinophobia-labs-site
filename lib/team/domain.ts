import { SERVICES, TERMS } from "./config";
import {
  STAGES,
  type Data,
  type Deal,
  type Partner,
  type Stage,
} from "./types";
export class Fault extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const must = (
  condition: unknown,
  message: string,
  status = 400,
): asserts condition => {
  if (!condition) throw new Fault(message, status);
};
export function owner(p: Partner) {
  if (p.role !== "owner") throw new Fault("Only Blake can do that.", 403);
}
export function visible(p: Partner, partnerId: string) {
  return p.role === "owner" || p.id === partnerId;
}
export function getDeal(db: Data, p: Partner, id: string) {
  const d = db.deals.find((d) => d.id === id && visible(p, d.partner_id));
  if (!d) throw new Fault("Deal not found.", 404);
  return d;
}
export function scoped(db: Data, p: Partner): Data {
  const deals = db.deals.filter((d) => visible(p, d.partner_id));
  const ids = new Set(deals.map((d) => d.id));
  return {
    partners: db.partners
      .filter((x) => visible(p, x.id))
      .map((x) => {
        const safe = { ...x };
        delete safe.code_hash;
        return safe;
      }),
    deals,
    leads: db.leads.filter((l) => visible(p, l.partner_id)),
    payments: db.payments.filter((x) => ids.has(x.deal_id)),
    payouts: db.payouts.filter(
      (x) => visible(p, x.partner_id) && ids.has(x.deal_id),
    ),
    site_checks: db.site_checks.filter((x) => visible(p, x.partner_id)),
  };
}
export function textInput(
  value: unknown,
  name: string,
  required = false,
  max = 2000,
) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new Fault(`${name} must be text.`);
  }
  const text = value.trim();
  if ((required && !text) || text.length > max)
    throw new Fault(`${name} is required and must be under ${max} characters.`);
  return text;
}
export function cents(value: unknown) {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) <= 0 ||
    (value as number) > 100_000_000
  )
    throw new Fault(
      "Enter a positive amount, up to $1,000,000, with at most two decimals.",
    );
  return value as number;
}
export function quoteDraft(serviceIds: unknown) {
  if (
    !Array.isArray(serviceIds) ||
    !serviceIds.length ||
    new Set(serviceIds).size !== serviceIds.length ||
    serviceIds.some((id) => !SERVICES.some((s) => s.id === id))
  )
    throw new Fault("Pick valid services, without duplicates.");
  const selected = SERVICES.filter((s) => serviceIds.includes(s.id));
  return {
    services: selected.map((s) => s.id),
    price: selected.some((s) => s.price === null)
      ? null
      : selected.reduce((n, s) => n + (s.price ?? 0), 0),
    monthly: selected
      .filter((s) => s.cadence === "monthly")
      .reduce((n, s) => n + (s.price ?? 0), 0),
    scope: selected.map((s) => `${s.name}: ${s.scope}`).join("\n\n"),
  };
}
export function transition(
  db: Data,
  p: Partner,
  d: Deal,
  stage: Stage,
  reason = "",
) {
  if (!STAGES.includes(stage) || stage === d.stage)
    throw new Fault("Choose a different valid stage.");
  if (d.stage === "Lost" || d.stage === "Delivered")
    throw new Fault("This deal is closed. Create a new deal for more work.");
  if (stage === "Lost") {
    if (db.payments.some((x) => x.deal_id === d.id))
      throw new Fault("A deal with received payments cannot be marked lost.");
    d.lost_reason = textInput(reason, "Lost reason", true);
  } else {
    if (STAGES.indexOf(stage) !== STAGES.indexOf(d.stage) + 1)
      throw new Fault("Move one stage at a time.");
    if (["Quote sent", "Won"].includes(stage) && !d.approved)
      throw new Fault("Blake must approve the quote first.");
    if (stage === "Client paid") {
      owner(p);
      if (d.price === null || paidOn(db, d.id) < d.price)
        throw new Fault("Record the full client payment first.");
    }
    if (stage === "Delivered") owner(p);
  }
  d.stage = stage;
  d.updated_at = new Date().toISOString();
}
export const paidOn = (db: Data, id: string) =>
  db.payments.filter((x) => x.deal_id === id).reduce((s, x) => s + x.amount, 0);
export function commission(db: Data, d: Deal) {
  const received = paidOn(db, d.id);
  const earned = Math.round(received * TERMS.commissionRate);
  const paid = db.payouts
    .filter((x) => x.deal_id === d.id)
    .reduce((n, x) => n + x.amount, 0);
  return { received, earned, paid, owed: earned - paid, override: 0 };
}
export function addPayout(db: Data, p: Partner, d: Deal, amount: unknown) {
  owner(p);
  const value = cents(amount);
  if (value > commission(db, d).owed)
    throw new Fault("Payout exceeds commission owed.");
  db.payouts.push({
    id: crypto.randomUUID(),
    partner_id: d.partner_id,
    deal_id: d.id,
    amount: value,
    paid_at: new Date().toISOString(),
  });
}
