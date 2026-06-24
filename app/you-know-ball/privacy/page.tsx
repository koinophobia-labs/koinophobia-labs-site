import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You Know Ball Privacy Policy | Koinophobia Labs",
  description:
    "Launch-draft privacy policy for You Know Ball, the sports debate game from Koinophobia Labs.",
};

export default function YouKnowBallPrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">You Know Ball</p>
      <h1>Privacy Policy</h1>
      <p className="legal-note">Launch draft. Review before public App Store release.</p>

      <section>
        <h2>What the app is for</h2>
        <p>
          You Know Ball is a sports debate game for fans, creators, and communities.
          Users drop sports takes, receive counters from the Banter Bot engine, and
          build local debate/ranking progress through sports conversation.
        </p>
      </section>

      <section>
        <h2>Prompts and AI processing</h2>
        <p>
          Prompts and related conversation context may be sent to the You Know Ball
          backend and a server-side AI provider so the app can generate sports debate
          responses. API keys are not stored in the iOS app bundle.
        </p>
      </section>

      <section>
        <h2>Local data</h2>
        <p>
          The current version can store session history, feedback, Daily progress,
          and Know Ball Score data locally in the browser or app WebView. Local data
          can be reset from the app Profile/Status area.
        </p>
      </section>

      <section>
        <h2>Feedback and exports</h2>
        <p>
          Testers may save quick feedback or detailed notes. Feedback can be exported
          from the app for review. Raw audio is not stored by default. Voice
          transcription should be treated as unavailable unless a server-side provider
          is explicitly configured.
        </p>
      </section>

      <section>
        <h2>Payments and sale of data</h2>
        <p>
          The launch version does not require an account and does not collect
          payments in-app. Koinophobia Labs does not intend to sell user data.
        </p>
      </section>

      <section>
        <h2>What not to enter</h2>
        <p>
          Do not enter employer/company data, confidential business information,
          private customer data, passwords, financial account information, or
          sensitive personal information.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or privacy requests can be sent to{" "}
          <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Safety note</h2>
        <p>
          You Know Ball is not a sportsbook, gambling product, or betting advice
          tool. Betting-adjacent prompts are redirected into sports-only discussion.
        </p>
      </section>
    </main>
  );
}
