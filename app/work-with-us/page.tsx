import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import { BUSINESS_POSITIONING } from "@/lib/acquisition/audit-config";
import { entryValue, intakeHref, type EntryQuery } from "@/lib/acquisition/entry";
import { shippedProducts, liveAppCount } from "@/lib/products";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = { title: "Work with me", description: BUSINESS_POSITIONING, alternates: { canonical: `${STUDIO_URL}/work-with-us` } };
const problems = [
  ["Leads waiting for a reply", "Find the gaps between a new inquiry, a response, and the follow-up that should happen next."],
  ["No-shows and scheduling", "Look at booking, reminders, rescheduling, and where appointments fall through."],
  ["Copy-and-paste admin", "Find repetitive re-typing between email, forms, spreadsheets, and the tools you already use."],
  ["Quotes and invoices that wait", "Trace the delays between a request, a quote, completed work, and an invoice."],
];
export default async function WorkWithUs({ searchParams }: { searchParams: Promise<EntryQuery> }) {
  const source = entryValue((await searchParams).src) || "work-with-us";
  return <div className="site" data-motion-shell><Masthead current="/work-with-us" /><main className="shell page b2b">
    <section className="b2b-hero"><p className="k"><b>Work with me</b> · Chicago owners & operators</p><h1>Let’s find what needs fixing first.</h1>
      <p className="lede">I’m Blake Taylor. I build software and AI tools. Tell me the business problem; I’ll help you find a practical next step.</p>
      <div className="actions"><Link className="btn btn--primary" href={intakeHref(source, "audit")}>Book a Revenue Leak Audit</Link><Link className="btn" href={intakeHref(source)}>Ask a question</Link></div>
      {/* WO-0327: no approved phone/booking URL exists in the repo. Keep this inert. */}
      <div className="actions"><button className="btn" type="button" disabled aria-describedby="call-pending">Call Blake · coming soon</button></div>
      <p className="b2b-note" id="call-pending">Calls aren’t available here yet. Use “Ask a question” to get in touch.</p>
      <p className="b2b-note">Revenue Leak Audit · $250 paid upfront · <Link href={`/audit?${new URLSearchParams({ src: source })}`}>See what’s included →</Link></p>
    </section>
    <section className="b2b-section"><p className="k">The work starts here</p><h2>Where is something slipping?</h2><div className="b2b-grid">{problems.map(([title, body], i) => <article className="b2b-card" key={title}><span className="b2b-number">0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="b2b-section"><p className="k">A clear next step</p><h2>Start small. Build what’s worth building.</h2><p><Link href="/services">See services, prices &amp; checkout →</Link></p><div className="b2b-ladder">
      {[["Revenue Leak Audit", "$250", "A 45-minute call, a written plan within 7 days of the call, and a results walkthrough."], ["Small projects", "50% upfront after a written quote", "A fixed price and written scope. Pay the deposit from my proposal link, with the balance on delivery."], ["Custom software or AI systems", "By proposal", "Build around your process: an internal tool, portal, app, or automation."], ["Ongoing support", "$500/month · 5 hours", "Monitoring, small fixes and a monthly check-in. Unused hours don’t roll over. Cancel anytime."]].map(([name, price, detail], i) => <article key={name}><span className="b2b-number">0{i + 1}</span><div><h3>{name}</h3><p>{detail}</p></div><strong>{price}</strong></article>)}
    </div></section>
    <section className="b2b-section"><p className="k">Proof you can open</p><h2>{liveAppCount} shipped apps. One builder.</h2><p>These are my own products, live on the App Store.</p><div className="b2b-proof">{shippedProducts.map(app => { const slug = app.slug; return <a key={slug} href={app.appStore!.url} target="_blank" rel="noreferrer"><strong>{slug === "career-forge" ? "Way In" : slug === "forget-about-it" ? "Forget About It" : app.name}</strong><span>View on the App Store ↗</span></a>; })}</div></section>
    <section className="b2b-section b2b-close"><h2>Tell me what keeps getting delayed.</h2><p>Use the form to request an audit or ask a question. I’ll follow up to confirm fit and arrange a time.</p><div className="actions"><Link className="btn btn--primary" href={intakeHref(source, "audit")}>Book a Revenue Leak Audit</Link><Link className="btn" href={intakeHref(source)}>Ask a question</Link></div><p>Building a new product from a spec? <Link href="/work-with-me">PRD → Release for founders →</Link></p></section>
    <SiteFooter />
  </main></div>;
}
