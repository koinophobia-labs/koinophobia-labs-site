import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GitBranch, IdCard, Mail, QrCode } from "lucide-react";
import { LINKS } from "@/lib/links";
import { nowLastUpdated, nowSnapshot } from "@/lib/now";
import { publishedNotes } from "@/lib/dev/lab";
import { products, reachLabel } from "@/lib/dev/universe";
import PersonalKoi from "@/components/dev-koi/PersonalKoi";

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

// Rendered from lib/dev/universe.ts so the home page cannot describe a product
// differently from the product's own page. Origins stay here because they're
// the homepage's job — one line on why the thing exists at all.
const origins: Record<string, string> = {
  "career-forge": "Started from my own layoff.",
  trendi: "Started from watching good ideas die before the record button.",
  "you-know-ball": "Started from a lifetime of sports arguments.",
  "koi-cave": "Started from not wanting to rent my own context back.",
};

const systems = products.map((product) => ({
  name: product.name,
  origin: origins[product.slug] ?? "",
  body: product.problem,
  status: product.status,
  reach: product.reach,
  href: `/products/${product.slug}`,
  // These go to the product's story page on this site, not to the product
  // itself — "Open" would promise a launch that doesn't happen here.
  cta: `Read the ${product.name} story`,
}));

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
          <Link href="/products">Products</Link>
          <Link href="/lab">Lab</Link>
          {/* Notes appears only once something is published there. Linking to
              an empty section promises writing that isn't up yet. */}
          {publishedNotes.length > 0 ? <Link href="/notes">Notes</Link> : null}
          <Link href="/now">Now</Link>
          <Link href="/about">About</Link>
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
              Everything here started as a real problem in my own life. This is the working record:
              what I&apos;m building, where each thing honestly stands, what broke on the way, and
              what it changed my mind about. The studio sells outcomes. This site shows the
              machinery.
            </p>
            <div className="devhome__hero-actions">
              <Link className="devhome__btn" href="/products">
                See what I&apos;m building
              </Link>
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
            <span className="devhome__now-stamp">status · {nowLastUpdated}</span>
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
              they&apos;re evidence of how I think, not inventory. Every status below is the real
              one, including the two that aren&apos;t in anyone&apos;s hands yet.
            </p>
          </div>
          <div className="devhome__system-list">
            {systems.map((system, index) => (
              <article className="devhome__system" key={system.name}>
                <div className="devhome__system-meta">
                  <span className="devhome__system-index">0{index + 1}</span>
                  <span className="devhome__system-status">{reachLabel[system.reach]}</span>
                </div>
                <div className="devhome__system-body">
                  <h3>{system.name}</h3>
                  <p className="devhome__system-origin">{system.origin}</p>
                  <p>{system.body}</p>
                  <Link className="devhome__system-link" href={system.href} aria-label={system.cta}>
                    {system.cta} <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="devhome__texture">
            The studio is the same idea pointed at other people&apos;s businesses.{" "}
            <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
              That work lives on its own site
            </a>
            .
          </p>
        </section>

        {/* The writing section only exists when there is writing. Every field
            note is currently held for Blake's review, so this collapses to the
            lab rather than advertising an empty archive. */}
        {publishedNotes.length > 0 ? (
          <section className="devhome__principles" aria-labelledby="devhome-notes-title">
            <div className="devhome__section-head">
              <h2 id="devhome-notes-title">What I&apos;m learning</h2>
              <p>
                Build logs from inside the work — a blocked release, a feature I switched off on
                purpose, a number I chased for months.
              </p>
            </div>
            <div className="devhome__principle-grid">
              {publishedNotes.slice(0, 3).map((note) => (
                <article key={note.slug}>
                  <h3>
                    <Link href={`/notes/${note.slug}`}>{note.title}</Link>
                  </h3>
                  <p>{note.hook}</p>
                </article>
              ))}
            </div>
            <p className="devhome__texture">
              <Link href="/notes">All field notes</Link> · <Link href="/lab">the lab</Link>
            </p>
          </section>
        ) : null}

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
            of the products above. <Link href="/about">The longer version, and why the site is
            called koinophobia</Link>.
          </p>
        </section>

        <section className="devhome__connect" aria-labelledby="devhome-connect-title">
          <div className="devhome__connect-card">
            <h2 id="devhome-connect-title">Talk to me</h2>
            <p>
              I read everything that comes in. To save you a guess about where to start:
            </p>
            <div className="devroute">
              <a
                className="devroute__item"
                href={LINKS.labs}
                target="_blank"
                rel="noopener noreferrer"
              >
                <em>Hire the studio</em>
                <strong>Koinophobia Labs</strong>
                <span>
                  Client work — sites, intake, and AI front-office systems. It has its own intake,
                  so I won&apos;t duplicate it here.
                </span>
              </a>
              <Link className="devroute__item" href="/products">
                <em>Try something</em>
                <strong>The products</strong>
                <span>
                  Two are open to anyone right now. The pages say plainly which two, and why the
                  others aren&apos;t.
                </span>
              </Link>
              <a className="devroute__item" href={LINKS.email}>
                <em>Test a beta</em>
                <strong>Ask for access</strong>
                <span>
                  Trendi runs an invite-only TestFlight. Tell me what you make and I&apos;ll add
                  you.
                </span>
              </a>
              <a className="devroute__item" href={LINKS.email}>
                <em>Hire me, or build together</em>
                <strong>Email</strong>
                <span>
                  Roles, collaborations, speaking, or comparing notes on products and systems.
                </span>
              </a>
            </div>
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
      <PersonalKoi />
    </div>
  );
}
