import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { LINKS } from "@/lib/links";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blake Taylor",
  description:
    "Laid off in July, three apps on the App Store by September. The person who designs, builds, tests, and ships everything at Koinophobia Labs.",
  alternates: { canonical: `${STUDIO_URL}/blake` },
  openGraph: { type: "profile", url: `${STUDIO_URL}/blake`, title: "Blake Taylor · Koinophobia Labs", images: [socialCard("The fear of an ordinary life, and what I did about it.", "Blake Taylor · founder")] },
};

const method = [
  {
    title: "Live the problem first.",
    body: "Every product here started as something I needed the week I needed it.",
  },
  {
    title: "Build the smallest true version.",
    body: "Trendi shipped with the newer pipeline turned off because it broke a mode that worked.",
  },
  {
    title: "Test on the device.",
    body: "The simulator was green for weeks while the phone found two shipping defects in an hour.",
  },
  {
    title: "Ship, then say exactly what's true.",
    body: "Every product page on this site carries a verified date and a list of what it can't do, and a script fails the build when the date goes stale.",
  },
];

export default function BlakePage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <section className="two" aria-labelledby="blake-title">
          <div className="portrait s">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/blake/portrait-2026-09-14.jpg" alt="Blake Taylor on a bridge over the Chicago River" width={736} height={920} />
          </div>
          <div className="page-head">
            <p className="k s">
              <b>Blake Taylor</b> · founder, builder, the only employee
            </p>
            <h1 id="blake-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              The fear of an ordinary life, and what I did about it.
            </h1>
            <p className="voice s" style={{ "--i": 2 } as React.CSSProperties}>
              &ldquo;Koinophobia is the fear of being ordinary. I named the studio after the thing I
              was running from, so I&apos;d never get to forget it.&rdquo;
            </p>
            <p className="lede s" style={{ "--i": 3 } as React.CSSProperties}>
              I&apos;m Blake. I spent three years in sportsbook operations at DraftKings, keeping
              high-volume systems and the people around them calm while a lot went wrong at once.
              In July 2026 the role ended. I had a list of tools I&apos;d wished existed for years, a
              Mac, and a set of AI coding agents I&apos;d learned to direct like a small crew. By
              September, three of those tools were on the App Store.
            </p>
            <div className="rail s" style={{ "--i": 4 } as React.CSSProperties}>
              <span>
                <b>Chicago</b>
              </span>
              <span>
                <b>Earlham College</b> · B.A. Global Management
              </span>
              <span>
                <b>DraftKings</b> · sportsbook operations, three years
              </span>
            </div>
          </div>
        </section>

        <section className="sec" aria-labelledby="method-title">
          <p className="k s">How I build</p>
          <h2 id="method-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Four rules, all of them earned the hard way.
          </h2>
          <div className="pblocks">
            {method.map((rule, index) => (
              <div className="pblock s" key={rule.title} style={{ "--i": index } as React.CSSProperties}>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" aria-labelledby="ai-title">
          <p className="k s">What AI does here, and doesn&apos;t</p>
          <h2 id="ai-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            The agents are why one person can do this. They&apos;re not the pitch.
          </h2>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            AI agents write a lot of the code, run the checks, and draft the documentation. They
            don&apos;t choose what to build, decide what ships, or get to make a claim the product
            can&apos;t back. Taste and judgment are the job.
          </p>
        </section>

        <section className="sec glass" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title" className="s">
            Work with me, or just say hello.
          </h2>
          <div className="rail rail--plain s" style={{ "--i": 1 } as React.CSSProperties}>
            <a href={`${LINKS.email}?subject=Hello`} data-analytics="founder_link_click" data-analytics-label="email">
              <b>Email</b> · koinophobia999@gmail.com
            </a>
            <a href={LINKS.github} target="_blank" rel="noreferrer" data-analytics="founder_link_click" data-analytics-label="github">
              <b>GitHub</b> <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/koinophobia_labs/" target="_blank" rel="noreferrer" data-analytics="founder_link_click" data-analytics-label="instagram">
              <b>Instagram</b> <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" data-analytics="founder_link_click" data-analytics-label="linkedin">
              <b>LinkedIn</b> <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a href="/resume/Blake-Taylor-Resume.pdf" data-analytics="founder_link_click" data-analytics-label="resume">
              <b>Résumé</b> · PDF
            </a>
          </div>
          <div className="actions s" style={{ "--i": 2 } as React.CSSProperties}>
            <Link className="btn btn--primary ai" href="/work-with-me">
              Work with me <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="method-title" before="contact" />
    </div>
  );
}
