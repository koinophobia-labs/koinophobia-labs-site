import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { seed } from "../lib/team/seed";
import { hashPassword } from "../lib/team/auth";
async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || process.env.VERCEL)
    throw Error(
      "Fake seed requires explicit loopback database outside Vercel.",
    );
  const db = new Pool({ connectionString: url.href });
  try {
    for (const file of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
      "010_team_portal.sql",
    ])
      await db.query(readFileSync("db/" + file, "utf8"));
    const data = seed(true),
      hash = await hashPassword("fake-portal-test-password");
    for (const p of data.partners)
      await db.query(
        "insert into team_partners(id,name,email,role,password_hash) values($1,$2,$3,$4,$5) on conflict(id) do nothing",
        [p.id, p.name, p.id + "@example.test", p.role, hash],
      );
    for (const l of data.leads)
      await db.query(
        "insert into team_leads(id,partner_id,business,email,phone,website,data) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing",
        [l.id, l.partner_id, l.business, l.email, l.phone, l.website, l],
      );
    for (const d of data.deals)
      await db.query(
        "insert into team_deals(id,partner_id,lead_id,services,price,monthly,approved,scope,stage) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(id) do nothing",
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
    console.log(
      "Fake local team fixture ready. No real prospects or payment services used.",
    );
  } finally {
    await db.end();
  }
}
main().catch(() => {
  console.error("Local seed failed. No credentials logged.");
  process.exitCode = 1;
});
