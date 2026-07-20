import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import DevShell from "@/components/dev/DevShell";
import { LINKS } from "@/lib/links";

// Served as koinophobia.dev/about via a host rewrite. The studio's /about is a
// different page about the business; this one is about the person.

export const metadata: Metadata = {
  title: { absolute: "About — Blake Taylor" },
  description:
    "Why the site is called koinophobia, what I believe about AI and leverage, and how a layoff turned into a studio.",
  alternates: { canonical: "https://koinophobia.dev/about" },
  openGraph: {
    type: "profile",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/about",
    title: "About — Blake Taylor",
    description:
      "Koinophobia is the fear of an ordinary life. This is what I've been doing about mine.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
};

const beliefs = [
  {
    title: "Leverage is built, not granted.",
    body: "For three years the ceiling on what I could build was somebody else's roadmap. The thing that changed wasn't my skill — it was that I stopped waiting to be given a bigger surface and started making my own. Nobody was ever going to hand me permission to ship a product. That's not a grievance; it's just how it works.",
  },
  {
    title: "AI multiplies taste. It doesn't supply it.",
    body: "A model will happily give you a hundred competent options and no reason to prefer any of them. The scarce input is knowing which one is right, and that still comes from having watched real people get confused by real products. AI made me roughly ten times faster at building the wrong thing, until I got better at choosing.",
  },
  {
    title: "The interesting products make you more capable, not more dependent.",
    body: "There's a version of every tool I've built that keeps you coming back because it holds something hostage. Career Forge could have hidden your own résumé behind a subscription. I'd rather build the version you eventually stop needing — partly on principle, and partly because I don't want to spend my life defending a moat I don't believe in.",
  },
  {
    title: "A solo studio is a real option now, and most people haven't updated.",
    body: "The overhead that used to require a team — design, build, deploy, support, sell — is genuinely compressible by one person with the right tools. I'm not claiming it's easy or that it beats a good job. I'm saying the tradeoff moved, and a lot of people are still pricing it at the old rate.",
  },
  {
    title: "Honest status labels are a feature.",
    body: "Half of what I've built isn't finished, and the site says so on every page. \"TestFlight beta, testers are two builds behind\" is less impressive and more useful than \"launched.\" I'd rather someone trust the one claim I make than be impressed by four they can't check.",
  },
  {
    title: "Teaching it is the fastest way to find out if you know it.",
    body: "I've been walking friends through AI tooling while building real things alongside them — not tutorials, actual work with actual stakes. Every time someone asks why a step exists and I don't have a good answer, that's a step I was doing out of habit.",
  },
];

export default function DevAboutPage() {
  return (
    <DevShell current="/about" narrow>
      <section className="devsec__head">
        <p className="devpage__kicker">About</p>
        <h1>The fear of an ordinary life, and what I did about it.</h1>
      </section>

      <div className="devabout__body">
        <p>
          I&apos;m Blake Taylor. I build products in Chicago, mostly alone, mostly out of problems
          that annoyed me first.
        </p>
        <p>
          For three years I worked in high-volume sportsbook operations at DraftKings. It is a
          better education than it sounds like. When thousands of people move through a process
          every day, you get to watch exactly where a product confuses someone, where a workflow
          quietly starts costing money, and how long a broken thing can survive because everybody
          has learned to route around it. I stopped seeing interfaces and started seeing systems
          under load.
        </p>
        <p>
          In 2025 I started building my own products around that lesson, at night, around the job.
          In July 2026 my role was eliminated. I&apos;m not going to dress that up as a gift — it
          was a layoff, and layoffs are bad. But it did collapse a decision I&apos;d been
          postponing. I stopped building around a job and went all in.
        </p>

        <dl className="devabout__word">
          <dt>koinophobia</dt>
          <dd>
            <em>noun.</em>{" "}
            The fear of an ordinary life. Not a fear of being average at things —
            a fear of the specific way a life gets ordinary, which is one reasonable postponement
            at a time. I named the studio after the thing I&apos;m running from, so I&apos;d have
            to type it every day.
          </dd>
        </dl>

        <p>
          That&apos;s the honest reason all of this exists. Not a mission statement about
          empowering creators. A specific, slightly embarrassing fear that the default path was
          going to work out fine, and fine was the problem.
        </p>
        <p>
          What I actually do about it is narrower than the word suggests: I find the point where a
          process starts costing someone time, money, or nerve, and I build a system that takes
          that cost away. That&apos;s the same job whether it&apos;s a job search, a creator
          staring at a record button, an argument with no scoreboard, or a small business whose
          follow-up lives in one person&apos;s memory.
        </p>
      </div>

      <section aria-labelledby="devabout-beliefs">
        <h2 id="devabout-beliefs" className="devpage__kicker">
          What I actually believe
        </h2>
        <ul className="devabout__beliefs">
          {beliefs.map((belief) => (
            <li className="devabout__belief" key={belief.title}>
              <h3>{belief.title}</h3>
              <p>{belief.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="devprod__section" aria-labelledby="devabout-next">
        <h2 id="devabout-next">Where to go next</h2>
        <div className="devroute">
          <Link className="devroute__item" href="/products">
            <em>The work</em>
            <strong>Products</strong>
            <span>Four builds, with honest status on each and what they cost me to learn.</span>
          </Link>
          <Link className="devroute__item" href="/now">
            <em>This month</em>
            <strong>Now</strong>
            <span>What&apos;s active, what&apos;s paused, and what I&apos;m looking for.</span>
          </Link>
          <Link className="devroute__item" href="/resume">
            <em>The formal version</em>
            <strong>Résumé</strong>
            <span>Roles, dates, and a PDF, for when someone needs the conventional artifact.</span>
          </Link>
          <a
            className="devroute__item"
            href={LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            <em>Follow along</em>
            <strong>
              LinkedIn <ArrowUpRight size={13} aria-hidden="true" />
            </strong>
            <span>Where I post about what I&apos;m building, at a slower cadence than here.</span>
          </a>
        </div>
      </section>
    </DevShell>
  );
}
