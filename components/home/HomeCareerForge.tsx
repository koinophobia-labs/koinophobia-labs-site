import { ArrowUpRight, Check, FileCheck2, Layers3, ShieldCheck } from "lucide-react";
import { founderLinks } from "@/lib/founderHub";

const STEPS = [
  {
    number: "01",
    title: "Import the history",
    body: "Bring old résumés, projects, and work history into one local career dossier.",
  },
  {
    number: "02",
    title: "Review the evidence",
    body: "Confirm professional claims and keep goals, gaps, constraints, and uncertainty out of generated materials.",
  },
  {
    number: "03",
    title: "Create draft packs",
    body: "Build ATS, recruiter, and job-specific drafts from the role lane that fits the approved evidence.",
  },
];

const PACK = [
  "Career Dossier",
  "Up to 3 role lanes",
  "ATS résumé draft per lane",
  "Recruiter résumé draft per lane",
  "LinkedIn positioning drafts",
  "Evidence receipt",
  "Job-specific tailoring",
  "PDF and DOCX bundle",
];

const FOUNDING_COHORT_HREF = `${founderLinks.careerForge}/founding-beta`;

const REBUILD_HREF =
  "mailto:koinophobia999@gmail.com?subject=Career%20Forge%20Resume%20Rebuild&body=Name%3A%0ACurrent%20role%20or%20background%3A%0ATarget%20roles%3A%0AWhat%20is%20not%20working%20in%20your%20current%20resume%3A%0A";

export default function HomeCareerForge() {
  return (
    <section id="career-forge" className="kl-career" aria-labelledby="career-forge-title">
      <div className="kl-career__inner">
        <div className="kl-career__copy">
          <div className="kl-career__kicker">
            <span className="kl-rule-gold" aria-hidden="true" />
            <span className="kl-mono">CAREER FORGE · PUBLIC BETA</span>
          </div>
          <p className="kl-career__eyebrow">Leverage for job seekers</p>
          <h2 id="career-forge-title">Build a reusable career evidence system.</h2>
          <p className="kl-career__lede">Your career is bigger than your last résumé.</p>
          <p className="kl-career__body">
            Career Forge organizes scattered jobs, projects, and old résumés into a local career
            dossier, then creates role-specific résumé and application drafts from the evidence you
            review. The product is in public beta. Every generated claim, date, heading, and export
            requires careful review before use.
          </p>
          <div className="kl-career__actions">
            <a
              className="kl-btn kl-career__primary"
              href={founderLinks.careerForge}
              target="_blank"
              rel="noreferrer"
            >
              Try the Career Forge beta
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a className="kl-link" href={FOUNDING_COHORT_HREF} target="_blank" rel="noreferrer">
              Apply for one of 5 founding seats ($49) →
            </a>
            <a className="kl-link" href="#career-forge-pack">
              See what the draft pack includes ↓
            </a>
          </div>
          <ul className="kl-career__trust" aria-label="Career Forge beta qualities">
            <li>
              <ShieldCheck size={17} aria-hidden="true" />
              Local-first workspace
            </li>
            <li>
              <FileCheck2 size={17} aria-hidden="true" />
              Reviewable source evidence
            </li>
            <li>
              <Layers3 size={17} aria-hidden="true" />
              Reusable role lanes
            </li>
          </ul>
        </div>

        <div className="kl-career__system" aria-label="How the Career Forge beta turns career evidence into draft résumé packs">
          <div className="kl-career__system-head">
            <span className="kl-mono">career://beta-workspace</span>
            <span className="kl-career__live"><i aria-hidden="true" /> PUBLIC BETA</span>
          </div>
          <div className="kl-career__flow">
            {STEPS.map((step) => (
              <article key={step.number} className="kl-career__step">
                <span className="kl-mono">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div id="career-forge-pack" className="kl-career__pack">
            <div className="kl-career__pack-head">
              <span className="kl-mono">DRAFT OUTPUT</span>
              <strong>A reusable dossier and role-specific drafts, not one generic document.</strong>
            </div>
            <ul>
              {PACK.map((item) => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="kl-career__service" aria-labelledby="career-forge-rebuild-title">
          <div>
            <p className="kl-mono">HUMAN SERVICE · SEPARATE FROM THE BETA</p>
            <h3 id="career-forge-rebuild-title">Career Forge Résumé Rebuild: $149 flat.</h3>
            <p>
              Blake completes and reviews this done-for-you service directly: a diagnostic, rebuilt
              résumé, LinkedIn headline, three target-role directions, a Loom walkthrough, and one
              revision. It is not an automated beta output. Turnaround is 48 hours after payment and
              intake.
            </p>
          </div>
          <a className="kl-link" href={REBUILD_HREF}>
            Request a human rebuild →
          </a>
        </aside>
      </div>
    </section>
  );
}
