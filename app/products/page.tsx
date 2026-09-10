import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, ProductCard, SectionIntro } from "@/components/studio";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";
import { products } from "@/lib/commercial";

export const metadata: Metadata = { title: "Apps & Products", description: "Download Trendi, Forget About It, and Way In. Explore the available web products and see which projects remain in development.", alternates: { canonical: "/products" }, openGraph: { url: "/products" } };
export default function ProductsPage() {
  return <div className="studio-site"><StudioNav /><main>
    <header className="studio-page-hero"><div className="studio-container studio-page-hero__grid"><div><p className="studio-eyebrow">Products by Koinophobia Labs</p><h1>Find the app for the thing you’re trying to do.</h1><p className="studio-page-hero__lede">Get from an idea to a recording, remember your day, or move your career search forward. Each product has its own walkthrough, download destination, and support.</p></div><aside className="studio-page-hero__aside">Trendi, Forget About It, and Way In are available on the App Store. These are studio-owned products; they do not imply client outcomes.</aside></div></header>
    <section className="studio-section studio-section--compact"><div className="studio-container"><SectionIntro eyebrow="Available now" title="Released apps" /><div className="studio-product-grid">{products.slice(0,3).map(product=><ProductCard product={product} key={product.title} />)}</div></div></section>
    <section className="studio-section"><div className="studio-container"><SectionIntro eyebrow="In your browser" title="Web products" body="Way In’s existing web workflow remains available through the former Career Forge destination. You Know Ball is playable on the web; its iOS release is unverified." /><p><Link className="studio-text-link" href="/way-in#career-forge-web">Way In / Career Forge web access →</Link></p><div className="studio-product-grid">{products.slice(3).map(product=><ProductCard product={product} key={product.title} />)}</div></div></section>
    <section className="studio-section"><div className="studio-container"><SectionIntro eyebrow="Development projects" title="Inside the workshop" body="Koi Cave is a private development project. There is no public download offered here." /><Link className="studio-text-link" href="https://koinophobia.dev/products/koi-cave">Read the Koi Cave development record →</Link></div></section>
    <CTABand /></main><StudioFooter /></div>;
}
