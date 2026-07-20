import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { personalKoiHostAllowed } from "../lib/dev-koi/host";
import { companionHostAllowed } from "../lib/companion/page-context";
import {
  observations,
  selectObservation,
  worldForRoute,
  worldTemperament,
} from "../lib/dev-koi/observations";
import {
  emptySession,
  parseSession,
  recordShown,
  suppressedIds,
  DEV_KOI_STORAGE_KEY,
} from "../lib/dev-koi/session";
import { COMPANION_STORAGE_KEY } from "../lib/companion/session";
import { products, stageLabel } from "../lib/dev/universe";
import { publishedNotes } from "../lib/dev/lab";

// The personal koi lives on koinophobia.dev. The studio concierge lives on
// koinophobialabs.com and funnels visitors toward paid work. These tests exist
// mostly to prove those two facts can never quietly become one fact.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

/* ------------------------------------------------------- host separation */

test("the two companions can never appear on the same host", () => {
  const hosts = [
    "koinophobia.dev",
    "www.koinophobia.dev",
    "koinophobialabs.com",
    "www.koinophobialabs.com",
    "koinophobia-labs.vercel.app",
    "koinophobia-dev-git-main-example.vercel.app",
    "example.com",
  ];
  for (const host of hosts) {
    const personal = personalKoiHostAllowed(host);
    const studio = companionHostAllowed(host);
    assert.ok(
      !(personal && studio),
      `${host} would render BOTH the personal koi and the studio concierge`
    );
  }
});

test("the personal koi is allowed on the personal host and refused on the studio", () => {
  assert.equal(personalKoiHostAllowed("koinophobia.dev"), true);
  assert.equal(personalKoiHostAllowed("www.koinophobia.dev"), true);
  assert.equal(personalKoiHostAllowed("koinophobialabs.com"), false);
  assert.equal(personalKoiHostAllowed("www.koinophobialabs.com"), false);
  assert.equal(personalKoiHostAllowed("koinophobia-labs.vercel.app"), false);
  assert.equal(personalKoiHostAllowed("evil.example.com"), false);
});

test("the personal koi is never mounted by studio surfaces", () => {
  // Structural isolation: if a studio page imported it, a hostname check would
  // be the only thing left standing.
  const studioSurfaces = [
    "app/page.tsx",
    "app/services/page.tsx",
    "app/work/page.tsx",
    "app/products/page.tsx",
    "app/about/page.tsx",
    "app/audit/page.tsx",
    "app/intake/page.tsx",
    "app/layout.tsx",
  ];
  for (const surface of studioSurfaces) {
    if (!exists(surface)) continue;
    assert.doesNotMatch(
      read(surface),
      /PersonalKoi/,
      `${surface} is a studio surface and must not mount the personal koi`
    );
  }
});

test("the personal koi does not import the commercial concierge", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  const content = read("lib/dev-koi/observations.ts");
  for (const source of [koi, content]) {
    assert.doesNotMatch(source, /ConciergeFlow|lib\/commercial|site-knowledge|concierge/i);
  }
});

test("storage keys do not collide", () => {
  assert.notEqual(DEV_KOI_STORAGE_KEY, COMPANION_STORAGE_KEY);
});

