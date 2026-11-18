import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { withLiveListings } from "@/lib/app-store";
import { shippedProducts, liveAppCount } from "@/lib/products";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shipped",
  description:
    `${liveAppCount} apps I built and shipped: Trendi, Forget About It, Way In, Old Dog, Preaching to the Choir, Teacher’s Pet, and Dreamcatcher.`,
  alternates: { canonical: `${STUDIO_URL}/shipped` },
  openGraph: { url: `${STUDIO_URL}/shipped`, title: "Shipped · Koinophobia Labs", images: [socialCard(`${liveAppCount} apps. Built and shipped by me.`, "Shipped")] },
};

export default async function ShippedPage() {
  const shipped = await withLiveListings(shippedProducts);
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s">
            <b>Shipped</b> · on the App Store now
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            {liveAppCount} apps. Built and shipped by me.
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Choose an app, watch a short demo, or download it from the App Store.
            The listings are published under my developer account.
          </p>
        </header>

        <section className="cards" aria-label="Shipped products">
          {shipped.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} placement="shipped" showNotYet />
          ))}
        </section>

        <section className="sec glass" aria-labelledby="shipped-end">
          <h2 id="shipped-end" className="s">
            Want one of these built for your idea?
          </h2>
          <p className="lede s" style={{ "--i": 1 } as React.CSSProperties}>
            The same pipeline is for hire: native Apple apps, working prototypes, and AI features
            with a deterministic frame.
          </p>
          <div className="actions s" style={{ "--i": 2 } as React.CSSProperties}>
            <Link className="btn btn--primary ai" href="/work-with-me">
              Work with me <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="shipped-end" />
    </div>
  );
}
