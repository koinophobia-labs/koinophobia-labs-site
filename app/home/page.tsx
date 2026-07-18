import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GitBranch, IdCard, Mail, QrCode } from "lucide-react";
import { LINKS } from "@/lib/links";
import { nowSnapshot } from "@/lib/now";

// This page is the root of koinophobia.dev (rewritten from "/" for that host in
// next.config.ts). koinophobialabs.com explains the studio; this page explains Blake.

export const metadata: Metadata = {
  title: { absolute: "Blake Taylor" },
  description:
    "Chicago-based founder and product builder. I build systems that turn chaos into leverage — Career Forge, Trendi, You Know Ball, and Koinophobia Labs.",
  alternates: { canonical: "https://koinophobia.dev/" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/",
    title: "Blake Taylor — I build systems that turn chaos into leverage",
    description:
      "Chicago-based founder and product builder. Career Forge, Trendi, You Know Ball, and Koinophobia Labs — products built from lived problems.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — I build systems that turn chaos into leverage",
    description:
      "Chicago-based founder and product builder. Products built from lived problems, documented honestly.",
    images: ["https://koinophobia.dev/og-founder.png"],
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Blake Taylor",
  url: "https://koinophobia.dev",
  image: "https://koinophobia.dev/blake-portrait.jpg",
  jobTitle: "Founder & Product Builder",
  worksFor: { "@type": "Organization", name: "Koinophobia Labs", url: "https://koinophobialabs.com" },
  address: { "@type": "PostalAddress", addressLocality: "Chicago", addressRegion: "IL" },
  sameAs: [LINKS.linkedin, LINKS.github, "https://koinophobialabs.com"],
};

const systems = [
  {
    name: "Career Forge",
    origin: "Started from my own layoff.",
    body: "When my DraftKings role ended, the job search in front of me looked like pure chaos: scattered applications, no feedback loops, advice too generic to act on. I built the system I needed — positioning, applications, outreach, and interview prep as one repeatable operation. Then I kept building it for the next person in that seat.",
    status: "Live · beta",
    href: LINKS.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    name: "Trendi",
    origin: "Started from watching good ideas die before the record button.",
    body: "Most creators don't run out of ideas — they stall in the gap between having one and pressing record. Trendi is an iOS app that takes a rough thought and hands you clear words to say on camera. A coach in your pocket, not a script mill.",
    status: "iOS · TestFlight",
    href: "/trendi",
    cta: "See Trendi",
  },
  {
    name: "You Know Ball",
    origin: "Started from a lifetime of sports arguments.",
    body: "Sports takes are the most passionate opinions most of us hold, and they usually evaporate into group-chat noise. You Know Ball turns them into an actual game: stake a claim, defend it against a debate engine that knows ball, and get scored honestly — no participation trophies.",
    status: "iOS · in development",
    href: "/you-know-ball/play",
    cta: "Play the web demo",
  },
  {
    name: "Koinophobia Labs",
    origin: "The same idea, applied to other people's businesses.",
    body: "Small businesses leak time and revenue through the exact kind of friction I build against everywhere else — unclear websites, messy intake, follow-up that lives in someone's memory. The studio is where I do that work for clients. If you want to hire it, that lives on its own site.",
    status: "Open for client work",
    href: LINKS.labs,
    cta: "Visit the studio",
    external: true,
  },
];

const principles = [
  {
    title: "Find the friction first.",
    body: "The visible symptom is rarely the real problem. I look for the point where a process quietly starts costing people time, money, or nerve.",
  },
  {
    title: "Systems over willpower.",
    body: "Repeated decisions get replaced with a reliable system, so judgment is saved for the calls that actually deserve it.",
  },
  {
    title: "Honest software.",
    body: "Real status labels, documented decisions, no invented proof. If something is a concept or a work in progress, it says so.",
  },
];

export default function DevHomePage() {
  return (
    <div className="devhome">
      <div className="devhome__field" aria-hidden="true" />
      <header className="devhome__topbar">
        <span className="devhome__wordmark">koinophobia.dev</span>
        <nav className="devhome__nav" aria-label="Site">
          <a href="#systems">Work</a>
          <Link href="/now">Now</Link>
          <Link href="/resume">Résumé</Link>
          <Link href="/connect">Connect</Link>
        </nav>
      </header>

      <main>
        <section className="devhome__hero" aria-labelledby="devhome-title">
          <div className="devhome__hero-text">
            <p className="devhome__kicker">Blake Taylor · Chicago, IL</p>
            <h1 id="devhome-title">
              I build systems that turn <span>chaos into leverage.</span>
            </h1>
            <p className="devhome__lede">
              I&apos;m a founder and product builder. I spent three years inside high-volume
              sportsbook operations at DraftKings, where small process failures get expensive fast.
              In 2025 I started building my own products around that lesson, and in 2026 — after my
              role was eliminated — I stopped building around a job and went all in.
            </p>
            <p className="devhome__lede devhome__lede--secondary">
              Everything on this page started as a real problem in my own life. This site is where I
              document what I&apos;m building, why, and what it&apos;s teaching me.
            </p>
            <div className="devhome__hero-actions">
              <a className="devhome__btn" href="#systems">
                See what I&apos;m building
              </a>
              <Link className="devhome__btn devhome__btn--ghost" href="/connect">
                Connect with me
              </Link>
            </div>
          </div>
          <figure className="devhome__portrait">
            <Image
              src="/blake-portrait.jpg"
              alt="Blake Taylor in downtown Chicago"
              width={640}
              height={800}
              priority
            />
            <figcaption>Chicago, IL — founder, Koinophobia Labs</figcaption>
          </figure>
        </section>

        <section className="devhome__now" id="now" aria-labelledby="devhome-now-title">
          <div className="devhome__now-head">
            <h2 id="devhome-now-title">Right now</h2>
            <span className="devhome__now-stamp">status · July 2026</span>
          </div>
          <ul className="devhome__now-list">
            {nowSnapshot.map((entry) => (
              <li key={entry.label}>
                <span className="devhome__now-label">{entry.label}</span>
                <span className="devhome__now-line">{entry.line}</span>
              </li>
            ))}
          </ul>
          <Link className="devhome__now-more" href="/now">
            Read the full update <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </section>

        <section className="devhome__systems" id="systems" aria-labelledby="devhome-systems-title">
          <div className="devhome__section-head">
            <h2 id="devhome-systems-title">The systems</h2>
            <p>
              Four builds, one operating idea. Each one exists because I lived the problem first —
              they&apos;re evidence of how I think, not inventory.
            </p>
          </div>
          <div className="devhome__system-list">
            {systems.map((system, index) => (
              <article className="devhome__system" key={system.name}>
                <div className="devhome__system-meta">
                  <span className="devhome__system-index">0{index + 1}</span>
                  <span className="devhome__system-status">{system.status}</span>
                </div>
                <div className="devhome__system-body">
                  <h3>{system.name}</h3>
                  <p className="devhome__system-origin">{system.origin}</p>
                  <p>{system.body}</p>
                  {system.external ? (
                    <a
                      className="devhome__system-link"
                      href={system.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${system.cta} (opens in a new tab)`}
                    >
                      {system.cta} <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link className="devhome__system-link" href={system.href} aria-label={system.cta}>
                      {system.cta} <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="devhome__principles" aria-labelledby="devhome-principles-title">
          <div className="devhome__section-head">
            <h2 id="devhome-principles-title">How I operate</h2>
          </div>
          <div className="devhome__principle-grid">
            {principles.map((principle) => (
              <article key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
          <p className="devhome__texture">
            Off the clock it&apos;s hoops arguments, the gym, and anime — which explains at least one
            of the products above.
          </p>
        </section>

        <section className="devhome__connect" aria-labelledby="devhome-connect-title">
          <div className="devhome__connect-card">
            <h2 id="devhome-connect-title">Talk to me</h2>
            <p>
              Hiring, building something, or just want to compare notes on products and systems?
              I read everything that comes in.
            </p>
            <div className="devhome__connect-actions">
              <a className="devhome__btn" href={LINKS.email}>
                <Mail size={17} aria-hidden="true" /> Email me
              </a>
              <a
                className="devhome__btn devhome__btn--ghost"
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn (opens in a new tab)"
              >
                <IdCard size={17} aria-hidden="true" /> LinkedIn
              </a>
              <a
                className="devhome__btn devhome__btn--ghost"
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub (opens in a new tab)"
              >
                <GitBranch size={17} aria-hidden="true" /> GitHub
              </a>
              <Link className="devhome__btn devhome__btn--ghost" href="/connect">
                <QrCode size={17} aria-hidden="true" /> The fast card
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="devhome__footer">
        <span>koinophobia.dev — the person</span>
        <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
          koinophobialabs.com — the studio <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </div>
  );
}
