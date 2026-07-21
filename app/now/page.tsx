import type { Metadata } from "next";
import PersonalKoi from "@/components/dev-koi/PersonalKoi";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  nowActiveWork,
  nowChapter,
  nowHero,
  nowLastUpdated,
  nowLearning,
  nowNotDoing,
  nowOpenDoor,
  nowProfessional,
  nowProof,
} from "@/lib/now";

// koinophobia.dev/now — the living pulse. A founder's field report on the
// present chapter, rendered entirely from lib/now.ts (shared with the homepage
// "Right now" snapshot). Not a changelog, résumé, or second landing page.

export const metadata: Metadata = {
  title: { absolute: "What I'm Doing Now — Blake Taylor" },
  description:
    "What Blake Taylor is actively building, testing, learning, and pursuing right now — the present chapter of Koinophobia Labs, Career Forge, Trendi, and You Know Ball.",
  alternates: { canonical: "https://koinophobia.dev/now" },
  openGraph: {
    type: "profile",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/now",
    title: "What I'm Doing Now — Blake Taylor",
    description:
      "The proof stage: turning shipped products into users, clients, feedback, and evidence.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What I'm Doing Now — Blake Taylor",
    description: "The proof stage: turning shipped products into users, clients, and evidence.",
    images: ["https://koinophobia.dev/og-founder.png"],
  },
};

export default function NowPage() {
  return (
    <div className="nowdev">
      <div className="nowdev__field" aria-hidden="true" />
      <main className="nowdev__inner">
        <header className="nowdev__top">
          <Link className="nowdev__home" href="/">
            <ArrowLeft size={15} aria-hidden="true" /> koinophobia.dev
          </Link>
          <div className="nowdev__stamp">
            <span className="nowdev__slug">/now</span>
            <span className="nowdev__updated">Last updated {nowLastUpdated}</span>
          </div>
        </header>

        <section className="nowdev__hero" aria-labelledby="now-title">
          <h1 id="now-title">{nowHero.heading}</h1>
          <p className="nowdev__lede">{nowHero.lede}</p>
        </section>

        <section className="nowdev__chapter" aria-labelledby="now-chapter">
          <p className="nowdev__eyebrow" id="now-chapter">
            The current chapter
          </p>
          {nowChapter.map((para) => (
            <p className="nowdev__chapter-body" key={para.slice(0, 32)}>
              {para}
            </p>
          ))}
        </section>

        <section className="nowdev__section" aria-labelledby="now-work">
          <p className="nowdev__eyebrow" id="now-work">
            Active work
          </p>
          <div className="nowdev__work">
            {nowActiveWork.map((item) => (
              <article className="nowdev__work-item" key={item.name}>
                <div className="nowdev__work-head">
                  <h2>{item.name}</h2>
                  <span className="nowdev__stage">{item.stage}</span>
                </div>
                <dl className="nowdev__work-detail">
                  <div>
                    <dt>Now</dt>
                    <dd>{item.doingNow}</dd>
                  </div>
                  <div>
                    <dt>Next proof</dt>
                    <dd>{item.nextProof}</dd>
                  </div>
                </dl>
                {item.external ? (
                  <a
                    className="nowdev__work-link"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.cta} (opens in a new tab)`}
                  >
                    {item.cta} <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <Link className="nowdev__work-link" href={item.href} aria-label={item.cta}>
                    {item.cta} <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="nowdev__section" aria-labelledby="now-proof">
          <p className="nowdev__eyebrow" id="now-proof">
            Proof I&apos;m chasing
          </p>
          <ul className="nowdev__proof">
            {nowProof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="nowdev__professional">
            <p>{nowProfessional.line}</p>
            <div className="nowdev__lanes">
              {nowProfessional.lanes.map((lane) => (
                <span className="nowdev__lane" key={lane}>
                  {lane}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="nowdev__section" aria-labelledby="now-learning">
          <p className="nowdev__eyebrow" id="now-learning">
            What I&apos;m learning
          </p>
          <div className="nowdev__learning">
            {nowLearning.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nowdev__section" aria-labelledby="now-not">
          <p className="nowdev__eyebrow" id="now-not">
            What I&apos;m deliberately not doing
          </p>
          <ul className="nowdev__not">
            {nowNotDoing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="nowdev__door" aria-labelledby="now-door">
          <h2 id="now-door">{nowOpenDoor.heading}</h2>
          <p className="nowdev__door-lede">{nowOpenDoor.lede}</p>
          <ul className="nowdev__door-list">
            {nowOpenDoor.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <Link className="nowdev__door-cta" href="/connect">
            Get in touch <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <footer className="nowdev__footer">
          <span>koinophobia.dev/now — updated by hand, {nowLastUpdated}</span>
          <Link href="/">Back to the story</Link>
        </footer>
      </main>
      <PersonalKoi />
    </div>
  );
}
