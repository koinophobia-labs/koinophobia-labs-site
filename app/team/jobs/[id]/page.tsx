/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentPartner } from "@/lib/team/session";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { ownerJob } from "@/lib/team/jobs-store";
import { jobAlerts, alertLabels, offerLabel, fixBrief } from "@/lib/team/jobs-domain";
import { JobControls, Countdown } from "@/components/team/JobControls";
import "../../jobs.css";
export const dynamic = "force-dynamic";
export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await currentPartner();
  if (!p) redirect("/team");
  if (p.role !== "owner" || hostedPreview()) notFound();
  const { id } = await params;
  const j = await ownerJob(teamDatabase(), p, id);
  const messages = (
    await teamDatabase().query(
      "select kind,status,error from team_job_messages where job_id=$1 order by created_at",
      [id],
    )
  ).rows;
  return (
    <main className="job-shell">
      <Link href="/team/admin#jobs">← Jobs / owner admin</Link>
      <h1>{j.business}</h1>
      <p>
        {offerLabel(j.offer)} · <strong>{j.stage}</strong>
      </p>
      <p>
        <Countdown deadline={j.deadline} />
      </p>
      <p className="job-alert">{jobAlerts(j).map(a=>alertLabels[a]).join(" · ")}</p>
      <dl>
        <dt>Site</dt>
        <dd>{j.website || "Not yet supplied"}</dd>
        <dt>Platform</dt>
        <dd>{j.data.platform || "Unknown"}</dd>
        <dt>Contributor access</dt>
        <dd>{j.data.access || "Waiting on client"}</dd>
        <dt>Best contact</dt>
        <dd>
          {j.data.contact || "Not supplied"} · {j.data.contact_email || ""} ·{" "}
          {j.data.cell || ""}
        </dd>
      </dl>
      <Link href={`/start/${j.code}`}>Open secure client onboarding</Link>
      <p>
        Invitation expires {new Date(j.code_expires_at).toLocaleDateString()}.
      </p>
      <h2>Paid problem & proof</h2>
      {j.data.findings.map((f, i) => (
        <section key={i} className="job-card">
          <p>{f.measurement}</p>
          <p>{f.url}</p>
          <div className="job-grid">
            <figure>
              <figcaption>Before · {f.proof?.captured_at}</figcaption>
              {f.proof?.image && (
                <img
                  className="job-proof"
                  src={f.proof.image}
                  alt={`Before: ${f.check}`}
                />
              )}
            </figure>
            {j.verification[1]?.proofs[i] && (
              <figure>
                <figcaption>
                  After · {j.verification[1].proofs[i].captured_at}
                </figcaption>
                <img
                  className="job-proof"
                  src={j.verification[1].proofs[i].image}
                  alt={`After: ${f.check}`}
                />
              </figure>
            )}
          </div>
        </section>
      ))}
      <h2>Fix brief</h2>
      <ol>
        {fixBrief(j).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <h2>Auditor</h2>
      <p>
        {j.verification.length} of 2 checks recorded. Checks are at least 10
        minutes apart.
      </p>
      {j.data.verification_error && (
        <p className="job-alert">{j.data.verification_error}</p>
      )}
      {j.verification_due_at && (
        <p>
          Next check due: {new Date(j.verification_due_at).toLocaleString()}
        </p>
      )}
      <JobControls
        id={id}
        stage={j.stage}
        notes={j.data.notes || ""}
        refundDraft={!!j.data.refund_draft}
        refundEligible={jobAlerts(j).includes("refund-review")}
        custom={!["fix", "tune-up"].includes(j.offer)}
      />
      <h2>Transactional delivery</h2>
      {messages.map((m, i) => (
        <p key={i}>
          {m.kind}: {m.status} {m.error || ""}
        </p>
      ))}
    </main>
  );
}
