import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

test("the koi world leads through six destinations and reads every fact from the registry", () => {
  const page = read("app/page.tsx");
  const layout = read("app/layout.tsx");
  const world = read("components/koi/KoiWorld.tsx");
  const water = read("components/koi/water.ts");
  const journey = read("lib/koi/journey.ts");
  const styles = read("app/koi-world.css");

  // Six destinations, wired in one place and rendered as real sections.
  const ids = ["surface", "shipped", "lab", "blake", "work", "start"];
  for (const id of ids) {
    assert.match(journey, new RegExp(`id: "${id}"`));
    assert.match(page, new RegExp(`id="${id}"`));
    assert.match(styles, new RegExp(`data-koi-destination="${id}"`));
  }
  assert.equal((page.match(/className="dest dest--/g) ?? []).length, 6);
  assert.match(page, /<KoiWorld \/>/);
  assert.match(layout, /import "\.\/koi-world\.css"/);

  // The overlays and the agency layer are gone, not merely unused.
  assert.doesNotMatch(layout, /KoiDepthPass|BrandIntro|KoiCompanion/);
  for (const retired of [
    "components/brand/BrandIntro.tsx",
    "components/companion/KoiCompanion.tsx",
    "components/concierge/ConciergeFlow.tsx",
    "lib/commercial.ts",
    "app/services/page.tsx",
    "app/audit/page.tsx",
    "app/concierge/page.tsx",
    "app/work/page.tsx",
    "app/demos/[slug]/page.tsx",
    "app/dev/products/page.tsx",
    "app/home/page.tsx",
  ]) {
    assert.equal(fs.existsSync(path.join(root, retired)), false, `${retired} should have been removed`);
  }

  // Product truth comes from lib/products, never from hardcoded copy.
  assert.match(page, /from "@\/lib\/products"/);
  assert.doesNotMatch(page, /Revenue Leak|Quick Fix|Koi Cave/);

  // The koi is composited into the page, not parked behind it.
  assert.match(styles, /mix-blend-mode: screen/);
  assert.match(styles, /mask-image: radial-gradient/);
  assert.match(styles, /\.koi-world__veil/);
  assert.match(styles, /mix-blend-mode: multiply/);
  assert.match(styles, /backdrop-filter/);

  // Scroll grammar: arrive, hold, depart, and never a seek.
  assert.match(journey, /export const ARRIVE_END/);
  assert.match(journey, /export const DEPART_START/);
  assert.match(world, /playbackRate/);
  assert.doesNotMatch(world, /\.currentTime\s*=/);

  // Exactly one clip can be visible at a time.
  assert.match(world, /if \(envelope <= 0\)/);
  assert.match(world, /mountedKey = desired/);
  assert.equal((journey.match(/clip: "duo"/g) ?? []).length, 1);
  assert.match(journey, /transitionClip: "separate"/);

  // Reduced motion and Save-Data get a designed still journey, not a stub.
  assert.match(world, /prefers-reduced-motion: reduce/);
  assert.match(world, /saveData/);
  assert.match(world, /effectiveType/);
  assert.match(world, /koi-world__still/);
  assert.match(styles, /\[data-motion="still"\]/);

  // Performance and resilience.
  assert.match(world, /visibilitychange/);
  assert.match(world, /const hasMoved =/);
  assert.match(world, /ensureVideo\(next\.clip, t > 0\.56 \? "auto" : "metadata"\)/);
  assert.doesNotMatch(world, /pool\.delete/);
  assert.match(world, /koiFallback/);
  assert.match(world, /854/);
  assert.match(water, /webgl2/);

  // The page must still read as HTML with no JavaScript at all.
  assert.match(styles, /\.kw\[data-koi-ready="true"\] \.dest__inner/);
});

test("every koi clip referenced by the journey ships both renditions and a poster", () => {
  const journey = read("lib/koi/journey.ts");
  const ids = [...journey.matchAll(/id: "(koi-[a-z]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 8, "expected the full clip set");
  for (const id of ids) {
    for (const file of [`${id}-1280.mp4`, `${id}-854.mp4`]) {
      assert.ok(fs.existsSync(path.join(root, "public/koi", file)), `missing public/koi/${file}`);
    }
  }
  const posters = [...journey.matchAll(/poster: "\/koi\/([a-z-]+\.webp)"/g)].map((m) => m[1]);
  for (const poster of posters) {
    assert.ok(fs.existsSync(path.join(root, "public/koi", poster)), `missing public/koi/${poster}`);
  }
});

test("the layout loads three font families and four site stylesheets, nothing from the agency era", () => {
  const layout = read("app/layout.tsx");
  for (const family of ["Sora", "Newsreader", "JetBrains_Mono"]) assert.match(layout, new RegExp(family));
  for (const gone of ["Inter", "Archivo", "IBM_Plex_Mono"]) assert.doesNotMatch(layout, new RegExp(`\\b${gone}\\b`));
  for (const css of ["tokens.css", "site.css", "motion.css", "koi-world.css"]) assert.match(layout, new RegExp(css));
  for (const gone of ["commercial.css", "front-office.css", "dev-home.css", "home.css", "brand-intro.css"]) {
    assert.doesNotMatch(layout, new RegExp(`"\\./${gone}"`), `${gone} is still imported`);
  }
});
