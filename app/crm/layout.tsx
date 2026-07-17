import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import "./crm.css";

export const metadata: Metadata = {
  title: "Private CRM | Koinophobia Labs",
  robots: { index: false, follow: false, nocache: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm-shell">
      <header className="crm-brandbar">
        <Link href="/" aria-label="Koinophobia Labs home">
          <BrandLogo
            variant="lockup"
            className="crm-brandbar__logo"
            decorative
          />
        </Link>
        <span>Private workspace</span>
      </header>
      {children}
    </div>
  );
}
