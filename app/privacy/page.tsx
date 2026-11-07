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
              <Link href="/dreamcatcher/privacy">Dreamcatcher privacy policy</Link> ·{" "}
              <Link href="/dreamcatcher/support">support</Link>
            </li>
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
            <li>
              <Link href="#saiikhotic">Saiikhotic privacy policy</Link>
            </li>
          </ul>
        </section>
        <section className="sec" id="saiikhotic">
          <h2>Saiikhotic privacy policy</h2>
          <p>Updated November 6, 2026 · Version 1</p>
          <p>
            Saiikhotic (com.koinophobialabs.saiikhotic) is a native iOS Spades game made in
            partnership with Koinophobia Labs. It is for ages 17+ and includes simulated gambling
            with virtual coins. Coins have no cash value, and there are no real-money payouts.
          </p>
          <h3>Solo play</h3>
          <p>
            Solo games against bots run entirely on your device. Solo play requires no account
            or internet connection and collects no data.
          </p>
          <h3>Online live table</h3>
          <p>
            To join Saiikhotic&apos;s hosted live table, you enter a display name and a short
            numeric PIN. The app sends both to the Saiikhotic game server to join the live table
            and identify you within that room. The name and PIN are used only for joining and
            identifying you in the live table, never for advertising or cross-app tracking.
          </p>
          <h3>Optional purchases</h3>
          <p>
            Optional coin packs are available through Apple In-App Purchase (StoreKit). Apple
            handles payment; Saiikhotic does not collect or store your payment information.
            Purchased coins are virtual in-app currency with no cash value.
          </p>
          <h3>Photo avatars</h3>
          <p>
            If you choose a photo avatar, it is stored only on your device and is never uploaded.
          </p>
          <h3>Notifications</h3>
          <p>
            Notifications are optional and local to your device. They use no push token, no
            server and no analytics.
          </p>
          <h3>Analytics, advertising and tracking</h3>
          <p>
            The Saiikhotic app has no analytics, no third-party tracking SDKs and no ads. We do
            not sell Saiikhotic data or use it for cross-app tracking. The website analytics
            described above apply to this website, not to the Saiikhotic app.
          </p>
          <h3>Contact</h3>
          <p>
            For Saiikhotic privacy questions or requests, contact Koinophobia Labs at{" "}
            <a href="mailto:blake@koinophobialabs.com">blake@koinophobialabs.com</a>.
          </p>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