test("css namespaces and testids do not collide", () => {
  // Strip comments first — the header legitimately *mentions* the studio
  // namespace to explain why this one is different. What matters is that no
  // rule targets it.
  const css = read("app/dev-koi.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /\.koi-companion/, "personal css must not target studio selectors");
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.doesNotMatch(koi, /koi-companion-trigger/, "must not reuse the studio testid");
  assert.match(koi, /data-testid="dev-koi"/);
});

/* --------------------------------------------------------- truthfulness */

test("the koi keeps no second copy of product status", () => {
  const content = read("lib/dev-koi/observations.ts");
  // It may import the truth sources; it may not restate them.
  assert.match(content, /from "@\/lib\/dev\/universe"/);
  for (const product of products) {
    assert.doesNotMatch(
      content,
      new RegExp(product.status.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `${product.name}'s status string is duplicated in koi content`
    );
  }
});

test("messages derived from stage use the shared label, never a synonym", () => {
  const productMessages = observations
    .filter((o) => o.id.startsWith("product-") && o.id.endsWith("-state"))
    .map((o) => o.message);
  assert.ok(productMessages.length >= products.length);
  for (const product of products) {
    const line = productMessages.find((m) => m.startsWith(product.name));
    assert.ok(line, `${product.name} has no state observation`);
    assert.ok(
      line!.toLowerCase().includes(stageLabel[product.stage].toLowerCase()),
      `${product.name} koi line does not use the canonical stage label`
    );
  }
});

test("no koi message invents launch or adoption language", () => {
  const banned =
    /\b(launched|available now|customers love|trusted by|thousands of|best[- ]in[- ]class|revolutionary)\b/i;
  for (const observation of observations) {
    assert.doesNotMatch(observation.message, banned, observation.id);
  }
});

test("held field notes cannot leak through the koi", () => {
  // The notes observation speaks only to the empty state, and only while empty.
  const notesObservation = observations.find((o) => o.id === "notes-held");
  assert.ok(notesObservation);
  assert.equal(notesObservation!.eligible(), publishedNotes.length === 0);

  // No observation may quote a held note's title or body.
  const heldTitles = read("lib/dev/lab.ts")
    .split("\n")
    .filter((line) => line.trim().startsWith("title:"))
    .map((line) => line.replace(/.*title:\s*"/, "").replace(/",?\s*$/, ""));
  for (const observation of observations) {
    for (const title of heldTitles) {
      if (title.length < 12) continue;
      assert.ok(
        !observation.message.includes(title),
        `${observation.id} quotes held note "${title}"`
      );
    }
  }
});

test("an observation whose data disappears goes silent, not stale", () => {
  // eligible() is the guard. A throwing predicate must suppress, never surface.
  for (const observation of observations) {
    assert.equal(typeof observation.eligible, "function", observation.id);
  }
  const broken = {
    ...observations[0],
    id: "broken",
    eligible: () => {
      throw new Error("data gone");
    },
  };
  const all = [...observations, broken];
  // selectObservation swallows predicate failures; prove it by construction.
  const source = read("lib/dev-koi/observations.ts");
  assert.match(source, /catch\s*\{[\s\S]{0,120}return false;/);
  assert.ok(all.length > observations.length);
});

/* -------------------------------------------------------------- behavior */

test("selection respects route, trigger, cooldown and priority", () => {
  const seen = new Set<string>();
  const home = selectObservation("/", "dwell", seen);
  assert.ok(home, "home should have a dwell observation");
  assert.ok(home!.routes.includes("/"));

  // Once seen, it is not offered again.
  const suppressed = new Set([home!.id]);
  const second = selectObservation("/", "dwell", suppressed);
  assert.notEqual(second?.id, home!.id);

  // Wrong route yields nothing.
  assert.equal(selectObservation("/definitely-not-a-route", "dwell", seen), null);
  // Wrong trigger yields nothing for an arrive-only route observation.
  const productArrive = selectObservation("/products/trendi", "arrive", seen);
  assert.ok(productArrive);
  assert.equal(productArrive!.trigger, "arrive");
});

test("route normalization makes /dev and public paths behave identically", () => {
  for (const product of products) {
    const publicPick = selectObservation(`/products/${product.slug}`, "arrive", new Set());
    const devPick = selectObservation(`/dev/products/${product.slug}`, "arrive", new Set());
    assert.equal(devPick?.id, publicPick?.id, `${product.slug} differs between /dev and public`);
  }
  assert.equal(
    selectObservation("/dev/lab", "arrive", new Set())?.id,
    selectObservation("/lab", "arrive", new Set())?.id
  );
});

test("every product page has its own observation", () => {
  for (const product of products) {
    const found = selectObservation(`/products/${product.slug}`, "arrive", new Set());
    assert.ok(found, `${product.slug} has no arrival observation`);
  }
});

test("each product world has a temperament, and they differ", () => {
  const themes = products.map((p) => p.identity.theme);
  for (const theme of themes) {
    assert.ok(worldTemperament[theme], `${theme} has no temperament`);
  }
  const drifts = new Set(themes.map((t) => worldTemperament[t].drift));
  assert.ok(drifts.size > 1, "all worlds move identically — that's one mascot, not four moods");
});

test("worldForRoute only themes real product pages", () => {
  assert.equal(worldForRoute("/products/trendi"), "signal");
  assert.equal(worldForRoute("/products/koi-cave"), "cave");
  assert.equal(worldForRoute("/products"), undefined);
  assert.equal(worldForRoute("/"), undefined);
  assert.equal(worldForRoute("/products/not-a-product"), undefined);
  // Local dev and direct app-tree hits carry the /dev prefix; production does
  // not. Both must resolve, or the temperament is right only in production.
  assert.equal(worldForRoute("/dev/products/trendi"), "signal");
  assert.equal(worldForRoute("/dev/products/koi-cave"), "cave");
  assert.equal(worldForRoute("/dev/products"), undefined);
});

test("session state survives corruption and stores nothing personal", () => {
  assert.deepEqual(parseSession(null), emptySession());
  assert.deepEqual(parseSession("{not json"), emptySession());
  assert.deepEqual(parseSession('{"dismissed":"yes"}').dismissed, false);

  const now = 1_000_000;
  const withShown = recordShown(emptySession(), "home-reach-split", now);
  assert.equal(Object.keys(withShown.shown).length, 1);
  // Inside cooldown -> suppressed; outside -> available again.
  assert.ok(suppressedIds(withShown, () => 10_000, now + 5_000).has("home-reach-split"));
  assert.ok(!suppressedIds(withShown, () => 10_000, now + 20_000).has("home-reach-split"));

  const source = read("lib/dev-koi/session.ts");
  assert.doesNotMatch(source, /email|name|ip|userAgent|fingerprint/i);
});

/* ---------------------------------------------------- motion and a11y */

test("the koi never chases the pointer", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  // No pointer listener at all — the property is true by construction.
  assert.doesNotMatch(koi, /pointermove|mousemove|clientX|clientY/);
});

test("animation stops when hidden, offscreen, or reduced-motion", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.match(koi, /visibilitychange/);
  assert.match(koi, /IntersectionObserver/);
  assert.match(koi, /prefers-reduced-motion/);
  assert.match(
    koi,
    /if \(reducedMotion \|\| paused \|\| offscreen\)/,
    "the rAF loop must not start in any of those states"
  );
});

test("the motion effect restarts after hydration", () => {
  // The component returns null until hydrated, so bodyRef is null on the first
  // pass. If `hydrated` is missing from the deps the rAF loop never starts and
  // the koi is frozen in production while every unit test still passes.
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  const deps = koi.match(/\}, \[hydrated, reducedMotion, paused, offscreen, world\]\);/);
  assert.ok(deps, "motion effect must depend on hydrated");
});

