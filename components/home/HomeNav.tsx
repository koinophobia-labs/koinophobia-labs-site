"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Career Forge", href: "#career-forge" },
  { label: "Work", href: "#products" },
  { label: "About", href: "#about" },
];

export default function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="kl-nav" data-open={open} aria-label="Primary">
      <div className="kl-nav__inner">
        <div className="kl-nav__brand">
          <Link href="/" className="kl-nav__brand-link" aria-label="Koinophobia Labs home">
            <BrandLogo
              variant="emblem"
              className="kl-nav__emblem"
              priority
              animated
              decorative
            />
            <span className="kl-nav__brand-copy">
              <span className="kl-nav__word">Koinophobia Labs</span>
              <span className="kl-nav__place">Chicago</span>
            </span>
          </Link>
        </div>

        <div className="kl-nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <Link className="kl-btn kl-btn--primary kl-btn--sm" href="/audit">
            Get a Revenue Leak Audit
          </Link>
        </div>

        <button
          className="kl-nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="kl-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="kl-nav__mobile" id="kl-mobile-menu">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <Link
          className="kl-btn kl-btn--primary"
          href="/audit"
          onClick={() => setOpen(false)}
        >
          Get a Revenue Leak Audit
        </Link>
      </div>
    </nav>
  );
}
