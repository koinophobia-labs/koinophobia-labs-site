import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Mic2,
  Sparkles,
  Video,
} from "lucide-react";
import { AppStoreLink, ProductPageView } from "@/components/products/ProductAnalytics";
import { trendiRelease } from "@/lib/releases";
import TrendiHeroVisual from "@/components/trendi/TrendiHeroVisual";
import TrendiMedia from "@/components/TrendiMedia";

const inquiryHref =
  "mailto:koinophobia999@gmail.com?subject=Trendi%20inquiry&body=Hi%20Blake%2C%0A%0AI%27d%20like%20to%20ask%20about%20Trendi.%0A%0AMy%20question%3A%0A";

export const metadata: Metadata = {
  title: "Trendi | Your Content Coach",
  description:
    "Trendi is a content coach for iPhone. Type the thought and get one angle, three hook options, an editable script, a caption, and a simple shot plan.",
  alternates: { canonical: "https://koinophobialabs.com/trendi" },
  openGraph: {
    title: "Trendi | From messy thought to recordable words",
    description:
      "Say it messy. Trendi shapes the thought into a finishable draft in your voice.",
    url: "https://koinophobialabs.com/trendi",
    siteName: "Koinophobia Labs",
    type: "website",
    images: [
      {
        url: "/trendi/store/04-own-the-script.jpg",
        width: 600,
        height: 1300,
        alt: "Trendi script editor from the current App Store listing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendi | From messy thought to recordable words",
    description:
      "Say it messy. Trendi shapes the thought into a finishable draft in your voice.",
    images: ["/trendi/store/04-own-the-script.jpg"],
  },
};

const steps = [
  {
    number: "01",
    icon: Mic2,
    title: "Dump the idea",
    body: "Type it or say it before you overthink it. Fragments, tangents, and half-formed thoughts are welcome.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Shape the thought",
    body: "Trendi finds the point and turns the messy input into clear, creator-specific words.",
  },
  {
    number: "03",
    icon: Video,
    title: "Record or publish",
    body: "Use the finishable draft on camera or carry it into your publishing workflow—not back into the notes graveyard.",
  },
];

const outputs = [
  "A clear point pulled from the raw thought",
  "Creator-specific language that sounds usable",
  "One focused, finishable draft",
  "Words structured to be spoken on camera",
];

const audiences = [
  ["Solo creators", "Turn the voice note you keep replaying into something ready to record."],
  ["Founder-creators", "Explain the thing you are building without sanding off your point of view."],
  ["Independent experts", "Freelancers, coaches, and consultants can start with what they know and make it clear enough to say."],
  ["Small business owners", "Create in your own voice without handing every useful thought to a content team."],
];

export default function TrendiPage() {
  return (
    <main className="trendiPage_world">
      <ProductPageView product="trendi" />
      <header className="trendiPage_nav" aria-label="Trendi navigation">
        <Link className="trendiPage_back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Koinophobia Labs
        </Link>
        <p className="trendiPage_navMark" aria-label="Trendi">
          TRENDI
        </p>
        <Link className="trendiPage_navCta" href="/trendi/support">Support <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>

      <section id="trendi-hero" className="trendiPage_hero" aria-labelledby="trendi-title">
        <div className="trendiPage_heroGlow" aria-hidden="true" />
        <div className="trendiPage_heroCopy">
          <p className="trendiPage_eyebrow">
            Trendi <span>For iPhone</span> Your content coach
          </p>
          <p id="trendi-identity" className="trendiPage_identity" aria-hidden="true">TRENDI</p>
          <h1 id="trendi-title">
            Type the thought. Get words to say on camera.
          </h1>
          <p className="trendiPage_lede">
            Say it messy. Trendi turns a rough idea into hooks, a recordable script, a
            caption, and a simple shot plan—so you can stop circling the thought and
            start recording it.
          </p>
          <div className="trendiPage_actions">
            <AppStoreLink product="trendi" placement="hero" id="trendi-hero-cta" className="trendiPage_primary" href={trendiRelease.url} />
            <a className="trendiPage_secondary" href="#real-product">
              See Trendi in action <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="trendiPage_releaseNote">
            Free to download · iPhone · iOS 17.0 or later. Optional Trendi Pro.
            <br /><a href="#free-and-pro">What’s included</a> · <Link href="/trendi/privacy">Privacy</Link>
          </p>
        </div>
        <div className="trendiPage_heroSide">
          <TrendiHeroVisual
            variant="full"
            heroId="trendi-hero"
            wordmarkId="trendi-identity"
            ctaId="trendi-hero-cta"
          />
          <aside className="trendiPage_heroNote" aria-label="Product premise">
            <span>THE PREMISE</span>
            <p>Your best ideas should not die between the voice note and the record button.</p>
          </aside>
        </div>
      </section>

      <section id="real-product" className="trendiPage_product" aria-labelledby="real-product-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">01 / Real product</p>
          <div>
            <h2 id="real-product-title">Start messy. Leave with something sayable.</h2>
            <p>
              Capture the idea, choose your hook, edit your script, then record with the
              teleprompter. These screenshots come from Trendi’s current App Store listing.
            </p>
          </div>
        </div>
        <TrendiMedia />
      </section>

      <section className="trendiPage_flow" aria-labelledby="flow-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">02 / The flow</p>
          <div>
            <h2 id="flow-title">From thought to record button in three moves.</h2>
          </div>
        </div>
        <ol className="trendiPage_steps">
          {steps.map(({ number, icon: Icon, title, body }) => (
            <li key={number}>
              <div className="trendiPage_stepTop">
                <span>{number}</span>
                <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="trendiPage_output" aria-labelledby="output-title">
        <div className="trendiPage_outputCopy">
          <p className="trendiPage_sectionIndex">03 / What comes out</p>
          <h2 id="output-title">Not more content sludge. A draft with your point still in it.</h2>
          <p>
            Trendi is designed around a smaller, more useful promise: help one real thought
            cross the gap into words you can speak.
          </p>
        </div>
        <ul className="trendiPage_outputList">
          {outputs.map((output) => (
            <li key={output}>
              <Check size={18} aria-hidden="true" />
              <span>{output}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="trendiPage_audience" aria-labelledby="audience-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">04 / Made for</p>
          <div>
            <h2 id="audience-title">People with something real to say—and friction saying it.</h2>
          </div>
        </div>
        <div className="trendiPage_audienceGrid">
          {audiences.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="free-and-pro" className="trendiPage_plans" aria-labelledby="plans-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">05 / Free &amp; Pro</p>
          <div><h2 id="plans-title">Start free. Get more coaching when you need it.</h2>
            <p>A Coach Pack brings together an angle, three hooks, an editable script, a caption, and a shot plan.</p></div>
        </div>
        <div className="trendiPage_planGrid">
          <article><h3>Free</h3><p className="trendiPage_allowance">3 Coach Packs <span>per weekly allowance period</span></p>
            <p>Capture ideas, keep drafts in your on-device Vault, edit scripts, and record with the teleprompter. Your saved work stays available.</p></article>
          <article><h3>Optional Trendi Pro</h3><p className="trendiPage_allowance">100 Coach Packs <span>each month</span></p>
            <p>A monthly subscription for more Coach Packs. Everything else stays the same on Free. See the current price in the app before purchasing.</p></article>
        </div>
        <p className="trendiPage_planNote">Only successfully delivered Coach Packs count. Pro renews automatically unless canceled at least 24 hours before the current period ends. Manage or cancel in your App Store account settings.</p>
        <p className="trendiPage_planNote">Trendi helps you prepare and record. It does not automatically post or schedule content, connect to social accounts, or promise views or growth.</p>
        <p className="trendiPage_planNote">Version {trendiRelease.version} · <a href={trendiRelease.url}>Public App Store listing</a> checked September 10, 2026. <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms of Use</a>.</p>
      </section>

      <section className="trendiPage_final" aria-labelledby="launch-title">
        <p className="trendiPage_finalMark" aria-hidden="true">TRENDI</p>
        <div className="trendiPage_finalInner">
          <p className="trendiPage_eyebrow">Available on iPhone</p>
          <h2 id="launch-title">Have a thought worth recording?</h2>
          <p>Start with one rough thought. Shape it into your next recording.</p>
          <AppStoreLink product="trendi" placement="footer" className="trendiPage_primary" href={trendiRelease.url} />
        </div>
      </section>

      <footer className="trendiPage_footer">
        <p>Trendi · A Koinophobia Labs product</p>
        <nav aria-label="Trendi links">
          <Link href="/trendi/privacy">Privacy</Link>
          <Link href="/trendi/support">Support</Link>
          <a href={inquiryHref}>Contact</a>
          <Link href="/">Koinophobia Labs</Link>
        </nav>
      </footer>
    </main>
  );
}
