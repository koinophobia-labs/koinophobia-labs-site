export default function HomeFooter() {
  return (
    <footer className="kl-footer">
      <div className="kl-footer__inner">
        <div className="kl-footer__brand">
          <b>Koinophobia Labs</b>
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
