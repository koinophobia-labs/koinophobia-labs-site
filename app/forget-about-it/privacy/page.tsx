import type { Metadata } from "next";
import Link from "next/link";

const privacyEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "ForgetAboutIt Privacy Policy",
  description:
    "ForgetAboutIt keeps every captured thought on your devices. This policy explains what stays local, how Plus purchases work through Apple, and what the app never collects.",
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
      <p className="legal-note">Last updated: October 14, 2026</p>

      <section>
        <h2>The short version</h2>
        <p>
          ForgetAboutIt is a private memory journal from Koinophobia Labs. Every
          thought you capture stays on your iPhone and Apple Watch. The app has no
          accounts, no analytics, no advertising and no server of its own. Your
          captured words are never sent to Koinophobia Labs or to any AI service.
        </p>
        <p>
          The app connects to the internet for one thing only: ForgetAboutIt Plus
          purchases. Those go through Apple&apos;s App Store using Apple&apos;s
          StoreKit, and they never include your captured words. Koinophobia Labs
          never receives, stores or sees anything you capture.
        </p>
      </section>

      <section>
        <h2>What stays on your devices</h2>
        <ul>
          <li>
            <strong>Captured thoughts.</strong> The words you speak or type, when
            you captured them, and which device they came from are stored in a
            local, encrypted database on your iPhone. Thoughts captured on Apple
            Watch wait on the Watch until your iPhone confirms it received them.
            They travel over Apple&apos;s connection between paired devices
            (WatchConnectivity).
          </li>
          <li>
            <strong>Everything derived from them.</strong> The daily story,
            recognised names and subjects, open-loop suggestions, reflections,
            statistics and Ask answers are all computed on your iPhone from your
            own words, using Apple&apos;s on-device language tools. They are stored
            beside your thoughts. Nothing is sent to any AI service or other
            outside provider.
          </li>
          <li>
            <strong>Preferences.</strong> Your onboarding answers, confirmation
            style, reminder times and reminder settings are stored on the device.
          </li>
        </ul>
        <p>
          The journal database is excluded from iCloud and computer backups as a
          deliberate privacy choice. That also means a new phone starts empty, and
          a lost phone takes its journal with it. To keep a copy you control, use{" "}
          <strong>Settings → Save a copy now</strong>.
        </p>
      </section>

      <section>
        <h2>ForgetAboutIt Plus purchases</h2>
        <p>
          ForgetAboutIt Plus is an optional subscription that you buy and manage
          through Apple. To show prices, make a purchase, restore purchases and
          check what you own, the app uses Apple&apos;s StoreKit, which
          communicates with Apple. The app also reads Apple&apos;s signed record of
          when you first downloaded it, so that features you already had before
          Plus existed stay available.
        </p>
        <p>
          None of this includes your captured words. Apple processes your payment
          under Apple&apos;s own terms. Koinophobia Labs does not receive your
          payment-card details, and it has no server that receives purchase
          information from the app. Apple gives Koinophobia Labs its standard App
          Store sales and subscription reports.
        </p>
        <p>Manage or cancel Plus in your Apple subscription settings.</p>
      </section>

      <section>
        <h2>What the app never collects</h2>
        <p>
          ForgetAboutIt has no accounts, no sign-in, no analytics or
          crash-reporting SDKs, no advertising, no tracking and no third-party AI
          processing. Koinophobia Labs does not collect your captured words, your
          name, email address, location, identifiers, usage data or diagnostics
          through the app. Anything you choose to share or export from the app
          goes only where you send it.
        </p>
      </section>

      <section>
        <h2>Speech and dictation</h2>
        <p>
          On iPhone, spoken capture uses Apple&apos;s speech recognition in
          on-device-only mode. Your audio is transcribed on the phone and is never
          stored. On Apple Watch, dictation is provided by watchOS, and the app
          receives only the text. Depending on your device, language and settings,
          Apple may process Watch dictation audio on the device or on Apple&apos;s
          servers, under Apple&apos;s own privacy terms. The app never records or
          keeps audio on either device.
        </p>
      </section>

      <section>
        <h2>Siri, Shortcuts and the Action button</h2>
        <p>
          You can capture a thought or ask your journal a question through Siri,
          Shortcuts or the Action button.
        </p>
        <ul>
          <li>
            <strong>Capturing.</strong> The words you pass to the app are saved in
            your local journal.
          </li>
          <li>
            <strong>Asking.</strong> ForgetAboutIt searches your journal on your
            iPhone and gives the answer back to Siri or Shortcuts to show or speak.
            Your iPhone must be unlocked before an answer is given.
          </li>
        </ul>
        <p>
          The app sends nothing to Koinophobia Labs for either. When you talk to
          Siri, Apple handles your spoken request under Apple&apos;s own privacy
          terms. If you build a shortcut that sends an answer somewhere else, it
          goes wherever that shortcut sends it.
        </p>
      </section>

      <section>
        <h2>Notifications</h2>
        <p>
          All reminders are scheduled locally on your iPhone. No notification
          passes through a Koinophobia Labs server or any other remote service.
        </p>
        <ul>
          <li>
            <strong>The evening reminder</strong> is optional. It never includes
            the words you captured.
          </li>
          <li>
            <strong>Reminders for a thought</strong> use a private message by
            default (&ldquo;A saved thought is ready.&rdquo;). They show the words
            only if you turn on <strong>Show the words in reminders</strong> in
            Settings. With it on, the reminder shows the first line of that
            thought.
          </li>
        </ul>
        <p>
          iOS decides where notifications appear: on your Lock Screen and in
          Notification Center, according to your notification-preview and Focus
          settings, and on a paired Apple Watch. If you turn on showing the words,
          they can appear in all of those places.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          You can delete any thought inside the app. Deletions offer a brief undo,
          then the thought is removed permanently.{" "}
          <strong>Settings → Erase everything</strong> erases the journal on your
          iPhone. Watch captures that haven&apos;t synced yet stay on the Watch and
          can arrive after it reconnects. Copies you exported or shared stay
          wherever you put them. Removing the app from a device removes its local
          data. Your Plus purchase record is kept by Apple.
        </p>
      </section>

      <section>
        <h2>These web pages</h2>
        <p>
          The ForgetAboutIt pages on this site are hosted by Vercel. To serve the
          pages, Vercel&apos;s infrastructure can process technical data such as
          your IP address, the request time and your browser type. When you open a
          support or privacy link from the app, this website loads in your
          browser.
        </p>
      </section>

      <section>
        <h2>Support messages</h2>
        <p>
          If you email support, Koinophobia Labs processes your address and
          whatever you include, in order to respond. Google provides Gmail, which
          processes those messages.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          ForgetAboutIt is a general-audience journal and is not directed to
          children. Koinophobia Labs collects no personal information from anyone
          through the app.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          Koinophobia Labs may update this policy when the app changes. The date
          at the top identifies the current version.
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
