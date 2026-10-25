import type { Metadata } from "next";
import Link from "next/link";

const contactEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "Dreamcatcher Privacy Policy",
  description:
    "How Dreamcatcher handles your journal, voice clips, backups, exports, and support messages.",
  alternates: { canonical: "/dreamcatcher/privacy" },
};

// Public copy and claim evidence: WO-0034/P-pages/privacy.md and claims.md.
export default function DreamcatcherPrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">Dreamcatcher</p>
      <h1>Privacy Policy</h1>
      <p className="legal-note">Effective October 24, 2026 · Dreamcatcher version 2.0</p>

      <section>
        <h2>Your journal on your devices</h2>
        {/* P01 */}
        <p>
          Dreamcatcher is a dream journal from Koinophobia Labs, with no account or sign-in.
        </p>
        {/* P02 */}
        <p>
          Your night text, morning additions, marks, dream signs, capture times and time zones, capture
          source, and wake-back-to-bed plans and intentions are stored in the app’s private storage on your iPhone.
        </p>
        {/* P03 */}
        <p>
          Dreamcatcher does not upload your journal to Koinophobia Labs or an analysis service. Backups,
          exports, Siri, Apple Watch dictation, and messages you send to support are described below.
        </p>
        {/* P04 */}
        <p>
          Journal files use iOS protection that makes them unavailable until the first unlock after an iPhone
          restart. Voice recordings can’t be opened while your iPhone is locked, except a recording that’s
          already open, such as one in progress.
        </p>
      </section>

      <section>
        <h2>Apple Health sleep data</h2>
        {/* H01 */}
        <p>
          Connecting Apple Health is optional. With your permission, Dreamcatcher reads sleep analysis,
          including recorded awake, core, deep and REM intervals, to show your sleep timeline alongside dream
          capture times, estimate a future REM window, and show associations between recorded sleep and journal
          recall. It never writes to Health.
        </p>
        {/* H02 */}
        <p>
          Health sleep data and the insights calculated from it are processed only on your iPhone. Dreamcatcher
          does not share them with Koinophobia Labs, advertising or analytics services, or any other party, and
          does not store them in iCloud, journal backups, or journal exports. Sleep timelines and statistics are
          reloaded from Health. To show last night&apos;s sleep in the Home Screen widget, Dreamcatcher stores a
          small summary of your two most recent nights (sleep times and total sleep) in an on-device area shared
          only with its own widget. This summary is excluded from backups and never leaves your iPhone.
          A wake time you choose is scheduled locally through
          Apple’s AlarmKit; alarm content contains no sleep stages or journal text.
        </p>
        {/* H03 */}
        <p>
          You can revoke sleep access in Settings → Health → Data Access &amp; Devices → Dreamcatcher.
          Revoking access does not stop dream capture. Health may grant limited history; Dreamcatcher uses at
          most the recent 30 days and explains when a limited-access boundary is reported.
        </p>
        {/* H04 */}
        <p>
          Sleep stages arrive after waking. REM windows are predictions from past nights, not live REM
          detection, medical advice, or a promise of lucid dreaming. A capture timestamp does not prove when a
          dream happened.
        </p>
      </section>

      <section>
        <h2>Speech and voice recordings</h2>
        {/* P05 */}
        <p>
          Night capture uses Apple’s on-device speech recognition in English (U.S.). If on-device recognition
          is unavailable, use Type instead.
        </p>
        {/* P06 */}
        <p>
          Unless Never keep audio is enabled, voice capture also keeps a voice clip on your iPhone. Night
          capture does not send your audio to a speech server.
        </p>
        {/* P07 */}
        <p>
          Siri and Apple Watch dictation are provided by Apple; Dreamcatcher receives text from them. Apple
          may process those requests on the device or on its servers, depending on your device and settings,
          under <a href="https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/">Apple’s Siri and
          Dictation privacy terms</a>.
        </p>
        {/* P08 */}
        <p>
          Voice clips become eligible for removal after you finish reviewing a transcribed dream, or seven
          days after capture. Clips awaiting transcription remain eligible for retention until that seven-day
          point; an untracked clip with no reliable capture date gets a seven-day period from discovery.
        </p>
        {/* P09 */}
        <p>
          Cleanup runs when the app can perform journal maintenance, so removal may happen later if the app is
          closed, the journal is locked, or a file cannot be removed.
        </p>
        {/* P10 */}
        <p>
          In Settings → Voice clips, enabling Never keep audio and confirming Delete clips and never keep
          audio removes retained clips and stops future clips from being kept. If removal fails, Settings
          offers Retry audio removal.
        </p>
        {/* P11 */}
        <p>
          Speech can still be transcribed on the iPhone with Never keep audio enabled. Voice clips are
          excluded from iPhone backups, but retained clips are included when you export your journal.
        </p>
      </section>

      <section>
        <h2>Backups</h2>
        {/* P12 */}
        <p>
          The journal is excluded from iPhone backups by default. Settings → Journal backups → Include journal
          in device backups allows journal files into subsequent device backups; it does not create a backup,
          and voice clips stay excluded.
        </p>
        {/* P13 */}
        <p>
          If you back up your iPhone to Apple’s servers, Apple stores that backup under your Apple Account.
          Turning journal backups off affects later backups, not copies already made.
        </p>
        {/* P14 */}
        <p>
          Preferences such as appearance, journal lock, reminder time, and the reality-check plan use standard
          iOS preferences, which may be included in device backups. Dreamcatcher does not put dream text or
          selected dream-sign text in those preferences.
        </p>
      </section>

      <section>
        <h2>Apple Watch</h2>
        {/* P15 */}
        <p>
          The Watch companion saves captures locally and transfers them to the paired iPhone using Apple’s
          WatchConnectivity. After the iPhone acknowledges a capture, the Watch removes its stored words;
          transfer or storage failures may delay this.
        </p>
        {/* P16 */}
        <p>
          The Watch app offers capture, not journal browsing, and its stored capture files are excluded from
          backups.
        </p>
      </section>

      <section>
        <h2>Notifications and alarms</h2>
        {/* P17 */}
        <p>
          Morning reminders and reality checks are scheduled locally on your iPhone. Dreamcatcher does not use
          a remote push service.
        </p>
        {/* P18 */}
        <p>
          Reality checks ask “Are you dreaming?” and contain no journal text unless you enable Include
          opted-in dream signs and allow the selected sign to be used. That sign can then appear in a
          notification on your Lock Screen or paired Apple Watch, depending on notification settings.
        </p>
        {/* P19 */}
        <p>
          The morning reminder says “A dream you captured is ready to revisit.” Wake-back-to-bed iPhone alarms
          use the title “Wake-back-to-bed” and do not include dream or intention text.
        </p>
      </section>

      <section>
        <h2>Journal lock</h2>
        {/* P20 */}
        <p>
          Settings → Privacy → Lock with Face ID or passcode uses iOS authentication to hide the journal. iOS
          handles Face ID and the passcode; the app receives the authentication result, not your face data or
          passcode.
        </p>
        {/* P21 */}
        <p>
          Night capture remains available while the journal is locked. The app covers its window when it
          becomes inactive to hide journal content in the app switcher.
        </p>
      </section>

      <section>
        <h2>Purchases and diagnostics</h2>
        {/* P22 */}
        <p>
          The Lucid Toolkit is a one-time in-app purchase through Apple’s App Store. Apple handles payment;
          Dreamcatcher checks access using StoreKit’s verified transactions, including its local offline
          cache, and Restore Purchases asks Apple to refresh purchases.
        </p>
        {/* P23 */}
        <p>
          The app has no advertising, tracking, or third-party analytics SDK. Apple may separately share
          diagnostics with developers according to your device settings, and TestFlight can provide testing
          feedback and crash reports.
        </p>
      </section>

      <section>
        <h2>Export, import, and deletion</h2>
        {/* P24 */}
        <p>
          Settings → Journal → Export and import → Export journal saves a folder containing journal.json and
          any retained voice clips. Choose a private destination; copies you save or share outside the app are
          handled by that destination.
        </p>
        {/* P25 */}
        <p>
          Import from export merges records while preserving the words of existing dreams. With Never keep
          audio enabled, voice clips are not imported.
        </p>
        {/* P26 */}
        <p>
          Settings → Journal → Delete all data deletes dreams, signs, nights, wake-back-to-bed records, and
          retained clips after you type DELETE and confirm. This cannot be undone in the app; exports and
          existing backups are not removed.
        </p>
        {/* P27 */}
        <p>
          Delete all data also records a cutoff so older pending Watch captures are discarded instead of being
          added back to the journal. The Watch removes those pending captures when it receives the update.
        </p>
        {/* P28 */}
        <p>
          Deleting the iPhone app removes its local app data; copies in exports or backups are separate. For
          pending Watch captures, use Delete all data while the devices can connect before removing the apps.
        </p>
      </section>

      <section>
        <h2>This website and support</h2>
        {/* P29 */}
        <p>
          These pages use Vercel hosting and Web Analytics, separately from the Dreamcatcher app. See the{" "}
          <Link href="/privacy">website privacy policy</Link> for what this site measures.
        </p>
        {/* P30 */}
        <p>
          If you email support, Koinophobia Labs receives your email address and the information you include;
          Gmail processes the message. Please do not include dream text or private details we do not need.
        </p>
      </section>

      <section>
        <h2>Questions and changes</h2>
        {/* P31 */}
        <p>
          Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with privacy questions or requests about
          support correspondence. If the app’s practices change, we will update this policy; the effective
          date identifies the version.
        </p>
      </section>

      <p>
        <Link href="/dreamcatcher/support">Dreamcatcher Support</Link>
      </p>
      <p>Dreamcatcher · Koinophobia Labs</p>
    </main>
  );
}
