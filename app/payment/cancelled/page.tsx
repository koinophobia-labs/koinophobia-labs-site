import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Not Completed",
  robots: { index: false, follow: false },
};

export default function Page(){return <main className="section simple-page"><p className="kicker kicker-gold">Payment not completed</p><h1>No charge was made.</h1><p>You can return to the secure Stripe payment link when you are ready or contact Koinophobia Labs for help.</p></main>}
