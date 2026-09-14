import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ANALYTICS_EVENTS } from "../components/studio/AnalyticsBridge";

// Sixteen events, each tied to a decision. An event that nothing fires is
// analytics theatre; an event fired under a name not on this list is noise.

const root = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const walk = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : /\.(tsx?|mjs)$/.test(entry.name) ? [rel] : [];
  });

const sources = [...walk("app"), ...walk("components"), ...walk("lib")].map((file) => [file, read(file)] as const);

test("the bridge declares exactly sixteen events", () => {
  assert.equal(ANALYTICS_EVENTS.length, 16);
  assert.equal(new Set(ANALYTICS_EVENTS).size, 16);
});

test("every declared event is fired somewhere on the site", () => {
  for (const event of ANALYTICS_EVENTS) {
    // journey_depth is fired by the bridge itself from the koi world's event.
    if (event === "journey_depth") continue;
    const fired = sources.some(
      ([file, source]) =>
        !file.endsWith("AnalyticsBridge.tsx") &&
        (source.includes(`"${event}"`) || source.includes(`'${event}'`) || source.includes(`data-analytics="${event}"`) || source.includes(`data-analytics-view="${event}"`)),
    );
    assert.ok(fired, `${event} is declared but never fired`);
  }
});

test("nothing fires an event that is not declared", () => {
  const declared = new Set<string>(ANALYTICS_EVENTS);
  for (const [file, source] of sources) {
    if (file.endsWith("AnalyticsBridge.tsx")) continue;
    for (const match of source.matchAll(/(?:track|trackStudioEvent)\(\s*"([a-z_]+)"/g)) {
      assert.ok(declared.has(match[1]), `${file} fires undeclared event ${match[1]}`);
    }
    for (const match of source.matchAll(/data-analytics(?:-view)?="([a-z_]+)"/g)) {
      assert.ok(declared.has(match[1]), `${file} marks undeclared event ${match[1]}`);
    }
  }
});

test("the koi world reports journey depth with the motion mode", () => {
  const world = read("components/koi/KoiWorld.tsx");
  assert.match(world, /koinophobia:destination/);
  assert.match(world, /motion/);
});

test("the App Store version can be refreshed from the Lookup API at build time, and falls back to the registry", () => {
  const source = read("lib/app-store.ts");
  assert.match(source, /itunes\.apple\.com\/lookup/);
  assert.match(source, /revalidate/);
  assert.match(source, /catch/);
  for (const page of ["app/page.tsx", "app/shipped/page.tsx", "app/trendi/page.tsx", "app/forget-about-it/page.tsx", "app/way-in/page.tsx"]) {
    assert.match(read(page), /withLiveListing/, `${page} does not read the live listing`);
  }
});

test("the log has a feed and the social card takes a title", () => {
  assert.ok(fs.existsSync(path.join(root, "app/log/feed.xml/route.ts")));
  assert.match(read("app/log/page.tsx"), /feed\.xml/);
  const card = read("app/brand/social-card/route.tsx");
  assert.match(card, /searchParams\.get\("title"\)/);
  assert.ok(fs.existsSync(path.join(root, "public/brand/social-plate.jpg")));
});
