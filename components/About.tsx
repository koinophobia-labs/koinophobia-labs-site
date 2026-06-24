import Image from "next/image";
import { Chip, Kicker, Reveal } from "@/components/ui";

const principles = [
  "Founder-led",
  "Operator mindset",
  "Builds from real problems",
  "Social entrepreneurship",
  "AI for leverage",
];

export default function About() {
  return (
    <section id="about" className="section about-section" aria-labelledby="about-title">
      <Reveal direction="left">
        <div className="portrait" role="img" aria-label="Portrait placeholder for Blake Taylor">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
          <Image src="/koi-mark.png" width={96} height={96} alt="" />
          <strong>OPERATOR · FOUNDER · BUILDER</strong>
        </div>
      </Reveal>
      <Reveal direction="right">
        <div className="about-copy">
          <Kicker tone="gold">Operator · Builder</Kicker>
          <h2 id="about-title">About</h2>
          <p>
            I&apos;ve worked around systems, people, sports conversations, and
            operational chaos. Now I build tools from that.
          </p>
          <p>
            Blake Taylor&apos;s background runs through sports and gaming operations
            — high-tempo, high-pressure rooms where you learn how real systems
            work and exactly where they break. That turned into building:
            creator systems, AI products, and the operating tools underneath
            them.
          </p>
          <p>
            Koinophobia Labs is the result — a one-person product lab using AI
            to create leverage and ship faster, grounded in social
            entrepreneurship: build useful things, from real problems, that give
            people an edge. The name says it — koinophobia, the fear of being
            ordinary.
          </p>
          <div className="chip-row">
            {principles.map((principle) => (
              <Chip key={principle} tone="cyan">
                {principle}
              </Chip>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
