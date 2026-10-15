import { freeStraightAnswerAvailable } from "@/lib/acquisition/services-config";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import PageView from "@/components/site/PageView";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { trendiRelease, forgetRelease, wayInRelease, oldDogRelease, preachingRelease } from "@/lib/releases";
import { getSiteProduct } from "@/lib/products";
import { STUDIO_URL, socialCard } from "@/lib/seo";

const headline = "You have the spec. I'll ship the app.";
const description = "Bring your spec, Figma or prototype. I'll take it from architecture to App Store release.";
const reviewHref = freeStraightAnswerAvailable() ? "/start?offer=readiness" : "/services#straight-answer";
const reviewLabel = freeStraightAnswerAvailable() ? "Get a free Straight Answer" : "Straight Answer · $250";

export const metadata: Metadata = {
  title: "PRD → Release",
  description,
  alternates: { canonical: `${STUDIO_URL}/work-with-me` },
  openGraph: { url: `${STUDIO_URL}/work-with-me`, title: headline, description, images: [socialCard(headline, "PRD → Release")] },
  twitter: { title: headline, description, images: [socialCard(headline, "PRD → Release")] },
};

// Five listings verified in Evidence/WO-0118/apple-lookup.json, 2026-10-15.
const listings = [
  { slug: "career-forge", name: "Way In: Resume & Job Search", platforms: "iOS", url: "https://apps.apple.com/us/app/way-in-resume-job-search/id6807942376", version: wayInRelease.version },
  { slug: "trendi", name: "Trendi: Content Coach", platforms: "iOS", url: "https://apps.apple.com/us/app/trendi-content-coach/id6776299336", version: trendiRelease.version },
  { slug: "forget-about-it", name: "ForgetAboutIt", platforms: "iOS + watchOS", url: "https://apps.apple.com/us/app/forgetaboutit/id6804360983", version: forgetRelease.version },
  { slug: "old-dog", name: "Old Dog", platforms: "macOS", url: "https://apps.apple.com/us/app/old-dog/id6813966822", version: oldDogRelease.version },
  { slug: "preaching-to-the-choir", name: "Preaching to the Choir", platforms: "iOS / iPadOS", url: "https://apps.apple.com/us/app/preaching-to-the-choir/id6808442357", version: preachingRelease.version },
];

const steps = [
  { title: "I review what’s ready to build", body: "A written review of what’s buildable, what’s missing, the risks and what it takes to ship." },
  { title: "I plan the architecture and milestones", body: "Platform choices, stack, data model and a milestone plan you approve." },
  { title: "I build against your spec", body: "Your Figma integrated into working builds, delivered at each milestone." },
  { title: "I test on real devices", body: "Automated tests and real-device testing, including accessibility and edge cases." },
  { title: "I prepare your app for release", body: "The store listing, privacy answers, review notes, screenshots plan and TestFlight." },
  { title: "I ship and handle App Review", body: "App Store submission, App Review handling, launch checks and handover." },
];

export default function WorkWithMePage() {
  return (
    <div className="site studio-offer" data-motion-shell>
      <PageView event="work_with_me_view" />
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s"><b>Client Studio · PRD → Release</b></p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>{headline}</h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>{description}</p>
          <div className="actions s" style={{ "--i": 3 } as React.CSSProperties}>
            <Link className="btn btn--primary ai" href={reviewHref} data-analytics="inquiry_start" data-analytics-label="work_with_me_top">
              {reviewLabel} <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <a className="btn ai" href="/start?src=work-with-me" data-analytics="founder_link_click" data-analytics-label="email">Ask a question</a>
          </div>
        </header>

        <section className="sec" aria-labelledby="fit-title">
          <p className="k s">Who it’s for</p>
          <h2 id="fit-title" className="s">You’ve defined it. Now you need it built.</h2>
          <p className="lede s">For founders with a PRD or spec, design or wireframes, a defined customer, and a need for implementation now.</p>
          <p className="s">Just an idea? <Link className="studio-idea-link" href="/#work">Start with Prove the idea <span aria-hidden="true">→</span></Link></p>
        </section>

        <section className="sec glass" aria-labelledby="review-title">
          <p className="k s">The first step</p>
          <h2 id="review-title" className="s">Start with a Straight Answer.</h2>
          <p className="lede s">Send the spec. Get a straight answer.</p>
          <p className="s">You get a short written review: what&apos;s buildable now, what&apos;s missing, the major risks, and what it takes to ship.</p>
          <p className="s"><strong>{freeStraightAnswerAvailable() ? "Free for my first five founders." : "Straight Answer · $250"}</strong></p>
          <p className="s">“Not ready yet” is a valid result.</p>
        </section>

        <section className="sec" aria-labelledby="how-title" data-analytics-view="engagement_shape_view" data-analytics-label="prd_to_release">
          <p className="k s">PRD → Release</p>
          <h2 id="how-title" className="s">From your spec to a shipped product.</h2>
          <ol className="pblocks" style={{ listStyle: "none", padding: 0 }}>
            {steps.map((step, index) => (
              <li className="pblock s" key={step.title} style={{ "--i": index } as React.CSSProperties}>
                <span className="k">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec" aria-labelledby="proof-title">
          <p className="k s">I built and shipped these</p>
          <h2 id="proof-title" className="s">Five apps. Live on the App Store.</h2>
          <div className="cards studio-proof">
            {listings.map((listing, index) => {
              const existing = getSiteProduct(listing.slug);
              return (
                <ProductCard key={listing.slug} index={index} placement="work_with_me" listingOnly product={{
                  ...listing,
                  href: existing?.href.startsWith("/") ? existing.href : listing.url,
                  screens: existing?.screens ?? [],
                  chip: "Live",
                  blurb: "",
                  notYetShort: "",
                  appStore: { url: listing.url, version: listing.version, verifiedAt: wayInRelease.verifiedAt, priceLine: "" },
                }} />
              );
            })}
          </div>
        </section>

        <section className="sec" aria-labelledby="scope-title">
          <p className="k s">Before I build</p>
          <h2 id="scope-title" className="s">A fixed price. A written scope.</h2>
          <p className="lede s">After the review, I quote fixed-price milestones. You approve the price and written scope before I build.</p>
          <p className="s">You own the code, the accounts and the listing.</p>
        </section>

        <section className="sec glass" id="work-end" aria-labelledby="end-title">
          <h2 id="end-title" className="s">Send the spec. Get a straight answer.</h2>
          <div className="actions s">
            <Link className="btn btn--primary ai" href={reviewHref} data-analytics="inquiry_start" data-analytics-label="work_with_me">
              {reviewLabel} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a className="btn ai" href="/start?src=work-with-me" data-analytics="founder_link_click" data-analytics-label="email">Ask a question</a>
          </div>
        </section>
        <SiteFooter />
      </main>
      <StickyStart after="fit-title" before="work-end" href={reviewHref} label={reviewLabel} />
    </div>
  );
}
