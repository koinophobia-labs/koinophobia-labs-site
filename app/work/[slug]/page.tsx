import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { CTABand, StatusBadge, WorkVisual } from "@/components/studio";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";
import { getWorkProject, workProjects } from "@/lib/commercial";

export function generateStaticParams() { return workProjects.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const project = getWorkProject((await params).slug); return project ? { title: `${project.title} Case Study`, description: project.summary, alternates: { canonical: `/work/${project.slug}` }, openGraph: { url: `/work/${project.slug}` } } : {}; }

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getWorkProject((await params).slug); if (!project) notFound();
  return <div className="studio-site"><StudioNav /><main data-analytics-view="case_study_view">
    <header className="studio-page-hero studio-case-hero"><div className="studio-container"><StatusBadge status={project.status} statusLabel={project.statusLabel} /><p className="studio-eyebrow" style={{ marginTop: 22 }}>{project.businessType}</p><h1>{project.title}</h1><p className="studio-page-hero__lede">{project.summary}</p><WorkVisual project={project} /></div></header>
    <section className="studio-section studio-section--compact"><div className="studio-container"><dl className="studio-fact-grid"><div><dt>Status</dt><dd>{project.statusLabel}</dd></div><div><dt>Business type</dt><dd>{project.businessType}</dd></div><div><dt>Delivery</dt><dd>{project.timeline || "Not published"}</dd></div><div><dt>Results language</dt><dd>{project.measuredResults?.length ? "Measured results" : "Intended impact only"}</dd></div></dl></div></section>
    <section className="studio-section"><div className="studio-container studio-case-grid"><div>
      <section className="studio-case-section"><p className="studio-eyebrow">The problem</p><h2>Operational friction before the interface</h2><p>{project.problem}</p></section>
      <section className="studio-case-section"><p className="studio-eyebrow">What was built</p><h2>A focused concept response</h2><p>{project.solution}</p><p><strong>Integrity note:</strong> This is a Koinophobia Labs concept build, not a completed client engagement.</p></section>
      <section className="studio-case-section"><p className="studio-eyebrow">How it works</p><h2>The customer journey in plain language</h2><ol>{project.howItWorks.map((item) => <li key={item}>{item}</li>)}</ol></section>
      <section className="studio-case-section"><p className="studio-eyebrow">Project scope</p><h2>Included in the demonstration</h2><ul>{project.scope.map((item) => <li key={item}><Check size={15} aria-hidden="true" style={{ marginRight: 8 }} />{item}</li>)}</ul></section>
      <section className="studio-case-section"><p className="studio-eyebrow">Delivery</p><h2>Current status and next step</h2><p>{project.timeline || "No verified timeline is published."} The current status is {project.statusLabel}. A real implementation would move through documented scope, review, launch testing, handoff, and the agreed support period.</p>{project.previewUrl ? <Link className="studio-text-link" href={project.previewUrl}>Open the interactive concept <ArrowRight size={16} aria-hidden="true" /></Link> : null}</section>
      <section className="studio-case-section"><p className="studio-eyebrow">Intended impact</p><h2>What this system is designed to improve</h2><p>No measured client result is available for this concept. These are design goals, not achieved outcomes.</p><ul>{project.intendedImpact?.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div><aside className="studio-case-aside"><h2>Need a system like this?</h2><p>Start with the current process, the customer friction, and the outcome you want. Blake will recommend the smallest useful next step.</p><Link className="studio-button" href="/audit" data-analytics="audit_cta_click">Start With an Audit</Link><div style={{ marginTop: 18 }}><Link className="studio-text-link" href="/intake" data-analytics="project_inquiry_cta_click">Request a project <ArrowRight size={16} aria-hidden="true" /></Link></div></aside></div></section>
    <CTABand title="Need a system like this?" />
  </main><StudioFooter /></div>;
}
