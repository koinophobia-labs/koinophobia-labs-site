import type { Metadata } from "next";
import "./team.css";
export const metadata: Metadata = {
  title: "Team · Koinophobia Labs",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="team-root">{children}</div>;
}
