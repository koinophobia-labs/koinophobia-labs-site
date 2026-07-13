import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui";
import TrendiHeroVisual from "@/components/trendi/TrendiHeroVisual";
import TrendiMedia from "@/components/TrendiMedia";

const proof = [
  "Voice-first capture",
  "Creator-specific output",
  "Recordable scripts",
  "For solo creators & founders",
  "TestFlight beta",
];

export default function TrendiFeature() {
  return (
    <section id="products" className="trendiLaunch_world" aria-labelledby="trendi-feature-title">
      <div className="trendiLaunch_shell">
        <Reveal>
          <p className="trendiLaunch_eyebrow">Featured product</p>
          <div className="trendiLaunch_intro">
            <div className="trendiLaunch_copy">
              <p id="trendi-feature-wordmark" className="trendiLaunch_wordmark" aria-label="Trendi">TRENDI</p>
              <h2 id="trendi-feature-title">Turn the thought in your head into words you can actually record.</h2>
              <p className="trendiLaunch_lede">Type it or say it messy. Trendi shapes the idea into creator-specific, usable words—without adding more generic content sludge to the feed.</p>
              <p className="trendiLaunch_status"><strong>TESTFLIGHT BETA</strong><span>Available through TestFlight. Not yet publicly released on the App Store.</span></p>
              <div className="trendiLaunch_actions">
                <Link id="trendi-feature-cta" className="trendiLaunch_primary" href="/trendi">View Trendi <ArrowRight size={17} aria-hidden="true" /></Link>
                <a className="trendiLaunch_secondary" href="#trendi-demo">Watch the real demo</a>
              </div>
            </div>
            <div className="trendiLaunch_side">
              <TrendiHeroVisual
                variant="full"
                heroId="products"
                wordmarkId="trendi-feature-wordmark"
                ctaId="trendi-feature-cta"
              />
              <p className="trendiLaunch_sideNote"><span>01</span>Flagship product from Koinophobia Labs</p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <ul className="trendiLaunch_proof" aria-label="Trendi product qualities">
            {proof.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Reveal>
        <Reveal>
          <TrendiMedia />
        </Reveal>
      </div>
    </section>
  );
}
