import type { Metadata } from "next";
import { ArrowLeft, GitBranch, IdCard, Mail } from "lucide-react";
import { founderLinks } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "Blake Taylor | Career and Resume",
  description:
    "Blake Taylor is a Chicago-based Koinophobia Labs founder seeking product, AI, community, operations, support, startup, and technical customer-facing roles.",
};

const roleAreas = [
  "Product and AI tools",
  "Community and creator systems",
  "Operations and support",
  "Startup execution",
  "Technical customer-facing work",
];

export default function ResumePage() {
  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <main className="mini-page career-page">
        <a className="back-link" href="/connect">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Blake
        </a>
        <section className="mini-hero" aria-labelledby="resume-title">
          <p className="kicker kicker-cyan">Career / resume</p>
          <h1 id="resume-title">Blake Taylor</h1>
          <p>
            Chicago, IL. Founder of Koinophobia Labs. Background includes operations,
            sportsbook/customer-facing work, community/content/product building, and AI product
            work.
          </p>
          <p>
            Seeking roles around product, AI, community, operations, support, startups, and
            technical customer-facing work.
          </p>
          <div className="cta-row">
            <a className="btn btn-gold" href={founderLinks.linkedin} target="_blank" rel="noreferrer">
              <IdCard size={18} aria-hidden="true" />
              <span>LinkedIn</span>
            </a>
            <a className="btn btn-cyan" href={founderLinks.github} target="_blank" rel="noreferrer">
              <GitBranch size={18} aria-hidden="true" />
              <span>GitHub</span>
            </a>
            <a className="btn btn-ghost" href={founderLinks.email}>
              <Mail size={18} aria-hidden="true" />
              <span>Email Blake</span>
            </a>
          </div>
        </section>

        <section className="mini-panel" aria-labelledby="target-title">
          <h2 id="target-title">Target role lanes</h2>
          <div className="mini-grid">
            {roleAreas.map((area) => (
              <article key={area}>
                <h3>{area}</h3>
              </article>
            ))}
          </div>
          <p>
            This page intentionally uses verified high-level background only. Exact employment dates,
            employer names, titles, and metrics should come from a real resume before being added.
          </p>
        </section>
      </main>
    </>
  );
}
