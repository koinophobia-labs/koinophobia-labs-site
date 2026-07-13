// Photography slots for future authoritative assets (working, Chicago,
// movement). Documented and shippable now — the absence of the future
// photographs does not block release, and nothing is fabricated.
const PHOTOS = [
  { key: "work", label: "Working — building, hands on" },
  { key: "city", label: "Chicago — environment" },
  { key: "move", label: "Movement — restrained training frame" },
];

function PhotoSlot({ label }: { label: string }) {
  return (
    <div className="kl-slot kl-slot--photo" role="img" aria-label={`${label} (photography pending)`}>
      <span className="kl-slot__label">{label}</span>
    </div>
  );
}

export default function HomeFounder() {
  return (
    <section id="about" className="kl-section kl-on-white">
      <div className="kl-inner">
        <div className="kl-founder__grid">
          <h2 className="kl-founder__title">Train. Think. Ship.</h2>
          <div className="kl-founder__body">
            <p className="kl-quote">
              “Ideas with real stakes — not safe concepts that look polished and
              go nowhere.”
            </p>
            <p>
              Blake Taylor is a Chicago-based founder and operator. Before the
              Labs: high-volume customer operations at DraftKings and a B.A. in
              Global Management from Earlham College. The discipline is the same
              whether it&apos;s a morning workout or a launch week — and the
              measure is always whether the thing gets used.
            </p>
            <a className="kl-link" href="/connect">
              More about Blake → koinophobia.dev/connect
            </a>
          </div>
        </div>

        <div className="kl-founder__photos">
          {PHOTOS.map((p) => (
            <PhotoSlot key={p.key} label={p.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
