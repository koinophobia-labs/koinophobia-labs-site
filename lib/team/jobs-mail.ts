import { sendInternalEmail } from "../acquisition/intake";
import type { Queryable } from "../payments";
import { jobAlerts, type Job } from "./jobs-domain";
const base = "https://koinophobialabs.com";
export function jobMessage(j: Job, kind: string) {
  const client = kind === "next" || kind === "fixed";
  const to = client ? j.data.buyer_email : "blake@koinophobialabs.com";
  if (!to || !/^\S+@\S+\.\S+$/.test(to))
    throw Error("missing_purchase_recipient");
  if (kind === "next")
    return {
      to,
      subject: "Next step: access for your website job",
      text: `Thank you for your purchase. Your ${j.offer} job is tracked.\n\nComplete your secure onboarding: ${base}/start/${j.code}\n${j.deadline ? `Deadline: ${new Date(j.deadline).toISOString()}` : "Your deadline will be confirmed from your quote."}\nInvite blake@koinophobialabs.com as a contributor. Never send passwords. This link expires ${new Date(j.code_expires_at).toISOString()}.`,
    };
  if (kind === "fixed") {
    const after = j.verification[1]?.proofs || [];
    const attachments: { filename: string; content: string }[] = [];
    j.data.findings.forEach((f, i) => {
      for (const [label, image] of [
        ["before", f.proof?.image],
        ["after", after[i]?.image],
      ]) {
        const m = image?.match(
          /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,
        );
        if (m)
          attachments.push({
            filename: `${label}-${i + 1}.${m[1] === "jpeg" ? "jpg" : m[1]}`,
            content: m[2],
          });
      }
    });
    if (
      attachments.length !== j.data.findings.length * 2 ||
      !attachments.length
    )
      throw Error("missing_proof");
    return {
      to,
      subject: "It's fixed — your website job",
      text: `Your agreed website fix is complete and passed two auditor checks.\n\n${j.data.findings.map((f) => f.measurement).join("\n")}\n\nBefore and after screenshots are attached.\nOptional ongoing care: ${base}/pay/care`,
      attachments,
    };
  }
  return {
    to,
    subject:
      kind === "access"
        ? "Client access nudge"
        : kind === "due-soon"
          ? "Website job due within 24 hours"
          : "Website job deadline reached",
    text: `${j.business}\n${kind === "access" ? "Waiting on client access for 24 hours. Call or text from your own phone." : "Review this job and its deadline."}\n${base}/team/jobs/${j.id}`,
  };
}
export async function drainJobMail(
  q: Queryable,
  send = sendInternalEmail,
  limit = 20,
) {
  // No network sends in local tests, previews, or fixture captures.
  if (
    process.env.VERCEL_ENV !== "production" ||
    process.env.NODE_ENV === "test"
  )
    return;
  await q.query(
    "update team_job_messages set status='uncertain',error='Dispatch interrupted; reconcile with provider before retrying.' where status='sending' and attempted_at<now()-interval '5 minutes'",
  );
  for (let n = 0; n < limit; n++) {
    const m = (
      await q.query(
        "update team_job_messages set status='sending',attempted_at=now() where id=(select id from team_job_messages where status='pending' order by created_at limit 1 for update skip locked) returning *",
      )
    ).rows[0];
    if (!m) break;
    const j = (await q.query("select * from team_jobs where id=$1", [m.job_id]))
      .rows[0] as Job;
    if (
      j.stage === "Closed" ||
      (m.kind !== "fixed" && j.stage === "Delivered") ||
      (["due-soon", "overdue", "access"].includes(m.kind) &&
        !jobAlerts(j).includes(m.kind))
    ) {
      await q.query(
        "update team_job_messages set status='failed',error='Superseded by current job state; no message sent.' where id=$1",
        [m.id],
      );
      continue;
    }
    try {
      const { to, ...message } = jobMessage(j, m.kind);
      const result = await send(message, `job/${m.id}`, to);
      await q.query(
        "update team_job_messages set status=$2,sent_at=case when $2='sent' then now() else null end,error=$3 where id=$1",
        [
          m.id,
          result.ok
            ? "sent"
            : result.reason === "provider_unreachable"
              ? "uncertain"
              : "failed",
          result.ok ? null : "Delivery not confirmed; owner action required.",
        ],
      );
    } catch {
      await q.query(
        "update team_job_messages set status='failed',error='Message could not be prepared; owner action required.' where id=$1",
        [m.id],
      );
    }
  }
}
