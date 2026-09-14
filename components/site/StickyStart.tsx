"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The mobile bottom bar. Appears after the visitor scrolls past `after`
 * (a section id) and hides again once `before` (the start section) is near.
 */
export default function StickyStart({ after, before }: { after: string; before?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1024px)");
    const onScroll = () => {
      if (!mobile.matches) return setOn(false);
      const a = document.getElementById(after);
      const b = before ? document.getElementById(before) : null;
      const past = a ? a.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
      const near = b ? b.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      setOn(past && !near);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [after, before]);
  return (
    <div className={`sticky${on ? " is-on" : ""}`}>
      <Link className="btn btn--primary" href="/start" data-analytics="inquiry_start" data-analytics-label="sticky_bar">
        Start a project
      </Link>
    </div>
  );
}
