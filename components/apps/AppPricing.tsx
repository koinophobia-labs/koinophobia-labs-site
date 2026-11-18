import { appPrices, freePrice, type AppSlug } from "@/lib/app-prices";

export default function AppPricing({ slug, free, prerelease }: { slug: AppSlug; free: string; prerelease?: boolean }) {
  const prices = appPrices[slug];
  const titles = { trendi: "Start free. Choose your Pro plan.", "way-in": "One payment each. Nothing renews.", "forget-about-it": "Every word. Every year.", "preaching-to-the-choir": "III / Keeper", "old-dog": "Your bookplate", "teachers-pet": "Result / Family", dreamcatcher: "Back to night" };
  const notes = { trendi: "Annual includes a seven-day free trial for eligible subscribers. Apple shows your local price and trial eligibility before purchase.", "way-in": "", "forget-about-it": "", "preaching-to-the-choir": "Without Keeper, every prayer stays yours to keep, read, search and export.", "old-dog": "One-time purchase. Not a subscription.", "teachers-pet": "Family subscriptions are offered through the App Store. Apple determines introductory-offer eligibility.", dreamcatcher: "" };
  return <section className="app-home__pricing" id="pricing" data-school-step aria-labelledby="pricing-title">
    <div><p className="app-home__eyebrow">The price, plainly · USA</p><h2 id="pricing-title">{titles[slug]}</h2>{notes[slug] && <p>{notes[slug]}</p>}</div>
    <div className="app-home__price-card" data-prices={slug}>
      <div className="app-home__free"><h3>{freePrice.name}{prerelease ? " when released" : ""}</h3><p>{free}</p></div>
      <dl>{prices.map(price => <div className="app-home__price" key={`${price.name}-${price.term}`}>
        <dt>{price.name}<small>{price.detail}</small></dt>
        <dd><strong data-price={price.amount}>${price.amount}</strong><span>{price.term}</span>{(price.term === "monthly" || price.term === "yearly" || price.term === "first year") && <small className="renewal">Renews unless cancelled.</small>}</dd>
      </div>)}</dl>
      {prices.some(price => price.term === "monthly" || price.term === "yearly") && <p className="app-home__terms">{slug === "trendi" ? "Payment is charged to your Apple Account. Cancel at least 24 hours before the trial or current period ends to avoid renewal. Manage or cancel in your App Store account settings." : "Subscriptions renew unless cancelled in your App Store settings."}</p>}
    </div>
  </section>;
}
