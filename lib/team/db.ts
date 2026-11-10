import { assertSandboxIsolation, sandboxPreview } from "../sandbox-runtime";
import { Pool } from "pg";
import type { Queryable } from "../payments";
export const hostedPreview = () => process.env.VERCEL_ENV === "preview" && !sandboxPreview();
let pool: Pool | undefined;
export function teamDatabase() {
  assertSandboxIsolation();
  if (hostedPreview())
    throw Error(
      "Hosted review uses fake data only. Database access is disabled.",
    );
  if (!process.env.DATABASE_URL)
    throw Error("Team database is not configured.");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}
export async function transaction<T>(
  work: (q: Queryable) => Promise<T>,
  database = teamDatabase(),
): Promise<T> {
  const q = await database.connect();
  try {
    await q.query("begin");
    await q.query("select pg_advisory_xact_lock(hashtext('team-write'))");
    const result = await work(q);
    await q.query("commit");
    return result;
  } catch (e) {
    await q.query("rollback");
    throw e;
  } finally {
    q.release();
  }
}
