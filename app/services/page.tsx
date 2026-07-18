import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CTABand, FAQItem, PricingCard, SectionIntro } from "@/components/studio";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";
import { faqs, serviceOffers, studioConfig } from "@/lib/commercial";

export const metadata: Metadata = { title: "Services and Pricing", description: "Website, landing page, audit, repair, and AI workflow services with visible price ranges, timelines, and deliverables.", alternates: { canonical: "/services" }, openGraph: { url: "/services" } };

export default function ServicesPage() {
  return <div className="studio-site"><StudioNav /><main>
    <header className="studio-page-hero"><div className="studio-container studio-page-hero__grid"><div><p className="studio-eyebrow">Services, prices, and timelines</p><h1>Choose the smallest useful engagement.</h1><p className="studio-page-hero__lede">Start with a contained repair or diagnosis when that is enough. Build a larger website or workflow only after the scope is clear.</p></div><aside className="studio-page-hero__aside">No implementation starts until scope and price are approved. There are no hidden numerical claims, fake discounts, or forced retainers.</aside></div></header>
    <section className="studio-section studio-section--compact" data-analytics-view="pricing_section_view"><div className="studio-container"><SectionIntro eyebrow="Offer menu" title="Five ways to start" body="Each offer names the likely cost, delivery window, and primary deliverable before you enter a sales conversation." /><div className="studio-pricing-grid">{serviceOffers.map((offer) => <PricingCard offer={offer} key={offer.slug} />)}</div><div className="studio-guarantee"><strong>You will know the agreed scope, price, timeline, and revision process before development starts.</strong><p>{studioConfig.auditCreditEnabled ? "The $250 audit fee is credited toward an eligible implementation project when you choose Koinophobia Labs to fix what the audit finds." : "Any audit-credit policy is confirmed in writing before purchase."}</p></div></div></section>
    <section className="studio-section studio-decision-band"><div className="studio-container studio-decision-band__grid"><div><p className="studio-eyebrow">Not sure which service fits?</p><h2>Start with the friction, not a package name.</h2><p>Answer seven focused questions and get a preliminary, rules-grounded recommendation you can correct before submitting.</p></div><Link className="studio-button studio-button--secondary" href="/concierge?entry=services" data-analytics="concierge_entry_click">Use the Project Concierge <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    <section className="studio-section studio-section--panel"><div className="studio-container"><SectionIntro eyebrow="Commercial details" title="What the scope confirms" body="Every proposal makes the boundaries visible before development." /><div className="studio-policy-grid"><article className="studio-policy-card"><h3>Revisions</h3><p>{studioConfig.revisionCopy}</p></article><article className="studio-policy-card"><h3>Post-launch support</h3><p>{studioConfig.postLaunchSupportCopy}</p></article><article className="studio-policy-card"><h3>Ownership and third parties</h3><p>{studioConfig.ownershipCopy}</p></article></div></div></section>
    <section id="faq" className="studio-section"><div className="studio-container"><SectionIntro eyebrow="Frequently asked" title="Direct answers before discovery" /><div className="studio-faq-list">{faqs.map((faq) => <FAQItem {...faq} key={faq.question} />)}</div></div></section>
    <CTABand />
  </main><StudioFooter /></div>;
}
