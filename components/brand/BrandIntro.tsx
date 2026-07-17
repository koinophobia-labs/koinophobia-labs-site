"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";

const INTRO_DURATION_MS = 1650;

export default function BrandIntro() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(false);
      return;
    }

    const safetyTimer = window.setTimeout(
      () => setActive(false),
      INTRO_DURATION_MS + 300,
    );

    return () => window.clearTimeout(safetyTimer);
  }, []);

  if (!active) return null;

  return (
    <div
      className="brand-intro"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.currentTarget === event.target) setActive(false);
      }}
    >
      <BrandLogo
        variant="emblem"
        className="brand-intro__emblem"
        priority
        decorative
      />
    </div>
  );
}
