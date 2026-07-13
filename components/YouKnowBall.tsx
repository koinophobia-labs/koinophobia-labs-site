import { Kicker, Reveal } from "@/components/ui";
import YouKnowBallSpotlight from "@/components/YouKnowBallSpotlight";

export default function YouKnowBall() {
  return (
    <section id="work" className="section ykb-section ykb-home" aria-labelledby="ykb-title">
      <Reveal>
        <Kicker tone="orange">Interactive product spotlight · 02</Kicker>
        <div className="ykb-home-head">
          <div>
            <h2 id="ykb-title">You Know <span>Ball</span></h2>
            <p className="ykb-tagline">One take. One counter. Your move.</p>
            <p className="product-status"><strong>WEB MVP</strong> Play locally in your browser. No account required.</p>
          </div>
          <p>A contained taste of the sports debate game: make the case, get pushed back, and see how the take scores.</p>
        </div>
      </Reveal>
      <Reveal><YouKnowBallSpotlight /></Reveal>
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
