import type { Metadata } from "next";
import LabPage from "@/components/site/LabPage";
import { getSiteProduct } from "@/lib/products";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Do You Know Ball?",
  description:
    "A sports-argument game where the opponent keeps score and remembers. Live as a web demo; iOS builds accepted by Apple, not yet released.",
  alternates: { canonical: `${STUDIO_URL}/lab/do-you-know-ball` },
  openGraph: { url: `${STUDIO_URL}/lab/do-you-know-ball`, images: [socialCard("Somebody who lives in your phone, disagrees with you about everything, and keeps score.", "The lab")] },
};

export default function DoYouKnowBallPage() {
  const product = getSiteProduct("you-know-ball")!;
  return (
    <LabPage
      product={product}
      kicker="Do You Know Ball? · Game · web demo, iOS pending"
      h1="Somebody who lives in your phone, disagrees with you about everything, and keeps score."
      lede="Drop a take. BanterBot counters. Your argument gets a transparent score from rules, not from a model's mood. In August 2026 the sports game and its general-argument sibling, Last Word, were merged into one product. The web demo still wears the older name."
      stats={[
        { value: "2", label: "iOS builds accepted by Apple" },
        { value: "0", label: "public iOS releases" },
        { value: "Web", label: "demo live, no account" },
      ]}
      primary={{ label: "Play the web demo", href: "/you-know-ball/play", analytics: "web_demo_click" }}
      sections={[
        {
          kicker: "How it plays",
          title: "Three ways in, one honest score.",
          body: (
            <p className="lede">
              Read the floor: a seven-possession coverage read. Hot seat: a three-life pressure run
              against BanterBot. Build the case: a sourced evidence draft and a cross-examination.
              Deterministic rules own every point; a model may improve BanterBot&apos;s voice but
              never controls points, lives, evidence, or progression. No betting, no picks, not a
              sportsbook.
            </p>
          ),
        },
      ]}
      next="Pick the public name, then decide whether the accepted iOS builds go to testers under it."
    />
  );
}
