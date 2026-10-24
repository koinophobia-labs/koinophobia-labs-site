import { freeStraightAnswerAvailable } from "@/lib/acquisition/services-config";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import PageView from "@/components/site/PageView";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { trendiRelease, forgetRelease, wayInRelease, oldDogRelease, preachingRelease, dreamcatcherRelease } from "@/lib/releases";
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

// Original five listings: Evidence/WO-0118/apple-lookup.json. Six live apps confirmed in WO-0160.
const listings = [
  { slug: "career-forge", name: "Way In: Resume & Job Search", platforms: "iOS", url: "https://apps.apple.com/us/app/way-in-resume-job-search/id6807942376", version: wayInRelease.version },
  { slug: "trendi", name: "Trendi: Content Coach", platforms: "iOS", url: "https://apps.apple.com/us/app/trendi-content-coach/id6776299336", version: trendiRelease.version },
  { slug: "forget-about-it", name: "ForgetAboutIt", platforms: "iOS + watchOS", url: "https://apps.apple.com/us/app/forgetaboutit/id6804360983", version: forgetRelease.version },
  { slug: "old-dog", name: "Old Dog", platforms: "macOS", url: "https://apps.apple.com/us/app/old-dog/id6813966822", version: oldDogRelease.version },
  { slug: "preaching-to-the-choir", name: "Preaching to the Choir", platforms: "iOS / iPadOS", url: "https://apps.apple.com/us/app/preaching-to-the-choir/id6808442357", version: preachingRelease.version },
  { slug: "dreamcatcher", name: "Dreamcatcher: Night Journal", platforms: "iOS", url: dreamcatcherRelease.url, version: dreamcatcherRelease.version },
];

const steps = [
  { title: "I review what’s ready to build", body: "A written review of what’s buildable, what’s missing, the risks and what it takes to ship." },
  { title: "I plan the architecture and milestones", body: "Platform choices, stack, data model and a milestone plan you approve." },
  { title: "I build against your spec", body: "Your Figma integrated into working builds, delivered at each milestone." },
  { title: "I check the agreed scope", body: "QA against the release plan, with test coverage, findings and remaining gaps documented." },
  { title: "I prepare your app for release", body: "The store listing, privacy answers, review notes, screenshots plan and TestFlight." },
  { title: "I ship and handle App Review", body: "App Store submission, App Review handling, launch checks and handover." },
];

const launchPackages = [
  {
    name: "Launch Review", price: "$250", terms: "A written go/no-go before you commit.",
    body: "A review of your existing app and App Store Connect setup: a ranked fix list plus metadata, privacy and in-app-purchase checks.",
    timing: "Typical work window: 3–5 business days.",
  },
  {
    name: "Get It Approved", price: "$400–$600", terms: "Per-app fix. A $150–$200 diagnosis is credited toward that total; part is paid on approval.",
    body: "Fix the blockers within the written quote, draft review replies and handle up to 2 resubmissions. The quote sets the payment split. Approval is not guaranteed.",
    timing: "Typical work window: 1–2 weeks, plus Apple’s review time.",
  },
  {
    name: "AI-built App Launch Pack", price: "$750–$1,500", terms: "For an existing app built with AI that needs a path to launch.",
    body: "Readiness review, agreed release fixes, QA, listing preparation and submission support. The written scope sets the fixes and resubmission cap; new features or a rebuild need a new quote.",
    timing: "Schedule confirmed after reviewing the build.",
  },
  {
    name: "Build to Launch", price: "$2,500–$5,000", terms: "Fixed milestones. 50% to start.",
    body: "Take a spec or prototype through milestone builds on TestFlight, QA, store listing, submission and launch support.",
    timing: "Typical work window: 4–10 weeks, with Apple’s review timing outside my control.",
  },
];

const launchFaq = [
  { question: "Can you guarantee approval?", answer: "No. App Store approval is not guaranteed. I identify likely blockers, fix the agreed scope and help with review replies. Apple makes the decision." },
  { question: "Whose account is it?", answer: "Yours. You own and pay for the Apple Developer membership. Access is by role invite only, never shared credentials. Your app, code and listing stay yours." },
  { question: "What do you work with?", answer: "Native iPhone, iPad and Mac apps. Other stacks get an honest answer in the review. A web wrapper may need a separately quoted rebuild." },
  { question: "How fast is review?", answer: "Apple sets the clock. Review waits vary and are outside the work estimates; time waiting for Apple does not count as work hours." },
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
            <a className="btn ai" href="#app-store-packages">App Store launch packages <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
        </header>

        <section className="sec" id="app-store-packages" aria-labelledby="launch-title">
          <p className="k s">App Store launch packages</p>
          <h2 id="launch-title" className="s">Get your app on the App Store.</h2>
          <p className="lede s">You built it with AI. I’ll help you get it ready for review. I ship my own apps the same way.</p>
          <p className="s"><strong>App Store approval is not guaranteed. Apple makes the final decision.</strong></p>
          <div className="pblocks">
            {launchPackages.map((pkg, index) => (
              <article className="pblock s" key={pkg.name} style={{ "--i": index } as React.CSSProperties}>
                <span className="k">{String(index + 1).padStart(2, "0")}</span>
                <h3>{pkg.name}</h3>
                <p><strong>{pkg.price}</strong></p>
                <p>{pkg.terms}</p>
                <p>{pkg.body}</p>
                <p>{pkg.timing}</p>
              </article>
            ))}
          </div>
          <p className="s">For a review or rescue, you provide a build or repo, an App Store Connect role invite when needed, and any rejection text. For a build, bring your spec or Figma, developer account, content and decisions. Work windows depend on the agreed scope and timely answers; we confirm availability before starting.</p>
          <div className="actions s">
            <Link className="btn btn--primary ai" href="/start?offer=app-store&src=work-with-me" data-analytics="inquiry_start" data-analytics-label="app_store_launch">
              Send me the app <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <p className="s">You’ll get a straight answer. Send app details first; access is arranged after we agree on the work.</p>
        </section>

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
          <h2 id="proof-title" className="s">Six apps. Live on the App Store and Mac App Store.</h2>
          <p className="lede s">100 downloads. Paying subscribers.</p>
          <p className="s">These are my own apps. I’ve fixed my own App Review rejections and shipped. I build with Claude and Codex, with independent review.</p>
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
                  appStore: { url: listing.url, version: listing.version, verifiedAt: existing?.appStore?.verifiedAt ?? wayInRelease.verifiedAt, priceLine: "" },
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
          <p className="s">Fixes, revisions, resubmissions and support are capped in the written scope. New features, extra polish or a rebuild need a new quote. Review waits don’t count as work hours.</p>
          <p className="s">Client work stays out of my internal studio workspace and my videos unless you give written permission.</p>
        </section>

        <section className="sec" aria-labelledby="launch-faq-title">
          <p className="k s">App Store questions</p>
          <h2 id="launch-faq-title" className="s">Before we start.</h2>
          <div className="pblocks">
            {launchFaq.map((item) => <div className="pblock s" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
          </div>
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
