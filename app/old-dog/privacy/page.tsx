import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Old Dog Privacy Policy",
  description: "How Old Dog version 1.0 handles learning progress, local storage, references and support correspondence.",
  alternates: { canonical: "/old-dog/privacy" },
};

export default function PrivacyPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/old-dog/support">← Old Dog support</Link>
    <p className="kicker kicker-orange">Old Dog</p>
    <h1>Privacy Policy</h1>
    <p className="legal-note">Effective September 20, 2026 · Old Dog version 1.0</p>
    <section><h2>Your learning stays on your Mac</h2><p>Old Dog is an adult learning app from Koinophobia Labs. It requires no account. Your interests, learning purpose, lesson progress, practice and proof answers, placement results, mastery records and completion dates are stored in the app’s local container. Koinophobia Labs does not receive this learning data.</p><p>Lessons and questions are included with the app and work offline. Search runs locally against that curriculum; search history is not saved. Reading, appearance and Knowledge Map preferences are stored locally. This version does not sync learning between devices or keep a server copy.</p></section>
    <section><h2>No app analytics, advertising or AI service</h2><p>Old Dog does not collect analytics, use advertising or tracking SDKs, send app-operated crash reports, or call an AI API. An artificial-intelligence course is part of the curriculum; your work is not sent to an AI service or used for model training. The app does not request your name, email address, contacts, location, microphone, camera or payment information.</p><p>Apple may process App Store, TestFlight or operating-system diagnostics under Apple’s policies and your settings. Those services are separate from Old Dog’s application code.</p></section>
    <section><h2>Educational references</h2><p>If you choose a reference link, your default browser opens the external site. Old Dog does not attach your learning history, answers or search query to those links. The browser and destination website may process ordinary web information under their own privacy policies.</p></section>
    <section><h2>Local storage, recovery and backups</h2><p>Old Dog stores learning in its own macOS app container, with a previous valid recovery copy. It preserves damaged or migrated records when necessary for recovery. A curriculum update can retain earlier evidence while asking you to complete revised material again.</p><p>The save checksum detects accidental corruption; it is not encryption. Someone with suitable access to your Mac can read local learning files. Your Mac’s backup configuration determines whether copies are included in backups and how those copies are protected. Old Dog does not provide a separate cloud backup or an in-app export in this version.</p></section>
    <section><h2>Retention and deletion</h2><p>Your learning remains on your Mac until you remove it. Settings → Reset learning asks for confirmation and removes interests, lesson progress, answers, mastery, placement and app-managed recovery copies. Appearance and reading preferences remain. Reset cannot be undone through the app.</p><p>Reset does not delete copies held by your backup system. Removing the application alone may leave its container behind. Manage external backups separately. There is no app account to delete, and support cannot access or erase the record on your Mac.</p></section>
    <section><h2>This website and support</h2><p>These pages are hosted by Vercel. Hosting infrastructure processes technical request information, such as IP address and browser details, to deliver them. The website also uses Vercel Web Analytics. This website activity is separate from Old Dog and does not receive its learning records. See the <Link href="/privacy">website privacy policy</Link>.</p><p>If you email support, we receive your email address and whatever you include so we can respond. Gmail processes those messages. Avoid including private learning records or other information we do not need. You may request deletion of support correspondence by email; existing provider backups or records required for legal obligations may remain.</p></section>
    <section><h2>Children</h2><p>Old Dog is designed for adults and does not collect learning data or app analytics from its users. If a child sends personal information to support, a parent or guardian may contact us to request deletion of that correspondence.</p></section>
    <section><h2>Questions and changes</h2><p>Contact <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a> for privacy questions or support-data requests. We will update this policy if the app’s practices change; the effective date identifies this version.</p><p>Old Dog · Koinophobia Labs</p></section>
  </main>;
}
