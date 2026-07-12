import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  GitBranch,
  IdCard,
  Mail,
} from "lucide-react";
import Image from "next/image";
import resume from "@/lib/resume.json";

export const metadata: Metadata = {
  title: "Blake Taylor — Résumé",
  description:
    "Résumé for Blake Taylor: AI product builder with a customer-experience and trust & safety background. Founder of Koinophobia Labs, formerly DraftKings.",
  alternates: {
    canonical: "https://koinophobia.dev/resume",
  },
  openGraph: {
    title: "Blake Taylor — Résumé",
    description:
      "AI product builder with a customer-experience and trust & safety background.",
    url: "https://koinophobia.dev/resume",
    images: [{ url: "/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — Résumé",
    images: ["/og-founder.png"],
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
          <div className="resume-head-row">
            <div className="resume-head-text">
              <p className="kicker kicker-gold">Career · Résumé</p>
              <h1 id="resume-title">{resume.name}</h1>
              <p className="resume-positioning">{resume.headline}</p>
            </div>
            <figure className="resume-portrait">
              <Image
                src="/blake-portrait.jpg"
                width={640}
                height={800}
                priority
                alt="Blake Taylor, founder of Koinophobia Labs"
              />
            </figure>
          </div>
          <div className="chip-row resume-chips" aria-label="Status">
            <span className="chip chip-gray">BASE · CHICAGO, IL</span>
            <span className="chip chip-cyan">LANE · CUSTOMER EXPERIENCE AI</span>
            <span className="chip chip-gold">STATUS · OPEN TO WORK</span>
          </div>
          <p className="resume-summary">{resume.summary}</p>
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
          <p className="kicker kicker-gold">Proof of work</p>
          <h2 id="experience-title">Experience</h2>
          {resume.experience.map((role) => (
            <article className="resume-role" key={`${role.title}-${role.org}`}>
              <div className="resume-role-head">
                <h3>
                  {role.title} — {role.org}
                </h3>
                <p className="resume-dates">
                  {role.location} · {role.dates}
                </p>
              </div>
              <ul>
                {role.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mini-panel resume-section" aria-labelledby="work-title">
          <p className="kicker kicker-cyan">Shipped</p>
          <h2 id="work-title">Selected shipped work</h2>
          <div className="resume-work-grid">
            {resume.projects.map((project) => (
              <article className="resume-work-card" key={project.name}>
                <span
                  className={`resume-work-tag${"tone" in project && project.tone === "orange" ? " resume-work-tag-orange" : ""}`}
                >
                  {project.tag}
                </span>
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

        <section className="mini-panel resume-section" aria-labelledby="education-title">
          <p className="kicker kicker-gold">Credentials</p>
          <h2 id="education-title">Education</h2>
          {resume.education.map((entry) => (
            <div className="resume-role-head resume-education" key={entry.school}>
              <h3>
                {entry.degree} — {entry.school}
              </h3>
              <p className="resume-dates">{entry.year}</p>
            </div>
          ))}
        </section>

        <section className="mini-panel resume-section" aria-labelledby="skills-title">
          <p className="kicker kicker-cyan">Stack</p>
          <h2 id="skills-title">Skills</h2>
          <dl className="resume-skills">
            {resume.skills.map((group) => (
              <div className="resume-skill-group" key={group.label}>
                <dt>{group.label}</dt>
                <dd>
                  <span className="chip-row">
                    {group.items.map((item) => (
                      <span className="chip chip-gray" key={item}>
                        {item}
                      </span>
                    ))}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="resume-footer">
          <p>
            {resume.name} · {resume.contact.location} ·{" "}
            <a href={`mailto:${resume.contact.email}`}>{resume.contact.email}</a> ·{" "}
            <a href={resume.contact.site}>koinophobia.dev</a> ·{" "}
            <a href={resume.contact.company}>koinophobialabs.com</a>
          </p>
        </footer>
      </main>
    </>
  );
}
