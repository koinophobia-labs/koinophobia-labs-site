"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#products" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#audit" },
];

export default function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="kl-nav" data-open={open} aria-label="Primary">
      <div className="kl-nav__inner">
        <div className="kl-nav__brand">
          <Link href="/" className="kl-nav__word">
            Koinophobia Labs
          </Link>
          <span className="kl-nav__place">Chicago</span>
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
