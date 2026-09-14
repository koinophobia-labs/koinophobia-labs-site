import type { Metadata } from "next";
import Link from "next/link";
import { preload } from "react-dom";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import KoiWorld from "@/components/koi/KoiWorld";
import WaterText from "@/components/koi/WaterText";
import { LabCard, ProductCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import NowStrip from "@/components/site/NowStrip";
import StickyStart from "@/components/site/StickyStart";
import { CLIPS, DESTINATIONS } from "@/lib/koi/journey";
import { LINKS } from "@/lib/links";
import {
  engagementShapes,
  engagementTerms,
  labProducts,
  replyPromise,
  shippedProducts,
} from "@/lib/products";
import { withLiveListings } from "@/lib/app-store";
import {
  STUDIO_DESCRIPTION,
  STUDIO_SCHEMA,
  STUDIO_SOCIAL_IMAGE,
  STUDIO_TITLE,
  STUDIO_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: STUDIO_TITLE,
  description: STUDIO_DESCRIPTION,
  alternates: { canonical: `${STUDIO_URL}/` },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: `${STUDIO_URL}/`,
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: [STUDIO_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: ["/brand/social-card"],
  },
};

const bandStyle = (index: number) => {
  const destination = DESTINATIONS[index];
  return {
    "--band-desktop": `${destination.band.desktop * 100}svh`,
    "--band-mobile": `${destination.band.mobile * 100}svh`,
  } as React.CSSProperties;
};

/**
 * The homepage: six destinations, one dive. Surface, Shipped, Lab, Blake,
 * Work with me, Start. Every fact on this page is read from the registry in
 * lib/products.ts, which reads from lib/dev/universe.ts. See the rebuild
 * document, sections 3 and 4.
 */
export default async function Home() {
  // The first poster is the largest paint on a phone; fetch it before the
  // koi engine's JavaScript creates the element that shows it.
  preload(CLIPS[DESTINATIONS[0].clip].poster, { as: "image", fetchPriority: "high" });
  const shipped = await withLiveListings(shippedProducts);
  return (
    <div className="kw" data-koi-destination="surface" data-motion-shell>
      <a className="kw__skip" href="#surface-copy">
        Skip the animation and read the page
      </a>

      <KoiWorld />
      <WaterText />

      <Masthead />

      <nav className="kw__map" aria-label="Journey">
        {DESTINATIONS.map((destination) => (
          <a
            key={destination.id}
            href={`#${destination.id}`}
            data-koi-link={destination.id}
            aria-current={destination.index === 0 ? "location" : undefined}
            aria-label={`${destination.marker} ${destination.label}: ${destination.hint}`}
          >
            <span className="kw__map-label">{destination.label}</span>
            <span className="kw__map-dot" aria-hidden="true" />
          </a>
        ))}
      </nav>

      <main className="kw__main">
        {/* ---------------------------------------------------- 00 Surface */}
        <section className="dest dest--surface" id="surface" style={bandStyle(0)} aria-labelledby="surface-title">
          <div className="dest__stage">
            <div className="dest__inner" id="surface-copy" tabIndex={-1}>
              <div>
                <p className="kw__kicker">A one-person software studio · Chicago</p>
                <h1 id="surface-title">Nothing here stayed an idea.</h1>
                <p className="kw__lede">
                  Koinophobia Labs is Blake Taylor, building apps, websites, and AI tools
                  from first prototype to release. Three of those apps are on the App Store.
                  In the lab: an experimental Mac learning app with its first course built,
                  and a language model trained from scratch. Have a project in mind? Blake
                  builds for other people too.
                </p>
                <div className="kw__actions">
                  <a className="kw__btn kw__btn--primary kw__btn--dive ai" href="#shipped" data-koi-link="shipped">
                    See what shipped <ArrowDown size={16} aria-hidden="true" />
                  </a>
                  <a className="kw__btn kw__btn--ghost ai" href="#work" data-koi-link="work">
                    Work with Blake <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
                <dl className="kw__trust-rail" aria-label="Proof">
                  <div>
                    <dt>{shippedProducts.length} apps</dt>
                    <dd>on the App Store</dd>
                  </div>
                  <div>
                    <dt>1 builder</dt>
                    <dd>0 employees</dd>
                  </div>
                  <div>
                    <dt>Work directly</dt>
                    <dd>with the builder</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- 01 Shipped */}
        <section className="dest dest--shipped" id="shipped" style={bandStyle(1)} aria-labelledby="shipped-title">
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>01</b> Shipped · on the App Store now
              </p>
              <h2 id="shipped-title">Built by one person. Downloadable by anyone.</h2>
              <p>
                Create a video, remember a thought, or plan your next career move.
                Explore the apps and see them in action.
              </p>
              <div className="cards">
                {shipped.map((product, index) => (
                  <ProductCard key={product.slug} product={product} index={index} placement="home" />
                ))}
              </div>
              <div className="kw__actions">
                <Link className="kw__btn kw__btn--ghost ai" href="/shipped">
                  Explore the apps{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- 02 Lab */}
        <section className="dest dest--lab" id="lab" style={bandStyle(2)} aria-labelledby="lab-title">
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker kw__marker--lab">
                <b>02</b> The lab · experiments with receipts
              </p>
              <h2 id="lab-title">The part of the studio that isn&apos;t finished, on purpose.</h2>
              <p>
                Explore the experiments in progress, what works today, and what comes next.
              </p>
              <div className="lab-list">
                {labProducts.map((product, index) => (
                  <LabCard key={product.slug} product={product} index={index} />
                ))}
              </div>
              <div className="kw__actions">
                <Link className="kw__btn kw__btn--ghost ai" href="/lab">
                  Open the lab <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ 03 Blake */}
        <section className="dest dest--blake" id="blake" style={bandStyle(3)} aria-labelledby="blake-title">
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>03</b> The builder
              </p>
              <div className="kw__panel kw__founder">
                <div className="kw__portrait">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/blake/portrait-2026-09-14.jpg"
                    alt="Blake Taylor on a bridge over the Chicago River"
                    width={736}
                    height={920}
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="kw__kicker">Blake Taylor · founder</p>
                  <h2 id="blake-title">Laid off in July. Three apps on the App Store by September.</h2>
                  <p className="voice">&ldquo;The simulator votes. The device decides.&rdquo;</p>
                  <p>
                    Blake Taylor spent three years inside sportsbook operations in the sports-betting market, where
                    the job was staying calm while thousands of things went wrong at once. When the
                    role ended in July 2026 he started building the tools he wished he&apos;d had,
                    and didn&apos;t stop. He designs, writes, builds, tests, and ships everything on
                    this site, using AI coding agents the way a woodworker uses power tools: for
                    speed, never for judgment.
                  </p>
                  <ul className="kw__founder-facts">
                    <li>Chicago.</li>
                    <li>Earlham College, B.A. Global Management.</li>
                    <li>Sports betting, sportsbook operations, three years.</li>
                  </ul>
                  <Link className="kw__text-link ai" href="/blake">
                    More about Blake <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- 04 Work with me */}
        <section className="dest dest--work" id="work" style={bandStyle(4)} aria-labelledby="work-title">
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>04</b> Hire the studio
              </p>
              <h2 id="work-title">Have an idea that deserves to exist? Bring it.</h2>
              <p>Koinophobia Labs takes on outside projects that fit what it has already proven it can do.</p>
              <div className="shapes">
                {engagementShapes.map((shape, index) => (
                  <div className="shape glass s" key={shape.slug} style={{ "--i": index } as React.CSSProperties}>
                    <h3>{shape.title}</h3>
                    <p>{shape.body}</p>
                    <span className="shape__t">{shape.timeline}</span>
                  </div>
                ))}
              </div>
              <p className="kw__also">
                Also in scope: sites with a point of view, product films, experimental interfaces,
                and automation that removes a job nobody wanted.
              </p>
              <dl className="kw__trust-rail" aria-label="Terms">
                {engagementTerms.map((term) => (
                  <div key={term.title}>
                    <dt>{term.title}</dt>
                    <dd>{term.body}</dd>
                  </div>
                ))}
              </dl>
              <div className="kw__actions">
                <Link className="kw__btn kw__btn--primary ai" href="/start" data-analytics="inquiry_start" data-analytics-label="home_work">
                  Start a project <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link className="kw__btn kw__btn--ghost ai" href="/work-with-me">
                  How engagements work <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ 05 Start */}
        <section className="dest dest--start" id="start" style={bandStyle(5)} aria-labelledby="start-title">
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>05</b> Start a project
              </p>
              <h2 id="start-title">Tell me the idea. I&apos;ll tell you what it takes.</h2>
              <p>
                Two paragraphs are enough: what you want to exist, what exists today, and when you
                need it. You&apos;ll hear back from Blake {replyPromise} with a real answer,
                including &ldquo;don&apos;t build this yet&rdquo; when that&apos;s the answer.
              </p>
              <div className="kw__actions">
                <Link className="kw__btn kw__btn--primary kw__btn--grand ai" href="/start" data-analytics="inquiry_start" data-analytics-label="home_start">
                  Start a project <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <a className="kw__finale-mail" href={`${LINKS.email}?subject=Project%20idea`} data-analytics="founder_link_click" data-analytics-label="email">
                Email Blake instead <ArrowUpRight size={14} aria-hidden="true" />
              </a>

              <NowStrip />

              <a className="kw__return" href="#surface" data-koi-link="surface">
                Return to the surface
              </a>

              <footer className="kw__footer">
                <span>Koinophobia Labs · Chicago</span>
                <nav aria-label="Footer">
                  <Link href="/shipped">Shipped</Link>
                  <Link href="/lab">Lab</Link>
                  <Link href="/log">Log</Link>
                  <Link href="/blake">Blake</Link>
                  <Link href="/work-with-me">Work with me</Link>
                  <Link href="/privacy">Privacy</Link>
                </nav>
                <span className="kw__footer-sign">Fear ordinary.</span>
              </footer>
            </div>
          </div>
        </section>
      </main>

      <div className="kw__depth" aria-hidden="true">
        <span />
      </div>

      <StickyStart after="shipped" before="start" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STUDIO_SCHEMA) }}
      />
    </div>
  );
}
