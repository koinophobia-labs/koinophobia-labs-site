import type { Metadata } from "next";
import Link from "next/link";
import { STUDIO_URL, socialCard } from "@/lib/seo";

const title = "Blog";
const description = "Practical guides to remembering your dreams and turning service, retail, and gig experience into a résumé.";
const image = socialCard("Small habits. Real experience.", "Blog");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${STUDIO_URL}/blog` },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: `${STUDIO_URL}/blog`,
    title,
    description,
    images: [image],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function BlogPage() {
  return (
    <>
      <header className="page-head">
        <p className="k">Koinophobia Labs · Blog</p>
        <h1>Small habits. Real experience.</h1>
        <p className="lede">Practical guides from the studio behind Dreamcatcher and Way In.</p>
      </header>
      <section aria-label="Posts">
        <article>
          <h2><Link href="/blog/how-to-remember-your-dreams">How to Remember Your Dreams: A Simple Nightly Method That Works</Link></h2>
          <p>Most people forget 95% of their dreams within minutes of waking. Here&#x27;s a simple, science-aligned method to remember more of them — starting tonight.</p>
        </article>
        <article>
          <h2><Link href="/blog/resume-for-service-retail-gig-work">How to Write a Résumé When Your Experience Is Service, Retail, or Gig Work</Link></h2>
          <p>No office job history? Your service, retail, and gig experience is more valuable than you think. Here&#x27;s how to turn it into a résumé that lands interviews.</p>
        </article>
      </section>
    </>
  );
}
