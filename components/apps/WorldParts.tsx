import Image from "next/image";
import { appHomes } from "@/lib/app-homes";
import type { AppSlug } from "@/lib/app-prices";
import AppStoreBadge from "@/components/site/AppStoreBadge";

export const worldSources: Record<AppSlug, string> = {
  trendi: "WORLDS.md:24–45; INVENTORY.md:62–93",
  "way-in": "WORLDS.md:47–62; INVENTORY.md:137–166",
  "forget-about-it": "WORLDS.md:64–88; INVENTORY.md:197–239",
  "preaching-to-the-choir": "WORLDS.md:90–113; INVENTORY.md:265–302",
  "old-dog": "WORLDS.md:115–131; INVENTORY.md:335–367",
  "teachers-pet": "WORLDS.md:133–149; INVENTORY.md:406–441",
  dreamcatcher: "WORLDS.md:151–171; INVENTORY.md:467–498",
};
export function Icon({slug, size = 88}: {slug:AppSlug; size?:number}) {
  return <Image className="world-icon" src={`/apps/${slug}/icon.png`} alt={`${appHomes[slug].name} app icon`} width={size} height={size} sizes={`${size}px`} />;
}
export function StoreAction({slug}: {slug:AppSlug}) {
  const app = appHomes[slug];
  return <div className="world-action">
    {app.store ? <AppStoreBadge product={slug} url={app.store} placement="product_hero" /> : <p className="app-home__coming">{app.coming}</p>}
    <a href="#pricing" className="pricing-link">{app.prerelease ? "Planned pricing" : "USA pricing"} ↓</a>
  </div>;
}
export function Art({slug, file}: {slug:AppSlug; file:string}) {
  return <div className="world-art" aria-hidden="true"><Image src={`/apps/${slug}/${file}`} alt="" fill sizes="100vw" preload /></div>;
}
export function Shot({slug, n, label, hero = false}: {slug:AppSlug; n:number; label?:string; hero?:boolean}) {
  const app = appHomes[slug];
  const file = app.shots?.[n - 1];
  const cropped = !file && ((slug === "old-dog" && n === 5) || (slug === "teachers-pet" && n <= 2));
  let width = app.landscape ? 1440 : slug === "preaching-to-the-choir" ? 1284 : 1320;
  let height = app.landscape ? 900 : slug === "preaching-to-the-choir" ? 2778 : 2868;
  // Listed webp shots are the full 1320×2868 App Store screenshots, resized to 900 wide.
  if (file) { width = 900; height = 1956; }
  if (slug === "old-dog" && n === 5) height = 752;
  if (slug === "teachers-pet" && n === 1) { width = 940; height = 253; }
  if (slug === "teachers-pet" && n === 2) { width = 1140; height = 445; }
  const caption = app.screens[n - 1];
  return <figure className={`world-shot${app.landscape ? " world-shot--wide" : ""}`} data-source={worldSources[slug]}>
    <Image src={`/apps/${slug}/${file ?? `shot-${n}${cropped ? "-crop" : ""}.png`}`} alt={`${app.name}: ${caption}${cropped ? " (cropped listing screenshot)" : ""}`} width={width} height={height} sizes={app.landscape ? "(max-width: 700px) 92vw, 900px" : "(max-width: 700px) 72vw, 360px"} loading={hero ? "eager" : "lazy"} />
    <figcaption>{label || caption}</figcaption>
  </figure>;
}
export function ListingLabel({slug}: {slug:AppSlug}) {
  return <p className="eyebrow listing-label">{appHomes[slug].prerelease ? "From the submitted listing" : "From the App Store listing"}</p>;
}
export function DreamHoop() {
  const point = (i:number, r:number) => `${500 + Math.cos(i * Math.PI / 4) * r},${500 + Math.sin(i * Math.PI / 4) * r}`;
  return <svg className="dream-hoop" viewBox="0 0 1000 1000" aria-hidden="true" fill="none">
    <circle cx="500" cy="500" r="450" stroke="currentColor" strokeOpacity=".32" />
    {Array.from({length:8}, (_, i) => <path key={i} d={`M500,500 L${point(i,450)}`} stroke="currentColor" strokeOpacity=".20" />)}
    {[.70,.40].map(r => <polygon key={r} points={Array.from({length:8},(_,i)=>point(i,450*r)).join(" ")} stroke="currentColor" strokeOpacity=".20" />)}
    <circle cx="500" cy="500" r="20" fill="currentColor" fillOpacity=".20" />
    <circle cx="700" cy="500" r="5" fill="#E7B76A" />
  </svg>;
}
