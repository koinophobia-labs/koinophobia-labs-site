import { CheckCircle2, CircleSlash2, Handshake, ShieldCheck } from "lucide-react";
import {
  betaOfferPoints,
  clientFaqs,
  goodFitItems,
  notFitItems,
  websiteBuildIncludes,
  whyKoinophobia,
} from "@/lib/content";
import { Button, Kicker, Reveal, SectionHead } from "@/components/ui";

export default function ClientTrust() {
  return (
    <section className="section trust-section" aria-labelledby="trust-title">
      <Reveal>
        <SectionHead
          kicker="Founder-led · Clear scope"
          index="// TRUST_AND_SCOPE"
          title={
            <>
              Built like a <span className="mark">real project</span>, not a vague agency pitch.
            </>
          }
        >
          For small business owners who need a sharper web presence, clear expectations, and a
          builder they can actually talk to.
        </SectionHead>
      </Reveal>

      <Reveal>
        <div className="trust-panel panel">
          <div>
            <Kicker tone="gold">Why work with Koinophobia Labs</Kicker>
            <h3 id="trust-title">Direct, practical, founder-led builds.</h3>
          </div>
          <div className="trust-grid">
            {whyKoinophobia.map((item) => (
              <article key={item.title} className="trust-card">
                <CheckCircle2 size={17} aria-hidden="true" />
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="scope-grid">
        <Reveal>
          <article className="scope-card panel">
            <Kicker tone="cyan">What&apos;s included</Kicker>
            <h3>Website builds come with the basics owners actually need.</h3>
            <ul className="included-list">
              {websiteBuildIncludes.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal delay={0.04}>
          <article className="scope-card beta-card panel">
            <Kicker tone="gold">First client / beta offer</Kicker>
            <h3>Early local client builds are available now.</h3>
            <ul className="included-list">
              {betaOfferPoints.map((item) => (
                <li key={item}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="trust-actions">
              <Button href="#contact" tone="gold">
                Request a build estimate
              </Button>
              <a href="#contact">Send your current site or Instagram</a>
            </div>
          </article>
        </Reveal>
      </div>

      <div className="fit-grid">
        <Reveal>
          <article className="fit-card panel">
            <Handshake size={22} aria-hidden="true" />
            <h3>Good fit</h3>
            <ul>
              {goodFitItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </Reveal>
        <Reveal delay={0.04}>
          <article className="fit-card panel fit-card-muted">
            <CircleSlash2 size={22} aria-hidden="true" />
            <h3>Not a fit</h3>
            <ul>
              {notFitItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </Reveal>
      </div>

      <Reveal>
        <div className="faq-panel panel">
          <div>
            <Kicker tone="cyan">FAQ</Kicker>
            <h3>Plain answers before you reach out.</h3>
            <p>
              No fake agency posture, no mystery process, and no surprise automation added to your
              business.
            </p>
          </div>
          <div className="faq-grid">
            {clientFaqs.map((item) => (
              <article key={item.question} className="faq-item">
                <h4>{item.question}</h4>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
