import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import IntakeForm from "@/components/acquisition/IntakeForm";
import StudioFooter from "@/components/studio/StudioFooter";
import StudioNav from "@/components/studio/StudioNav";

export const metadata: Metadata = { title: "Request a Project", description: "Tell Koinophobia Labs about your business, current friction, desired outcome, budget, tools, and timeline.", alternates: { canonical: "/intake" }, robots: { index: false, follow: true } };
export default function IntakePage() {
  return <div className="studio-site"><StudioNav /><main>
    <header className="studio-page-hero"><div className="studio-container studio-page-hero__grid"><div><p className="studio-eyebrow">Request a project</p><h1>Start with the business problem.</h1><p className="studio-page-hero__lede">You do not need to prescribe the technology. Share what is breaking, what better would look like, the current tools, budget, and timing.</p><div className="studio-hero__actions"><a className="studio-button" href="#standard-intake">Start the standard form</a><Link className="studio-button studio-button--secondary" href="/concierge?entry=intake" data-analytics="concierge_entry_click">Help me choose <ArrowRight size={16} aria-hidden="true" /></Link></div></div><aside className="studio-page-hero__aside">After submission, Blake reviews fit and replies with the smallest sensible next step. Nothing is charged by this form.</aside></div></header>
    <section className="studio-section studio-section--compact" id="standard-intake"><div className="studio-container" style={{ maxWidth: 920 }}><div className="intake-choice-note"><p className="studio-eyebrow">Standard project intake</p><h2>Know the direction already?</h2><p>Complete the form directly. If you arrived from the concierge, the relevant fields are prefilled and remain editable.</p></div><IntakeForm /></div></section>
  </main><StudioFooter /></div>;
}
