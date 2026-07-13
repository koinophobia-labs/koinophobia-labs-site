import { CheckCircle2 } from "lucide-react";
import DeckConsole from "@/components/DeckConsole";
import { Button, Kicker, Mark, Reveal } from "@/components/ui";
import { heroProof } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="hero section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <Reveal>
          <Kicker tone="gold">KOINOPHOBIA LABS · AI PRODUCT LAB</Kicker>
          <h1 id="hero-title">
            I build systems, products, and <Mark>proof</Mark>.
          </h1>
          <p className="hero-sub">
            Koinophobia Labs is a founder-led AI product lab — building AI
            products, creator systems, and command centers for real workflows.
            Built, tested, shipped. Featured product: Trendi.
          </p>
          <div className="cta-row">
            <Button href="#products" tone="gold">
              View Products
            </Button>
            <Button href="#contact" tone="cyan">
              Work With Me
            </Button>
          </div>
          <div className="brand-tags" aria-label="Brand tags">
            <span>Founder-led</span>
            <span>Operator mindset</span>
            <span>Ship useful software</span>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="proof-strip" aria-label="Proof highlights">
            {heroProof.map((item) => (
              <span key={item}>
                <CheckCircle2 size={15} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal className="hero-console" direction="right" delay={0.14}>
        <DeckConsole />
      </Reveal>
    </section>
  );
}
