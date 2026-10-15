import type { Metadata } from "next";
import { cookies } from "next/headers";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import AuditPaidContent from "@/components/site/AuditPaidContent";
import { AUDIT_SESSION_COOKIE, verifyAuditPayment } from "@/lib/acquisition/audit-checkout";
export const metadata: Metadata = { title: "Revenue Leak Audit payment", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default async function AuditPaid({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : undefined;
  const payment = await verifyAuditPayment(sessionId);
  const browserSession = (await cookies()).get(AUDIT_SESSION_COOKIE)?.value;
  // No Stripe/customer object crosses into rendered HTML or client props.
  return <div className="site" data-motion-shell><Masthead current="/work-with-us"/><main className="shell page b2b"><AuditPaidContent paid={Boolean(payment)} canBook={Boolean(payment && browserSession === sessionId)}/><SiteFooter/></main></div>;
}
