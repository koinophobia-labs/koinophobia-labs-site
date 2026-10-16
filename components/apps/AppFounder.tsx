import Link from "next/link";

export default function AppFounder({ founderNote }: { founderNote?: string }) {
  return <section data-source="WORLDS.md:19; INVENTORY.md:510–528" className="app-home__founder" aria-labelledby="founder-title">
    <p id="founder-title" className="app-home__eyebrow">{founderNote ? "From Blake" : "The builder"}</p>
    <div>
      {founderNote ? <p className="app-home__founder-note">{founderNote}</p> : null}
      <p className="app-home__sign-off">Designed, built and shipped by Blake Taylor in Chicago.</p>
      <Link href="/blake">Blake Taylor <span aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}
