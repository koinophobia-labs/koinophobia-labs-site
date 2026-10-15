import Link from "next/link";
import ServiceOnboardingForm from "./ServiceOnboardingForm";
import ServiceContact from "./ServiceContact";
import type { NewServiceOffer } from "@/lib/acquisition/services-config";
export default function ServicePaidContent({ paid, offer }: { paid: boolean; offer: NewServiceOffer }) {
  if (!paid) return <section className="b2b-hero"><h1>We couldn&apos;t confirm a payment</h1><p>If you just paid, try refreshing this page in a moment.</p><Link className="btn" href="/services">Back to services</Link><ServiceContact/></section>;
  const review = offer === "straight_answer";
  return <section className="b2b-hero"><p className="k">{review ? "Straight Answer · Build Readiness Review" : "Monthly support retainer"}</p><h1>{review ? "Paid: Straight Answer, $250" : "Paid: Monthly support, $500/month"}</h1><p className="lede">{review ? "Send your PRD or spec so Blake can review it." : "Tell Blake what we’re supporting and who to contact for access."}</p><p>Your payment receipt comes from Stripe.</p>{!review ? <><p>Monitoring, small fixes and a monthly check-in. Up to 5 hours per month. Unused hours don’t roll over. Cancel anytime.</p><ServiceContact cancellation/></> : null}<ServiceOnboardingForm offer={offer}/></section>;
}
