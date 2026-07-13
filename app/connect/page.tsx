import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, MapPin, MessageSquareText, Sparkles } from "lucide-react";
import { buildCards, founderLinks, primaryActions, reachOutReasons } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "Blake Taylor — Founder, Koinophobia Labs",
  description: "Blake builds systems that turn messy, high-friction work into clear, repeatable leverage.",
  alternates: { canonical: "https://koinophobia.dev/connect" },
  openGraph: {
    title: "Blake Taylor — Founder, Koinophobia Labs",
    description: "Products, websites, and workflows built around leverage through better systems.",
    url: "https://koinophobia.dev/connect",
    images: [{ url: "/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — Founder, Koinophobia Labs",
    description: "Products, websites, and workflows built around leverage through better systems.",
    images: ["/og-founder.png"],
  },
};

export default function ConnectPage() {
  return (
    <>
      <div className="page-field founder-field" aria-hidden="true" />
      <main className="founder-page">
        <section className="founder-shell" aria-labelledby="connect-title">
          <div className="founder-card">
            <div className="founder-ambient-koi" aria-hidden="true">
              <Image src="/koi-mark.png" alt="" width={320} height={320} priority />
            </div>

            <header className="founder-header">
              <a className="founder-brand" href="https://koinophobialabs.com">
                <span className="brand-mark"><Image src="/koi-mark.png" alt="" width={32} height={32} priority /></span>
                <span>Koinophobia Labs / Blake Taylor</span>
              </a>
              <span className="founder-location"><MapPin size={15} aria-hidden="true" />Chicago, IL</span>
            </header>

            <div className="founder-hero">
              <div className="founder-hero-text">
                <p className="kicker kicker-gold">Founder · operator · product builder</p>
                <h1 id="connect-title">Blake Taylor</h1>
                <p className="founder-role">I build systems that create leverage.</p>
                <p className="founder-sub">
                  My background is in operations, customer experience, and trust-heavy environments where small process improvements matter. Koinophobia Labs turns that mindset into products, websites, and workflows.
                </p>
                <p className="founder-intro">
                  Different problems, same move: find the friction, replace repeated decisions with a reliable system, and give people more room for judgment.
                </p>
              </div>
              <figure className="founder-portrait">
                <Image src="/blake-portrait.jpg" width={640} height={800} priority alt="Blake Taylor, founder of Koinophobia Labs" />
                <figcaption aria-hidden="true">Operator · Founder · Builder</figcaption>
              </figure>
            </div>

            <nav className="founder-actions" aria-label="Connect with Blake">
              {primaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a key={action.label} className={`founder-action founder-action-${action.tone}`} href={action.href} target={action.external ? "_blank" : undefined} rel={action.external ? "noopener noreferrer" : undefined} aria-label={action.external ? `${action.label} (opens in a new tab)` : action.label}>
                    <Icon size={19} aria-hidden="true" /><span>{action.label}</span><ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                );
              })}
            </nav>
          </div>

          <aside className="founder-side" aria-label="Fast context">
            <div className="signal-card">
              <Sparkles size={20} aria-hidden="true" />
              <p className="kicker kicker-cyan">The operating idea</p>
              <h2>Turn high-friction work into repeatable leverage.</h2>
              <p>That throughline connects the studio’s products, client work, and Blake’s operating background.</p>
              <ul className="founder-focus-list">{reachOutReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
            <div className="event-card">
              <MessageSquareText size={20} aria-hidden="true" />
              <p className="kicker kicker-gold">Start a conversation</p>
              <h2>Have a role, product, or tangled workflow in mind?</h2>
              <p>Send a quick note with what you are building, hiring for, or trying to make easier.</p>
              <a className="btn btn-gold" href={founderLinks.emailWithContext}><span>Email Blake</span></a>
            </div>
          </aside>
        </section>

        <section className="founder-section" aria-labelledby="building-title">
          <div className="founder-section-head">
            <p className="kicker kicker-cyan">Applications of the systems mindset</p>
            <h2 id="building-title">One operating idea, expressed through different work.</h2>
          </div>
          <div className="founder-proof-grid">
            {buildCards.map((card) => (
              <article className="founder-proof-card" key={card.title}>
                <span>{card.tag}</span><h3>{card.title}</h3><p>{card.body}</p>
                <a href={card.href} target={card.external ? "_blank" : undefined} rel={card.external ? "noopener noreferrer" : undefined} aria-label={card.external ? `${card.cta} (opens in a new tab)` : card.cta}>
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
