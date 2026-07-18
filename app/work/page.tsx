import type { Metadata } from "next";
import { CTABand, SectionIntro, WorkCard } from "@/components/studio";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";
import { workProjects } from "@/lib/commercial";

export const metadata: Metadata = { title: "Client Work and Business Systems", description: "Client work, pilots, and concept builds from Koinophobia Labs, each labeled by its real project status.", alternates: { canonical: "/work" }, openGraph: { url: "/work" } };

export default function WorkPage() {
  return <div className="studio-site"><StudioNav /><main>
    <header className="studio-page-hero"><div className="studio-container studio-page-hero__grid"><div><p className="studio-eyebrow">Client work and business systems</p><h1>Every project labeled by its real status.</h1><p className="studio-page-hero__lede">This portfolio is commercially early and technically serious. The published business work below consists of clearly labeled concept builds; shipped internal products live on the Products page.</p></div><aside className="studio-page-hero__aside">No concept is a client. No intended impact is reported as an achieved result. When verified client proof is available, the same system can publish it without changing the site architecture.</aside></div></header>
    <section className="studio-section studio-section--compact" data-analytics-view="client_work_view"><div className="studio-container"><SectionIntro eyebrow="Published inventory" title="Business problem demonstrations" body="These concepts show the diagnosis, proposed customer path, scope, and intended impact without claiming external delivery." /><p className="studio-disclosure">Current inventory: 0 published Live Client projects, 0 published Client Pilots, and {workProjects.length} Concept Builds. This is an evidence boundary, not a missing label.</p><div className="studio-work-grid">{workProjects.map((project) => <WorkCard project={project} key={project.slug} />)}</div></div></section>
    <section className="studio-section studio-section--panel"><div className="studio-container"><SectionIntro eyebrow="Status definitions" title="What each label means" /><div className="studio-policy-grid"><article className="studio-policy-card"><h3>Live Client</h3><p>Completed external work with a verifiable delivered status and permission to publish.</p></article><article className="studio-policy-card"><h3>Client Pilot</h3><p>An approved or active external-business pilot being tested. It is not treated as a completed engagement.</p></article><article className="studio-policy-card"><h3>Concept Build</h3><p>An original demonstration built around a real business problem. It is not real client work.</p></article></div></div></section>
    <CTABand title="Need a system like one of these?" body="Start with the business friction. The audit or project intake helps determine whether a focused repair, website, or workflow is the right next step." />
  </main><StudioFooter /></div>;
}
