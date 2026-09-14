import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/site/Cards";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { shippedProducts } from "@/lib/products";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shipped",
  description:
    "Trendi, Forget About It, and Way In: three apps built by one person, on the App Store now, with what each one can't do yet.",
  alternates: { canonical: `${STUDIO_URL}/shipped` },
  openGraph: { url: `${STUDIO_URL}/shipped`, title: "Shipped · Koinophobia Labs" },
};

export default function ShippedPage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k s">
            <b>Shipped</b> · on the App Store now
          </p>
          <h1 className="s" style={{ "--i": 1 } as React.CSSProperties}>
            Three apps. One builder. On the App Store now.
          </h1>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            Each one is listed under Blake&apos;s developer account, which is why searching
            &ldquo;Koinophobia Labs&rdquo; on the App Store finds nothing. Use the buttons. Each
            card also says what the app can&apos;t do yet, because that line is where trust is
            decided.
          </p>
        </header>

        <section className="cards" aria-label="Shipped products">
          {shippedProducts.map((product, index) => (
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
            <Link className="btn btn--primary ai" href="/work-with-me" data-analytics="work_with_me_view" data-analytics-label="shipped">
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
