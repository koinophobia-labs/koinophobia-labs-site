"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/nav";

/**
 * Five words and one button. Becomes glass after 80px of scroll and never
 * hides on scroll down. On phones the five collapse into a bottom sheet; the
 * button moves into the sheet and the sticky bar.
 */
export default function Masthead({ current }: { current?: string }) {
  const pathname = usePathname();
  const active = current ?? pathname;
  const [glass, setGlass] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setGlass(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`mast${glass ? " is-glass" : ""}`}>
      <Link className="mast__brand ai" href="/" aria-label="Koinophobia Labs, home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/koinophobia-labs-koi-640.webp" alt="" width={30} height={30} />
        Koinophobia Labs
      </Link>
      <nav className={`mast__nav${open ? " is-open" : ""}`} id="site-nav" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="ai"
            aria-current={active === item.href || active?.startsWith(`${item.href}/`) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link className="btn btn--primary mast__sheet-cta" href="/start" data-analytics="inquiry_start" data-analytics-label="masthead_sheet">
          Start a project
        </Link>
      </nav>
      <Link className="btn btn--primary btn--small ai mast__cta" href="/start" data-analytics="inquiry_start" data-analytics-label="masthead">
        Start a project
      </Link>
      <button
        className="btn btn--small mast__menu"
        type="button"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
    </header>
  );
}
