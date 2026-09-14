import type { Metadata } from "next";
import Masthead from "@/components/site/Masthead";
import EvidenceDetails from "@/components/site/EvidenceDetails";
import SiteFooter from "@/components/site/SiteFooter";
import { shortDate } from "@/components/site/NowStrip";
import { logEntries, logKindLabel, logLastUpdated } from "@/lib/dev/log";
import { getProduct } from "@/lib/dev/universe";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Build log",
  description: "The chronological record of what actually happened across the studio's products, dated and sourced. Nothing is deleted to make it look better.",
  alternates: { canonical: `${STUDIO_URL}/log`, types: { "application/rss+xml": `${STUDIO_URL}/log/feed.xml` } },
  openGraph: { url: `${STUDIO_URL}/log`, title: "Build log · Koinophobia Labs", images: [socialCard("What actually happened.", "Build log")] },
};

const surfaceName = (slug: string) =>
  slug === "site" ? "This site" : slug === "studio" ? "The studio" : (getProduct(slug)?.name ?? slug);

export default function LogPage() {
  const entries = [...logEntries].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s">
            <b>Build log</b> · updated {logLastUpdated}
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            What actually happened.
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Dated entries with sources. Entries before 26 July 2026 were backfilled from release
            records. A wrong entry is corrected by a newer entry that says what was wrong; nothing
            is deleted. <a href="/log/feed.xml">RSS feed</a>.
          </p>
        </header>
        <section className="log-list" aria-label="Entries">
          {entries.map((entry, index) => (
            <article className="log-item s" id={entry.slug} key={entry.slug} style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
              <time dateTime={entry.date}>{shortDate(entry.date)} {entry.date.slice(0, 4)}</time>
              <div>
                <p className="k">
                  {surfaceName(entry.product)} · {logKindLabel[entry.kind]}
                </p>
                <h3>{entry.title}</h3>
                {entry.supersededBy ? <p className="log-update">Historical status. <a href={`#${entry.supersededBy}`}>Read the later release update.</a></p> : null}
                <p>{entry.what}</p>
                <p>
                  <strong>Why.</strong> {entry.why}
                </p>
                <p>
                  <strong>Next.</strong> {entry.next}
                </p>
                {entry.evidence?.length ? (
                  <EvidenceDetails evidence={entry.evidence} />
                ) : null}
              </div>
            </article>
          ))}
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
