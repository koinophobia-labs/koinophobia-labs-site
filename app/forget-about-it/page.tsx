import type { Metadata } from "next";
import ProductPage from "@/components/site/ProductPage";
import { getSiteProduct } from "@/lib/products";
import { forgetRelease } from "@/lib/releases";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Forget About It, a memory journal for iPhone and Apple Watch",
  description:
    "Raise your wrist, say the thought, and the day writes itself back to you. No account, no server, free on the App Store.",
  alternates: { canonical: `${STUDIO_URL}/forget-about-it` },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: `${STUDIO_URL}/forget-about-it`,
    title: "Forget About It, a memory journal for iPhone and Apple Watch",
    description: "Keep the thought. Come back to your day.",
    images: [{ url: "/forget-about-it/store/1.jpg", width: 600, height: 1304, alt: "Forget About It Today view from the current App Store listing" }],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ForgetAboutIt",
  operatingSystem: "iOS, watchOS",
  applicationCategory: "ProductivityApplication",
  url: `${STUDIO_URL}/forget-about-it`,
  installUrl: forgetRelease.url,
  softwareVersion: forgetRelease.version,
  author: { "@type": "Person", name: "Blake Taylor" },
  publisher: { "@id": `${STUDIO_URL}/#organization` },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ForgetAboutItPage() {
  const product = getSiteProduct("forget-about-it")!;
  return (
    <>
      <ProductPage product={product} analyticsId="forget-about-it" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
