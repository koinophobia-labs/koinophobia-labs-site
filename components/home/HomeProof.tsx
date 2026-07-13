import { founderLinks } from "@/lib/founderHub";

// Condensed editorial evidence — real receipts only (metrics sourced from
// lib/content.ts proofReceipts; no invented clients, numbers, or outcomes).
// Career Forge appears here as a small secondary offer, out of the main flow.
const RECEIPTS = [
  {
    title: "Red-teamed before launch",
    body: "80 adversarial prompts run against the You Know Ball debate engine. Zero hard violations.",
  },
  {
    title: "Guardrails by default",
    body: "The game refuses betting picks, lines, and parlays, and a safety gate clears before any response ships.",
  },
  {
    title: "Documented and tested",
    body: "QA, docs, and release verification before anything ships — built thumb-first and tested on real phones.",
  },
];

export default function HomeProof() {
  return (
    <section id="proof" className="kl-section">
      <div className="kl-inner">
        <h2 className="kl-h2">Proof, not promises</h2>
        <p className="kl-proof__intro">
          Receipts from how the work actually ships — no invented clients, no
          padded numbers.
        </p>
        <div className="kl-proof__rows">
          {RECEIPTS.map((r) => (
            <div key={r.title} className="kl-proof__row">
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
        <aside className="kl-offer" aria-labelledby="career-forge-offer">
          <div>
            <h3 id="career-forge-offer">Career Forge — Resume Rebuild</h3>
            <p>
              A $149 flat-rate rebuild of your real work history — accurate,
              role-aware, no invented metrics. 48-hour turnaround, one revision
              round included.
            </p>
          </div>
          <a className="kl-link" href={founderLinks.emailWithContext}>
            Request a rebuild →
          </a>
        </aside>
      </div>
    </section>
  );
}
