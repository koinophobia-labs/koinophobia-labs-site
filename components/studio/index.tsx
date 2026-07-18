import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CircleDot, Clock3 } from "lucide-react";
import type { WorkProject } from "@/lib/commercial";

export function StatusBadge({ status, statusLabel }: Pick<WorkProject, "status" | "statusLabel">) {
  return <span className={`studio-status studio-status--${status}`}><CircleDot size={13} aria-hidden="true" />{statusLabel}</span>;
}

export function SectionIntro({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id?: string }) {
  return <header className="studio-section-intro"><p className="studio-eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2>{body ? <p>{body}</p> : null}</header>;
}

export function ProofItem({ children }: { children: React.ReactNode }) {
  return <div className="studio-proof-item"><Check size={16} aria-hidden="true" /><span>{children}</span></div>;
}

export function WorkVisual({ project }: { project: WorkProject }) {
  return (
    <div className={`studio-work-visual studio-work-visual--${project.slug}`} aria-hidden="true">
      <div className="studio-browser-bar"><i /><i /><i /><span>{project.businessType}</span></div>
      <div className="studio-browser-body"><small>{project.statusLabel}</small><strong>{project.title}</strong><span>{project.summary}</span><b>Structured path to action →</b></div>
    </div>
  );
}

export function WorkCard({ project }: { project: WorkProject }) {
  return (
    <article className="studio-work-card">
      <WorkVisual project={project} />
      <div className="studio-work-card__body">
        <StatusBadge status={project.status} statusLabel={project.statusLabel} />
        <p className="studio-card-meta">{project.businessType}</p>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <dl><div><dt>Problem</dt><dd>{project.problem}</dd></div><div><dt>Designed response</dt><dd>{project.solution}</dd></div></dl>
        {project.timeline ? <p className="studio-timeline"><Clock3 size={15} aria-hidden="true" />{project.timeline}</p> : null}
        <div className="studio-chip-row">{project.capabilities.map((item) => <span key={item}>{item}</span>)}</div>
        <Link className="studio-text-link" href={`/work/${project.slug}`} data-analytics="case_study_view" data-analytics-label={project.slug}>Read the case study <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

type ServiceOffer = {
  title: string; forWhom: string; problem: string; includes: readonly string[] | string[];
  price: string; priceLabel: string; timeline: string; deliverable: string; href: string; cta: string; featured?: boolean;
};

export function PricingCard({ offer }: { offer: ServiceOffer }) {
  return (
    <article className={`studio-pricing-card${offer.featured ? " studio-pricing-card--featured" : ""}`}>
      {offer.featured ? <span className="studio-pricing-flag">Lowest-risk start</span> : null}
      <div className="studio-price-head"><p>{offer.priceLabel}</p><strong>{offer.price}</strong><span><Clock3 size={14} aria-hidden="true" />{offer.timeline}</span></div>
      <h3>{offer.title}</h3><p><b>Best for:</b> {offer.forWhom}</p><p><b>Solves:</b> {offer.problem}</p>
      <ul>{offer.includes.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul>
      <p className="studio-deliverable"><b>Primary deliverable</b>{offer.deliverable}</p>
      <Link className="studio-button studio-button--secondary" href={offer.href} data-analytics={offer.href === "/audit" ? "audit_cta_click" : "project_inquiry_cta_click"}>{offer.cta}</Link>
    </article>
  );
}

export function ProcessStep({ number, title, body }: { number: string; title: string; body: string }) {
  return <article className="studio-process-step"><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>;
}

type Product = { title: string; status: string; audience: string; body: string; capabilities: readonly string[] | string[]; href: string; cta: string; image?: string };

export function ProductCard({ product }: { product: Product }) {
  return <article className="studio-product-card">{product.image ? <div className="studio-product-image"><Image src={product.image} alt={`${product.title} product interface`} fill sizes="(max-width: 800px) 100vw, 380px" /></div> : <div className="studio-product-image studio-product-image--career" aria-hidden="true"><span>CF</span><b>Career Forge</b><i>Real experience. Clearer positioning.</i></div>}<div><p className="studio-product-status">{product.status}</p><h3>{product.title}</h3><p className="studio-card-meta">For {product.audience}</p><p>{product.body}</p><div className="studio-chip-row">{product.capabilities.map((item) => <span key={item}>{item}</span>)}</div><Link className="studio-text-link" href={product.href} data-analytics="product_link_click" data-analytics-label={product.title}>{product.cta}<ArrowRight size={16} aria-hidden="true" /></Link></div></article>;
}

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  return <details className="studio-faq-item"><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>;
}

export function Testimonial({ quote, name, role }: { quote?: string; name?: string; role?: string }) {
  if (!quote || !name) return null;
  return <blockquote className="studio-testimonial"><p>“{quote}”</p><cite>{name}{role ? `, ${role}` : ""}</cite></blockquote>;
}

export function CTABand({ title = "Start with the problem, not a giant commitment.", body = "The $250 Revenue Leak Audit gives you a prioritized plan you can use whether or not Koinophobia Labs handles the implementation." }: { title?: string; body?: string }) {
  return <section className="studio-cta-band"><div><p className="studio-eyebrow">A low-risk first step</p><h2>{title}</h2><p>{body}</p></div><div><Link className="studio-button" href="/audit" data-analytics="audit_cta_click">Start With an Audit</Link><Link className="studio-text-link studio-text-link--light" href="/intake" data-analytics="project_inquiry_cta_click">Request a project <ArrowRight size={16} aria-hidden="true" /></Link></div></section>;
}
