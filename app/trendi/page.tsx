import type { Metadata } from "next";
import ProductPage from "@/components/site/ProductPage";
import { getSiteProduct } from "@/lib/products";
import { trendiRelease } from "@/lib/releases";
import { withLiveListing } from "@/lib/app-store";
import { STUDIO_URL, socialCard } from "@/lib/seo";

// The Trendi product page. Every fact is read from lib/products.ts and
// lib/dev/universe.ts; the App Store link is trendiRelease.url. The July 2026
// tester chapter lives in the dated build log, not here.

export const metadata: Metadata = {
  title: "Trendi, a content coach for iPhone",
  description:
    "Say a messy thought. Get one angle, three hooks, a script, a caption, and a shot plan, then record it with the teleprompter. Free on the App Store.",
  alternates: { canonical: `${STUDIO_URL}/trendi` },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: `${STUDIO_URL}/trendi`,
    title: "Trendi, a content coach for iPhone",
    description: "Say it messy. Leave with words you can say on camera.",
    images: [socialCard("Say it messy. Leave with words you can say on camera.", "Trendi · content coach for iPhone")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendi, a content coach for iPhone",
    description: "Say it messy. Leave with words you can say on camera.",
    images: [socialCard("Say it messy. Leave with words you can say on camera.", "Trendi · content coach for iPhone").url],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Trendi: Content Coach",
  operatingSystem: "iOS",
  applicationCategory: "MultimediaApplication",
  url: `${STUDIO_URL}/trendi`,
  installUrl: trendiRelease.url,
  softwareVersion: trendiRelease.version,
  author: { "@type": "Person", name: "Blake Taylor" },
  publisher: { "@id": `${STUDIO_URL}/#organization` },
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "7.99", priceCurrency: "USD", name: "Trendi Pro, monthly" },
  ],
};

export default async function TrendiPage() {
  const product = await withLiveListing(getSiteProduct("trendi")!);
  return (
    <>
      <ProductPage product={product} analyticsId="trendi" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
