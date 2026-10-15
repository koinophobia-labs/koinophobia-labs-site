import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import { auditCheckoutAvailable } from "@/lib/acquisition/audit-checkout";
import AuditPayButton from "@/components/site/AuditPayButton";
export const dynamic = "force-dynamic";
import { entryValue, intakeHref, type EntryQuery } from "@/lib/acquisition/entry";
import { STUDIO_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "Revenue Leak Audit · $250", description: "A 45-minute call and a written plan within 7 days: find gaps in leads, follow-ups, scheduling, quoting, invoicing, and admin.", alternates: { canonical: `${STUDIO_URL}/audit` } };
const faq = [
  ["Who is this for?", "Chicago small and mid-size businesses where leads, appointments, quotes, or repeat business drive revenue. It suits owners and operators who can point to a process that feels slow or unreliable."],
  ["Do I need to prepare anything?", "After payment, you receive a short intake about your business, how inquiries arrive, your tools, and the repetitive work taking up time. Rough numbers and ‘not sure’ are useful answers."],
  ["Do you need my passwords?", "No. Blake reviews public information and what you choose to show on the call. Use a screen share instead of sharing logins. A test inquiry is sent only with your permission."],
  ["Will this guarantee more revenue?", "No. Impact ranges use your own numbers where available and are labelled ‘Estimate, not a guarantee.’ Where the numbers are missing, the plan says so and focuses on time instead."],
  ["Do I have to hire the studio to build the fixes?", "No. You keep the report and can implement it yourself or take it to your current vendor. Any implementation by Koinophobia Labs is quoted separately."],
  ["What if I have an idea rather than an operating business?", "The founder path, PRD → Release, is a better starting point for a new product or a spec."],
];
export default async function Audit({ searchParams }: { searchParams: Promise<EntryQuery> }) {
 const checkoutAvailable = auditCheckoutAvailable();
 const source = entryValue((await searchParams).src) || "audit";
 return <div className="site" data-motion-shell><Masthead current="/work-with-us"/><main className="shell page b2b">
  <section className="b2b-hero"><p className="k"><b>Revenue Leak Audit</b> · Chicago businesses</p><h1>Find the gaps.<br/>Leave with a plan.</h1><p className="lede">Find where leads, follow-ups, scheduling, quoting, invoicing, and admin are slipping. Get a written plan with the quick wins first.</p><p className="b2b-price">$250 <span>paid upfront · one location or service line</span></p><div className="actions">{checkoutAvailable ? <AuditPayButton source={source}/> : <Link className="btn btn--primary" href={intakeHref(source, "audit")}>Request a Revenue Leak Audit</Link>}<Link className="btn" href={intakeHref(source)}>Ask a question</Link></div><p className="b2b-note">{checkoutAvailable ? "Pay securely through Stripe, then send your preferred call times. Blake will email you to confirm a call time." : "Request an audit through the form. Blake will confirm fit, arrange payment, and agree a call time with you."}</p></section>
  <section className="b2b-section"><p className="k">Who it helps</p><h2>Busy, but something’s slipping.</h2><p className="lede">For owners and operators of Chicago service businesses, shops, and studios with leads to answer, appointments to book, quotes to send, or data to re-type.</p><p>Start with one business location or one service line. A new product idea? <Link href="/work-with-me">Use the founder path →</Link></p></section>
  <section className="b2b-section"><p className="k">How it works</p><h2>A conversation. Evidence. Priorities.</h2><div className="b2b-grid">
   {[["01", "Intake & review", "Pay $250 upfront, then answer a short intake. Blake reviews your public website, business profile, booking or contact path, and the context you share."], ["02", "45-minute discovery call", "Walk through how an inquiry becomes paid work and where repetitive admin gets in the way. Aim to book within about 5 business days of payment, subject to both calendars."], ["03", "Written plan within 7 days", "Within 7 days of the call, receive your Revenue Leak Report as a PDF: evidence, priorities, quick wins, and estimated impact."], ["04", "30-minute results call", "Walk through the plan and ask questions within a few days of delivery. Decide what to do yourself, with your vendor, or with the studio."]].map(([n, title, body]) => <article className="b2b-card" key={n}><span className="b2b-number">{n}</span><h3>{title}</h3><p>{body}</p></article>)}
  </div></section>
  <section className="b2b-section"><p className="k">Yours to keep</p><h2>A useful written plan.</h2><ul className="b2b-list"><li>A map of how a lead becomes a customer today.</li><li>Findings across response time, follow-up, scheduling, data entry, quoting and invoicing, review requests, website conversion, admin, and reporting.</li><li>Prioritized leaks with evidence, proposed fixes, and effort.</li><li>Quick wins for the next two weeks and a 30 / 60 / 90-day plan.</li><li>Estimated impact ranges, with assumptions and missing information made clear.</li><li>Next-step options, whoever does the implementation.</li></ul></section>
  <section className="b2b-section"><p className="k">The boundary</p><h2>What’s excluded</h2><p>Implementation, paid tools, and ad spend are separate. This is not a financial, tax, legal, accounting, compliance, IT-security, or penetration-test audit. It does not promise revenue or savings, and it does not require access to passwords or admin accounts.</p></section>
  <section className="b2b-section"><h2>Questions before you start</h2><div className="b2b-faq">{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
  <section className="b2b-section b2b-close"><h2>Start with the process that needs attention.</h2><div className="actions">{checkoutAvailable ? <AuditPayButton source={source}/> : <Link className="btn btn--primary" href={intakeHref(source, "audit")}>Request a Revenue Leak Audit</Link>}<Link className="btn" href={intakeHref(source)}>Ask a question</Link></div><p><Link href={`/work-with-us?${new URLSearchParams({ src: source })}`}>Explore the full offer ladder →</Link></p></section><SiteFooter/>
 </main></div>;
}
