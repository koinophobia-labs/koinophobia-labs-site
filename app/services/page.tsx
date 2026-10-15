import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import ServicePayButton from "@/components/site/ServicePayButton";
import ServiceContact from "@/components/site/ServiceContact";
import { freeStraightAnswerAvailable } from "@/lib/acquisition/services-config";
import { STUDIO_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "Services", description: "A review, an audit, ongoing support, or a scoped project. Work directly with Blake.", alternates: { canonical: `${STUDIO_URL}/services` } };
export default function Services() {
  return <div className="site" data-motion-shell><Masthead current="/services"/><main className="shell page b2b services-menu">
    <section className="b2b-hero"><p className="k">Koinophobia Labs · Services</p><h1>Start with what you need.</h1><p className="lede">A review before you build. A look at what’s slipping. Help keeping things running. Work directly with Blake.</p><ServiceContact/></section>
    <section className="b2b-grid service-offers" aria-label="Services menu">
      <article className="b2b-card" id="audit"><span className="b2b-number">01 · Find the gaps</span><h2>Revenue Leak Audit</h2><p className="service-price">$250 <span>paid upfront</span></p><p>A 45-minute call, a written plan within 7 days of the call, and a results walkthrough.</p><p>Pay upfront, then send your business details and preferred call times.</p><Link className="btn btn--primary" href="/audit?src=services">See the audit &amp; pay $250</Link></article>
      <article className="b2b-card" id="straight-answer"><span className="b2b-number">02 · Before you build</span><h2>Straight Answer</h2><p>Build Readiness Review · For founders with a PRD or spec.</p><p className="service-price">$250 <span>paid upfront</span></p><p>A written review of what’s buildable, what’s missing, the risks, and what it takes to ship. Pay, then send your PRD or spec link.</p>{freeStraightAnswerAvailable() ? <p>Free for the first 5 founders. <Link href="/start?offer=readiness&src=services">Request a free review</Link>.</p> : null}<ServicePayButton source="services" path="/api/services/straight-answer/checkout" label="Pay $250"/></article>
      <article className="b2b-card" id="retainer"><span className="b2b-number">03 · Keep it running</span><h2>Monthly support retainer</h2><p className="service-price">$500<span>/month · 5 hours</span></p><p>Monitoring, small fixes and a monthly check-in. Up to 5 hours each month. Unused hours don’t roll over.</p><p>Subscribe, then tell Blake what we’re supporting and who handles access. Cancel anytime.</p><ServiceContact cancellation/><ServicePayButton source="services" path="/api/services/retainer/checkout" label="Subscribe for $500/month"/></article>
      <article className="b2b-card" id="project"><span className="b2b-number">04 · Build the agreed scope</span><h2>Small project deposit</h2><p className="service-price">50% <span>upfront · price per quote</span></p><p>A small project with a written fixed-price quote. Agree on the scope first; pay 50% upfront and the balance on delivery.</p><p>Pay the deposit from the proposal link Blake sends.</p><Link className="btn" href="/start?entry=business&src=services">Request a written quote</Link></article>
    </section>
    <section className="b2b-section"><p className="k">Proof you can open</p><h2>Five live apps. One builder.</h2><p><Link href="/shipped">See the studio’s five live apps →</Link></p><p><Link href="/work-with-us">Business owners &amp; operators →</Link> · <Link href="/work-with-me">Founders with a spec →</Link></p></section><SiteFooter/>
  </main></div>;
}
