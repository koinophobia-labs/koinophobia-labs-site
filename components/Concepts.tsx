import Link from "next/link";
import { demoConcepts } from "@/lib/demoConcepts";
import { Reveal, SectionHead } from "@/components/ui";

export default function Concepts() {
  return (
    <section id="concepts" className="section concepts-section" aria-labelledby="concepts-title">
      <Reveal>
        <SectionHead
          kicker="Website concepts · sales assets"
          index="// BUILT_TO_SELL"
          title={
            <>
              Client Site <span className="mark">Concepts</span>.
            </>
          }
        >
          Sales-ready examples for outreach conversations. Each concept shows who the site is for,
          what it fixes, and why a founder-led build can move a local business from &quot;looks
          fine&quot; to &quot;gets contacted.&quot;
        </SectionHead>
      </Reveal>
      <Reveal>
        <div className="concept-proof-bar" aria-label="Concept section proof points">
          <span>Built for outreach</span>
          <span>Mobile-first CTA paths</span>
          <span>Problem-first copy</span>
          <span>Clearly labeled demos</span>
        </div>
      </Reveal>
      <div className="concept-grid">
        {demoConcepts.map((demo, index) => {
          const Icon = demo.icon;
          return (
            <Reveal key={demo.slug} delay={index * 0.05}>
              <article className={`concept-card concept-${demo.accent}`}>
                <div className="concept-preview" aria-hidden="true">
                  <div className="mock-browser">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mock-hero">
                    <Icon size={32} />
                    <strong>{demo.name}</strong>
                  </div>
                  <div className="mock-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="concept-body">
                  <p className="kicker kicker-cyan">{demo.label}</p>
                  <h3>{demo.name}</h3>
                  <p>{demo.cardSummary}</p>
                  <div className="concept-meta">
                    <div>
                      <span>For</span>
                      <p>{demo.audience}</p>
                    </div>
                    <div>
                      <span>Solves</span>
                      <p>{demo.problem}</p>
                    </div>
                  </div>
                  <div className="solve-box">
                    <span>Why Koinophobia Labs</span>
                    <p>{demo.hireReason}</p>
                  </div>
                  <Link className="btn btn-cyan" href={`/demos/${demo.slug}`}>
                    <span>View concept</span>
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
