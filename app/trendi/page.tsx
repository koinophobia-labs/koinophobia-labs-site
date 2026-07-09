import type { Metadata } from "next";
import { ArrowLeft, Mail } from "lucide-react";
import { founderLinks } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "Trendi | Product Proof by Koinophobia Labs",
  description:
    "Trendi helps creators figure out what to post, draft content, and stay consistent. Product proof from Koinophobia Labs.",
};

export default function TrendiPage() {
  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <main className="mini-page product-proof-page">
        <a className="back-link" href="/connect">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Blake
        </a>
        <section className="mini-hero" aria-labelledby="trendi-title">
          <p className="kicker kicker-orange">Product proof</p>
          <h1 id="trendi-title">Trendi</h1>
          <p>
            Trendi helps creators figure out what to post, draft content, and stay consistent. This
            page is a public proof point for the product direction, not a claim of App Store launch,
            user count, revenue, or public TestFlight availability.
          </p>
          <div className="cta-row">
            <a className="btn btn-gold" href={founderLinks.emailWithContext}>
              <Mail size={18} aria-hidden="true" />
              <span>Ask about Trendi</span>
            </a>
            <a className="btn btn-cyan" href="/connect">
              <span>Open founder hub</span>
            </a>
          </div>
        </section>

        <section className="mini-panel" aria-labelledby="trendi-proof-title">
          <h2 id="trendi-proof-title">What it is built to solve</h2>
          <div className="mini-grid">
            <article>
              <h3>Post clarity</h3>
              <p>Help creators decide what to say next without starting from a blank page.</p>
            </article>
            <article>
              <h3>Drafting flow</h3>
              <p>Turn ideas into usable post drafts with a practical content workflow.</p>
            </article>
            <article>
              <h3>Consistency</h3>
              <p>Keep the habit moving with a lightweight system instead of scattered notes.</p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
