import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, MapPin, MessageSquareText, Sparkles } from "lucide-react";
import { buildCards, founderLinks, primaryActions, reachOutReasons } from "@/lib/founderHub";

export const metadata: Metadata = {
  title: "Blake Taylor | Founder, Koinophobia Labs",
  description:
    "Chicago-based product builder creating AI-powered tools, websites, and systems for creators, local businesses, and founders.",
  openGraph: {
    title: "Blake Taylor | Founder, Koinophobia Labs",
    description:
      "Chicago-based product builder creating AI-powered tools, websites, and systems for creators, local businesses, and founders.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor | Founder, Koinophobia Labs",
    description:
      "Chicago-based product builder creating AI-powered tools, websites, and systems for creators, local businesses, and founders.",
    images: ["/og.png"],
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
              <p className="kicker kicker-gold">Founder command card</p>
              <h1 id="connect-title">Blake Taylor</h1>
              <p className="founder-role">Founder, Koinophobia Labs</p>
              <p className="founder-sub">
                Chicago-based product builder creating AI-powered tools, websites, and systems
                for creators, local businesses, and founders trying to move faster.
              </p>
              <p>
                I build practical AI tools, websites, automations, and launch systems through
                Koinophobia Labs. Right now I&apos;m focused on helping Chicago-area businesses
                find revenue leaks in their websites, while building products like Trendi,
                You Know Ball, Career Forge, and Koi Cave.
              </p>
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
                    rel={action.external ? "noreferrer" : undefined}
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
              <p className="kicker kicker-cyan">Current priority</p>
              <h2>Audit sales, useful products, career runway.</h2>
              <p>
                The best first thread is practical: a website audit, product help, or a role where
                product sense, AI tools, operations, support, and community work matter.
              </p>
            </div>
            <div className="event-card">
              <MessageSquareText size={20} aria-hidden="true" />
              <h2>Met me at an event?</h2>
              <p>
                Send me a note with where we met, what you&apos;re building, and whether
                you&apos;re looking for a website audit, product help, or a career/startup
                conversation.
              </p>
              <a className="btn btn-gold" href={founderLinks.emailWithContext}>
                <span>Email Blake</span>
              </a>
            </div>
          </aside>
        </section>

        <section className="founder-section" aria-labelledby="building-title">
          <div className="founder-section-head">
            <p className="kicker kicker-cyan">What I&apos;m building</p>
            <h2 id="building-title">Proof assets with a cash-priority funnel.</h2>
          </div>
          <div className="founder-proof-grid">
            {buildCards.map((card) => (
              <article className="founder-proof-card" key={card.title}>
                <span>{card.tag}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                {card.href ? <a href={card.href}>Open →</a> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="founder-section founder-reasons" aria-labelledby="reasons-title">
          <div className="founder-section-head">
            <p className="kicker kicker-gold">Best reasons to reach out</p>
            <h2 id="reasons-title">Clear asks beat vague networking.</h2>
          </div>
          <ul>
            {reachOutReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
