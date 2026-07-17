import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export default function HomeFooter() {
  return (
    <footer className="kl-footer">
      <div className="kl-footer__inner">
        <div className="kl-footer__brand">
          <Link
            href="/"
            className="kl-footer__brand-link"
            aria-label="Koinophobia Labs home"
          >
            <BrandLogo
              variant="lockup"
              className="kl-footer__lockup"
              decorative
            />
          </Link>
          <span>Founder-led. Chicago.</span>
        </div>
        <nav className="kl-footer__nav" aria-label="Footer">
          <a href="#services">Services</a>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="/connect">Connect</a>
        </nav>
        <span className="kl-footer__meta">CHICAGO, IL · © 2026</span>
      </div>
    </footer>
  );
}
