import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import IntakeForm from "@/components/acquisition/IntakeForm";
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
import { founderLinks } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "$250 Website Revenue Leak Audit | Koinophobia Labs",
  description:
    "A flat-fee website audit that turns scattered conversion problems into a prioritized system for clearer trust, mobile flow, booking paths, and inquiries.",
  alternates: { canonical: "https://koinophobialabs.com/audit" },
};

export default function AuditPage() {
  return (
    <>
      <div className="page-field founder-field" aria-hidden="true" />
      <main className="mini-page audit-page">
        <Link className="back-link" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          Koinophobia Labs
        </Link>

        <section className="mini-hero" aria-labelledby="audit-title">
          <p className="kicker kicker-gold">Build leverage in your business</p>
          <h1 id="audit-title">{AUDIT_PRICE_LABEL} Website Revenue Leak Audit</h1>
          <p>
            <strong>{auditContinuity.heading}</strong> {auditContinuity.body} This is the same systems approach behind the studio&apos;s products: find the friction, make the problem visible, and turn it into a prioritized path forward.
          </p>
          <div className="audit-price-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              {AUDIT_PRICE_LABEL} flat. No subscription, no sales call required. Credited toward
              the build if you hire Koinophobia Labs to fix what it finds. Nothing is charged on
              this page — payment happens later through a secure Stripe link.
            </p>
          </div>
          <div className="cta-row">
            <a className="btn btn-gold" href={`#${AUDIT_INTAKE_ANCHOR}`}><span>Map the leaks</span></a>
            <a className="btn btn-cyan" href={auditEmailFallback}><Mail size={18} aria-hidden="true" /><span>Prefer email? Email Blake</span></a>
          </div>
        </section>

        <section className="mini-panel" aria-labelledby="audit-includes-title">
          <p className="kicker kicker-gold">From scattered symptoms to a clear system</p>
          <h2 id="audit-includes-title">What gets measured</h2>
          <ul className="audit-areas">{auditMeasuredAreas.map((area) => <li key={area}>{area}</li>)}</ul>
          <h2>What you receive</h2>
          <p className="audit-receive-lead">
            You receive a practical system for deciding what to fix first — not a pile of disconnected opinions.
          </p>
          <ul className="audit-deliverables">
            {auditDeliverables.map((item) => <li key={item}><CheckCircle2 size={16} aria-hidden="true" />{item}</li>)}
          </ul>
        </section>

        <section className="mini-panel" aria-labelledby="audit-steps-title">
          <h2 id="audit-steps-title">What happens next</h2>
          <ol className="audit-steps">
            {auditSteps.map((step) => <li key={step.title}><strong>{step.title}</strong>{step.body}</li>)}
          </ol>
          <p>
            Built for Chicago and Chicagoland shops and local businesses — tattoo studios, barbers,
            trainers, restaurants. If the audit is not the right move for your site, Blake will say
            so instead of selling you one.
          </p>
        </section>

        <section className="mini-panel" id={AUDIT_INTAKE_ANCHOR} aria-labelledby="audit-intake-title">
          <h2 id="audit-intake-title">Start with the friction</h2>
          <p>
            Tell Blake what feels stuck and what you want more of — calls, bookings, walk-ins, or qualified inquiries. He replies with fit, a delivery date, and the payment link if the audit is the right next system to build.
          </p>
          <IntakeForm defaultService={AUDIT_SERVICE_INTEREST} />
        </section>

        <footer className="audit-footer">
          <Link href={founderLinks.resume}>See the operator background</Link>
          <Link href="/connect">Meet the founder</Link>
          <Link href="/">See the studio systems</Link>
        </footer>
      </main>
    </>
  );
}
