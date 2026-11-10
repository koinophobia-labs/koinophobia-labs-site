import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import { isPartnerOffer, partnerOffers, parsePartnerAttribution, partnerSearchParams } from "@/lib/acquisition/partner-offers";
export const metadata: Metadata = { title: "Secure payment", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Pay({ params, searchParams }: { params: Promise<{ offer: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { offer } = await params;
  if (!isPartnerOffer(offer)) notFound();
  const attribution = parsePartnerAttribution(partnerSearchParams(await searchParams));
  const config = partnerOffers[offer];
  return <div className="site" data-motion-shell><Masthead current="/work-with-me" /><main className="shell page b2b"><section className="section simple-page"><p className="kicker kicker-gold">Koinophobia Labs · Secure payment</p><h1>{config.name}</h1><p>{config.description}</p><h2>{config.terms}</h2><p>{config.timeline}. Work starts after payment.</p>{attribution ? <form method="post" action={`${config.path}/checkout?${new URLSearchParams(attribution)}`}><button className="button button-primary" type="submit">{offer === "care" ? "Subscribe for $99/month" : `Pay $${config.amount / 100}`} →</button><p>Checkout is securely handled by Stripe. Blake will reach out within one business day to start.</p></form> : <p role="alert">This payment link has invalid references. Ask your partner for a new link.</p>}<p><a href="mailto:blake@koinophobialabs.com">Ask Blake a question</a></p></section><SiteFooter /></main></div>;
}
