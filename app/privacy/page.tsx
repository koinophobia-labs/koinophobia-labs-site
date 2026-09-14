import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this website measures, and where each app's privacy policy lives.",
  alternates: { canonical: `${STUDIO_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <header className="page-head">
          <p className="k">Privacy</p>
          <h1>What this site measures, and what it doesn&apos;t.</h1>
          <p className="lede">
            This website measures page visits and outbound clicks (App Store, TestFlight, the web
            demo, social links) with Vercel Analytics. The project form stores what you type in it
            so Blake can reply; obvious secrets are masked before storage. Nothing else is
            collected. The apps have their own policies:
          </p>
        </header>
        <section className="sec">
          <ul>
            <li>
              <Link href="/trendi/privacy">Trendi privacy policy</Link> · <Link href="/trendi/support">support</Link>
            </li>
            <li>
              <Link href="/forget-about-it/privacy">Forget About It privacy policy</Link> ·{" "}
              <Link href="/forget-about-it/support">support</Link>
            </li>
            <li>
              <a href="https://careerforge.koinophobialabs.com/privacy">Way In privacy policy</a>
            </li>
            <li>
              <Link href="/you-know-ball/privacy">You Know Ball privacy policy</Link> ·{" "}
              <Link href="/you-know-ball/safety">safety</Link>
            </li>
          </ul>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
