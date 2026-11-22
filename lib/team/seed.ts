import type { Data, Partner } from "./types";
import { quoteDraft } from "./domain";
import { TERMS } from "./config";
export const partner = (
  id: string,
  name: string,
  role: "owner" | "partner" = "partner",
): Partner => ({
  id,
  name,
  role,
  parent_partner_id: null,
  commission_rate: TERMS.commissionRate,
  override_rate: 0,
  active: true,
});
export function seed(fake = false): Data {
  const db: Data = {
    partners: [partner("owner", "Blake", "owner")],
    leads: [],
    deals: [],
    payments: [],
    payouts: [],
    site_checks: [],
  };
  if (!fake) return db;
  db.partners.push(
    partner("demo-a", "Alex · fictional partner"),
    partner("demo-b", "Sam · fictional partner"),
  );
  const now = new Date().toISOString();
  const names = [
    "Juniper Bicycle · FAKE",
    "Paper Moon Studio · FAKE",
    "Northstar Bakery · FAKE",
    "Cedar Workshop · FAKE",
  ];
  names.forEach((business, i) => {
    const partner_id = i === 3 ? "demo-b" : "demo-a";
    db.leads.push({
      id: `lead-${i}`,
      partner_id,
      business,
      contact: "Fictional contact",
      phone: "",
      email: `demo${i}@example.test`,
      website: `https://example.test/${i}`,
      channel: ["In person", "Phone", "Online", "Referral"][i],
      notes: "Fictional demonstration record. No real client or prospect.",
      created_at: now,
    });
    db.deals.push({
      id: `deal-${i}`,
      lead_id: `lead-${i}`,
      partner_id,
      ...quoteDraft([["fix", "tune", "site", "care"][i]]),
      approved: i !== 2,
      stage: ["Won", "Client paid", "Contacted", "Lead"][
        i
      ] as Data["deals"][number]["stage"],
      lost_reason: "",
      created_at: now,
      updated_at: now,
    });
  });
  db.payments.push({
    id: "fake-payment",
    deal_id: "deal-1",
    amount: 75000,
    received_at: now,
  });
  db.payouts.push({
    id: "fake-payout",
    deal_id: "deal-1",
    partner_id: "demo-a",
    amount: 10000,
    paid_at: now,
  });
  return db;
}
