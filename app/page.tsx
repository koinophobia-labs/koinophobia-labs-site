import type { Metadata } from "next";
import HomeNav from "@/components/home/HomeNav";
import HomeHero from "@/components/home/HomeHero";
import HomeServices from "@/components/home/HomeServices";
import HomeCareerForge from "@/components/home/HomeCareerForge";
import HomeProof from "@/components/home/HomeProof";
import HomeFounder from "@/components/home/HomeFounder";
import HomeAudit from "@/components/home/HomeAudit";
import HomeFooter from "@/components/home/HomeFooter";
import TrendiFeature from "@/components/TrendiFeature";
import YouKnowBall from "@/components/YouKnowBall";

export const metadata: Metadata = {
  title: "Koinophobia Labs | Career Forge beta and founder-led systems",
  description:
    "Koinophobia Labs is Blake Taylor's founder-led studio in Chicago. Career Forge is a public beta for organizing career evidence and creating reviewable drafts; Trendi, software, workflows, and websites turn messy work into repeatable action.",
  alternates: { canonical: "https://koinophobialabs.com/" },
  openGraph: {
    title: "Koinophobia Labs | Career Forge beta and founder-led systems",
    description:
      "Career Forge public beta for job seekers, Trendi for creators, and founder-led software, workflows, and websites that turn messy work into repeatable action.",
    url: "https://koinophobialabs.com/",
    siteName: "Koinophobia Labs",
    images: [
      {
        url: "/brand/social-card",
        width: 1200,
        height: 630,
        alt: "Koinophobia Labs official logo with two cybernetic koi and a violet pulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinophobia Labs | Career Forge beta and founder-led systems",
    description:
      "Career Forge public beta for job seekers, Trendi for creators, and founder-led systems for messy work.",
    images: ["/brand/social-card"],
  },
};

// "Blake, In Person" (3a) editorial shell. The Trendi feature (real demo
// video + screenshot) and the playable You Know Ball possession are preserved
// verbatim from the release-candidate implementation; only the page shell and
// surrounding sections changed.
export default function Home() {
  return (
    <div className="kl-home">
      <HomeNav />
      <main>
        <HomeHero />
        <HomeServices />
        <HomeCareerForge />
        <TrendiFeature />
        <div className="kl-band kl-band--arena">
          <YouKnowBall />
        </div>
        <HomeProof />
        <HomeFounder />
        <HomeAudit />
      </main>
      <HomeFooter />
    </div>
  );
}
