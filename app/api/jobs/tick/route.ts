import { timingSafeEqual } from "node:crypto";
import { teamDatabase } from "@/lib/team/db";
import { collectJobAlerts } from "@/lib/team/jobs-store";
import { runJobVerification } from "@/lib/team/jobs-verification";
import { drainJobMail } from "@/lib/team/jobs-mail";
export const maxDuration = 300;
export async function GET(r: Request) {
  const expected = process.env.CRON_SECRET
      ? `Bearer ${process.env.CRON_SECRET}`
      : "",
    actual = r.headers.get("authorization") || "";
  if (
    !expected ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return new Response("Unauthorized", { status: 401 });
  if (process.env.VERCEL_ENV !== "production")
    return new Response("Unavailable", { status: 409 });
  const q = teamDatabase();
  await collectJobAlerts(q);
  await drainJobMail(q);
  await runJobVerification(q);
  return Response.json({ ok: true });
}
