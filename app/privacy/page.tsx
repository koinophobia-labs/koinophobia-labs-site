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
          </ul>
        </section>
        <section className="sec" id="saiikhotic">
          <h2>Saiikhotic</h2>
          <p>
            Saiikhotic&apos;s Line queue collects a display name and a 4–6 digit PIN you choose.
            These are stored with your account to identify you in the line and keep your place.
            The planned Spades table will collect a profile name, PIN, and avatar to identify you
            at the table when you use that feature.
          </p>
          <p>
            This data is linked to your identity in the line or table and is used only for app
            functionality. It is not sold or used for advertising or tracking. Saiikhotic has no
            in-app analytics.
          </p>
          <p>
            Account data is stored on the Saiikhotic game servers, run by the Taylor+Martin
            partnership. The app connects to those servers only when you use the Line or Spades
            features.
          </p>
          <p>
            You can delete your account and all its data at any time inside the app: go to
            Settings/Account → Delete Account. Deletion removes your account, its sessions, and
            its queue entry from the server. You can also request deletion or ask privacy and
            support questions by emailing{" "}
            <a href="mailto:blake@koinophobialabs.com">blake@koinophobialabs.com</a>.
          </p>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
