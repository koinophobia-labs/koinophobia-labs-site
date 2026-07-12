import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, MapPin, MessageSquareText, Sparkles } from "lucide-react";
import { buildCards, founderLinks, primaryActions, reachOutReasons } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "Blake Taylor — Founder, Koinophobia Labs",
  description: "Blake builds AI products, websites, and automation systems in Chicago.",
  alternates: {
    canonical: "https://koinophobia.dev/connect",
  },
  openGraph: {
    title: "Blake Taylor — Founder, Koinophobia Labs",
    description: "Blake builds AI products, websites, and automation systems in Chicago.",
    url: "https://koinophobia.dev/connect",
    images: [{ url: "/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — Founder, Koinophobia Labs",
    description: "Blake builds AI products, websites, and automation systems in Chicago.",
    images: ["/og-founder.png"],
  },
};

export default function ConnectPage() {
  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <main className="founder-page">
        <section className="founder-shell" aria-labelledby="connect-title">
          <div className="founder-card">
            <header className="founder-header">
              <a className="founder-brand" href="https://koinophobialabs.com">
                <span className="brand-mark">
                  <Image src="/koi-mark.png" alt="" width={32} height={32} priority />
                </span>
                <span>Koinophobia Labs</span>
              </a>
              <span className="founder-location">
                <MapPin size={15} aria-hidden="true" />
                Chicago, IL
              </span>
            </header>

            <div className="founder-hero">
              <div className="founder-hero-text">
                <p className="kicker kicker-gold">Founder · builder</p>
                <h1 id="connect-title">Blake Taylor</h1>
                <p className="founder-role">Founder, Koinophobia Labs</p>
                <p className="founder-sub">
                  I build AI products, websites, and automation systems in Chicago.
                </p>
                <p className="founder-intro">
                  Founder-led work focused on turning real problems and messy workflows into
                  useful, shipped software.
                </p>
              </div>
              <figure className="founder-portrait">
                <Image
                  src="/blake-portrait.jpg"
                  width={640}
                  height={800}
                  priority
                  alt="Blake Taylor, founder of Koinophobia Labs"
                />
                <figcaption aria-hidden="true">Operator · Founder · Builder</figcaption>
              </figure>
            </div>

            <nav className="founder-actions" aria-label="Connect with Blake">
              {primaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.label}
                    className={`founder-action founder-action-${action.tone}`}
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noopener noreferrer" : undefined}
                    aria-label={
                      action.external ? `${action.label} (opens in a new tab)` : action.label
                    }
                  >
                    <Icon size={19} aria-hidden="true" />
                    <span>{action.label}</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                );
              })}
            </nav>
          </div>

          <aside className="founder-side" aria-label="Fast context">
            <div className="signal-card">
              <Sparkles size={20} aria-hidden="true" />
              <p className="kicker kicker-cyan">Fast context</p>
              <h2>Useful software, built from real problems.</h2>
              <p>
                Blake works across product, AI, web, operations, and customer-facing systems.
              </p>
              <ul className="founder-focus-list">
                {reachOutReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            <div className="event-card">
              <MessageSquareText size={20} aria-hidden="true" />
              <p className="kicker kicker-gold">Start a conversation</p>
              <h2>Have a role, product, or collaboration in mind?</h2>
              <p>
                Send a quick note with what you&apos;re building, hiring for, or trying to improve.
              </p>
              <a className="btn btn-gold" href={founderLinks.emailWithContext}>
                <span>Email Blake</span>
              </a>
            </div>
          </aside>
        </section>

        <section className="founder-section" aria-labelledby="building-title">
          <div className="founder-section-head">
            <p className="kicker kicker-cyan">Selected work</p>
            <h2 id="building-title">See what Blake is building.</h2>
          </div>
          <div className="founder-proof-grid">
            {buildCards.map((card) => (
              <article className="founder-proof-card" key={card.title}>
                <span>{card.tag}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <a
                  href={card.href}
                  target={card.external ? "_blank" : undefined}
                  rel={card.external ? "noopener noreferrer" : undefined}
                  aria-label={
                    card.external ? `${card.cta} (opens in a new tab)` : card.cta
                  }
                >
                  {card.cta} <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
