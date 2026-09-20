import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Old Dog Support",
  description: "Help with Old Dog lessons, practice, mastery, local progress and learning-data recovery on Mac.",
  alternates: { canonical: "/old-dog/support" },
};

export default function SupportPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/">← Koinophobia Labs</Link>
    <p className="kicker kicker-orange">Old Dog</p>
    <h1>Support</h1>
    <p className="legal-note">Version 1.0 · Mac · macOS 15 or later</p>
    <section><h2>Get in touch</h2><p>Email <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a> with your Mac model, macOS version, Old Dog version and what happened. Find the app version in Settings. You do not need to send your learning history or saved answers. Check screenshots for private information before attaching them.</p></section>
    <section><h2>Start learning</h2><p>Choose a few interests during the welcome screen, or choose Explore first. Open a course from Home or Courses, then choose an available lesson. Old Dog includes ten Foundation courses across five subjects. Four other subjects are marked as planned and do not contain lessons yet. No account or internet connection is needed for the lessons.</p></section>
    <section><h2>Practice, proof and mastery</h2><p>Read the lesson, answer the practice question and review its feedback. Correct practice opens two Prove questions. Both correct proof responses earn mastery of that objective; the saved answers and earned date remain available to review. Reading a lesson or completing placement alone does not award mastery.</p><p>The optional Find my starting point check suggests an entry point from the answers you give. It does not certify your ability or award mastery for untested knowledge.</p></section>
    <section><h2>Return to your place</h2><p>Home offers Resume Learning when work is in progress. Search with Command-F, or open the Knowledge Map to browse your subjects, courses, units and objectives. Learning progress is saved on this Mac, including partially completed proof and placement. There is no cloud sync between Macs in this version.</p></section>
    <section><h2>Reading and keyboard controls</h2><p>Open Settings with Command-comma to choose System, Light or Dark appearance, enlarge reading text, or change interests. Command-[ goes back. Tab and Shift-Tab move keyboard focus, Return activates the default action where available, and Escape dismisses supported sheets or cancels reset.</p></section>
    <section><h2>Missing progress or a save warning</h2><p>Keep some storage free on your Mac. If Old Dog reports that a change could not be saved, free space and retry the action. If the primary save is damaged, the app can recover the previous valid copy and preserves the damaged file; the latest step may need repeating. If neither copy can be read, contact support before removing the app, deleting its container or resetting learning.</p><p>Old Dog has no server copy of your progress. Use your normal Mac backup process before moving to another Mac or making storage changes. This version does not provide an in-app export or cloud restore.</p></section>
    <section><h2>Resetting learning</h2><p>Settings → Reset learning requires confirmation. It removes interests, lesson progress, saved answers, mastery, placement and app-managed recovery copies from this Mac. Appearance and reading preferences remain. Reset cannot be undone in the app and does not remove copies held by your Mac backup system.</p></section>
    <section><h2>Privacy</h2><p>Read the <Link href="/old-dog/privacy">Old Dog privacy policy</Link>. Koinophobia Labs does not receive your learning record. Optional educational references open in your browser and follow the destination website’s policies.</p></section>
  </main>;
}
