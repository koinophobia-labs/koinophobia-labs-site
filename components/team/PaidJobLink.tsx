import { PendingJobRefresh } from "./PendingJobRefresh";
import Link from "next/link";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
export async function PaidJobLink({
  sessionId,
}: {
  sessionId?: string | string[];
}) {
  if (
    hostedPreview() ||
    typeof sessionId !== "string" ||
    !/^cs_(test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId)
  )
    return null;
  const j = (
    await teamDatabase().query(
      "select j.code,j.stage from team_jobs j join crm_payments p on p.proposal_id=j.proposal_id where p.stripe_checkout_session_id=$1 and p.status='paid' and j.code_expires_at>now() and j.stage<>'Closed'",
      [sessionId],
    )
  ).rows[0];
  return j ? (
    <p>
      <Link href={`/start/${j.code}`}>
        <strong>Next step: securely set up contributor access →</strong>
      </Link>
    </p>
  ) : (
    <PendingJobRefresh />
  );
}
