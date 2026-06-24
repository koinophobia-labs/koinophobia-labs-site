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
    </section>
  );
}
