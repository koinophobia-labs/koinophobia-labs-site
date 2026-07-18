import type { Metadata } from "next";
import ConciergeFlow from "@/components/concierge/ConciergeFlow";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  title: "AI Project Concierge",
  description: "Answer seven focused questions and get a practical preliminary recommendation for a website, workflow, product, audit, or focused repair.",
  alternates: { canonical: "/concierge" },
  openGraph: { url: "/concierge" },
};

export default async function ConciergePage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const rawEntry = (await searchParams).entry || "direct";
  const entry = ["home", "services", "intake", "audit", "direct"].includes(rawEntry) ? rawEntry : "direct";
  return (
    <div className="studio-site concierge-page">
      <StudioNav />
      <main>
        <header className="studio-page-hero concierge-page-hero">
          <div className="studio-container studio-page-hero__grid">
            <div><p className="studio-eyebrow">AI Project Concierge</p><h1>A clearer next step, without guessing the service.</h1><p className="studio-page-hero__lede">A finite, rules-grounded intake for businesses that know the friction but not the right engagement.</p></div>
            <aside className="studio-page-hero__aside studio-page-hero__aside--keep">This tool interprets your answers and prepares a preliminary recommendation. Blake reviews every submitted project before scope, price, timing, or fit is confirmed.</aside>
          </div>
        </header>
        <section className="studio-section studio-section--compact"><div className="studio-container concierge-container"><ConciergeFlow entry={entry} /></div></section>
      </main>
      <StudioFooter />
    </div>
  );
}
