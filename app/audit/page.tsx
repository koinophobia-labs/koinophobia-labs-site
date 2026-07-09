import type { Metadata } from "next";
import { ArrowLeft, Mail } from "lucide-react";
import { auditReviewAreas, founderLinks } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "$250 Website Revenue Leak Audit | Koinophobia Labs",
  description:
    "A focused website audit for Chicago and Chicagoland businesses reviewing trust, clarity, mobile flow, inquiry paths, CTA friction, and missed revenue opportunities.",
};

export default function AuditPage() {
  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <main className="mini-page">
        <a className="back-link" href="/connect">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Blake
        </a>
        <section className="mini-hero" aria-labelledby="audit-title">
          <p className="kicker kicker-gold">Koinophobia Labs Revenue Leak Audit</p>
          <h1 id="audit-title">$250 Website Revenue Leak Audit</h1>
          <p>
            A focused review for Chicago and Chicagoland businesses that want their website to
            create more trust, clearer next steps, and fewer lost inquiries. The audit is credited
            toward a future build if we work together after.
          </p>
          <div className="cta-row">
            <a
              className="btn btn-gold"
              href="mailto:koinophobia999@gmail.com?subject=%24250%20Website%20Revenue%20Leak%20Audit&body=Business%20name%3A%0AWebsite%20URL%3A%0AWhat%20you%20want%20more%20of%3A%20calls%20%2F%20bookings%20%2F%20inquiries%20%2F%20sales%0A"
            >
              <Mail size={18} aria-hidden="true" />
              <span>Request the audit</span>
            </a>
            <a className="btn btn-cyan" href={founderLinks.labs}>
              <span>Work with Koinophobia Labs</span>
            </a>
          </div>
        </section>

        <section className="mini-panel" aria-labelledby="audit-includes-title">
          <h2 id="audit-includes-title">What gets reviewed</h2>
          <div className="mini-grid">
            {auditReviewAreas.map((area) => (
              <article key={area}>
                <h3>{area}</h3>
              </article>
            ))}
          </div>
          <p>
            No payment flow is wired here. Send the current site or Instagram first, and Blake will
            confirm fit, scope, and next steps by email.
          </p>
        </section>
      </main>
    </>
  );
}
