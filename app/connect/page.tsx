import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  GitBranch,
  IdCard,
  Mail,
  MapPin,
} from "lucide-react";
import { founderLinks } from "@/lib/founderHub";
import { LINKS } from "@/lib/links";

// The fast networking card for koinophobia.dev. It shares the personal home's
// dark, violet-controlled identity (.connectcard mirrors the .devhome palette)
// and exists to make someone who just met Blake recognize him and act quickly —
// not to retell the homepage or sell the studio.

export const metadata: Metadata = {
  title: { absolute: "Connect with Blake Taylor" },
  description:
    "Blake Taylor — Chicago-based founder and product builder. Contact, follow, and explore what I build. I build systems that turn chaos into leverage.",
  alternates: { canonical: "https://koinophobia.dev/connect" },
  openGraph: {
    type: "profile",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/connect",
    title: "Connect with Blake Taylor",
    description:
      "Chicago-based founder and product builder. Contact, follow, and explore what I build.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect with Blake Taylor",
    description: "Chicago-based founder and product builder. Contact, follow, and explore what I build.",
    images: ["https://koinophobia.dev/og-founder.png"],
  },
};

const contactActions: Array<{
  label: string;
  href: string;
  icon: typeof Mail;
  primary?: boolean;
  external?: boolean;
  internal?: boolean;
}> = [
  { label: "Email me", href: founderLinks.emailWithContext, icon: Mail, primary: true },
  { label: "LinkedIn", href: LINKS.linkedin, icon: IdCard, external: true },
  { label: "GitHub", href: LINKS.github, icon: GitBranch, external: true },
  { label: "Résumé", href: "/resume", icon: FileText, internal: true },
];

const work: Array<{
  name: string;
  note: string;
  href: string;
  external?: boolean;
}> = [
  {
    name: "Career Forge",
    note: "Leverage in the job search",
    href: LINKS.careerForge,
    external: true,
  },
  { name: "Trendi", note: "Leverage for creators", href: "/trendi" },
  { name: "You Know Ball", note: "Sports takes, scored honestly", href: "/you-know-ball/play" },
  {
    name: "Koinophobia Labs",
    note: "The studio I run — hire it",
    href: LINKS.labs,
    external: true,
  },
];

export default function ConnectPage() {
  return (
    <div className="connectcard">
      <div className="connectcard__field" aria-hidden="true" />
      <main className="connectcard__inner">
        <header className="connectcard__top">
          <Link className="connectcard__home" href="/">
            <ArrowLeft size={15} aria-hidden="true" /> koinophobia.dev
          </Link>
          <span className="connectcard__loc">
            <MapPin size={14} aria-hidden="true" /> Chicago, IL
          </span>
        </header>

        <section className="connectcard__hero" aria-labelledby="connect-name">
          <figure className="connectcard__portrait">
            <Image
              src="/blake-portrait.jpg"
              alt="Blake Taylor"
              width={640}
              height={800}
              priority
            />
          </figure>
          <div className="connectcard__id">
            <p className="connectcard__kicker">Founder · product builder</p>
            <h1 id="connect-name">Blake Taylor</h1>
            <p className="connectcard__role">
              I build systems that turn <span>chaos into leverage.</span>
            </p>
            <p className="connectcard__sub">
              Operator background in high-volume sportsbook operations, now building AI products and
              the systems around them. If we just met — here&apos;s how to stay in touch.
            </p>
          </div>
        </section>

        <nav className="connectcard__actions" aria-label="Contact Blake">
          {contactActions.map((action) => {
            const Icon = action.icon;
            const className = `connectcard__action${action.primary ? " connectcard__action--primary" : ""}`;
            const inner = (
              <>
                <Icon size={18} aria-hidden="true" />
                <span>{action.label}</span>
              </>
            );
            if (action.internal) {
              return (
                <Link key={action.label} className={className} href={action.href}>
                  {inner}
                </Link>
              );
            }
            return (
              <a
                key={action.label}
                className={className}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                aria-label={action.external ? `${action.label} (opens in a new tab)` : action.label}
              >
                {inner}
              </a>
            );
          })}
        </nav>

        <section className="connectcard__work" aria-labelledby="connect-work">
          <p className="connectcard__label" id="connect-work">
            What I&apos;m building
          </p>
          <ul className="connectcard__work-list">
            {work.map((item) => {
              const inner = (
                <>
                  <span className="connectcard__work-name">{item.name}</span>
                  <span className="connectcard__work-note">{item.note}</span>
                  <ArrowUpRight className="connectcard__work-arrow" size={15} aria-hidden="true" />
                </>
              );
              return (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.name} — ${item.note} (opens in a new tab)`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link href={item.href} aria-label={`${item.name} — ${item.note}`}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <Link className="connectcard__more" href="/">
          Read the full story on koinophobia.dev
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>

        <footer className="connectcard__footer">
          <span>koinophobia.dev — the person</span>
          <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
            koinophobialabs.com — the studio <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}