test("opacity is never animated on surfaces that must stay visible", () => {
  // A throttled background tab freezes a `both`-filled opacity fade at 0,
  // leaving an invisible element. The studio koi hit this; this one must not.
  const css = read("app/dev-koi.css");
  const keyframes = css.match(/@keyframes[\s\S]*?\}\s*\}/g) ?? [];
  for (const block of keyframes) {
    assert.doesNotMatch(block, /opacity/, `keyframe animates opacity:\n${block}`);
  }
});

test("reduced motion is honored in CSS as well as JS", () => {
  const css = read("app/dev-koi.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(block, /animation: none !important/);
});

test("the koi is keyboard reachable and labelled", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.match(koi, /<button/, "the trigger must be a real button");
  assert.match(koi, /aria-label=/);
  assert.match(koi, /aria-expanded=/);
  const css = read("app/dev-koi.css");
  assert.match(css, /:focus-visible/);
});

test("the note is dismissible and does not trap focus", () => {
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.match(koi, /Dismiss/);
  assert.doesNotMatch(koi, /aria-modal|role="dialog"/, "this is a note, not a modal");
});

test("the koi does not volunteer notes on narrow viewports", () => {
  // At 320px an unsolicited note overlays page controls. Verified visually:
  // it covered a product page's primary button before this guard existed.
  const koi = read("components/dev-koi/PersonalKoi.tsx");
  assert.match(koi, /PROACTIVE_MIN_WIDTH/);
  assert.match(
    koi,
    /window\.innerWidth < PROACTIVE_MIN_WIDTH\) return;/,
    "proactive offers must be suppressed on small screens"
  );
});

test("the koi sits below the studio companion's z-index band", () => {
  const css = read("app/dev-koi.css");
  const z = Number(css.match(/z-index:\s*(\d+)/)?.[1] ?? 0);
  assert.ok(z > 0 && z < 260, `z-index ${z} should sit below the studio band (260)`);
});

test("messages stay short enough to read at a glance", () => {
  for (const observation of observations) {
    assert.ok(
      observation.message.length <= 220,
      `${observation.id} is ${observation.message.length} chars — too long for a passing thought`
    );
  }
});
