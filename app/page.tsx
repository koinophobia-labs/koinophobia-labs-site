import type { Metadata } from "next";
import HomeNav from "@/components/home/HomeNav";
import HomeHero from "@/components/home/HomeHero";
import HomeServices from "@/components/home/HomeServices";
import HomeProof from "@/components/home/HomeProof";
import HomeFounder from "@/components/home/HomeFounder";
import HomeAudit from "@/components/home/HomeAudit";
import HomeFooter from "@/components/home/HomeFooter";
import TrendiFeature from "@/components/TrendiFeature";
import YouKnowBall from "@/components/YouKnowBall";

export const metadata: Metadata = {
  title: "Koinophobia Labs — A founder-led studio in Chicago",
  description:
    "Koinophobia Labs is Blake Taylor's founder-led studio in Chicago. Websites that convert, workflows that remove real work, and products people actually use — for founders, creators, and small teams.",
  alternates: { canonical: "https://koinophobialabs.com/" },
  openGraph: {
    title: "Koinophobia Labs — A founder-led studio in Chicago",
    description:
      "Websites that convert, workflows that remove real work, and products people actually use — for founders, creators, and small teams.",
    url: "https://koinophobialabs.com/",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinophobia Labs — A founder-led studio in Chicago",
    description:
      "Websites that convert, workflows that remove real work, and products people actually use.",
    images: ["/og.png"],
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
        <TrendiFeature />
        <div className="kl-band kl-band--white">
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
