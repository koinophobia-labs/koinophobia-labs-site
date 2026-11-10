import type { Metadata } from "next";
import Link from "next/link";
import { isPartnerOffer, parsePartnerAttribution, partnerSearchParams } from "@/lib/acquisition/partner-offers";
export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Cancel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { offer, ...refs } = await searchParams;
  const attribution = parsePartnerAttribution(partnerSearchParams(refs));
  return <main className="section simple-page"><p className="kicker kicker-gold">Koinophobia Labs</p><h1>Checkout cancelled.</h1><p>Payment wasn’t completed in this checkout. Return when you’re ready, or contact Blake with questions.</p>{typeof offer === "string" && isPartnerOffer(offer) && attribution ? <p><Link href={`/pay/${offer}?${new URLSearchParams(attribution)}`}>Return to your offer →</Link></p> : null}<p><a href="mailto:blake@koinophobialabs.com">Contact Blake</a></p></main>;
}
