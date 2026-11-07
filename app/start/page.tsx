import { freeStraightAnswerAvailable } from "@/lib/acquisition/services-config";
import type { Metadata } from "next";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StartForm from "@/components/site/StartForm";
import Link from "next/link";
import { intakeEntry, intakeHref, type EntryQuery } from "@/lib/acquisition/entry";
import { replyPromise } from "@/lib/products";
import { CONTACT_EMAIL } from "@/lib/contact";
import { LINKS } from "@/lib/links";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Start a project",
  description: `Tell Blake the idea in two paragraphs. Hear back ${replyPromise} with a real answer.`,
  alternates: { canonical: `${STUDIO_URL}/start` },
  robots: { index: false, follow: true },
};

export default async function StartPage({ searchParams }: { searchParams: Promise<EntryQuery> }) {
  const { source, offer, business } = intakeEntry(await searchParams);
  const readiness = offer === "readiness";
  const appStore = offer === "app-store";
  return (
    <div className="site" data-motion-shell>
      <Masthead current={business ? "/work-with-us" : "/work-with-me"} />
      <main className="shell page">
        <section className="two" aria-labelledby="start-title">
          <div className="page-head">
            <p className="k s">
              <b>{appStore ? "App Store launch packages" : business ? offer === "audit" ? "Revenue Leak Audit · $250" : "Work With Us" : readiness ? "Straight Answer" : "Start a project"}</b>
            </p>
            <h1 id="start-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              {appStore ? "Send me the app. You’ll get a straight answer." : business ? "Tell Blake what’s slipping." : readiness ? "Send the spec. Get a straight answer." : "Tell me the idea."}
            </h1>
            <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
              {appStore ? (<>Tell me what you have and where you’re stuck. I’ll confirm the right package and written scope before any paid work. This inquiry takes no payment. App Store approval is not guaranteed.</>) : business ? (<>Share the problem in one line. Blake will follow up to confirm fit and the next step. An audit request does not book a time or take payment.</>) : readiness ? (
                <>You get a short written review: what&apos;s buildable now, what&apos;s missing, the major risks, and what it would take to ship.</>
              ) : (
                <>Two paragraphs are plenty. You&apos;ll hear back {replyPromise}, and the reply might be a question, or &ldquo;don&apos;t build this yet.&rdquo;</>
              )}
            </p>
            <p className="s">Prefer email? <a href={`${LINKS.email}?subject=Project%20idea`}>{CONTACT_EMAIL}</a></p>
            {readiness ? <p className="s"><strong>{freeStraightAnswerAvailable() ? "Free for my first five founders." : "Straight Answer · $250"}</strong></p> : null}
            <p className="s" style={{ "--i": 3 } as React.CSSProperties}>
              {appStore ? <Link href="/work-with-me#app-store-packages">Review packages, prices and scope.</Link> : business ? <Link href={intakeHref(source, "readiness", false)}>Founder with a PRD? Use the Straight Answer path.</Link> : <Link href={intakeHref(source, "", true)}>Running a business? Use the business intake.</Link>}
            </p>
          </div>
          <div className="s" style={{ "--i": 2 } as React.CSSProperties}>
            {readiness && !freeStraightAnswerAvailable() ? <Link className="btn btn--primary" href="/services#straight-answer">Pay $250 for a Straight Answer</Link> : <StartForm key={`${source}:${offer}:${business}`} readiness={readiness} source={source} offer={offer} business={business} entry={appStore ? "app-store" : business ? "business" : readiness ? "readiness" : "start"} />}
          </div>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
