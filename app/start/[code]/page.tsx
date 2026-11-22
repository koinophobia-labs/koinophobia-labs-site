import type { Metadata } from "next";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { publicJob } from "@/lib/team/jobs-store";
import { onboardingDate, onboardingTitle, knownPlatform } from "@/lib/team/jobs-domain";
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
      <h1>{onboardingTitle(j)}</h1>
      <p>{onboardingDate(j.deadline) ? `Done by ${onboardingDate(j.deadline)}` : "Timing: as agreed in your quote."}</p>
      <p>
        Job status: <strong>{j.stage}</strong>
      </p>
      {["New", "Waiting on client access"].includes(j.stage) ? (
        <Onboarding code={code} needsSite={!j.website}
          initialPlatform={knownPlatform(j.data.platform)}
          initialContact={j.data.contact || ""}
          initialEmail={j.data.contact_email || j.data.buyer_email || ""}
          initialCell={j.data.cell || ""}
          deadlineLabel={onboardingDate(j.deadline)}
          partnerFirstName={j.partner_name?.trim().split(/\s+/)[0] || "Blake"}
        />
      ) : (
        <p>
          Blake has your next steps. Contact him if your access details change.
        </p>
      )}
    </main>
  );
}
