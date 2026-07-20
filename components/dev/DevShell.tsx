import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/links";

// Shared chrome for every koinophobia.dev route except the home page (which
// owns its own hero-scale topbar). One nav definition means the personal site
// can't grow a route that nothing links to.

export const DEV_NAV = [
  { href: "/products", label: "Products" },
  { href: "/lab", label: "Lab" },
  { href: "/notes", label: "Notes" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
] as const;

export type DevWorld = "forge" | "signal" | "arena" | "cave" | "studio";

export default function DevShell({
  world,
  current,
  narrow,
  fieldX,
  children,
}: {
  /** Sets the accent theme. Omit for Blake-violet. */
  world?: DevWorld;
  /** Route that should be marked aria-current in the nav. */
  current?: string;
  narrow?: boolean;
  fieldX?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={narrow ? "devpage devpage--narrow" : "devpage"}
      data-world={world}
      style={fieldX ? ({ "--dh-field-x": fieldX } as React.CSSProperties) : undefined}
    >
      <div className="devpage__field" aria-hidden="true" />

      <header className="devpage__topbar">
        <Link className="devpage__wordmark" href="/">
          koinophobia.dev
        </Link>
        <nav className="devpage__nav" aria-label="Site">
          {DEV_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="devpage__footer">
        <span>koinophobia.dev — the person</span>
        <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
          koinophobialabs.com — the studio <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
