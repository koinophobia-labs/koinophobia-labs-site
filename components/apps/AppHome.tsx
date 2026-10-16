import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/products/ProductAnalytics";
import AppFounder from "./AppFounder";
import { appHomes, publicAppHomes, showPrereleaseAppPages } from "@/lib/app-homes";
import { appPrices, freePrice, wayInPurchaseRequirement, type AppSlug } from "@/lib/app-prices";
import { STUDIO_URL } from "@/lib/seo";
import { appWorlds } from "./AppWorlds";
import { worldSources } from "./WorldParts";
import { WorldBehavior } from "./WorldBehavior";
import "./app-home.css";

export function appHomeMetadata(slug: AppSlug): Metadata {
  const app = appHomes[slug];
  if (app.prerelease && !showPrereleaseAppPages()) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: `${app.name} · ${app.category}`, description: app.intro,
    alternates: { canonical: `${STUDIO_URL}/${slug}` },
    ...(app.prerelease ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title: app.name, description: app.promise, url: `${STUDIO_URL}/${slug}`, images: [{ url: `/apps/${slug}/world-og.png`, width: 1440, height: 1000, alt: `${app.name} app home` }] },
    twitter: { card: "summary_large_image", title: app.name, description: app.promise, images: [`/apps/${slug}/world-og.png`] },
  };
}

export default function AppHome({ slug }: { slug: AppSlug }) {
  const app = appHomes[slug];
  if (app.prerelease && !showPrereleaseAppPages()) notFound();
  const style = {
    "--app-paper": app.colors.paper, "--app-ink": app.colors.ink, "--app-accent": app.colors.accent,
    "--app-surface": app.colors.surface, "--app-muted": app.colors.muted,
  } as CSSProperties;
  const schema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: app.name,
    operatingSystem: app.platforms, url: `${STUDIO_URL}/${slug}`, installUrl: app.store,
    offers: [{ "@type": "Offer", name: freePrice.name, ...(slug === "way-in" ? { description: wayInPurchaseRequirement } : {}), price: freePrice.amount, priceCurrency: "USD" },
      ...appPrices[slug].map(price => ({ "@type": "Offer", name: `${price.name}, ${price.term}`, price: price.amount, priceCurrency: "USD" }))],
  };
  const World = appWorlds[slug];
  return <div className={`app-home app-home--${slug}`} style={style} data-source={worldSources[slug]}>
    {!app.prerelease && <ProductPageView product={slug} />}
    <a className="app-home__skip" href="#app-main">Skip to app</a>
    <header className="world-studio-bar" data-source="WORLDS.md:13–20">
      <Link href="/" className="studio-brand"><Image src="/brand/koi-emblem.svg" alt="" width={22} height={22} /><span>Koinophobia Labs</span></Link>
      <nav aria-label="Studio"><Link href="/shipped">Apps</Link><Link href="/blake">Blake</Link><Link href="/work-with-me">Work with me</Link></nav>
    </header>
    <main id="app-main" className="app-home__main"><World />
      <div className="world-end"><AppFounder founderNote={app.founderNote} />
        <nav className="app-home__help" aria-label={`${app.name} help`} data-source="INVENTORY.md §§1–7; WORLDS.md:13–20"><span>{app.name}</span><Link href={app.support}>Support</Link><Link href={app.privacy}>Privacy</Link></nav>
      </div>
    </main>
    <footer className="world-footer" data-source="WORLDS.md:13–20; INVENTORY.md:510–528">
      <p>Koinophobia Labs · Designed and built by Blake Taylor, Chicago.</p>
      <nav className="app-home__other" aria-label="Other apps"><p>Also from Koinophobia Labs</p><div>{publicAppHomes().filter(other => other.slug !== slug).map(other => <Link key={other.slug} href={`/${other.slug}`} prefetch={false}><Image src={`/apps/${other.slug}/icon.png`} alt="" width={48} height={48} /><span>{other.name}<small>{other.tagline}</small></span></Link>)}</div></nav>
    </footer>
    <WorldBehavior />
    {!app.prerelease && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
  </div>;
}
