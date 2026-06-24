"use client";

import clsx from "clsx";
import { Send, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { quickTakes } from "@/lib/content";

type Chat = { role: "bot" | "user"; text: string; guard?: boolean };

const bettingPattern = /(bet|odds|parlay|wager|spread|over\/under|gambl)/i;
const openers = [
  "Answer First: I am pushing back.",
  "Answer First: strong take, but I am not buying it yet.",
  "Answer First: there is a real argument here, but you need cleaner evidence.",
  "Answer First: I will defend the other side until you bring receipts.",
];

function rank(score: number) {
  if (score >= 1000) return "GOAT";
  if (score >= 850) return "MVP";
  if (score >= 600) return "ALL-STAR";
  if (score >= 400) return "STARTER";
  return "ROOKIE";
}

function botReply(take: string) {
  const opener = openers[Math.floor(Math.random() * openers.length)];
  return `${opener} "${take}" only works if you prove the matchup, the context, and the counterargument. Highlights are not a case. Your move: give me one stat, one moment, and one reason the obvious rebuttal fails.`;
}

export default function BanterBot() {
  const [score, setScore] = useState(612);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Chat[]>([
    {
      role: "bot",
      text:
        "I'm the Banter Bot. Answer First — I commit to a side, then make you defend yours. No betting talk, just ball.",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentRank = useMemo(() => rank(score), [score]);

  function submitTake(take: string) {
    const clean = take.trim();
    if (!clean || typing) return;
    setValue("");
    setMessages((list) => [...list, { role: "user", text: clean }]);
    setTyping(true);
    window.setTimeout(() => {
      if (bettingPattern.test(clean)) {
        setMessages((list) => [
          ...list,
          {
            role: "bot",
            guard: true,
            text:
              "I don't do betting advice, lines, or picks — hard guardrail. Keep it to arguments, players, teams, and ball.",
          },
        ]);
      } else {
        const bump = 12 + Math.floor(Math.random() * 26);
        setScore((current) => Math.min(1000, current + bump));
        setMessages((list) => [...list, { role: "bot", text: botReply(clean) }]);
      }
      setTyping(false);
    }, 850);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitTake(value);
  }

  return (
    <div className="phone-shell" aria-label="You Know Ball Banter Bot phone mock">
      <div className="phone-notch" />
      <header className="phone-header">
        <div className="yb-avatar">YB</div>
        <div>
          <strong>You Know Ball</strong>
          <span>● BANTER BOT · ONLINE</span>
        </div>
        <div className="kb-score">
          <small>KB SCORE</small>
          <b>{score}</b>
          <em>{currentRank}</em>
        </div>
      </header>
      <div className="chat-log" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={clsx("chat", message.role)}>
            {message.guard ? <ShieldCheck size={15} aria-hidden="true" /> : null}
            <p>{message.text}</p>
          </div>
        ))}
        {typing ? (
          <div className="typing" aria-label="Banter Bot typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
      <div className="quick-takes">
        {quickTakes.map((take) => (
          <button key={take} type="button" onClick={() => submitTake(take)}>
            {take}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="chat-form">
        <label className="sr-only" htmlFor="take">
          Drop a take
        </label>
        <input
          ref={inputRef}
          id="take"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Drop a take..."
        />
        <button type="submit" aria-label="Send take">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

