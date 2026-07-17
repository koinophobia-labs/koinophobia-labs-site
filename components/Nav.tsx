"use client";

import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import { navItems } from "@/lib/content";
import { useHasScrolled, useScrollSpy } from "@/lib/hooks";
import { Button } from "@/components/ui";

const spyIds = ["top", "products", "lab", "proof", "concepts", "services", "about", "contact"];

export default function Nav() {
  const active = useScrollSpy(spyIds);
  const hasScrolled = useHasScrolled();
  const [open, setOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>("[data-menu] a, [data-menu] button"),
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav className={clsx("site-nav", hasScrolled && "site-nav-scrolled")}>
      <a className="brand" href="#top" aria-label="Koinophobia Labs home">
        <span className="brand-mark">
          <BrandLogo
            variant="emblem"
            className="brand__emblem"
            priority
            animated
            decorative
          />
        </span>
        <span>
          <strong>KOINOPHOBIA</strong>
          <em>LABS</em>
        </span>
      </a>
      <div className="nav-links" aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={item.id}
            className={clsx(active === item.id && "active")}
            href={`#${item.id}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <Button className="nav-cta" href="#contact" tone="gold">
        Work With Me
      </Button>
      <button
        className="menu-toggle"
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open ? (
        <div className="mobile-menu" data-menu>
          <button
            className="menu-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={24} />
          </button>
          <div className="mobile-menu-links">
            {navItems.map((item, index) => (
              <a
                key={item.id}
                ref={index === 0 ? firstLink : undefined}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            ))}
            <Button href="#contact" tone="gold" onClick={() => setOpen(false)}>
              Work With Me
            </Button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
