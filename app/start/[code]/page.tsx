import type { Metadata } from "next";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { publicJob } from "@/lib/team/jobs-store";
import { Onboarding } from "@/components/team/Onboarding";
import "../../team/team.css";
import "../../team/jobs.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your website job — next steps",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Start({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const j = hostedPreview() ? null : await publicJob(teamDatabase(), code);
  if (!j)
    return (
      <main className="job-shell">
        <h1>This invitation is unavailable or expired.</h1>
        <p>
          Ask Blake for a fresh secure onboarding link. Never email passwords.
        </p>
        <a href="mailto:blake@koinophobialabs.com">Contact Blake</a>
      </main>
    );
  return (
    <main className="job-shell">
      <p className="kicker">KOINOPHOBIA LABS · NEXT STEP</p>
      <h1>Let’s get your site fixed.</h1>
      <p>
        {j.business} · {j.offer}
      </p>
      <p>
        {j.deadline
          ? `Due ${new Date(j.deadline).toLocaleString("en-US", { timeZone: "America/Chicago" })} Central`
          : "Deadline: per your agreed quote."}
      </p>
      <p>
        Job status: <strong>{j.stage}</strong>
      </p>
      {["New", "Waiting on client access"].includes(j.stage) ? (
        <Onboarding code={code} needsSite={!j.website} />
      ) : (
        <p>
          Blake has your next steps. Contact him if your access details change.
        </p>
      )}
    </main>
  );
}
