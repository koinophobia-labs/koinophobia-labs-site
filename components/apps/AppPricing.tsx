import { appPrices, freePrice, type AppSlug } from "@/lib/app-prices";

export default function AppPricing({ slug, free, prerelease }: { slug: AppSlug; free: string; prerelease?: boolean }) {
  const prices = appPrices[slug];
  return <section className="app-home__pricing" id="pricing" aria-labelledby="pricing-title">
    <div><p className="app-home__eyebrow">The price, plainly · USA</p><h2 id="pricing-title">Start here.</h2><p>{prerelease ? "Planned App Store pricing. Not available to purchase yet." : "Download from the App Store. Choose a paid option if it fits what you need."}</p></div>
    <div className="app-home__price-card" data-prices={slug}>
      <div className="app-home__free"><h3>{freePrice.name}{prerelease ? " when released" : ""}</h3><p>{free}</p></div>
      <dl>{prices.map(price => <div className="app-home__price" key={`${price.name}-${price.term}`}>
        <dt>{price.name}<small>{price.detail}</small></dt>
        <dd><strong data-price={price.amount}>${price.amount}</strong><span>{price.term}</span></dd>
      </div>)}</dl>
      {prices.some(price => price.term === "monthly" || price.term === "yearly") && <p className="app-home__terms">Subscriptions renew unless cancelled in your App Store settings.</p>}
    </div>
  </section>;
}
