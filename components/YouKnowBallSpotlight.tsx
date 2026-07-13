"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { trackYkb } from "@/lib/youKnowBall";

const Playable = dynamic(() => import("@/components/YouKnowBallGame"), { loading: () => <p className="ykb-loading">Loading the possession…</p>, ssr: false });

export default function YouKnowBallSpotlight() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { trackYkb("play_module_viewed"); observer.disconnect(); }
    }, { threshold: 0.35 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="ykb-spotlight-shell">
      {started ? <Playable compact /> : (
        <div className="ykb-static-preview">
          <div>
            <p className="ykb-overline">NBA · One possession</p>
            <h3>What matters more in an all-time player debate: peak or longevity?</h3>
            <p>Choose an angle, make a short case, and let BanterBot push back. About 30 seconds.</p>
          </div>
          <button type="button" onClick={() => { setStarted(true); trackYkb("first_possession_started"); }}><Play size={17} fill="currentColor" /> Play one possession</button>
          <Link href="/you-know-ball/play" prefetch={false}>Skip to the full web version <ArrowRight size={15} /></Link>
        </div>
      )}
    </div>
  );
}
