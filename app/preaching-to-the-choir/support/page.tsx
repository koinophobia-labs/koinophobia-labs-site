import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Preaching to the Choir Support",
  description: "Help with writing, recording, revisiting, exporting, and deleting your prayers.",
  alternates: { canonical: "/preaching-to-the-choir/support" },
};

export default function SupportPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/">← Koinophobia Labs</Link>
    <p className="kicker kicker-orange">Preaching to the Choir</p>
    <h1>Support</h1>
    <p className="legal-note">Version 1.0 · iPhone and iPad · iOS / iPadOS 26 or later</p>
    <section><h2>Get in touch</h2><p>Email <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a> with your device model, operating system and app version, and what happened. You do not need to send your prayers or recordings. Check screenshots for private information before attaching them.</p></section>
    <section><h2>Keep a prayer</h2><p>Open Today and choose Write instead, or Record to speak. Tap Keep to save. Your prayers appear in Journal, where you can open them again, search your words, and edit or delete a prayer. No app account is required.</p></section>
    <section><h2>Recording and transcription</h2><p>Allow microphone access when you choose Record. Speech recognition is optional and runs on your device; availability depends on your device, language, and Apple speech assets. If a transcript is unavailable, keep the audio or write instead. Settings → Transcription lets you change transcription and language choices.</p><p>If you denied a permission, review it in the device Settings app under Privacy &amp; Security or Apps → Preaching to the Choir. Keep some device storage free for recordings. Do not delete the app to troubleshoot before saving an export.</p></section>
    <section><h2>Keep a copy</h2><p>Version 1.0 keeps your record locally and does not offer live iCloud sync. Use Settings → Export to save a copy of your text, recordings, and other record data. You can optionally protect a full export with a passphrase. Keep that passphrase safely: we cannot recover it. PDF yearbooks and ordinary shared files are readable by anyone who receives them.</p><p>The app can be included in device backups. Backup protection depends on your Apple and computer settings. Keep an export before moving to another device or removing the app.</p></section>
    <section><h2>Deleting your record</h2><p>A deleted prayer goes to Settings → Recently Deleted for 30 days. Restore it there or choose Delete now. Settings → Erase everything removes the app’s local record and settings. There is no app account to delete. Exported copies, files you shared, and existing device backups must be managed separately. Support cannot access or erase the record on your device.</p></section>
    <section><h2>Keeper</h2><p>Keeper provides Similar wording and Year views. Your prayers, search, and export remain available without membership. Use Restore purchases on the Keeper screen with the Apple Account used for the purchase. Manage renewable subscriptions in Apple’s subscription settings. Erasing the journal or deleting the app does not cancel an Apple subscription.</p></section>
    <section><h2>Privacy and reminders</h2><p>Read the <Link href="/preaching-to-the-choir/privacy">privacy policy</Link>. Optional reminders are managed in Settings; device notification permission must also be enabled. The app’s notifications do not include your prayer text.</p></section>
  </main>;
}
