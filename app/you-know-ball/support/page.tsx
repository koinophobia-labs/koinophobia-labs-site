import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You Know Ball Support | Koinophobia Labs",
  description: "Support and troubleshooting for You Know Ball.",
};

export default function YouKnowBallSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">You Know Ball</p>
      <h1>Support</h1>
      <p className="legal-note">For TestFlight, install help, bug reports, and safety questions.</p>

      <section>
        <h2>Contact</h2>
        <p>
          Email{" "}
          <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a>{" "}
          with the device, iOS version, app build if known, and a short description
          of what happened.
        </p>
      </section>

      <section>
        <h2>TestFlight install help</h2>
        <ul>
          <li>Confirm you are using the Apple ID invited to TestFlight.</li>
          <li>Install or update the TestFlight app from Apple.</li>
          <li>Open the You Know Ball invitation and install the latest available build.</li>
          <li>If the app opens stale UI, fully close and reopen the app so the hosted shell reloads.</li>
        </ul>
      </section>

      <section>
        <h2>Troubleshooting</h2>
        <ul>
          <li>If the app does not respond, check connection and try again.</li>
          <li>If the PIN/access screen appears, use the access flow provided to testers.</li>
          <li>If a response looks wrong, export or screenshot the round and send it with notes.</li>
          <li>If voice input is unavailable, type the sports take instead.</li>
        </ul>
      </section>

      <section>
        <h2>Report an issue</h2>
        <p>
          Include the prompt, mode, whether guardrails appeared, and whether the
          response source/status area showed Live Brain or fallback. Do not include
          passwords, private company data, or sensitive personal information.
        </p>
      </section>

      <section>
        <h2>Public app troubleshooting</h2>
        <ul>
          <li>Update to the latest App Store version when available.</li>
          <li>Close and reopen the app if the hosted experience does not refresh.</li>
          <li>Use Profile to review source/status information or reset local data.</li>
          <li>Send screenshots with bug reports when a layout or response issue is visible.</li>
        </ul>
      </section>

      <section>
        <h2>Safety reminder</h2>
        <p>
          You Know Ball is for sports debate, entertainment, creator prompts, and
          community engagement. It does not provide betting advice, picks, parlays,
          locks, odds, wagers, bankroll strategy, or help chasing losses.
        </p>
      </section>
    </main>
  );
}
