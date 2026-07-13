import { Reveal } from "@/components/ui";
import YkbChallenge from "@/components/home/YkbChallenge";
import YouKnowBallSpotlight from "@/components/YouKnowBallSpotlight";

export default function YouKnowBall() {
  return (
    <section id="work" className="section ykb-section ykb-home" aria-labelledby="work-title">
      {/* Dark "arena" entrance: Trendi's purple sweep darkens into the game
          world, the "You Know Ball?" challenge lands, then the existing
          lazy-loaded playable card takes over — its architecture is untouched.
          The SVG is decorative: aria-hidden + pointer-events:none (in CSS). */}
      <div className="ykb-arena">
        <svg
          className="ykb-court"
          viewBox="0 0 1200 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="ykb-sweep" x1="0" y1="0" x2="1" y2="0.5">
              <stop offset="0" stopColor="#7b4dff" />
              <stop offset="0.45" stopColor="#c23bf0" />
              <stop offset="0.7" stopColor="#ff2ed1" />
              <stop offset="1" stopColor="#ff6a2b" />
            </linearGradient>
          </defs>
          {/* Purple-to-orange sweep carried from Trendi, fading into the arena */}
          <path
            className="ykb-court__sweep"
            d="M0,86 C280,12 520,150 720,116 C920,84 1060,0 1200,40 L1200,0 L0,0 Z"
            fill="url(#ykb-sweep)"
          />
          {/* Faint court arc + possession line guiding the eye down to the card */}
          <path className="ykb-court__arc" d="M120,300 A480,480 0 0 1 1080,300" />
          <path className="ykb-court__seam" d="M600,150 L600,320" />
          <path className="ykb-court__arc ykb-court__arc--inner" d="M300,320 A300,300 0 0 1 900,320" />
        </svg>

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
