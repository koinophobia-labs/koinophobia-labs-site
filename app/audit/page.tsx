import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import IntakeForm from "@/components/acquisition/IntakeForm";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";
import { SectionIntro } from "@/components/studio";
import {
  AUDIT_INTAKE_ANCHOR,
  AUDIT_PRICE_LABEL,
  AUDIT_SERVICE_INTEREST,
  auditContinuity,
  auditDeliverables,
  auditEmailFallback,
  auditMeasuredAreas,
  auditSteps,
} from "@/lib/audit-offer";

export const metadata: Metadata = {
  title: "$250 Website Revenue Leak Audit",
  description:
    "A flat-fee website audit that turns scattered conversion problems into a prioritized system for clearer trust, mobile flow, booking paths, and inquiries.",
  alternates: { canonical: "https://koinophobialabs.com/audit" },
};

export default function AuditPage() {
  return (
    <div className="studio-site">
      <StudioNav />
      <main>
        <header className="studio-page-hero" data-analytics-view="audit_page_view">
          <div className="studio-container studio-page-hero__grid">
            <div>
              <p className="studio-eyebrow">Lowest-risk start · Flat fee</p>
              <h1>The {AUDIT_PRICE_LABEL} Website Revenue Leak Audit.</h1>
              <p className="studio-page-hero__lede">
                The audit checks your whole site — trust, mobile flow, booking paths, contact
                visibility — measures what is costing you inquiries, and puts everything in one
                prioritized report you can act on with or without Koinophobia Labs.
              </p>
              <div className="studio-hero__actions">
                <a className="studio-button" href={`#${AUDIT_INTAKE_ANCHOR}`} data-analytics="audit_form_jump">Map the leaks</a>
                <a className="studio-button studio-button--secondary" href={auditEmailFallback} data-analytics="audit_email_fallback">Prefer email? Email Blake</a>
              </div>
            </div>
            <aside className="studio-page-hero__aside studio-page-hero__aside--keep">
              <ShieldCheck size={18} aria-hidden="true" /> {AUDIT_PRICE_LABEL} flat. No
              subscription, no sales call required. Credited toward the build if you hire
              Koinophobia Labs to fix what it finds. Nothing is charged on this page — payment
              happens later through a secure Stripe link.
            </aside>
          </div>
        </header>

        <section className="studio-section studio-section--compact">
          <div className="studio-container">
            <SectionIntro eyebrow={auditContinuity.kicker} title={auditContinuity.heading} body={auditContinuity.body} />
            <p className="studio-disclosure">Not sure diagnosis is the right first step? <Link className="studio-text-link" href="/concierge?entry=audit" data-analytics="concierge_entry_click">Use the Project Concierge</Link> to compare the fit without blocking the audit path.</p>
          </div>
        </section>

        <section className="studio-section studio-section--panel">
          <div className="studio-container">
            <SectionIntro eyebrow="From scattered symptoms to a clear system" title="What gets measured" />
            <div className="studio-chip-row studio-chip-row--large">
              {auditMeasuredAreas.map((area) => <span key={area}>{area}</span>)}
            </div>
            <SectionIntro
              eyebrow="The deliverable"
              title="What you receive"
              body="You receive a practical system for deciding what to fix first — not a pile of disconnected opinions."
            />
            <ul className="studio-audit-deliverables">
              {auditDeliverables.map((item) => (
                <li key={item}><Check size={16} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="studio-section">
          <div className="studio-container">
            <SectionIntro eyebrow="The path" title="What happens next" />
            <div className="studio-process-grid">
              {auditSteps.map((step, index) => (
                <article className="studio-process-step" key={step.title}>
                  <span>0{index + 1}</span>
                  <div><h3>{step.title}</h3><p>{step.body}</p></div>
                </article>
              ))}
            </div>
            <p className="studio-disclosure">
              Built for Chicago and Chicagoland shops and local businesses — tattoo studios,
              barbers, trainers, restaurants. If the audit is not the right move for your site,
              Blake will say so instead of selling you one.
            </p>
          </div>
        </section>

        <section className="studio-section studio-section--panel" id={AUDIT_INTAKE_ANCHOR} data-analytics-view="audit_intake_view">
          <div className="studio-container" style={{ maxWidth: 920 }}>
            <SectionIntro
              eyebrow="Start with the friction"
              title="Tell Blake what feels stuck."
              body="Share what you want more of — calls, bookings, walk-ins, or qualified inquiries. Blake replies with fit, a delivery date, and the payment link if the audit is the right next system to build."
            />
            <IntakeForm defaultService={AUDIT_SERVICE_INTEREST} />
          </div>
        </section>
      </main>
      <StudioFooter />
    </div>
  );
}
