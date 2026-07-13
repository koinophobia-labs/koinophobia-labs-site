const SERVICES = [
  {
    title: "Build leverage in your business",
    body: "Conversion-focused websites that replace unclear browsing with a visible path from first screen to inquiry.",
  },
  {
    title: "Build leverage in your operations",
    body: "Practical workflows and automation that replace repetitive decisions with reliable, repeatable systems.",
  },
  {
    title: "Build leverage through software",
    body: "Products, internal tools, and prototypes that turn high-friction work into something faster, clearer, and easier to use.",
  },
];

export default function HomeServices() {
  return (
    <section id="services" className="kl-section kl-on-white">
      <div className="kl-inner">
        <div className="kl-sec-head">
          <h2 className="kl-h2">Different outputs. One operating idea.</h2>
          <p className="kl-sec-head__note">
            Find the friction. Build the system. Give people their time and judgment back.
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
