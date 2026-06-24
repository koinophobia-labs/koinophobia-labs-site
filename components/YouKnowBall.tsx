import { ExternalLink } from "lucide-react";
import BanterBot from "@/components/BanterBot";
import { Button, Chip, Kicker, Receipt, Reveal } from "@/components/ui";
import { hasLink, link } from "@/lib/links";
import { ykbFeatures, ykbReceipts } from "@/lib/content";

function externalProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {};
}

export default function YouKnowBall() {
  const testflightSoon = !hasLink("ykbTestflight");
  const demoSoon = !hasLink("ykbDemo");
  const testflight = link("ykbTestflight");
  const demo = link("ykbDemo");

  return (
    <section
      id="products"
      className="section ykb-section"
      style={{ "--glow": "var(--orange)" } as React.CSSProperties}
      aria-labelledby="ykb-title"
    >
      <div className="split">
        <div>
          <Reveal>
            <Kicker tone="orange">Flagship product · 01</Kicker>
            <h2 id="ykb-title">
              You Know <span>Ball</span>
            </h2>
            <p className="ykb-tagline">
              Drop a take. Defend your argument. Prove you know ball.
            </p>
            <p>
              You Know Ball takes a sports take, pushes back, and turns the
              round into content. A debate AI for fans, creators, and
              communities — it makes you actually defend your opinion, then
              hands you something worth sharing.
            </p>
            <div className="chip-row">
              {["iOS archive ready", "ASC access pending", "iPhone-first", "Live web app"].map((chip) => (
                <Chip key={chip} tone="orange">
                  {chip}
                </Chip>
              ))}
            </div>
          </Reveal>
          <div className="feature-grid">
            {ykbFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.04}>
                <article className="feature-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="receipt-panel ykb-receipts">
              <header>ykb://receipts</header>
              <div>
                {ykbReceipts.map((receipt) => (
                  <Receipt key={receipt}>{receipt}</Receipt>
                ))}
              </div>
            </div>
            <div className="cta-row">
              <Button href={testflight} tone="orange" soon={testflightSoon} {...externalProps(testflight)}>
                Request You Know Ball Access
              </Button>
              <Button href={demo} tone="orange" className="btn-outline-orange" soon={demoSoon} {...externalProps(demo)}>
                Live web demo <ExternalLink size={15} />
              </Button>
            </div>
            <div className="guardrail-pill">
              NOT A SPORTSBOOK · NOT BETTING ADVICE · NOT PICKS OR PARLAYS
            </div>
          </Reveal>
        </div>
        <Reveal direction="right" className="phone-wrap">
          <BanterBot />
        </Reveal>
      </div>
    </section>
  );
}
