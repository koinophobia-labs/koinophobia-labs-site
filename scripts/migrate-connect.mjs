import { readFileSync } from "node:fs";
import pg from "pg";
import {
  resolveMigrationPlan,
  verifyDatabaseIdentity,
} from "./database-migrations.mjs";
const plan = resolveMigrationPlan();
const client = new pg.Client({ connectionString: plan.databaseUrl });
try {
  await client.connect();
  await verifyDatabaseIdentity(client, plan);
  await client.query("begin");
  await client.query(
    "select pg_advisory_xact_lock(hashtext('team-migration'))",
  );
  await client.query(
    readFileSync(
      new URL("../db/011_team_connect.sql", import.meta.url),
      "utf8",
    ),
  );
  await client.query("commit");
  console.log("Additive Connect migration committed.");
} catch {
  await client.query("rollback").catch(() => {});
  console.error("Connect migration refused or failed; credentials omitted.");
  process.exitCode = 1;
} finally {
  await client.end();
}
