import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You Know Ball Safety",
  description: "Safety and responsible-use notes for You Know Ball.",
  alternates: { canonical: "/you-know-ball/safety" },
};

export default function YouKnowBallSafetyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">You Know Ball</p>
      <h1>Safety</h1>
      <p className="legal-note">Sports debate only. Not betting advice.</p>

      <section>
        <h2>Not a sportsbook</h2>
        <p>
          You Know Ball is a sports debate game. It is not a sportsbook, gambling
          product, betting tool, odds board, or wagering service.
        </p>
      </section>

      <section>
        <h2>No betting advice</h2>
        <p>
          The app does not provide picks, parlays, locks, odds, spreads, props,
          wagers, units, bankroll strategy, or help chasing losses.
        </p>
      </section>

      <section>
        <h2>Betting-adjacent prompts</h2>
        <p>
          If a prompt asks what to bet, which side to take, how to recover losses,
          or how to disguise betting advice as analysis, the app should redirect
          into sports-only discussion.
        </p>
      </section>

      <section>
        <h2>Responsible use</h2>
        <p>
          Use You Know Ball for sports discussion, entertainment, creator prompts,
          and community debate. Do not rely on AI responses for financial,
          gambling, medical, legal, or emergency decisions.
        </p>
      </section>

      <section>
        <h2>Score and rank</h2>
        <p>
          Know Ball Score, streaks, ranks, Daily, and Matchups are game and debate
          features. They measure argument quality, clarity, counterpunching, and
          participation. They are not betting confidence, wagering recommendations,
          or predictions for financial decisions.
        </p>
      </section>

      <section>
        <h2>Daily and Matchups</h2>
        <p>
          Daily challenges and Matchups are sports debate prompts. They are not
          wagering recommendations, sportsbook lines, odds, or instructions to place
          bets.
        </p>
      </section>

      <section>
        <h2>Report safety issues</h2>
        <p>
          Send examples to{" "}
          <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a>{" "}
          with the prompt, response, and any relevant screenshots.
        </p>
      </section>
    </main>
  );
}
