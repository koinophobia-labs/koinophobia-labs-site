import { LINKS } from "@/lib/links";
import Link from "next/link";
import AuditBookingForm from "@/components/site/AuditBookingForm";
import { AUDIT_BOOKING_URL } from "@/lib/acquisition/audit-config";

export default function AuditPaidContent({ paid, canBook = false }: { paid: boolean; canBook?: boolean }) {
  if (!paid) return <section className="b2b-hero"><h1>We couldn&apos;t confirm a payment</h1><p>If you just paid, try refreshing this page in a moment.</p><Link className="btn" href="/audit">Back to the Revenue Leak Audit</Link></section>;
  return <section className="b2b-hero"><p className="k">Revenue Leak Audit</p><h1>Paid: Revenue Leak Audit, $250</h1><p className="lede">Next, tell Blake about your business and suggest a time to talk.</p><p>Blake will confirm your call within one business day.</p><p>Your payment receipt comes from Stripe.</p>
    {AUDIT_BOOKING_URL ? <a className="btn btn--primary" href={AUDIT_BOOKING_URL}>Book your call</a> : canBook ? <AuditBookingForm/> : <p>To send preferred times, open this confirmation in the browser you used to pay. If you need help, contact <a href={LINKS.email}>Blake</a>.</p>}
  </section>;
}
