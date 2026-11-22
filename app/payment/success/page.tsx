import { PaidJobLink } from "@/components/team/PaidJobLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Received",
  robots: { index: false, follow: false },
};

export default async function Page({searchParams}:{searchParams:Promise<{session_id?:string}>}){const {session_id}=await searchParams;return <main className="section simple-page"><p className="kicker kicker-gold">Payment received</p><h1>Thank you.</h1><p>Stripe is confirming the payment. Koinophobia Labs will follow up with the next project step.</p>{await PaidJobLink({sessionId:session_id})}</main>}
