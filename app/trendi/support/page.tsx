import type { Metadata } from "next";
import Link from "next/link";

const supportEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "Trendi Support",
  description:
    "Support, troubleshooting, privacy, and account-deletion help for Trendi.",
  alternates: { canonical: "/trendi/support" },
};

export default function TrendiSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/trendi">
        ← Trendi
      </Link>
      <p className="kicker kicker-orange">Trendi</p>
      <h1>Support</h1>
      <p className="legal-note">Help with Coach Packs, purchases, recording, and data</p>

      <section>
        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Include your
          iPhone model, iOS version, Trendi version or build if known, the step you
          were taking, and what happened. Include a screenshot only if it contains
          no content you want to keep private.
        </p>
        <p>
          Never send an Apple credential, password, API key, payment-card number, or
          recording you do not want reviewed.
        </p>
      </section>

      <section>
        <h2>Sign in with Apple</h2>
        <ul>
          <li>Trendi does not have a separate username or password.</li>
          <li>Confirm your iPhone has an internet connection, then retry Sign in with Apple.</li>
          <li>If sign-in still fails, send support the exact error message and time it occurred.</li>
        </ul>
      </section>

      <section>
        <h2>Coach Pack generation</h2>
        <ul>
          <li>Coach Packs require an internet connection.</li>
          <li>If generation fails, your local thought or draft should remain available.</li>
          <li>Use Retry after the app shows the final error.</li>
          <li>
            For an unexpected allowance or rate-limit message, include the time and
            time zone in your support email.
          </li>
        </ul>
        <p>
          Free includes 3 successfully delivered Coach Packs each week. Trendi Pro
          includes 100 per subscription month. The app shows your remaining
          allowance and reset time. Failed generation does not use a successful pack.
        </p>
      </section>

      <section>
        <h2>Trendi Pro, billing, and Restore Purchases</h2>
        <p>
          Trendi Pro is one optional monthly subscription. The US price is $7.99 per
          month; Apple shows your local price and billing terms before purchase.
          It renews automatically until cancelled. There is no separate paid tier
          for the teleprompter, recording, or Vault.
        </p>
        <ul>
          <li>Open Profile, then the Trendi Pro subscription screen, and tap Restore Purchases using the Apple Account that made the purchase.</li>
          <li>If payment succeeded but Pro did not unlock, use Restore Purchases before trying to buy again.</li>
          <li>A purchase awaiting approval stays pending. Free remains available while you wait.</li>
          <li>If Apple&apos;s catalog is unavailable, reconnect and retry. Do not reinstall to troubleshoot: local content can be lost.</li>
          <li>Manage or cancel in iPhone Settings → your name → Subscriptions → Trendi Pro. Access continues until the paid period ends, subject to Apple&apos;s status.</li>
          <li>Request billing help or a refund through <a href="https://reportaproblem.apple.com/">Apple&apos;s purchase support</a>. Refund eligibility is decided by Apple.</li>
        </ul>
        <p>Subscription terms: <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Apple Standard EULA</a>.</p>
      </section>

      <section>
        <h2>Unfinished ideas, the Vault, and offline use</h2>
        <p>
          Your saved ideas and scripts stay on this device. Return to the Vault to
          reopen a draft, edit it, and prepare another recording. Coach generation
          needs internet; already saved work does not require a new generation.
          Export anything you need before removing the app or deleting its data.
        </p>
        <p>
          For a recording interruption, return to Record Mode and follow the recovery
          prompt. Review a recovered clip before sharing it. Trendi does not post to
          a social network for you.
        </p>
      </section>

      <section>
        <h2>Feedback</h2>
        <p>
          Email <a href={`mailto:${supportEmail}?subject=Trendi%20feedback`}>Trendi feedback</a>
          {" "}with what you wanted to say, where you got stuck, and whether you reached
          a recordable script. Share only material you are comfortable sending by email.
          Your message will not be used as a testimonial without your permission.
        </p>
      </section>

      <section>
        <h2>Speech and recording permissions</h2>
        <p>
          Open iPhone Settings, choose Apps, then Trendi to review permissions.
          Speech recognition and microphone access are needed for spoken thoughts.
          Camera and microphone access are needed for Record Mode. Add-only Photos
          access is requested when you choose to save a recording.
        </p>
      </section>

      <section>
        <h2>Delete your Trendi account</h2>
        <p>
          In Trendi, open <strong>Profile</strong>, choose{" "}
          <strong>Account &amp; Workspace</strong>, tap <strong>Delete Account</strong>,
          then confirm with Apple. Trendi deletes the account&apos;s Coach results and
          ordinary service records and deletes the local workspace, clears the
          session, and signs out. If deletion fails before the service confirms it,
          your local data remains available so you can retry safely.
        </p>
        <p>
          To remove Sign in with Apple authorization as well, open iPhone Settings,
          tap your name, tap Sign in with Apple, select Trendi or Koinophobia Labs,
          then tap Delete and confirm Stop Using. Account deletion does not cancel
          an Apple subscription; cancel separately in Settings → your name → Subscriptions.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          Read the <Link href="/trendi/privacy">Trendi Privacy Policy</Link> for the
          data Trendi processes, provider details, retention periods, and deletion
          choices.
        </p>
      </section>

      <section>
        <h2>App requirements</h2>
        <ul>
          <li>iPhone running iOS 17 or later.</li>
          <li>Internet access for Sign in with Apple and Coach Packs.</li>
          <li>Camera and microphone access only when you use recording features.</li>
        </ul>
      </section>

      <section>
        <h2>About Trendi</h2>
        <p>
          Trendi helps business owners turn a rough typed or spoken thought into one angle,
          three hook options, an editable script, a caption, a shot plan, and a
          record-ready workflow. Trendi does not automatically publish content.
        </p>
      </section>
    </main>
  );
}
