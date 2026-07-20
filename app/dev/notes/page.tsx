import type { Metadata } from "next";
import Link from "next/link";
import DevShell from "@/components/dev/DevShell";
import { labLastUpdated, publishedNotes } from "@/lib/dev/lab";

// koinophobia.dev/notes via host rewrite. Build logs, not essays.

export const metadata: Metadata = {
  title: { absolute: "Field Notes — Blake Taylor" },
  description:
    "Build logs from the products: what broke, what number moved, and which decisions I'd defend.",
  alternates: { canonical: "https://koinophobia.dev/notes" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/notes",
    title: "Field Notes — Blake Taylor",
    description: "What broke, what number moved, and what I changed my mind about.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
};

export default function DevNotesPage() {
  return (
    <DevShell current="/notes" narrow>
      <section className="devsec__head">
        <p className="devpage__kicker">Field notes</p>
        <h1>What broke, and what it cost me to find out.</h1>
        <p className="devpage__lede">
          Not essays. These are notes from inside the build — a blocked release, a feature I turned
          off on purpose, an audit that caught my own site getting its facts wrong. If a note
          can&apos;t name what broke, and point at something that proves it, it doesn&apos;t go up.
        </p>
        <p className="devsec__stamp">Updated {labLastUpdated}</p>
      </section>

      {publishedNotes.length === 0 ? (
        // Honest empty state rather than a 404. The route is unlinked from the
        // nav while it's empty, but anyone arriving from a sitemap, a bookmark
        // or a search result gets told what's actually going on.
        <p className="devnotes__empty">
          Nothing published yet. The notes are written and sitting in the
          repository — I haven&apos;t read them closely enough to put my name on
          them in public, and a byline I haven&apos;t checked is exactly the kind
          of claim the rest of this site exists to avoid. They&apos;ll go up as I
          clear them.
        </p>
      ) : null}

      <ul className="devnotes__list">
        {publishedNotes.map((note) => (
          <li className="devnotes__item" key={note.slug}>
            <Link className="devnotes__link" href={`/notes/${note.slug}`}>
              <div className="devnotes__meta">
                <span>{note.date}</span>
                <span>{note.tag}</span>
              </div>
              <h2>{note.title}</h2>
              <p className="devnotes__hook">{note.hook}</p>
            </Link>
          </li>
        ))}
      </ul>
    </DevShell>
  );
}
