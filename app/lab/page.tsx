import type { Metadata } from "next";
import { LabCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { experiments } from "@/lib/dev/lab";
import { labProducts } from "@/lib/products";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Lab",
  description:
    "Experiments at their real stage: a K–12 curriculum engine, a language model trained from random weights, a sports-argument game, and the small machines that keep the studio honest.",
  alternates: { canonical: `${STUDIO_URL}/lab` },
  openGraph: { url: `${STUDIO_URL}/lab`, title: "The Lab · Koinophobia Labs" },
};

/** Visitor-facing names for the six small machines already in lab.ts. */
const machineNames: Record<string, string> = {
  "The koi": "The koi",
  "Debate tournament harness": "Debate tournament harness",
  "Claims gate": "Claims gate",
  "Contrast checker": "Contrast checker",
  "Release-truth audit": "Release-truth audit",
  "Headless UI puppet": "Headless UI puppet",
};

export default function LabPage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k k--lab s">
            <b>The lab</b> · experiments with receipts
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Small machines and large bets, at their real stage.
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Everything here has receipts and none of it is finished. The dates are the point.
          </p>
        </header>

        <section className="lab-list" aria-label="Experiments">
          {labProducts.map((product, index) => (
            <LabCard key={product.slug} product={product} index={index} />
          ))}
        </section>

        <section className="sec" aria-labelledby="machines-title">
          <p className="k k--lab s">
            <b>Small machines</b> · built to answer one question
          </p>
          <h2 id="machines-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            The tools that keep the studio honest.
          </h2>
          <div className="lab-list">
            {experiments.map((experiment, index) => (
              <article className="lcard s" key={experiment.name} style={{ "--i": index } as React.CSSProperties}>
                <span className="lcard__top">
                  <h3>{machineNames[experiment.name] ?? experiment.name}</h3>
                  <span className="chip chip--lab">{experiment.kind.split(" · ")[0]}</span>
                </span>
                <p>{experiment.body}</p>
                <p>
                  <strong>Finding.</strong> {experiment.finding}
                </p>
                {experiment.live ? <span className="receipt receipt--lab">{experiment.live}</span> : null}
              </article>
            ))}
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="machines-title" />
    </div>
  );
}
