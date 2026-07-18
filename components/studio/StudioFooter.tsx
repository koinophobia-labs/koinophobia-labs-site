import Image from "next/image";
import Link from "next/link";

export default function StudioFooter() {
  return (
    <footer className="studio-footer">
      <div className="studio-container studio-footer__grid">
        <div>
          <div className="studio-brand studio-brand--footer"><Image src="/koi-mark.png" alt="" width={34} height={34} /><span>Koinophobia <b>Labs</b></span></div>
          <p>Founder-led websites, AI workflows, and business systems. Chicago-based, available remotely.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/services">Services</Link><Link href="/work">Work</Link><Link href="/products">Products</Link><Link href="/process">Process</Link><Link href="/about">About</Link><Link href="/intake">Request a project</Link>
        </nav>
        <div className="studio-footer__meta"><a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a><span>© 2026 Koinophobia Labs</span></div>
      </div>
    </footer>
  );
}
