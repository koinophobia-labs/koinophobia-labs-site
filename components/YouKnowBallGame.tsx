"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { debatePrompts, scoreTake, trackYkb, type RoundScore } from "@/lib/youKnowBall";

type Props = { compact?: boolean };

export default function YouKnowBallGame({ compact = false }: Props) {
  const prompts = compact ? debatePrompts.slice(0, 1) : debatePrompts;
  const [promptIndex, setPromptIndex] = useState(0);
  const [side, setSide] = useState<0 | 1 | null>(null);
  const [take, setTake] = useState("");
  const [result, setResult] = useState<{ score: RoundScore; counter: string } | null>(null);
  const prompt = prompts[promptIndex];
  const selectedTake = take.trim() || (side === null ? "" : `${prompt.sides[side]} because that is the cleaner way to judge the argument.`);
  const counter = useMemo(() => (side === null ? prompt.counters[0] : prompt.counters[side]), [prompt, side]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedTake) return;
    trackYkb("take_submitted");
    setResult({ score: scoreTake(selectedTake, prompt), counter });
    trackYkb("possession_completed");
  }

  function replay() {
    trackYkb("replay_selected");
    setPromptIndex((current) => compact ? 0 : (current + 1) % prompts.length);
    setSide(null);
    setTake("");
    setResult(null);
  }

  return (
    <div className={`ykb-game ${compact ? "ykb-game-compact" : "ykb-game-full"}`}>
      <header className="ykb-scoreboard">
        <div><span>POSSESSION</span><strong>{String(promptIndex + 1).padStart(2, "0")}</strong></div>
        <p>YOU KNOW BALL <small>SPORTS INTELLIGENCE</small></p>
        <div><span>MODE</span><strong>1V BOT</strong></div>
      </header>

      {!result ? (
        <form onSubmit={submit} className="ykb-possession">
          <p className="ykb-overline">{prompt.sport} · Debate prompt</p>
          <h2 className="ykb-prompt-title">{prompt.question}</h2>
          <fieldset>
            <legend>Choose your angle</legend>
            <div className="ykb-side-grid">
              {prompt.sides.map((label, index) => (
                <button key={label} type="button" className={side === index ? "selected" : ""} onClick={() => setSide(index as 0 | 1)} aria-pressed={side === index}>
                  <span>0{index + 1}</span>{label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="ykb-take-label">
            <span>Your take <small>optional if you choose a side</small></span>
            <textarea value={take} onChange={(event) => setTake(event.target.value.slice(0, 180))} maxLength={180} rows={compact ? 2 : 3} placeholder="Make the case in one or two sentences…" />
            <em>{take.length}/180 · stays in this browser</em>
          </label>
          <button className="ykb-submit" type="submit" disabled={!selectedTake}>Send the take <ArrowRight size={17} /></button>
        </form>
      ) : (
        <div className="ykb-result" aria-live="polite">
          <p className="ykb-overline">BanterBot counter</p>
          <blockquote>{result.score.paused ? "I can debate the sport, but I won't help with picks, lines, or wagers. Reframe it as a player, team, or strategy argument. Your move." : result.counter}</blockquote>
          <div className="ykb-verdict">
            <div><span>VERDICT</span><strong>{result.score.verdict}</strong></div>
            <div><span>TAKE STRENGTH</span><strong>{result.score.takeStrength}</strong><small>/100</small></div>
            <div><span>RANK POINTS</span><strong>{result.score.paused ? "—" : `+${result.score.points}`}</strong></div>
          </div>
          <p className="ykb-score-note">Starter scoring · clear claim, sports context, reasoning, and evidence. This preview does not save rank or XP.</p>
          <div className="ykb-result-actions">
            <button type="button" onClick={replay}><RotateCcw size={16} /> {compact ? "Reset" : "Run it back"}</button>
            {compact ? <Link href="/you-know-ball/play" onClick={() => trackYkb("continued_to_full_game")}>Play the full web version <ArrowRight size={16} /></Link> : null}
          </div>
        </div>
      )}
    </div>
  );
}
