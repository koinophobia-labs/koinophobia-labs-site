import { readFileSync } from "node:fs";
import pg from "pg";
import {
  resolveMigrationPlan,
  verifyDatabaseIdentity,
} from "./database-migrations.mjs";
const plan = resolveMigrationPlan();
const down = process.argv.includes("--down");
if (down && process.env.ALLOW_TEAM_DATA_REMOVAL !== "true")
  throw Error(
    "Down migration requires explicit ALLOW_TEAM_DATA_REMOVAL=true; prefer code rollback and preserve data.",
  );
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
      new URL(
        `../db/010_team_portal${down ? ".down" : ""}.sql`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await client.query("commit");
  console.log(
    `Team migration ${down ? "down" : "up"} committed for ${plan.targetEnvironment}.`,
  );
} catch {
  await client.query("rollback").catch(() => {});
  console.error("Team migration refused or failed; no credentials logged.");
  process.exitCode = 1;
} finally {
  await client.end();
}
