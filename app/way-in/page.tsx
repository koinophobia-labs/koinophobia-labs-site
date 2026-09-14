import type { Metadata } from "next";
import ProductPage from "@/components/site/ProductPage";
import { getSiteProduct } from "@/lib/products";
import { wayInRelease } from "@/lib/releases";
import { withLiveListing } from "@/lib/app-store";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Way In, a private career workspace for iPhone and iPad",
  description:
    "Turn the experience you actually have into a résumé a stranger can judge in six seconds. Nothing invented. Free on the App Store.",
  alternates: { canonical: `${STUDIO_URL}/way-in` },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: `${STUDIO_URL}/way-in`,
    title: "Way In, a private career workspace for iPhone and iPad",
    description: "Your experience. A clearer next move.",
    images: [socialCard("Your experience. A clearer next move.", "Way In · iPhone + iPad")],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Way In: Career Hub",
  operatingSystem: "iOS, iPadOS",
  applicationCategory: "ProductivityApplication",
  url: `${STUDIO_URL}/way-in`,
  installUrl: wayInRelease.url,
  softwareVersion: wayInRelease.version,
  author: { "@type": "Person", name: "Blake Taylor" },
  publisher: { "@id": `${STUDIO_URL}/#organization` },
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "29.99", priceCurrency: "USD", name: "30-Day Career Pass" },
    { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Resume Toolkit" },
  ],
};

export default async function WayInPage() {
  const product = await withLiveListing(getSiteProduct("career-forge")!);
  return (
    <>
      <ProductPage product={product} analyticsId="way-in" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
