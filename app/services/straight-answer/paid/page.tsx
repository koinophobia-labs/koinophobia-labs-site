import type { Metadata } from "next";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import ServicePaidContent from "@/components/site/ServicePaidContent";
import { verifyOfferPayment } from "@/lib/acquisition/service-checkout";
export const metadata: Metadata = { title: "Service payment", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default async function Paid({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const { session_id } = await searchParams;
  const payment = await verifyOfferPayment("straight_answer", typeof session_id === "string" ? session_id : undefined);
  return <div className="site" data-motion-shell><Masthead current="/services"/><main className="shell page b2b"><ServicePaidContent paid={Boolean(payment)} offer="straight_answer"/><SiteFooter/></main></div>;
}
