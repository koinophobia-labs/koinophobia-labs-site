"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";

const SESSION_KEY = "koinophobia-brand-intro-seen";

type IntroPhase = "hidden" | "visible" | "leaving";

export default function BrandIntro() {
  const [phase, setPhase] = useState<IntroPhase>("hidden");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      if (reducedMotion || window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      if (reducedMotion) return;
    }

    const showFrame = window.requestAnimationFrame(() => setPhase("visible"));
    const leaveTimer = window.setTimeout(() => setPhase("leaving"), 1750);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 2300);

    return () => {
      window.cancelAnimationFrame(showFrame);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div className="brand-intro" data-phase={phase} aria-hidden="true">
      <div className="brand-intro__field" />
      <div className="brand-intro__panel">
        <BrandLogo
          variant="emblem"
          className="brand-intro__emblem"
          priority
          animated
          decorative
        />
        <BrandLogo
          variant="lockup"
          className="brand-intro__lockup"
          priority
          decorative
        />
        <p>KOINOPHOBIA LABS // SYSTEMS ONLINE</p>
      </div>
    </div>
  );
}
