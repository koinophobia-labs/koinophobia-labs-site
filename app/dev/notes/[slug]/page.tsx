import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import DevShell from "@/components/dev/DevShell";
import { getNote, publishedNotes } from "@/lib/dev/lab";

export function generateStaticParams() {
  return publishedNotes.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const note = getNote((await params).slug);
  if (!note) return {};
  const url = `https://koinophobia.dev/notes/${note.slug}`;
  return {
    title: { absolute: `${note.title} — Blake Taylor` },
    description: note.hook,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "koinophobia.dev",
      url,
      title: note.title,
      description: note.hook,
      publishedTime: note.date,
      images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.hook,
      images: ["https://koinophobia.dev/og-founder.png"],
    },
  };
}

export default async function DevNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const note = getNote((await params).slug);
  if (!note) notFound();

  const index = publishedNotes.findIndex((n) => n.slug === note.slug);
  const next = publishedNotes[index + 1];

  return (
    <DevShell current="/notes" narrow fieldX="26%">
      <article>
        <header className="devnote__head">
          <Link className="devpage__back" href="/notes">
            <ArrowLeft size={13} aria-hidden="true" /> Field notes
          </Link>
          <div className="devnotes__meta" style={{ marginTop: 22 }}>
            <span>{note.date}</span>
            <span>{note.tag}</span>
          </div>
          <h1>{note.title}</h1>
        </header>

        <div className="devnote__body">
          {note.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </article>

      <nav className="devprod__nextprev" aria-label="More notes">
        <Link className="devpage__back" href="/notes">
          <ArrowLeft size={13} aria-hidden="true" /> All notes
        </Link>
        {next ? (
          <Link className="devpage__back" href={`/notes/${next.slug}`}>
            Next: {next.title} <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        ) : null}
      </nav>
    </DevShell>
  );
}
