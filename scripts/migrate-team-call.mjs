import { readFileSync } from "node:fs";
import pg from "pg";
import { resolveMigrationPlan, verifyDatabaseIdentity } from "./database-migrations.mjs";

const plan = resolveMigrationPlan();
const client = new pg.Client({ connectionString: plan.databaseUrl });
try {
  await client.connect();
  await verifyDatabaseIdentity(client, plan);
  await client.query("begin");
  await client.query("select pg_advisory_xact_lock(hashtext('team-migration'))");
  await client.query(readFileSync(new URL("../db/014_team_call.sql", import.meta.url), "utf8"));
  await client.query("commit");
  console.log(`Team call migration committed for ${plan.targetEnvironment}.`);
} catch {
  await client.query("rollback").catch(() => {});
  console.error("Team call migration refused or failed; no credentials logged.");
  process.exitCode = 1;
} finally {
  await client.end();
}
