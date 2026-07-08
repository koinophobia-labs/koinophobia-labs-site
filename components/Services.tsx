import { services } from "@/lib/content";
import { Button, Reveal, SectionHead } from "@/components/ui";

export default function Services() {
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <Reveal>
        <SectionHead
          kicker="Open for builds · Services"
          index="// WORK_WITH_ME"
          title={
            <>
              Work with <span className="mark">me</span>.
            </>
          }
        >
          Practical builds, productized. Pick what you need shipped — every
          engagement starts with the problem, not a pitch deck.
        </SectionHead>
      </Reveal>
      <div className="services-grid">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Reveal key={service.name} delay={index * 0.04}>
              <article className="service-card">
                <Icon size={24} aria-hidden="true" />
                <h3>{service.name}</h3>
                <p>
                  <strong>Problem:</strong> {service.problem}
                </p>
                <p>
                  <strong>You get:</strong> {service.get}
                </p>
                <p>
                  <strong>Best for:</strong> {service.best}
                </p>
                <a href="#contact">Request a build estimate →</a>
              </article>
            </Reveal>
          );
        })}
      </div>
      <Reveal>
        <div className="cta-bar">
          <div>
            <h3>Not sure which one you need?</h3>
            <p>
              Send your current site or Instagram. I&apos;ll tell you what I&apos;d
              improve first and whether a build makes sense.
            </p>
          </div>
          <Button href="#contact" tone="gold">
            Ask what I&apos;d improve first
          </Button>
        </div>
      </Reveal>
      <Reveal>
        <article id="career-forge" className="service-card" aria-labelledby="career-forge-title">
          <p className="kicker kicker-gold">Career Forge · Resume Rebuild</p>
          <h3 id="career-forge-title">Career Forge — Resume Rebuild</h3>
          <p>
            <strong>For people with real experience who struggle to explain how it transfers.</strong>
          </p>
          <p>
            You have done the work. The problem is your resume does not say that clearly enough for
            the roles you actually want. Career Forge takes your real work history, diagnoses what
            is landing wrong, and rebuilds it accurately, specifically, and without inflating
            anything you did not do.
          </p>
          <p>
            <strong>What you get:</strong>
          </p>
          <ul>
            <li>Resume diagnostic — what is not working and why</li>
            <li>Rebuilt resume — accurate, role-aware, no invented metrics</li>
            <li>Stronger professional summary</li>
            <li>LinkedIn headline</li>
            <li>3 target role directions based on your real background</li>
            <li>5-minute Loom walkthrough of every change made</li>
            <li>One revision round</li>
            <li>48-hour turnaround after payment and intake</li>
          </ul>
          <p>
            <strong>Price:</strong> $149 flat. No subscription. No upsell.
          </p>
          <div className="cta-row">
            <Button href="#contact" tone="gold">
              Request a Career Forge Resume Rebuild →
            </Button>
          </div>
          <p>
            No fake credentials, no inflated titles, no job guarantees. If your experience does not
            match the role, I will tell you that too.
          </p>
        </article>
      </Reveal>
    </section>
  );
}
