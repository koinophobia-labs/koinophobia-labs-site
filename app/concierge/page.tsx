import type { Metadata } from "next";
import ConciergePageFlow from "@/components/concierge/ConciergePageFlow";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  title: "AI Project Concierge",
  description: "Describe the business problem in your own words and get a structured brief with a practical preliminary recommendation — website, workflow, product, audit, or focused repair.",
  alternates: { canonical: "/concierge" },
  openGraph: { url: "/concierge" },
};

export default async function ConciergePage({ searchParams }: { searchParams: Promise<{ entry?: string; mode?: string }> }) {
  const params = await searchParams;
  const rawEntry = params.entry || "direct";
  const entry = ["home", "services", "intake", "audit", "koi", "direct"].includes(rawEntry) ? rawEntry : "direct";
  const mode = params.mode === "steps" ? "steps" : undefined;
  return (
    <div className="studio-site concierge-page">
      <StudioNav />
      <main>
        <header className="studio-page-hero concierge-page-hero">
          <div className="studio-container studio-page-hero__grid">
            <div><p className="studio-eyebrow">AI Front Office</p><h1>Say what&apos;s going wrong. Leave with a next step.</h1><p className="studio-page-hero__lede">Describe the friction in plain language — typos and half-thoughts welcome. You get a structured brief and the smallest sensible starting point, and nothing is sent anywhere until you decide to send it.</p></div>
            <aside className="studio-page-hero__aside studio-page-hero__aside--keep">The recommendation comes from explicit business rules, not improvisation. Blake reviews every submitted project before scope, price, timing, or fit is confirmed.</aside>
          </div>
        </header>
        <section className="studio-section studio-section--compact"><div className="studio-container concierge-container"><ConciergePageFlow entry={entry} mode={mode} /></div></section>
      </main>
      <StudioFooter />
    </div>
  );
}
