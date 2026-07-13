import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kicker, Reveal } from "@/components/ui";

export default function TrendiFeature() {
  return (
    <section id="products" className="section trendi-feature" aria-labelledby="trendi-feature-title">
      <Reveal>
        <Kicker tone="gold">Featured product · 01</Kicker>
        <div className="trendi-head">
          <div>
            <h2 id="trendi-feature-title">Trendi</h2>
            <p className="trendi-lede">From “what should I post?” to a usable draft—without the content chaos.</p>
          </div>
          <Link className="trendi-link" href="/trendi">View product proof <ArrowRight size={16} /></Link>
        </div>
      </Reveal>
      <Reveal>
        <div className="trendi-media-grid">
          <figure className="trendi-video-frame">
            <video controls preload="none" playsInline poster="/trendi/trendi-mobile.png" aria-label="Trendi product demo">
              <source src="/trendi/trendi-demo.mp4" type="video/mp4" />
            </video>
            <figcaption>Product demo · loads only when you press play</figcaption>
          </figure>
          <figure className="trendi-shot">
            <Image src="/trendi/trendi-mobile.png" alt="Trendi mobile interface showing the creator workflow" width={390} height={844} sizes="(max-width: 900px) 65vw, 300px" />
            <figcaption>Mobile workflow</figcaption>
          </figure>
        </div>
      </Reveal>
    </section>
  );
}
