import type { Metadata } from "next";
import Link from "next/link";

const privacyEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "ForgetAboutIt Privacy Policy",
  description:
    "ForgetAboutIt keeps every captured thought on your devices. This policy explains exactly what stays local and what the app never collects.",
  alternates: { canonical: "/forget-about-it/privacy" },
};

export default function ForgetAboutItPrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/forget-about-it">
        ← Forget About It
      </Link>
      <p className="kicker kicker-orange">ForgetAboutIt</p>
      <h1>Privacy Policy</h1>
      <p className="legal-note">Effective September 20, 2026</p>

      <section>
        <h2>The short version</h2>
        <p>
          ForgetAboutIt is a private memory journal from Koinophobia Labs. Every
          thought you capture stays on your iPhone and Apple Watch. The app has no
          account system, no analytics, and no server of its own. Apple handles
          Plus purchases through the App Store. Your captured words are not sent
          to Koinophobia Labs or to a remote AI service.
        </p>
      </section>

      <section>
        <h2>What stays on your devices</h2>
        <ul>
          <li>
            <strong>Captured thoughts.</strong> The words you speak or type, when
            you captured them, and which device they came from are stored in a
            local database on your iPhone. Thoughts captured on the Watch queue
            locally and transfer to your iPhone over Apple&apos;s private
            connection (WatchConnectivity). They remain queued on the Watch
            until the iPhone confirms receipt.
          </li>
          <li>
            <strong>Everything derived from them.</strong> The daily story,
            recognised names and subjects, open-loop suggestions, and statistics
            are computed on your device from your own words and stored beside
            them. Nothing is sent to any AI service or other external provider.
          </li>
          <li>
            <strong>Preferences.</strong> Your onboarding answers, confirmation
            style, and reminder settings are stored on the device.
          </li>
        </ul>
        <p>
          The journal database is excluded from iCloud and computer backups as a
          deliberate privacy choice. That also means a new phone starts empty and
          a lost phone takes its journal with it — use{" "}
          <strong>Settings → Save a copy of everything</strong> in the app to save an export
          you control.
        </p>
      </section>

      <section>
        <h2>What the app never collects</h2>
        <p>
          ForgetAboutIt has no accounts, no sign-in, no analytics or crash SDKs,
          no advertising, no tracking, and no third-party AI processing. It does
          not send your captured words, location, usage data, or diagnostics to
          Koinophobia Labs. You control any copies you share or export and where
          they go.
        </p>
      </section>

      <section>
        <h2>Plus purchases</h2>
        <p>
          Apple handles payments and subscription management. The app uses
          StoreKit to request prices and verify purchase status. This
          communication does not include your captured memory text.
          Koinophobia Labs does not receive your payment-card details.
        </p>
      </section>

      <section>
        <h2>Speech and dictation</h2>
        <p>
          On iPhone, spoken capture uses Apple&apos;s on-device speech
          recognition; audio is transcribed on the phone and never stored. On
          Apple Watch, dictation is provided by watchOS itself and hands the app
          text only — depending on your device, language, and settings, Apple may
          process dictation audio on device or on Apple&apos;s servers under
          Apple&apos;s own privacy terms. The app never records or retains audio
          on either device.
        </p>
      </section>

      <section>
        <h2>Notifications</h2>
        <p>
          The optional evening reminder is scheduled locally on your iPhone. Its
          text never includes what you captured — or even how much. Reminder-style
          thoughts with an explicit time can schedule a local notification; its
          content is generic. No notification passes through a remote service.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          Delete any thought inside the app — deletions offer a brief undo, then
          are removed permanently. <strong>Settings → Erase everything</strong> erases
          the iPhone journal. Copies you exported or shared remain wherever you
          put them. Watch captures waiting to sync remain on the Watch and can
          arrive after reconnection. Removing the app from a device removes its
          local data.
        </p>
      </section>

      <section>
        <h2>These web pages</h2>
        <p>
          The ForgetAboutIt pages on this site are hosted by Vercel, whose
          infrastructure can process technical data such as IP address, request
          time, and browser type to serve the pages. Opening a support or privacy
          link from the app loads this website in your browser.
        </p>
      </section>

      <section>
        <h2>Support messages</h2>
        <p>
          If you email support, Koinophobia Labs processes the address and
          information you include in order to respond. Google provides Gmail,
          which processes those messages.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          ForgetAboutIt is a general-audience journal and is not directed to
          children. The app does not send captured thoughts to Koinophobia Labs.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          Koinophobia Labs may update this policy if the app changes. The
          effective date above identifies the current version.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy questions and requests:{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </p>
        <p>ForgetAboutIt · A Koinophobia Labs product</p>
      </section>
    </main>
  );
}
