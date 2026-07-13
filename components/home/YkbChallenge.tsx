"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The animated "You Know Ball?" challenge text. Tiny client boundary: one
 * one-shot IntersectionObserver flips `data-revealed`; all motion is CSS
 * (transform/opacity). Imports NOTHING from the game bundle, so the reveal
 * never triggers the lazy-loaded playable.
 *
 * No-JS / reduced-motion safety: text renders fully visible by default. Only
 * when motion is allowed AND an observer exists do we "arm" the reveal (jump
 * to the hidden start state, then animate in on intersect), so a visitor
 * without JS, or with prefers-reduced-motion, always sees the complete text.
 */
export default function YkbChallenge() {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Arm on the next frame (not synchronously) so the text paints visible
    // first, then transitions to its hidden start state before revealing.
    const raf = requestAnimationFrame(() => setArmed(true));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect(); // one-shot: never replays on scroll jiggle
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`ykb-challenge${armed ? " ykb-challenge--armed" : ""}`}
      data-revealed={revealed || undefined}
    >
      <h2 id="work-title" className="ykb-challenge__title">
        <span className="ykb-word">You</span>{" "}
        <span className="ykb-word">Know</span>{" "}
        <span className="ykb-word">
          Ball<span className="ykb-q">?</span>
        </span>
      </h2>
      <p className="ykb-challenge__tag">One take. One counter. Your move.</p>
      <p className="product-status ykb-challenge__status">
        <strong>LIVE</strong> Play locally in your browser. No account required.
      </p>
    </div>
  );
}
