import { Reveal } from "@/components/ui";
import YkbChallenge from "@/components/home/YkbChallenge";
import YouKnowBallSpotlight from "@/components/YouKnowBallSpotlight";

export default function YouKnowBall() {
  return (
    <section id="work" className="section ykb-section ykb-home" aria-labelledby="work-title">
      {/* Dark arena entrance flowing out of the Trendi flagship above (the
          soft rose→violet→orange seam lives on .kl-band--arena in CSS). The
          "You Know Ball?" challenge lands, then the existing lazy-loaded
          playable card takes over — its architecture is untouched. */}
      <div className="ykb-arena">
        <p className="kicker kicker-orange ykb-arena__kicker">Interactive product spotlight · 02</p>
        <YkbChallenge />
        <Reveal><YouKnowBallSpotlight /></Reveal>
      </div>

      <Reveal>
        <aside className="koi-case" aria-labelledby="koi-case-title">
          <div><span>Private build · 03</span><h3 id="koi-case-title">Koi Cave</h3></div>
          <p>A local-first operator system for notes, tasks, memory, and automations. A smaller private-build case study—not a public product demo.</p>
          <a href="#contact">Ask about the build →</a>
        </aside>
      </Reveal>
    </section>
  );
}
