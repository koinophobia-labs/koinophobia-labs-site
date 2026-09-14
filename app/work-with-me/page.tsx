import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { LINKS } from "@/lib/links";
import { engagementShapes, engagementTerms, replyPromise } from "@/lib/products";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Work with Koinophobia Labs",
  description:
    "Hire the studio that shipped Trendi, Forget About It, and Way In. Native Apple apps, working prototypes, and AI features with a deterministic frame. Fixed price, in writing, before anything is built.",
  alternates: { canonical: `${STUDIO_URL}/work-with-me` },
  openGraph: { url: `${STUDIO_URL}/work-with-me`, title: "Work with Koinophobia Labs" },
};

const steps = [
  { title: "You write two paragraphs.", body: "What you want to exist, what exists today, when you need it." },
  { title: `Blake replies ${replyPromise}.`, body: "With a real answer: a scope, a question, or “not yet.”" },
  { title: "A fixed price and a written scope.", body: "Before anything is built. Revision rounds and the support window are in it." },
  { title: "Working software every week.", body: "On your device, not in a deck." },
  { title: "Handoff.", body: "You own the code, the accounts, and the listing." },
];

export default function WorkWithMePage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s">
            <b>Hire the studio</b>
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Hire the studio that shipped three apps this summer.
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Koinophobia Labs takes on a small number of outside projects. Every one runs through
            the same pipeline as the studio&apos;s own products, with the same rule: it isn&apos;t
            done until it&apos;s on a device and the claims are true.
          </p>
          <div className="actions s" style={{ "--i": 3 } as React.CSSProperties}>
            <Link className="btn btn--primary ai" href="/start" data-analytics="inquiry_start" data-analytics-label="work_with_me_top">
              Start a project <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="sec" aria-labelledby="shapes-title">
          <p className="k s">Three shapes</p>
          <h2 id="shapes-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Each one backed by something already shipped.
          </h2>
          <div className="shapes">
            {engagementShapes.map((shape, index) => (
              <div className="shape glass s" key={shape.slug} style={{ "--i": index } as React.CSSProperties} data-analytics-view={`engagement_shape_view_${shape.slug}`}>
                <h3>{shape.title}</h3>
                <p>{shape.body}</p>
                <span className="shape__t">{shape.timeline}</span>
                <span className="shape__proof">{shape.proof}</span>
              </div>
            ))}
          </div>
          <p className="lede s" style={{ "--i": 3 } as React.CSSProperties}>
            Also in scope when it fits: a site with a point of view (this one), a product film with
            real screens, an experimental interface, automation that removes a job nobody wanted.
          </p>
        </section>

        <section className="sec" aria-labelledby="how-title">
          <p className="k s">How it works</p>
          <h2 id="how-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Five steps, no surprises.
          </h2>
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

        <section className="sec" aria-labelledby="cost-title">
          <p className="k s">What it costs</p>
          <h2 id="cost-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Priced once, in writing.
          </h2>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Prototypes start in the low thousands. App builds are scoped individually and priced
            once, before development. If the honest answer is that you don&apos;t need a studio
            yet, you&apos;ll get that answer for free.
          </p>
          <div className="rail s" style={{ "--i": 3 } as React.CSSProperties}>
            {engagementTerms.map((term) => (
              <span key={term.title}>
                <b>{term.title}</b> {term.body}
              </span>
            ))}
          </div>
          <p className="s" style={{ "--i": 4 } as React.CSSProperties}>
            Scope, price, timeline, and revision rounds are agreed before development. The
            post-launch support window is defined in the scope. Third-party costs, accounts, and
            domains are documented before launch. No open-ended retainers unless the system
            genuinely needs one.
          </p>
        </section>

        <section className="sec glass" id="work-end" aria-labelledby="end-title">
          <h2 id="end-title" className="s">
            Tell me the idea.
          </h2>
          <div className="actions s" style={{ "--i": 1 } as React.CSSProperties}>
            <Link className="btn btn--primary btn--grand ai" href="/start" data-analytics="inquiry_start" data-analytics-label="work_with_me">
              Start a project <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a className="btn ai" href={`${LINKS.email}?subject=Project%20idea`} data-analytics="founder_link_click" data-analytics-label="email">
              Email Blake instead
            </a>
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="shapes-title" before="work-end" />
    </div>
  );
}
