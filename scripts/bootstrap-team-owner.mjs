import { randomBytes, randomUUID, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import pg from "pg";
import {
  resolveMigrationPlan,
  verifyDatabaseIdentity,
} from "./database-migrations.mjs";
const plan = resolveMigrationPlan();
const email = (process.env.TEAM_OWNER_EMAIL || "").trim().toLowerCase(),
  output = process.env.TEAM_INVITE_OUTPUT;
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !output?.startsWith("/"))
  throw Error(
    "Set TEAM_OWNER_EMAIL and absolute TEAM_INVITE_OUTPUT outside git.",
  );
const db = new pg.Client({ connectionString: plan.databaseUrl });
try {
  await db.connect();
  await verifyDatabaseIdentity(db, plan);
  await db.query("begin");
  await db.query("select pg_advisory_xact_lock(hashtext('team-write'))");
  if (
    (await db.query("select id from team_partners where role='owner'")).rows
      .length
  )
    throw Error("Owner already exists.");
  const code = randomBytes(32).toString("base64url");
  await db.query(
    "insert into team_partners(id,name,email,role,invite_hash,invite_expires_at) values($1,'Blake',$2,'owner',$3,now()+interval '7 days')",
    [randomUUID(), email, createHash("sha256").update(code).digest("hex")],
  );
  writeFileSync(output, code + "\n", { mode: 0o600, flag: "wx" });
  await db.query("commit");
  console.log(
    "Owner created. Invite code saved in the specified private file; no email sent.",
  );
} catch {
  await db.query("rollback").catch(() => {});
  console.error(
    "Owner bootstrap refused or failed. Verify inputs, database identity and whether an owner already exists.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
