import type { Metadata } from "next";
import Image from "next/image";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { publicDeal } from "@/lib/team/call-store";
import { quotePaymentLink } from "@/lib/team/payment-links";
import { SERVICES, money } from "@/lib/team/config";
import { DealOpened } from "@/components/team/DealOpened";
import "../../team/team.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your plan | Koinophobia Labs",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function DealPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const page = hostedPreview() ? null : await publicDeal(teamDatabase(), code);
  if (!page)
    return (
      <main className="team-workspace deal-public">
        <section className="team-card">
          <p className="team-eyebrow">KOINOPHOBIA LABS</p>
          <h1>This page is no longer available.</h1>
          <p>
            It may be paid, closed or expired. Your partner can help with the
            next step.
          </p>
        </section>
      </main>
    );
  const service = SERVICES.find((s) => s.id === page.deal.services[0])!;
  const pay = new URL(quotePaymentLink(page.deal)!);
  pay.searchParams.set("go", page.code);
  const website = new URL(page.lead.website);
  website.search = "";
  website.hash = "";
  return (
    <main className="team-workspace deal-public">
      {!page.is_demo && <DealOpened code={page.code} />}
      <section className="team-card">
        <p className="team-eyebrow">KOINOPHOBIA LABS · YOUR PLAN</p>
        {page.is_demo && (
          <p role="status">FAKE DEAL · Preview only. Payments disabled.</p>
        )}
        <h1>A clear next step for {page.lead.business}.</h1>
        <p>{website.toString()}</p>
        <div className="team-inset">
          <p className="team-eyebrow">THE CONFIRMED PROBLEM</p>
          <h2>{page.problem}</h2>
          {page.proof_reviewed_by && page.proof_image && <>
          <p>
            Screenshot captured{" "}
            {new Date(page.proof_at).toLocaleDateString("en-US", {
              timeZone: "UTC",
            })}
            .
          </p>
          {/* Auditor raster is served privately without a public storage URL. */}
          <Image
            unoptimized
            width={1280}
            height={900}
            className="deal-proof"
            src={`/go/${page.code}/proof`}
            alt="Auditor screenshot showing the confirmed website problem"
          />
          </>}
        </div>
        <h2>
          {service.name} · {money(page.deal.price)}
          {page.deal.monthly ? "/month" : ""}
        </h2>
        <p>{service.scope}</p>
        <p>
          <strong>Turnaround:</strong> {service.turnaround}.
        </p>
        {page.is_demo ? (
          <button className="team-button" disabled>
            Preview · payments disabled
          </button>
        ) : (
          <a className="team-button" href={pay.pathname + pay.search}>
            Pay {money(page.deal.price)}
            {page.deal.monthly ? "/month" : ""} →
          </a>
        )}
        <p>
          Secure checkout with Stripe. Apple Pay, Google Pay or card where
          available. Blake will reach out within one business day to start.
        </p>
        <small>
          Link expires{" "}
          {new Date(page.expires_at).toLocaleDateString("en-US", {
            timeZone: "UTC",
          })}
          .
        </small>
      </section>
    </main>
  );
}
