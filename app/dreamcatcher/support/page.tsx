import type { Metadata } from "next";
import Link from "next/link";

const contactEmail = "blake@koinophobialabs.com";

export const metadata: Metadata = {
  title: "Dreamcatcher Support",
  description:
    "Help with Dreamcatcher capture, Apple Watch, the Lucid Toolkit, privacy settings, and your journal.",
  alternates: { canonical: "/dreamcatcher/support" },
};

// Public copy and claim evidence: WO-0034/P-pages/support.md and claims.md.
export default function DreamcatcherSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">Dreamcatcher</p>
      <h1>Support</h1>
      <p className="legal-note">Help with capture, the Lucid Toolkit, and your journal</p>

      <section>
        <h2>Getting started</h2>
        {/* S01 */}
        <p>
          Dreamcatcher requires an iPhone running iOS 27 or later. The optional Watch companion requires
          watchOS 27 or later and a paired iPhone.
        </p>
        {/* S02 */}
        <p>
          For help, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with your device model,
          operating system version, Dreamcatcher version, and the steps that led to the problem. Please leave
          out your dream text.
        </p>
      </section>

      <section>
        <h2>Catching a dream</h2>
        {/* S03 */}
        <p>
          Open Journal → Night capture, speak when Microphone live appears, then tap Save dream. Tap Type
          instead to use the keyboard.
        </p>
        {/* S04 */}
        <p>
          You can also add the Catch a dream control to Control Center or your Lock Screen. Night capture uses
          a dark screen and dims the display during voice capture; it does not show older dreams.
        </p>
        {/* S05 */}
        <p>
          To save with Siri, say “Catch a dream in Dreamcatcher” and provide your dream text. The intent can
          save while the iPhone is locked and replies “Saved.” after a successful save, without displaying
          your journal.
        </p>
        {/* S06 */}
        <p>
          Night capture’s English (U.S.) speech recognition runs on your iPhone when the required on-device
          recognition is available. You can type without a network connection if speech is unavailable.
        </p>
        {/* S07 */}
        <p>
          If capture is interrupted, Dreamcatcher can recover words already saved in a draft and retained
          voice clips when journal maintenance next runs. In Journal, look for Recovered captures and add any
          missing details during review.
        </p>
      </section>

      <section>
        <h2>Apple Watch</h2>
        {/* S08 */}
        <p>
          Open Dreamcatcher on your Watch and tap Catch a dream, or use the Catch a dream complication. Use
          the system’s dictation or text input; Dreamcatcher receives text, not dictation audio.
        </p>
        {/* S09 */}
        <p>
          “Saved. Waiting for iPhone.” means the capture is waiting to transfer. “Saved on iPhone” indicates
          an acknowledgement from the iPhone; the Watch removes acknowledged words, and shows a retry message
          if cleanup fails.
        </p>
        {/* S10 */}
        <p>
          The Watch companion does not display your journal. Reality checks are iPhone notifications that
          watchOS may mirror according to your notification settings; Dreamcatcher does not schedule a
          separate Watch alarm or a custom repeating wrist vibration.
        </p>
      </section>

      <section>
        <h2>Morning review and dream signs</h2>
        {/* S11 */}
        <p>
          Open Journal → Morning review to add morning words separately from your captured night text. You can
          mark a dream Lucid, Vivid, Nightmare, or Recurring, tag dream signs, and tap Finish review.
        </p>
        {/* S12 */}
        <p>
          Use the Signs tab to manage dream signs, and Settings → Journal → Search and history to search and
          filter entries.
        </p>
      </section>

      <section>
        <h2>Lucid Toolkit</h2>
        {/* S13 */}
        <p>
          The Lucid Toolkit is a one-time purchase. Its tools are Reality-check program and Wake-back-to-bed
          night in Checks, Dream-sign insights in Signs, and Progress trends in Trends.
        </p>
        {/* S14 */}
        <p>
          Open Settings → Lucid Toolkit for the purchase screen. Restore Purchases is available directly in
          Settings under Lucid Toolkit and on the purchase screen; use the Apple Account that made the
          purchase.
        </p>
        {/* S15 */}
        <p>
          StoreKit can verify a previously purchased Toolkit from its local cache while offline. A pending
          purchase grants no access until Apple supplies a verified entitlement; if the storefront cannot
          offer the Toolkit, your journal is still available.
        </p>
        {/* S16 */}
        <p>
          Capture, journal review, marks, signs, search, export and import, the journal lock, deletion, the
          morning reminder, basic counts, and Reality check now do not require the Toolkit.
        </p>
      </section>

      <section>
        <h2>Reality checks and reminders</h2>
        {/* S17 */}
        <p>
          In Checks → Reality-check program, turn on Enable program and set your waking window, checks per day
          (up to eight), minimum spacing, and quiet days. Tap Allow notifications, then Try one now (5
          seconds) to schedule a sample; a Focus may silence it.
        </p>
        {/* S18 */}
        <p>
          Checks are scheduled at varied times within your chosen window, with up to 56 future checks at a
          time. The app extends the schedule when opened or given background time; check its schedule status
          and reopen it if checks have stopped.
        </p>
        {/* S19 */}
        <p>
          Dream signs appear in notifications only when Include opted-in dream signs and the sign’s own
          permission are both on. Those notifications can be visible on the Lock Screen.
        </p>
        {/* S20 */}
        <p>
          For a morning reminder, use Settings → Morning reminder → Remind me to review and choose Morning
          time. The app schedules it only when a capture is waiting for review, using a message without dream
          text.
        </p>
      </section>

      <section>
        <h2>Wake-back-to-bed nights</h2>
        {/* S21 */}
        <p>
          Open Checks → Wake-back-to-bed night. Choose iPhone alarm under Wake method, select Wake at, tap
          Plan this night, then Confirm this night and allow alarm access when asked.
        </p>
        {/* S22 */}
        <p>
          This uses an iPhone alarm through Apple’s AlarmKit for one chosen time, without automatic
          repetition. Dreamcatcher allows one planned session per night; the Your own alarm option instead
          asks you to set an alarm yourself.
        </p>
        {/* S23 */}
        <p>
          Test alarm in 1 minute is available when both the current time and the test time fall between 08:00
          and 20:00 on the same day. If the screen says the alarm was not set, use Set alarm again and check
          the result.
        </p>
        {/* S24 */}
        <p>
          When you tap I’m up, Dreamcatcher opens capture first, then offers an intention and Minutes awake
          before Back to sleep. Cancel this night cancels the planned session.
        </p>
      </section>

      <section>
        <h2>Journal lock and privacy</h2>
        {/* S25 */}
        <p>
          Turn on Settings → Privacy → Lock with Face ID or passcode. Use your iPhone passcode if Face ID is
          unavailable; Night capture remains accessible from the locked journal screen.
        </p>
        {/* S26 */}
        <p>
          For speech, Watch dictation, backups, exports, and website data, read the <Link
          href="/dreamcatcher/privacy">Dreamcatcher Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Export, backups, and deletion</h2>
        {/* S27 */}
        <p>
          Go to Settings → Journal → Export and import → Export journal. The export is a folder containing
          journal.json and any retained voice clips, so keep the whole folder somewhere private.
        </p>
        {/* S28 */}
        <p>
          On another iPhone, use Settings → Journal → Export and import → Import from export and select that
          folder or a journal.json file. Existing dreams keep their words; with Never keep audio enabled,
          clips are not imported.
        </p>
        {/* S29 */}
        <p>
          To allow journal files into iPhone backups, turn on Settings → Journal backups → Include journal in
          device backups before making a backup. It is off by default, does not make a backup itself, and
          always excludes voice clips.
        </p>
        {/* S30 */}
        <p>
          Voice clips become eligible for removal after review of a transcribed dream or seven days after
          capture, with cleanup when the app can run journal maintenance. Clips awaiting transcription wait
          until the seven-day point; untracked clips without a reliable date use discovery time.
        </p>
        {/* S31 */}
        <p>
          To stop retaining clips, turn on Settings → Voice clips → Never keep audio and confirm Delete clips
          and never keep audio. If an error appears, use Retry audio removal; this does not remove clips in
          exports you saved elsewhere.
        </p>
        {/* S32 */}
        <p>
          To erase the journal, open Settings → Journal → Delete all data, type DELETE, and tap Delete all
          data. This removes dreams, signs, nights, wake-back-to-bed records, and retained clips; export first
          if you want to keep a copy.
        </p>
        {/* S33 */}
        <p>
          Deletion first attempts to cancel the app’s alarms; if cancellation cannot be confirmed, the journal
          is not erased and an error is shown. Exports and backups are not erased, and pending Watch captures
          older than the deletion cutoff are discarded when the Watch receives the update.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        {/* S34 */}
        <p>
          Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> for help. Please do not send private
          journal content; see the <Link href="/dreamcatcher/privacy">Dreamcatcher Privacy Policy</Link> for
          support email handling.
        </p>
      </section>

      <p>
        <Link href="/dreamcatcher/privacy">Dreamcatcher Privacy Policy</Link>
      </p>
      <p>Dreamcatcher · Koinophobia Labs</p>
    </main>
  );
}
