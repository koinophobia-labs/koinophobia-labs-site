import type { Metadata } from "next";
import Link from "next/link";
import DevShell from "@/components/dev/DevShell";
import { labLastUpdated, notes } from "@/lib/dev/lab";

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
          off on purpose, a number I chased for months, a thing I certified and then didn&apos;t
          install. If a note can&apos;t name what broke or which number moved, it doesn&apos;t go
          up.
        </p>
        <p className="devsec__stamp">Updated {labLastUpdated}</p>
      </section>

      <ul className="devnotes__list">
        {notes.map((note) => (
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
