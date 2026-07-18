"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  ["Services", "/services"],
  ["Work", "/work"],
  ["Products", "/products"],
  ["Process", "/process"],
  ["About", "/about"],
] as const;

export default function StudioNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="studio-nav" data-open={open} aria-label="Primary navigation">
      <div className="studio-nav__inner">
        <Link className="studio-brand" href="/" aria-label="Koinophobia Labs home">
          <Image src="/brand/koi-emblem.svg" alt="" width={34} height={34} priority />
          <span>Koinophobia <b>Labs</b></span>
        </Link>
        <div className="studio-nav__desktop">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link className="studio-button studio-button--compact" href="/audit" data-analytics="audit_cta_click">Start an Audit</Link>
        </div>
        <button className="studio-nav__toggle" type="button" aria-expanded={open} aria-controls="studio-mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </div>
      <div id="studio-mobile-nav" className="studio-nav__mobile">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link className="studio-button" href="/audit" data-analytics="audit_cta_click" onClick={() => setOpen(false)}>Start an Audit</Link>
      </div>
    </nav>
  );
}
