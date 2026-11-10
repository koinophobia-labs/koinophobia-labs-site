import { randomUUID } from "node:crypto";
import type { Queryable } from "../payments";
import type { Data, Partner, Lead, Deal, Stage } from "./types";
import { actor } from "./auth";
import {
  owner,
  Fault,
  textInput,
  quoteDraft,
  transition,
  commission,
  cents,
} from "./domain";
import { validateImport, importLeads } from "./lead-import";
export type TeamLead = Lead & {
  opted_out?: boolean;
  city?: string;
  state?: string;
  time_zone?: string;
  fit_score?: number;
  opener?: string;
  evidence?: { check: string; measurement: string }[];
};
export type TeamSnapshot = Omit<Data, "leads"> & {
  me: Partner;
  fake: boolean;
  readonly: boolean;
  mailingAddress: string;
  leads: TeamLead[];
};
export function contactKeys(l: Pick<Lead, "email" | "phone" | "website">) {
  const keys: string[] = [];
  if (l.email) keys.push("email:" + l.email.trim().toLowerCase());
  if (l.phone) {
    const number = l.phone.replace(/\D/g, "").slice(-10);
    if (number) keys.push("phone:" + number);
  }
  try {
    keys.push(
      "host:" + new URL(l.website).hostname.toLowerCase().replace(/^www\./, ""),
    );
  } catch {}
  return keys;
}
export async function isOptedOut(
  q: Queryable,
  l: Pick<Lead, "email" | "phone" | "website">,
) {
  return Boolean(
    (
      await q.query(
        "select key from team_opt_outs where key=any($1::text[]) limit 1",
        [contactKeys(l)],
      )
    ).rows[0],
  );
}
export async function snapshot(
  q: Queryable,
  p: Partner,
): Promise<TeamSnapshot> {
  const scope = p.role === "owner" ? null : p.id;
  const leads = (
    await q.query(
      "select * from team_leads where ($1::text is null or partner_id=$1) order by created_at desc",
      [scope],
    )
  ).rows;
  const suppressed = new Set(
    (
      await q.query("select key from team_opt_outs where key=any($1::text[])", [
        leads.flatMap((l) => contactKeys(l as Lead)),
      ])
    ).rows.map((x) => x.key),
  );
  const shaped: TeamLead[] = [];
  for (const l of leads)
    shaped.push({
      ...l.data,
      id: l.id,
      partner_id: l.partner_id,
      business: l.business,
      email: l.email,
      phone: l.phone,
      website: l.website,
      created_at: new Date(l.created_at).toISOString(),
      opted_out: contactKeys(l as Lead).some((key) => suppressed.has(key)),
    });
  const deals = (
    await q.query(
      "select * from team_deals where ($1::text is null or partner_id=$1) order by created_at desc",
      [scope],
    )
  ).rows as Deal[];
  const payments = (
    await q.query(
      `select p.id,a.deal_id,p.amount,p.paid_at received_at from team_payment_attributions a join crm_payments p on p.id=a.payment_id join team_deals d on d.id=a.deal_id where p.status='paid' and ($1::text is null or d.partner_id=$1)`,
      [scope],
    )
  ).rows as Data["payments"];
  const payouts = (
    await q.query(
      "select id,partner_id,deal_id,amount,paid_at from team_payouts where ($1::text is null or partner_id=$1)",
      [scope],
    )
  ).rows as Data["payouts"];
  const partners = (
    await q.query(
      "select id,name,email,role,active,parent_partner_id,override_rate from team_partners where ($1::text is null or id=$1) order by name",
      [scope],
    )
  ).rows.map(actor);
  const checks = (
    await q.query(
      "select id,partner_id,data from team_site_checks where ($1::text is null or partner_id=$1) order by created_at desc limit 30",
      [scope],
    )
  ).rows.map((x) => ({ ...x.data, id: x.id, partner_id: x.partner_id }));
  const address =
    (
      await q.query(
        "select value from team_settings where key='mailing_address'",
        [],
      )
    ).rows[0]?.value || "";
  return {
    me: p,
    fake: false,
    readonly: false,
    mailingAddress: address,
    leads: shaped,
    deals,
    payments,
    payouts,
    partners,
    site_checks: checks,
  };
}
export async function scopedDeal(
  q: Queryable,
  p: Partner,
  id: string,
  lock = false,
) {
  const r = await q.query(
    `select * from team_deals where id=$1 and ($2::text is null or partner_id=$2)${lock ? " for update" : ""}`,
    [id, p.role === "owner" ? null : p.id],
  );
  if (!r.rows[0]) throw new Fault("Deal not found.", 404);
  return r.rows[0] as Deal;
}
export async function scopedLead(q: Queryable, p: Partner, id: string) {
  const r = await q.query(
    "select * from team_leads where id=$1 and ($2::text is null or partner_id=$2)",
    [id, p.role === "owner" ? null : p.id],
  );
  if (!r.rows[0]) throw new Fault("Lead not found.", 404);
  return r.rows[0] as Lead;
}
export async function importAssigned(
  q: Queryable,
  p: Partner,
  partnerId: string,
  body: unknown,
) {
  owner(p);
  const row = (
    await q.query(
      "select * from team_partners where id=$1 and active and role='partner'",
      [partnerId],
    )
  ).rows[0];
  if (!row) throw new Fault("Choose an active partner.");
  const rows = validateImport(body, actor(row));
  const all = (await q.query("select data from team_leads")).rows.map(
    (x) => x.data,
  ) as Lead[];
  const data: Data = {
    leads: all,
    partners: [],
    deals: [],
    payments: [],
    payouts: [],
    site_checks: [],
  };
  let imported = 0,
    duplicates = 0,
    suppressed = 0;
  for (const l of rows) {
    if (await isOptedOut(q, l)) {
      suppressed++;
      continue;
    }
    const r = importLeads(data, [l]);
    if (!r.imported) {
      duplicates++;
      continue;
    }
    await q.query(
      "insert into team_leads(id,partner_id,business,email,phone,website,data) values($1,$2,$3,$4,$5,$6,$7)",
      [l.id, l.partner_id, l.business, l.email, l.phone, l.website, l],
    );
    imported++;
  }
  return { imported, duplicates, suppressed };
}
export async function optOut(q: Queryable, p: Partner, id: string) {
  const l = await scopedLead(q, p, id);
  for (const key of contactKeys(l))
    await q.query(
      "insert into team_opt_outs(key,recorded_by) values($1,$2) on conflict do nothing",
      [key, p.id],
    );
  return { ok: true };
}
export async function saveQuote(
  q: Queryable,
  p: Partner,
  body: Record<string, unknown>,
) {
  const l = await scopedLead(q, p, textInput(body.lead_id, "Lead", true, 80));
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  const draft = quoteDraft(body.services),
    id = randomUUID();
  await q.query(
    `insert into team_deals(id,partner_id,lead_id,services,price,monthly,scope) values($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      l.partner_id,
      l.id,
      JSON.stringify(draft.services),
      draft.price,
      draft.monthly,
      draft.scope,
    ],
  );
  return { id };
}
export async function updateDeal(
  q: Queryable,
  p: Partner,
  id: string,
  body: Record<string, unknown>,
) {
  const d = await scopedDeal(q, p, id, true);
  if (body.action === "approve") {
    owner(p);
    if (["Client paid", "Delivered", "Lost"].includes(d.stage))
      throw new Fault("Closed or paid quotes cannot change.");
    const price = body.price == null ? d.price : cents(body.price);
    if (price === null)
      throw new Fault("Set an approved price for custom work.");
    await q.query(
      "update team_deals set approved=true,price=$1,updated_at=now() where id=$2",
      [price, id],
    );
  } else {
    const stage = textInput(body.stage, "Stage", true, 40) as Stage;
    if (stage === "Client paid")
      throw new Fault(
        "Client paid is set automatically by verified Stripe payment.",
      );
    const l = await scopedLead(q, p, d.lead_id);
    if (stage !== "Lost" && stage !== "Delivered" && (await isOptedOut(q, l)))
      throw new Fault("This contact has opted out.");
    const data = await snapshot(q, p);
    transition(data, p, d, stage, textInput(body.reason, "Lost reason"));
    await q.query(
      "update team_deals set stage=$1,lost_reason=$2,updated_at=now() where id=$3",
      [d.stage, d.lost_reason, id],
    );
  }
  return { ok: true };
}
export async function recordPayout(
  q: Queryable,
  p: Partner,
  id: string,
  amount: unknown,
) {
  owner(p);
  const d = await scopedDeal(q, p, id, true),
    value = cents(amount),
    data = await snapshot(q, p);
  if (value > commission(data, d).owed)
    throw new Fault("Payout exceeds commission owed.");
  await q.query(
    "insert into team_payouts(id,partner_id,deal_id,amount,recorded_by) values($1,$2,$3,$4,$5)",
    [randomUUID(), d.partner_id, id, value, p.id],
  );
  return { ok: true };
}
