import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import YouKnowBallGame from "@/components/YouKnowBallGame";

export const metadata: Metadata = {
  title: "Play You Know Ball",
  description: "Drop a sports take, face a BanterBot counterargument, and see how your take scores.",
  alternates: { canonical: "/you-know-ball/play" },
};

export default function YouKnowBallPlayPage() {
  return (
    <main className="ykb-play-page">
      <div className="ykb-play-wrap">
        <nav><Link href="/#work"><ArrowLeft size={16} /> Back to Koinophobia Labs</Link></nav>
        <header className="ykb-play-head">
          <p className="ykb-overline">Limited web possession</p>
          <h1>You Know Ball</h1>
          <p>Drop a take. BanterBot counters. Your argument gets a transparent score. No account, no live opponent, no saved XP.</p>
        </header>
        <YouKnowBallGame />
        <footer><span>Debate, not betting.</span><span>NBA · NFL · MLB prompts</span><span>Free text stays in your browser.</span></footer>
      </div>
    </main>
  );
}
