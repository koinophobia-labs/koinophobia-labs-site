import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Received",
  robots: { index: false, follow: false },
};

export default function Page(){return <main className="section simple-page"><p className="kicker kicker-gold">Payment received</p><h1>Thank you.</h1><p>Stripe is confirming the payment. Koinophobia Labs will follow up with the next project step.</p></main>}
