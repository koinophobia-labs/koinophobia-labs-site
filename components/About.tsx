import Image from "next/image";
import { Chip, Kicker, Reveal } from "@/components/ui";

const principles = [
  "Founder-led",
  "Built from real problems",
  "Chicago",
];

export default function About() {
  return (
    <section id="about" className="section about-section" aria-labelledby="about-title">
      <Reveal direction="left">
        <figure className="portrait">
          <Image
            src="/blake-portrait.jpg"
            alt="Blake Taylor, founder of Koinophobia Labs"
            fill
            sizes="(max-width: 900px) 78vw, 34vw"
          />
        </figure>
      </Reveal>
      <Reveal direction="right">
        <div className="about-copy">
          <Kicker tone="gold">Operator · Builder</Kicker>
          <h2 id="about-title">About</h2>
          <p>
            Hi, I&apos;m Blake Taylor, founder of Koinophobia Labs. I build practical AI
            products, websites, and automation systems for creators, local businesses,
            and people with real operational problems. My background in sports and gaming
            operations taught me how systems behave under pressure and where they tend to
            break. Now I turn those problems into useful tools that can actually ship.
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
