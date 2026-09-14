import Link from "next/link";
import { LINKS } from "@/lib/links";
import { NAV } from "@/lib/nav";

export default function SiteFooter() {
  return (
    <footer className="foot">
      <nav aria-label="Footer">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/privacy">Privacy</Link>
      </nav>
      <nav aria-label="Social">
        <a href={LINKS.github} rel="noreferrer" target="_blank" data-analytics="founder_link_click" data-analytics-label="github">
          GitHub
        </a>
        <a href="https://www.instagram.com/koinophobia_labs/" rel="noreferrer" target="_blank" data-analytics="founder_link_click" data-analytics-label="instagram">
          Instagram
        </a>
        <a href={LINKS.linkedin} rel="noreferrer" target="_blank" data-analytics="founder_link_click" data-analytics-label="linkedin">
          LinkedIn
        </a>
      </nav>
      <span className="foot__def">Koinophobia: the fear of an ordinary life.</span>
      <span>Koinophobia Labs · Chicago</span>
      <span className="foot__sign">Fear ordinary.</span>
    </footer>
  );
}
