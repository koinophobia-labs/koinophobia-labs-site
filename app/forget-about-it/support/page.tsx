import type { Metadata } from "next";
import Link from "next/link";

const supportEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "ForgetAboutIt Support",
  description:
    "Support for ForgetAboutIt — capture, Watch sync, reminders, exporting, and deleting your journal.",
  alternates: { canonical: "/forget-about-it/support" },
};

export default function ForgetAboutItSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/forget-about-it">
        ← Forget About It
      </Link>
      <p className="kicker kicker-orange">ForgetAboutIt</p>
      <h1>Support</h1>
      <p className="legal-note">Help with capture, Watch sync, reminders, and your data</p>

      <section>
        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Include
          your iPhone and Watch models, iOS/watchOS versions, the app version if
          known, the step you were taking, and what happened. Include a
          screenshot only if it contains nothing you want to keep private.
        </p>
        <p>
          Because your journal lives only on your devices, support can never see,
          recover, or delete it for you.
        </p>
      </section>

      <section>
        <h2>Capturing</h2>
        <ul>
          <li>
            On iPhone, type into the field on Today, or tap the microphone to
            dictate. Tap Save to keep your thought; Return adds a new line.
            Unsaved typed words are kept locally between launches when storage
            is available.
          </li>
          <li>
            On Apple Watch, tap the capture button to speak or enter text.
            Captured words save on the Watch before transfer to iPhone.
          </li>
          <li>
            If on-device speech recognition is unavailable, the app falls back to
            typing and says so. If dictation is interrupted, review any recovered
            text before saving.
          </li>
        </ul>
      </section>

      <section>
        <h2>Watch sync</h2>
        <ul>
          <li>
            Watch captures save on the Watch first, then transfer to the iPhone
            automatically — including captures made offline, which sync when the
            devices reconnect.
          </li>
          <li>
            &ldquo;Waiting for iPhone&rdquo; means the phone has not confirmed
            receipt. Keep both apps installed and allow the devices to reconnect.
          </li>
          <li>Each thought carries a unique ID, so retries never duplicate it.</li>
        </ul>
      </section>

      <section>
        <h2>Evening reminder</h2>
        <p>
          The reminder is optional and can be enabled in Settings. It only fires on days you actually captured something. Change
          notification permission any time in iPhone Settings → Apps →
          ForgetAboutIt.
        </p>
      </section>

      <section>
        <h2>Plus and purchases</h2>
        <p>
          Settings contains subscription status, Restore purchases, and Manage
          subscription. Apple handles renewal and cancellation. Cancelling keeps
          access through the paid period. Prices come from your App Store region.
          Capture, all original history, literal search, and text export remain
          free. Existing users keep previously available earlier reflections.
        </p>
      </section>

      <section>
        <h2>Finding a thought</h2>
        <p>
          Browse History or search your exact words in Memory. Open a thought to
          see its complete original text and any separately labeled on-device
          context. Your original words are never rewritten.
        </p>
      </section>

      <section>
        <h2>If a save fails</h2>
        <p>
          Keep the visible words and free storage before trying Save again. Do
          not uninstall the app to repair an archive you have not exported.
        </p>
      </section>

      <section>
        <h2>Keeping a copy / moving phones</h2>
        <p>
          Your journal is deliberately excluded from iCloud and computer backups.
          To keep your thoughts across phones, use{" "}
          <strong>Settings → Save a copy of everything</strong> to save an export before
          you switch. A new phone starts with an empty journal.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          Swipe a thought to delete it (with a brief undo), use{" "}
          <strong>Settings → Erase everything</strong> to erase the whole journal, or
          remove the app from a device to remove its local data. Exported or shared
          copies remain where you put them. Watch captures waiting for transfer
          can arrive after reconnection.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          Read the{" "}
          <Link href="/forget-about-it/privacy">ForgetAboutIt Privacy Policy</Link>{" "}
          — captured thoughts stay on your devices, while Apple handles Plus
          purchases through StoreKit.
        </p>
      </section>

      <section>
        <h2>App requirements</h2>
        <ul>
          <li>iPhone running iOS 17 or later.</li>
          <li>Optional Apple Watch app requires watchOS 10 or later.</li>
          <li>No app account is required. Basic capture works offline.</li>
          <li>Plus purchases and restoration require access to the App Store.</li>
        </ul>
      </section>

      <section>
        <h2>About ForgetAboutIt</h2>
        <p>
          ForgetAboutIt captures a thought before it disappears — fastest from
          the wrist — and turns the fragments of your day into a private, written
          record in your own words.
        </p>
      </section>
    </main>
  );
}
