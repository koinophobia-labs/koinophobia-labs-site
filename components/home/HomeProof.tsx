// Condensed editorial evidence. Real receipts only, with no invented clients,
// numbers, outcomes, or product-readiness claims.
const RECEIPTS = [
  {
    title: "Reviewable evidence workflow",
    body: "Career Forge keeps source evidence reviewable and separates goals, gaps, constraints, and uncertainty from professional claims. The product remains in public beta, and every generated material requires review.",
  },
  {
    title: "Red-teamed before launch",
    body: "80 adversarial prompts run against the You Know Ball debate engine. Zero hard violations.",
  },
  {
    title: "Documented and tested",
    body: "QA, docs, and release verification before anything ships, built thumb-first and tested on real phones.",
  },
];

export default function HomeProof() {
  return (
    <section id="proof" className="kl-section">
      <div className="kl-inner">
        <h2 className="kl-h2">Proof, not promises</h2>
        <p className="kl-proof__intro">
          Receipts from how the work actually ships, with no invented clients or padded numbers.
        </p>
        <div className="kl-proof__rows">
          {RECEIPTS.map((r) => (
            <div key={r.title} className="kl-proof__row">
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
