import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { stageLabel } from "@/lib/dev/universe";
import type { SiteProduct } from "@/lib/products";

/**
 * One template for experiment pages. Scale, stage, receipts, what's next.
 * The registry supplies status, evidence, decisions, and notYet; the page
 * adds the framing and a stat rail. Never a device frame, never a badge.
 */
export default function LabPage({
  product,
  kicker,
  h1,
  lede,
  stats,
  sections,
  primary,
  next,
}: {
  product: SiteProduct;
  kicker: string;
  h1: string;
  lede: string;
  stats: Array<{ value: string; label: string }>;
  sections: Array<{ kicker: string; title: string; body: React.ReactNode }>;
  primary?: { label: string; href: string; external?: boolean; analytics: string };
  next: string;
}) {
  const decision = product.decisions[0];
  return (
    <div className="site" data-motion-shell>
      <Masthead current="/lab" />
      <main className="shell page">
        <header className="page-head">
          <p className="k k--lab s">
            <b>Lab</b> · {kicker}
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            {h1}
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            {lede}
          </p>
          <div className="rail rail--lab s" style={{ "--i": 3 } as React.CSSProperties}>
            {stats.map((stat) => (
              <span key={stat.label}>
                <b>{stat.value}</b> {stat.label}
              </span>
            ))}
          </div>
          {primary ? (
            <div className="actions s" style={{ "--i": 4 } as React.CSSProperties}>
              {primary.external ? (
                <a className="btn btn--primary ai" href={primary.href} target="_blank" rel="noreferrer" data-analytics={primary.analytics} data-analytics-label={product.slug}>
                  {primary.label}
                </a>
              ) : (
                <Link className="btn btn--primary ai" href={primary.href} data-analytics={primary.analytics} data-analytics-label={product.slug}>
                  {primary.label}
                </Link>
              )}
            </div>
          ) : null}
        </header>

        {sections.map((section, index) => (
          <section className="sec" key={section.title} aria-labelledby={`lab-sec-${index}`}>
            <p className="k k--lab s">{section.kicker}</p>
            <h2 id={`lab-sec-${index}`} className="s" style={{ "--i": 1 } as React.CSSProperties}>
              {section.title}
            </h2>
            <div className="s" style={{ "--i": 2 } as React.CSSProperties}>
              {section.body}
            </div>
          </section>
        ))}

        {decision ? (
          <section className="sec" aria-labelledby="lab-decision">
            <p className="k k--lab s">Why it&apos;s in the lab</p>
            <h2 id="lab-decision" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              {decision.call}
            </h2>
            <p className="voice s" style={{ "--i": 2 } as React.CSSProperties}>
              &ldquo;{decision.why}&rdquo;
            </p>
          </section>
        ) : null}

        <section className="sec" aria-labelledby="lab-status">
          <p className="k k--lab s">Status</p>
          <h2 id="lab-status" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            {stageLabel[product.stage]}. Verified {product.verifiedAt}.
          </h2>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            {product.status}.
          </p>
          <ul className="notyet s" style={{ "--i": 3 } as React.CSSProperties} aria-label="Not yet">
            {product.notYet.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="evidence s" style={{ "--i": 4 } as React.CSSProperties} aria-label="Evidence">
            {product.evidence.map((item) => (
              <li key={item.claim}>
                <b>{item.claim}</b>
                {item.source}
              </li>
            ))}
          </ul>
          <p className="s" style={{ "--i": 5 } as React.CSSProperties}>
            <strong>Next.</strong> {next}
          </p>
        </section>

        <section className="sec glass" aria-labelledby="lab-end">
          <h2 id="lab-end" className="s">
            Have a strange idea of your own?
          </h2>
          <div className="actions s" style={{ "--i": 1 } as React.CSSProperties}>
            <Link className="btn btn--primary ai" href="/work-with-me">
              Work with me <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link className="btn ai" href="/lab">
              Back to the lab
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="lab-sec-0" />
    </div>
  );
}
