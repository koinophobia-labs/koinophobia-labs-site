import { ArrowUpRight, Check, FileCheck2, Layers3, ShieldCheck } from "lucide-react";
import { founderLinks } from "@/lib/founderHub";

const STEPS = [
  {
    number: "01",
    title: "Import the history",
    body: "Bring old resumes, projects, and work history into one local career dossier.",
  },
  {
    number: "02",
    title: "Approve the truth",
    body: "Every imported fact stays a proposal until you confirm it. Unsupported gaps stay gaps.",
  },
  {
    number: "03",
    title: "Compile the pack",
    body: "Build distinct ATS, recruiter, and job-specific resumes from the right role lane.",
  },
];

const PACK = [
  "Career Dossier",
  "Up to 3 role lanes",
  "ATS resume per lane",
  "Recruiter resume per lane",
  "LinkedIn positioning",
  "Evidence receipt",
  "Job-specific tailoring",
  "PDF and DOCX bundle",
];

const REBUILD_HREF =
  "mailto:koinophobia999@gmail.com?subject=Career%20Forge%20Resume%20Rebuild&body=Name%3A%0ACurrent%20role%20or%20background%3A%0ATarget%20roles%3A%0AWhat%20is%20not%20working%20in%20your%20current%20resume%3A%0A";

export default function HomeCareerForge() {
  return (
    <section id="career-forge" className="kl-career" aria-labelledby="career-forge-title">
      <div className="kl-career__inner">
        <div className="kl-career__copy">
          <div className="kl-career__kicker">
            <span className="kl-rule-gold" aria-hidden="true" />
            <span className="kl-mono">CAREER FORGE · LIVE PRODUCT</span>
          </div>
          <p className="kl-career__eyebrow">Leverage for job seekers</p>
          <h2 id="career-forge-title">One career history. A complete resume pack.</h2>
          <p className="kl-career__lede">Your career is bigger than your last resume.</p>
          <p className="kl-career__body">
            Career Forge turns scattered jobs, projects, and old resumes into an approved evidence
            system, then compiles truthful application packs for every credible direction. No
            account is required. Files process locally, and nothing enters the output until you
            approve it.
          </p>
          <div className="kl-career__actions">
            <a
              className="kl-btn kl-career__primary"
              href={founderLinks.careerForge}
              target="_blank"
              rel="noreferrer"
            >
              Open Career Forge
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a className="kl-link" href="#career-forge-pack">
              See what the pack includes ↓
            </a>
          </div>
          <ul className="kl-career__trust" aria-label="Career Forge safeguards">
            <li>
              <ShieldCheck size={17} aria-hidden="true" />
              Approval-gated evidence
            </li>
            <li>
              <FileCheck2 size={17} aria-hidden="true" />
              No invented claims
            </li>
            <li>
              <Layers3 size={17} aria-hidden="true" />
              Multiple role lanes
            </li>
          </ul>
        </div>

        <div className="kl-career__system" aria-label="How Career Forge turns career evidence into resume packs">
          <div className="kl-career__system-head">
            <span className="kl-mono">career://truth-system</span>
            <span className="kl-career__live"><i aria-hidden="true" /> LIVE</span>
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
              <span className="kl-mono">THE OUTPUT</span>
              <strong>A reusable dossier, not one generic document.</strong>
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
            <p className="kl-mono">DONE-FOR-YOU OPTION</p>
            <h3 id="career-forge-rebuild-title">Career Forge Resume Rebuild: $149 flat.</h3>
            <p>
              A diagnostic, rebuilt resume, LinkedIn headline, three target-role directions, a Loom
              walkthrough, and one revision. Turnaround is 48 hours after payment and intake.
            </p>
          </div>
          <a className="kl-link" href={REBUILD_HREF}>
            Request a rebuild →
          </a>
        </aside>
      </div>
    </section>
  );
}
