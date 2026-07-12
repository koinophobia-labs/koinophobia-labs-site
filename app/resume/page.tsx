import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  GitBranch,
  IdCard,
  Mail,
  MapPin,
} from "lucide-react";
import resume from "@/lib/resume.json";

export const metadata: Metadata = {
  title: "Blake Taylor — Résumé",
  description:
    "Public résumé for Blake Taylor: AI product builder, technical founder, and operator in Chicago.",
  alternates: {
    canonical: "https://koinophobia.dev/resume",
  },
};

const PDF_PATH = "/resume/Blake-Taylor-Resume.pdf";

export default function ResumePage() {
  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <main className="mini-page resume-page">
        <a className="back-link" href="/connect">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to connect
        </a>

        <header className="mini-hero resume-header" aria-labelledby="resume-title">
          <p className="kicker kicker-gold">Career · Résumé</p>
          <h1 id="resume-title">{resume.name}</h1>
          <p className="resume-positioning">{resume.positioning}</p>
          <p className="resume-meta">
            <MapPin size={14} aria-hidden="true" />
            {resume.contact.location}
          </p>
          <p className="resume-summary">{resume.summary}</p>
          <p className="resume-open-to">{resume.openTo}</p>
          <div className="cta-row">
            <a
              className="btn btn-gold"
              href={PDF_PATH}
              download="Blake-Taylor-Resume.pdf"
              aria-label="Download Blake Taylor's résumé as a PDF"
            >
              <Download size={18} aria-hidden="true" />
              <span>Download PDF</span>
            </a>
            <a
              className="btn btn-ghost"
              href={resume.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Blake Taylor on LinkedIn (opens in a new tab)"
            >
              <IdCard size={18} aria-hidden="true" />
              <span>LinkedIn</span>
            </a>
            <a
              className="btn btn-ghost"
              href={resume.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Koinophobia Labs on GitHub (opens in a new tab)"
            >
              <GitBranch size={18} aria-hidden="true" />
              <span>GitHub</span>
            </a>
            <a
              className="btn btn-ghost"
              href={`mailto:${resume.contact.email}`}
              aria-label={`Email Blake at ${resume.contact.email}`}
            >
              <Mail size={18} aria-hidden="true" />
              <span>Email</span>
            </a>
          </div>
        </header>

        <section className="mini-panel resume-section" aria-labelledby="experience-title">
          <h2 id="experience-title">Experience</h2>
          {resume.experience.map((role) => (
            <article className="resume-role" key={`${role.title}-${role.org}`}>
              <div className="resume-role-head">
                <h3>
                  {role.title} — {role.org}
                </h3>
                <p className="resume-dates">{role.dates}</p>
              </div>
              <ul>
                {role.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
          <div className="resume-background">
            <h3>Background</h3>
            <p>{resume.background}</p>
          </div>
        </section>

        <section className="mini-panel resume-section" aria-labelledby="work-title">
          <h2 id="work-title">Selected shipped work</h2>
          <div className="resume-work-grid">
            {resume.projects.map((project) => (
              <article className="resume-work-card" key={project.name}>
                <h3>{project.name}</h3>
                <p>{project.blurb}</p>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.name} (opens in a new tab)`}
                >
                  {project.url.replace("https://", "")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mini-panel resume-section" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills</h2>
          <dl className="resume-skills">
            {resume.skills.map((group) => (
              <div className="resume-skill-group" key={group.label}>
                <dt>{group.label}</dt>
                <dd>{group.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="resume-footer">
          <p>
            {resume.name} · {resume.contact.location} ·{" "}
            <a href={`mailto:${resume.contact.email}`}>{resume.contact.email}</a> ·{" "}
            <a href={resume.contact.site}>koinophobia.dev</a>
          </p>
        </footer>
      </main>
    </>
  );
}
