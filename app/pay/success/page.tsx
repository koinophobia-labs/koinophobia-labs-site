import type { Metadata } from "next";
import { verifyOfferPayment } from "@/lib/acquisition/service-checkout";
import { isPartnerOffer } from "@/lib/acquisition/partner-offers";
export const metadata: Metadata = { title: "Payment confirmation", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default async function Success({ searchParams }: { searchParams: Promise<{ offer?: string | string[]; session_id?: string | string[] }> }) {
  const { offer, session_id } = await searchParams;
  const payment = typeof offer === "string" && isPartnerOffer(offer) && typeof session_id === "string" ? await verifyOfferPayment(offer, session_id) : null;
  return <main className="section simple-page"><p className="kicker kicker-gold">Koinophobia Labs</p><h1>{payment ? "Paid. Blake will reach out within one business day to start." : "We couldn’t confirm payment yet."}</h1><p>{payment ? "Reply with your business name, website and the scope you agreed with Blake. Please don’t email passwords." : "If you just paid, refresh shortly. Contact Blake if you need help before trying another payment."}</p><p><a href="mailto:blake@koinophobialabs.com">Contact Blake →</a></p></main>;
}
