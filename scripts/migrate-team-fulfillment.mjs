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
  const tables = (
    await client.query(
      "select tablename from pg_tables where schemaname='public' order by tablename",
    )
  ).rows.map((r) => r.tablename);
  const counts = {};
  for (const t of tables)
    counts[t] = (
      await client.query(
        'select count(*)::int n from "' + t.replaceAll('"', '""') + '"',
      )
    ).rows[0].n;
  console.log(JSON.stringify({ phase: "pre-count", counts }));
  await client.query(
    readFileSync(
      new URL("../db/015_team_fulfillment.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const t of tables) {
    const after = (
      await client.query(
        'select count(*)::int n from "' + t.replaceAll('"', '""') + '"',
      )
    ).rows[0].n;
    if (after !== counts[t]) throw Error("Existing row count changed");
  }
  await client.query("commit");
  console.log(
    JSON.stringify({ phase: "post-count", existingCountsUnchanged: true }),
  );
  console.log(
    `Team fulfillment migration committed for ${plan.targetEnvironment}.`,
  );
} catch {
  await client.query("rollback").catch(() => {});
  console.error(
    "Team fulfillment migration refused or failed; no credentials logged.",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
