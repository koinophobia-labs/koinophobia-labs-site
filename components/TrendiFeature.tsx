import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kicker, Reveal } from "@/components/ui";
import TrendiMedia from "@/components/TrendiMedia";

export default function TrendiFeature() {
  return (
    <section id="products" className="section trendi-feature" aria-labelledby="trendi-feature-title">
      <Reveal>
        <Kicker tone="gold">Featured product · 01</Kicker>
        <div className="trendi-head">
          <div>
            <h2 id="trendi-feature-title">Trendi</h2>
            <p className="trendi-lede">From “what should I post?” to a usable draft—without the content chaos.</p>
            <p className="product-status"><strong>TESTFLIGHT</strong> Available in TestFlight beta. Not yet publicly released on the App Store.</p>
          </div>
          <Link className="trendi-link" href="/trendi">View product proof <ArrowRight size={16} /></Link>
        </div>
      </Reveal>
      <Reveal>
        <TrendiMedia />
      </Reveal>
    </section>
  );
}
