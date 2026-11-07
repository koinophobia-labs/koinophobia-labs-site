import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import { STUDIO_URL, socialCard } from "@/lib/seo";

const headline = "Something on your site is quietly costing you customers.";
const description = "A Chicago developer finds and fixes the specific things quietly costing your website customers — flat $299 per fix, usually done in a couple of days.";
const recordingHref = "mailto:blake@koinophobialabs.com?subject=Website%20fix%20—%20free%202-min%20recording&body=Hi%20Blake%2C%20here's%20my%20website%3A%20";
const questionHref = "mailto:blake@koinophobialabs.com?subject=Website%20fix%20question";

export const metadata: Metadata = {
  title: "$299 Website Fixes (Chicago)",
  description,
  alternates: { canonical: `${STUDIO_URL}/fix` },
  openGraph: { url: `${STUDIO_URL}/fix`, title: headline, description, images: [socialCard(headline, "$299 Website Fixes · Chicago")] },
  twitter: { title: headline, description, images: [socialCard(headline, "$299 Website Fixes · Chicago")] },
};

const stats = [
  { title: "One fix", body: "Flat $299 — no packages, no retainer." },
  { title: "~2 days", body: "Start to done, most of the time." },
  { title: "Free first", body: "A 2-min recording before you pay." },
];

const fixes = [
  { title: "Broken or silent contact forms", body: "Inquiries that vanish instead of reaching you." },
  { title: "Dead or misrouted links & buttons", body: '"Book Now" / "Contact" that go nowhere or to the wrong place.' },
  { title: "Security-certificate errors", body: 'The "not secure" warning that turns people away before the page loads.' },
  { title: "Leftover placeholder & template text", body: '"Lorem ipsum" and demo copy sitting on a live page.' },
  { title: "Wrong-destination calls-to-action", body: "Your most important button pointing at the wrong page." },
];

const steps = [
  { title: "You send your site", body: "One link. That's all I need to start looking." },
  { title: "I send a free 2-minute recording", body: "You see exactly what's wrong and what I'd do — before you pay anything." },
  { title: "I fix it for a flat $299", body: "Usually within a couple of days, with a recording confirming it works." },
];

export default function FixPage() {
  return (
    <div className="site studio-offer" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s"><b>Website fixes for Chicago owners &amp; operators</b></p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>{headline}</h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            A broken form, a dead button, a security warning, leftover placeholder text — you don&apos;t see it because you don&apos;t visit your own site the way a customer does. I find it, and I fix it.
          </p>
          <p className="k s"><b>Flat $299</b> · one fix · usually ~2 days</p>
          <div className="actions s" style={{ "--i": 3 } as React.CSSProperties}>
            <a className="btn btn--primary ai" href={recordingHref}>
              Get a free 2-min recording <ArrowRight size={15} aria-hidden="true" />
            </a>
            <a className="btn ai" href={questionHref}>
              Ask a question <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="pblocks" aria-label="The offer at a glance">
            {stats.map((stat) => (
              <div className="pblock s" key={stat.title}>
                <p className="k"><b>{stat.title}</b></p>
                <p>{stat.body}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="sec" aria-labelledby="fixes-title">
          <p className="k s">What I fix</p>
          <h2 id="fixes-title" className="s">Specific, money-losing problems — not a redesign.</h2>
          <ul className="pblocks" style={{ listStyle: "none", padding: 0 }}>
            {fixes.map((fix) => (
              <li className="pblock s" key={fix.title}>
                <h3>{fix.title}</h3>
                <p>{fix.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sec" aria-labelledby="how-title">
          <p className="k s">How it works</p>
          <h2 id="how-title" className="s">Three steps. No commitment to start.</h2>
          <ol className="pblocks" style={{ listStyle: "none", padding: 0 }}>
            {steps.map((step, index) => (
              <li className="pblock s" key={step.title} style={{ "--i": index } as React.CSSProperties}>
                <span className="k">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec" aria-labelledby="proof-title">
          <p className="k s">Proof</p>
          <h2 id="proof-title" className="s">Real fixes, shown.</h2>
          <div className="glass s">
            <p>Before / after examples go here — the actual issue and the resolution. (Added after the first job.)</p>
          </div>
        </section>

        <section className="sec" aria-labelledby="who-title">
          <p className="k s">Who you&apos;re working with</p>
          <h2 id="who-title" className="s">Blake Taylor — Koinophobia Labs.</h2>
          <p className="lede s">A one-person software studio in Chicago, building apps, websites, and AI tools from prototype to release. Direct, local, fast — you work with the person doing the work.</p>
        </section>

        <section className="sec glass" aria-labelledby="end-title">
          <p className="k s">Start here</p>
          <h2 id="end-title" className="s">Want to see what&apos;s costing you?</h2>
          <p className="lede s">Send your site and I&apos;ll record exactly what I find — free, no obligation.</p>
          <div className="actions s">
            <a className="btn btn--primary ai" href={recordingHref}>
              Get my free recording <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
