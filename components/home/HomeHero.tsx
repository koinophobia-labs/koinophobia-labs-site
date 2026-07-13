import Link from "next/link";
import Image from "next/image";

export default function HomeHero() {
  return (
    <header className="kl-hero">
      <div className="kl-hero__inner">
        <div className="kl-hero__copy">
          <p className="kl-eyebrow">
            Koinophobia Labs — a founder-led studio in Chicago.
          </p>
          <h1 className="kl-hero__h1">Tools that give people leverage.</h1>
          <p className="kl-hero__sub">
            Websites that convert, workflows that remove real work, and products
            people actually use — for founders, creators, and small teams.
            Founder-led: you work directly with the person who builds and ships.
          </p>
          <div className="kl-cta-row">
            <Link className="kl-btn kl-btn--primary" href="/audit">
              Get a Revenue Leak Audit
            </Link>
            <a className="kl-link" href="#work">
              See the work →
            </a>
          </div>
          <div className="kl-signature">
            <span className="kl-rule-gold" aria-hidden="true" />
            <span className="kl-mono">BLAKE TAYLOR · FOUNDER · CHICAGO, IL</span>
          </div>
        </div>

        <div className="kl-hero__portrait">
          <Image
            src="/blake-portrait.jpg"
            alt="Blake Taylor, founder of Koinophobia Labs"
            fill
            priority
            sizes="(max-width: 1000px) 100vw, 440px"
          />
        </div>
      </div>
    </header>
  );
}
