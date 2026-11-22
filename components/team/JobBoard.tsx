import Link from "next/link";
import type { Partner } from "@/lib/team/types";
import { ownerJobs } from "@/lib/team/jobs-store";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { jobAlerts, alertLabels, offerLabel } from "@/lib/team/jobs-domain";
import { Countdown } from "./JobControls";
import "@/app/team/jobs.css";
export async function JobBoard({ partner }: { partner: Partner }) {
  if (hostedPreview())
    return (
      <section className="job-shell">
        <h2>Jobs</h2>
        <p>
          Read-only preview. Fulfillment is verified with isolated fake
          purchases.
        </p>
      </section>
    );
  const jobs = await ownerJobs(teamDatabase(), partner),
    open = jobs.filter((j) => !["Delivered", "Closed"].includes(j.stage));
  const messages = (
    await teamDatabase().query(
      "select count(*)::int n from team_job_messages where status in ('failed','uncertain')",
    )
  ).rows[0].n;
  return (
    <section className="job-shell" id="jobs">
      <p className="kicker">OWNER · FULFILLMENT</p>
      <h2 style={{fontSize:36}}>Jobs</h2>
      <p>
        Daily digest ·{" "}
        {new Date().toLocaleDateString("en-US", {
          timeZone: "America/Chicago",
        })}{" "}
        Central
      </p>
      <div className="job-grid">
        <div className="job-card">
          <h2>{open.length} open</h2>
          <p>Every paid project has a next step.</p>
        </div>
        <div className="job-card">
          <h2>
            {
              open.filter((j) =>
                jobAlerts(j).some((a) => ["due-soon", "overdue"].includes(a)),
              ).length
            }{" "}
            due
          </h2>
          <p>Due within 24 hours or overdue.</p>
        </div>
        <div className="job-card">
          <h2>
            {
              open.filter((j) =>
                jobAlerts(j).some((a) =>
                  ["access", "proof-needed", "refund-review"].includes(a),
                ),
              ).length
            }{" "}
            stuck
          </h2>
          <p>Access, proof or refund review needed.</p>
        </div>
      </div>
      {messages > 0 && (
        <p className="job-alert">
          {messages} email deliveries need owner review. Open the job for
          details.
        </p>
      )}
      {jobs.map((j) => (
        <article className="job-card" key={j.id}>
          <h2>
            <Link href={`/team/jobs/${j.id}`}>{j.business}</Link>
          </h2>
          <p>
            {offerLabel(j.offer)} · <strong>{j.stage}</strong>
          </p>
          <Countdown deadline={j.deadline} />
          <p className="job-alert">{jobAlerts(j).map(a=>alertLabels[a]).join(" · ")}</p>
          <p>
            {j.data.findings?.[0]?.measurement ||
              "Confirmed scope and auditor proof needed"}
          </p>
        </article>
      ))}
      {!jobs.length && (
        <p>
          No paid jobs yet. Your first payment will create one automatically.
        </p>
      )}
    </section>
  );
}
