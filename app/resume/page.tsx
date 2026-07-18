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
import Link from "next/link";
import resume from "@/lib/resume.json";

// koinophobia.dev/resume — the truthful résumé, rendered in the personal home's
// dark identity (.resumedev mirrors the .devhome palette). All facts come from
// lib/resume.json (single source of truth); the ATS PDF at PDF_PATH is generated
// from the same file via scripts/generate-resume-pdf.py. Content is not edited here.

export const metadata: Metadata = {
  title: { absolute: "Blake Taylor — Résumé" },
  description:
    "Résumé for Blake Taylor: AI product builder with a customer-experience and trust & safety background. Founder of Koinophobia Labs, formerly DraftKings.",
  alternates: {
    canonical: "https://koinophobia.dev/resume",
  },
  openGraph: {
    type: "profile",
    siteName: "koinophobia.dev",
    title: "Blake Taylor — Résumé",
    description:
      "AI product builder with a customer-experience and trust & safety background.",
    url: "https://koinophobia.dev/resume",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — Résumé",
    description: "AI product builder with a customer-experience and trust & safety background.",
    images: ["https://koinophobia.dev/og-founder.png"],
  },
};

const PDF_PATH = "/resume/Blake-Taylor-Resume.pdf";

export default function ResumePage() {
  return (
    <div className="resumedev">
      <div className="resumedev__field" aria-hidden="true" />
      <main className="resumedev__inner">
        <header className="resumedev__top">
          <Link className="resumedev__home" href="/">
            <ArrowLeft size={15} aria-hidden="true" /> koinophobia.dev
          </Link>
          <span className="resumedev__loc">{resume.contact.location}</span>
        </header>

        <section className="resumedev__hero" aria-labelledby="resume-title">
          <div className="resumedev__hero-text">
            <p className="resumedev__kicker">Career · Résumé</p>
            <h1 id="resume-title">{resume.name}</h1>
            <p className="resumedev__headline">{resume.headline}</p>
            <p className="resumedev__operator">
              I build practical systems that turn repeated friction into clear, reliable action.
            </p>
          </div>
          <figure className="resumedev__portrait">
            <Image
              src="/blake-portrait.jpg"
              width={640}
              height={800}
              priority
              alt="Blake Taylor, founder of Koinophobia Labs"
            />
          </figure>
        </section>

        <div className="resumedev__chips" aria-label="Status">
          <span className="resumedev__chip">Base · Chicago, IL</span>
          <span className="resumedev__chip">Lane · Customer Experience AI</span>
          <span className="resumedev__chip resumedev__chip--open">Status · Open to work</span>
        </div>

        <p className="resumedev__summary">{resume.summary}</p>

        <div className="resumedev__actions">
          <a
            className="resumedev__action resumedev__action--primary"
            href={PDF_PATH}
            download="Blake-Taylor-Resume.pdf"
            aria-label="Download Blake Taylor's résumé as a PDF"
          >
            <Download size={18} aria-hidden="true" />
            <span>Download PDF</span>
          </a>
          <a
            className="resumedev__action"
            href={resume.contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Blake Taylor on LinkedIn (opens in a new tab)"
          >
            <IdCard size={18} aria-hidden="true" />
            <span>LinkedIn</span>
          </a>
          <a
            className="resumedev__action"
            href={resume.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Koinophobia Labs on GitHub (opens in a new tab)"
          >
            <GitBranch size={18} aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <a
            className="resumedev__action"
            href={`mailto:${resume.contact.email}`}
            aria-label={`Email Blake at ${resume.contact.email}`}
          >
            <Mail size={18} aria-hidden="true" />
            <span>Email</span>
          </a>
        </div>

        <section className="resumedev__section" aria-labelledby="experience-title">
          <p className="resumedev__eyebrow">Proof of work</p>
          <h2 id="experience-title">Experience</h2>
          {resume.experience.map((role) => (
            <article className="resumedev__role" key={`${role.title}-${role.org}`}>
              <div className="resumedev__role-head">
                <h3>
                  {role.title} — {role.org}
                </h3>
                <p className="resumedev__dates">
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

        <section className="resumedev__section" aria-labelledby="work-title">
          <p className="resumedev__eyebrow">Shipped</p>
          <h2 id="work-title">Selected shipped work</h2>
          <div className="resumedev__work-grid">
            {resume.projects.map((project) => (
              <article className="resumedev__work-card" key={project.name}>
                <span
                  className={`resumedev__work-tag${"tone" in project && project.tone === "orange" ? " resumedev__work-tag--alt" : ""}`}
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

        <section className="resumedev__section" aria-labelledby="education-title">
          <p className="resumedev__eyebrow">Credentials</p>
          <h2 id="education-title">Education</h2>
          {resume.education.map((entry) => (
            <article className="resumedev__education" key={entry.school}>
              <div className="resumedev__role-head">
                <div>
                  <h3>{entry.school}</h3>
                  <p className="resumedev__education-degree">{entry.degree}</p>
                </div>
                <p className="resumedev__dates">{entry.graduation}</p>
              </div>
              <dl className="resumedev__education-details">
                <div>
                  <dt>Track</dt>
                  <dd>{entry.track}</dd>
                </div>
                <div>
                  <dt>Minors</dt>
                  <dd>{entry.minors.join(" · ")}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="resumedev__section" aria-labelledby="publication-title">
          <p className="resumedev__eyebrow">Research</p>
          <h2 id="publication-title">Research &amp; Publication</h2>
          <div className="resumedev__publications">
            {resume.publications.map((publication) => (
              <article className="resumedev__publication" key={publication.title}>
                <h3>{publication.title}</h3>
                <p className="resumedev__publication-author">{publication.author}</p>
                <p className="resumedev__publication-meta">
                  {publication.institution} · {publication.date}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="resumedev__section" aria-labelledby="skills-title">
          <p className="resumedev__eyebrow">Stack</p>
          <h2 id="skills-title">Skills</h2>
          <dl className="resumedev__skills">
            {resume.skills.map((group) => (
              <div className="resumedev__skill-group" key={group.label}>
                <dt>{group.label}</dt>
                <dd>
                  {group.items.map((item) => (
                    <span className="resumedev__chip" key={item}>
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="resumedev__footer">
          <p>
            {resume.name} · {resume.contact.location} ·{" "}
            <a href={`mailto:${resume.contact.email}`}>{resume.contact.email}</a> ·{" "}
            <Link href="/">koinophobia.dev</Link> ·{" "}
            <a href={resume.contact.company} target="_blank" rel="noopener noreferrer">
              koinophobialabs.com
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
