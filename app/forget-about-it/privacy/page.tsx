import type { Metadata } from "next";
import Link from "next/link";

const privacyEmail = "blake@koinophobialabs.com";

export const metadata: Metadata = {
  title: "ForgetAboutIt Privacy Policy",
  description:
    "How ForgetAboutIt stores your diary, handles optional AI day story with Anthropic, and checks Plus purchases through Apple.",
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
      <p className="legal-note">Last updated: November 3, 2026</p>

      <section>
        <h2>The short version</h2>
        <p>
          Your diary is stored on your device. Capturing, viewing, searching and exporting your notes do not require an account or remote AI. We do not use your notes for advertising or tracking. AI day story is an optional Plus feature, off by default, that you can turn on or off in Settings.
        </p>
      </section>

      <section>
        <h2>Optional AI day story</h2>
        <p>
          If you turn on AI day story after reading its disclosure, that day&apos;s notes are sent securely to our server and to Anthropic (Claude) to write and check a short summary. Our server also receives your language setting, app version and signed App Store purchase proof to check Plus access. Anthropic receives the notes, language setting and candidate summaries, but not your purchase proof or a device identifier supplied by our app. Notes may contain personal information that you wrote. Tiny days and days matching our local safety checks do not use this feature. A failed or rejected summary leaves the ordinary on-device reflection in place.
        </p>
        <p>
          We do not store or log the notes or AI summaries on our server. A temporary transaction-derived counter limits requests. Your consent choice and its time are saved locally. The app temporarily caches a summary for the current set of notes; changing the notes or turning the feature off prevents that cached summary from being shown.
        </p>
        <p>
          Anthropic&apos;s commercial terms prohibit training models on customer content. Its standard API policy provides for deletion of inputs and outputs within 30 days, with exceptions for safety enforcement, legal obligations and applicable agreements. Its structured-output documentation describes zero-retention processing, but we do not promise that all provider retention is zero; safety and legal exceptions still apply. Turning the feature off stops future sharing for AI day story and does not retract requests already processed.
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
            <strong>On-device reflections and other derived information.</strong>{" "}
            The ordinary reflection, recognised names and subjects, open-loop
            suggestions, statistics and Ask answers are computed on your iPhone
            from your own words, using Apple&apos;s on-device language tools. They
            are stored beside your thoughts. Optional AI day story uses the
            processing described above.
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
          payment-card details. If you turn on AI day story, our server receives
          signed App Store purchase proof to check Plus access, as described
          above. Apple gives Koinophobia Labs its standard App Store sales and
          subscription reports.
        </p>
        <p>Manage or cancel Plus in your Apple subscription settings.</p>
      </section>

      <section>
        <h2>Accounts, advertising and tracking</h2>
        <p>
          ForgetAboutIt has no accounts, no sign-in, no analytics or
          crash-reporting SDKs, no advertising and no tracking. Optional AI day
          story shares the information described above only after you turn it on.
          Anything you choose to share or export from the app goes only where you
          send it.
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
          children.
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
