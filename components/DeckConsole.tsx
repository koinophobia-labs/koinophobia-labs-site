"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { bootLines } from "@/lib/content";
import { StatusTag } from "@/components/ui";

function lineTone(line: string) {
  if (line.includes("LIVE")) return "orange";
  if (line.includes("BUILD")) return "cyan";
  if (line.includes("LOCAL")) return "gray";
  if (line.includes("OPEN")) return "gold";
  return "cyan";
}

export default function DeckConsole() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(reduced ? bootLines.length : 0);

  useEffect(() => {
    if (reduced) return;
    const timers = bootLines.map((_, index) =>
      window.setTimeout(() => setVisible(index + 1), 260 + index * 315),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  return (
    <motion.aside
      className="deck-console panel"
      initial={reduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Koinophobia command deck console"
    >
      <div className="console-radar" aria-hidden="true" />
      <header>
        <span className="dot red" />
        <span className="dot gold" />
        <span className="dot cyan" />
        <strong>koi://command-deck</strong>
        <em>● ONLINE</em>
      </header>
      <div className="console-body">
        {bootLines.slice(0, visible).map((line) => (
          <p key={line}>
            {line.includes("LIVE") ||
            line.includes("BUILD") ||
            line.includes("LOCAL") ||
            line.includes("OPEN") ? (
              <>
                <span>{line.replace(/(LIVE|BUILD|LOCAL|OPEN)/, "")}</span>
                <StatusTag tone={lineTone(line)}>{line.match(/LIVE|BUILD|LOCAL|OPEN/)?.[0]}</StatusTag>
              </>
            ) : (
              line
            )}
            {line === "> system online." ? <span className="cursor" /> : null}
          </p>
        ))}
      </div>
      <footer>
        <span>
          STATUS <strong>SHIPPING</strong>
        </span>
        <span>
          STACK <strong>iOS · WEB · AI</strong>
        </span>
        <span>
          MODE <strong>BUILD IN PUBLIC</strong>
        </span>
      </footer>
    </motion.aside>
  );
}

