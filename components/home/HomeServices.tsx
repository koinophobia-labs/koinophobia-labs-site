const SERVICES = [
  {
    title: "Websites that convert",
    body: "Built to turn visits into conversations — a visible path from first screen to action.",
  },
  {
    title: "Workflows & automation",
    body: "Practical systems that quietly remove hours of real work from small teams every week.",
  },
  {
    title: "Prototypes & tools",
    body: "Working software in weeks — internal tools, MVPs, and proofs that earn their next step.",
  },
];

// Note: the 3a mock shows a "How it works →" link per service. Those point to
// service-detail pages that do not exist in this project, so they are omitted
// here to avoid dead links (per the design assistant's own caveat). Add them
// back when detail routes ship.
export default function HomeServices() {
  return (
    <section id="services" className="kl-section kl-on-white">
      <div className="kl-inner">
        <div className="kl-sec-head">
          <h2 className="kl-h2">What the studio does</h2>
          <p className="kl-sec-head__note">
            Scoped honestly. Shipped fast. Made to be used.
          </p>
        </div>
        <div className="kl-grid-3">
          {SERVICES.map((s) => (
            <article key={s.title} className="kl-service">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
