import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gelasio, Hanken_Grotesk, Newsreader, Source_Serif_4 } from "next/font/google";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import AppStoreBadge from "@/components/site/AppStoreBadge";
import { ProductPageView } from "@/components/products/ProductAnalytics";
import AppPricing from "./AppPricing";
import { appHomes, publicAppHomes, showPrereleaseAppPages } from "@/lib/app-homes";
import { appPrices, freePrice, type AppSlug } from "@/lib/app-prices";
import { STUDIO_URL } from "@/lib/seo";
import "./app-home.css";

const gelasio = Gelasio({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], display: "swap" });
const source = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
const fonts = { gelasio, source, newsreader };

export function appHomeMetadata(slug: AppSlug): Metadata {
  const app = appHomes[slug];
  if (app.prerelease && !showPrereleaseAppPages()) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: `${app.name} · ${app.category}`, description: app.intro,
    alternates: { canonical: `${STUDIO_URL}/${slug}` },
    ...(app.prerelease ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title: app.name, description: app.promise, url: `${STUDIO_URL}/${slug}`, images: [{ url: `/apps/${slug}/icon.png`, width: 1024, height: 1024, alt: app.name }] },
    twitter: { card: "summary", title: app.name, description: app.promise, images: [`/apps/${slug}/icon.png`] },
  };
}

export default function AppHome({ slug }: { slug: AppSlug }) {
  const app = appHomes[slug];
  if (app.prerelease && !showPrereleaseAppPages()) notFound();
  const style = {
    "--app-paper": app.colors.paper, "--app-ink": app.colors.ink, "--app-accent": app.colors.accent,
    "--app-surface": app.colors.surface, "--app-muted": app.colors.muted,
    "--app-display": fonts[app.font].style.fontFamily,
    "--app-body": slug === "trendi" ? hanken.style.fontFamily : fonts[app.font].style.fontFamily,
  } as CSSProperties;
  const schema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: app.name,
    operatingSystem: app.platforms, url: `${STUDIO_URL}/${slug}`, installUrl: app.store,
    offers: [{ "@type": "Offer", name: freePrice.name, price: freePrice.amount, priceCurrency: "USD" },
      ...appPrices[slug].map(price => ({ "@type": "Offer", name: `${price.name}, ${price.term}`, price: price.amount, priceCurrency: "USD" }))],
  };
  return <div className={`app-home app-home--${slug}`} style={style}>
    {!app.prerelease && <ProductPageView product={slug} />}
    <Masthead current="/shipped" />
    <a className="app-home__skip" href="#app-main">Skip to app</a>
    <main id="app-main" className="app-home__main">
      <section className="app-home__hero" aria-labelledby="app-title">
        <div className="app-home__identity"><Image src={`/apps/${slug}/icon.png`} alt={`${app.name} app icon`} width={112} height={112} sizes="112px" preload /><span>{app.name}<small>{app.platforms}</small></span></div>
        <div className="app-home__hero-grid">
          <div><p className="app-home__eyebrow">{app.category}</p><h1 id="app-title">{app.promise}</h1></div>
          <div className="app-home__hero-aside"><p className="app-home__intro">{app.intro}</p>
            {app.store ? <AppStoreBadge product={slug} url={app.store} placement="product_hero" /> : <p className="app-home__coming">{app.coming}</p>}
            <a className="app-home__text-link" href="#pricing">Free to download · See pricing <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
      <section className="app-home__demos" aria-labelledby="demo-title">
        <div className="app-home__section-head"><div><p className="app-home__eyebrow">{app.prerelease ? "From the submitted listing" : "From the App Store listing"}</p><h2 id="demo-title">A look inside.</h2></div><p className="app-home__scroll-hint">Scroll to explore <span aria-hidden="true">→</span></p></div>
        <div className={`app-home__gallery${app.landscape ? " app-home__gallery--wide" : ""}`} tabIndex={0} role="region" aria-label={`${app.name} screenshots. Scroll horizontally to see all ${app.screens.length}.`}>
          {app.screens.map((caption, i) => <figure key={caption}>
            <Image src={`/apps/${slug}/shot-${i + 1}.png`} alt={`${app.name}: ${caption}`} width={app.landscape ? 1440 : slug === "preaching-to-the-choir" ? 1284 : 1320} height={app.landscape ? 900 : slug === "preaching-to-the-choir" ? 2778 : 2868} sizes={app.landscape ? "(max-width: 600px) 85vw, 720px" : "(max-width: 600px) 72vw, 270px"} loading={i === 0 ? "eager" : "lazy"} />
            <figcaption><span>{String(i + 1).padStart(2, "0")}</span>{caption}</figcaption>
          </figure>)}
        </div>
      </section>
      <section className="app-home__features" aria-labelledby="features-title"><p className="app-home__eyebrow">What it does</p><h2 id="features-title">{slug === "preaching-to-the-choir" ? "A place for your words." : slug === "old-dog" ? "A little wiser, every day." : "Made to be used."}</h2>
        <div className="app-home__feature-grid">{app.features.map((feature, i) => <article key={feature.title}><span className="app-home__number">{String(i + 1).padStart(2, "0")}</span><h3>{feature.title}</h3><p>{feature.body}</p></article>)}</div>
      </section>
      <AppPricing slug={slug} free={app.free} prerelease={app.prerelease} />
      <section className="app-home__founder" aria-labelledby="founder-title"><div><p id="founder-title" className="app-home__eyebrow">From Blake</p><p className="app-home__signature">One builder. Chicago.</p></div><div><blockquote>{app.founder}</blockquote><Link href="/blake">Blake Taylor <span aria-hidden="true">↗</span></Link></div></section>
      <nav className="app-home__help" aria-label={`${app.name} help`}><span>{app.name}</span><Link href={app.support}>Support</Link><Link href={app.privacy}>Privacy</Link></nav>
      <nav className="app-home__other" aria-label="Other apps"><p className="app-home__eyebrow">Also from Koinophobia Labs</p>{publicAppHomes().filter(other => other.slug !== slug).map(other => <Link key={other.slug} href={`/${other.slug}`}>{other.name}<span aria-hidden="true">↗</span></Link>)}</nav>
    </main>
    <div className="app-home__studio-footer"><SiteFooter /></div>
    {!app.prerelease && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
  </div>;
}
