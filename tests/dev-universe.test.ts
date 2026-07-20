import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getProduct, products, reachLabel } from "../lib/dev/universe";
import { experiments, getNote, notes } from "../lib/dev/lab";

// The koinophobia.dev product universe exists because the site had drifted into
// describing the same product three different ways on three different pages.
// These tests guard the invariants that made that possible.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

test("every product answers the reach question with a real value", () => {
  assert.ok(products.length >= 4);
  for (const product of products) {
    assert.ok(["public", "limited", "internal"].includes(product.reach), product.name);
    assert.ok(reachLabel[product.reach], `${product.name} has no reach label`);
    assert.ok(product.status.length > 10, `${product.name} needs a specific status`);
  }
});

test("every product states what is not true yet", () => {
  // The honesty block is not optional. A product with nothing unproven is a
  // product whose page is selling rather than reporting.
  for (const product of products) {
    assert.ok(
      product.notYet.length >= 2,
      `${product.name} lists fewer than two unproven claims — verify that's real`,
    );
  }
});

test("internal-only products offer nothing to click", () => {
  // Koi Cave has no users, no URL and no build to download. Offering an action
  // would be inventory-padding, which is the exact failure this site avoids.
  for (const product of products.filter((p) => p.reach === "internal")) {
    assert.equal(
      product.actions.length,
      0,
      `${product.name} is internal but offers ${product.actions.length} action(s)`,
    );
  }
});

test("no product claims TestFlight distribution it does not have", () => {
  // The regression this whole pass started from: You Know Ball advertised
  // "TestFlight builds shipping" while no build had ever reached a tester.
  const ykb = getProduct("you-know-ball");
  assert.ok(ykb);
  assert.doesNotMatch(ykb!.status, /testflight/i, "YKB has never shipped a TestFlight build");
  assert.ok(
    ykb!.notYet.some((line) => /testflight/i.test(line)),
    "YKB must say plainly that it has never been on TestFlight",
  );
});

test("no product uses launch language it cannot back", () => {
  const banned = [/\blaunched\b/i, /\bapp store\b(?!.*\bnot\b)/i, /\bavailable now\b/i];
  for (const product of products) {
    for (const pattern of banned) {
      assert.doesNotMatch(
        product.status,
        pattern,
        `${product.name} status uses launch language: ${product.status}`,
      );
    }
  }
});

test("no product invents users, revenue, or testimonials", () => {
  const source = read("lib/dev/universe.ts");
  for (const pattern of [
    /\d+\s*(paying|happy)\s+(customers|users|clients)/i,
    /\btestimonial/i,
    /\$\d+[\d,]*\s*(in\s+)?(revenue|MRR|ARR)/i,
  ]) {
    assert.doesNotMatch(source, pattern, `universe.ts appears to claim ${pattern}`);
  }
});

test("product slugs are unique and every one resolves", () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate product slug");
  for (const slug of slugs) {
    assert.ok(getProduct(slug), `${slug} does not resolve`);
  }
  assert.equal(getProduct("does-not-exist"), undefined);
});

test("every product action link is usable by a stranger", () => {
  for (const product of products) {
    for (const action of product.actions) {
      const isExternal = action.external || action.href.startsWith("mailto:");
      if (isExternal) {
        assert.match(action.href, /^(https?:|mailto:)/, `${product.name}: ${action.href}`);
        continue;
      }
      // Internal links must resolve, allowing for the /dev host rewrite.
      const segments = action.href.replace(/^\//, "").split("/");
      const parent = segments.slice(0, -1).join("/");
      const candidates = [
        `app/${segments.join("/")}/page.tsx`,
        `app/dev/${segments.join("/")}/page.tsx`,
        ...(parent ? [`app/dev/${parent}/[slug]/page.tsx`] : []),
      ];
      assert.ok(
        candidates.some((file) => exists(file)),
        `${product.name}: ${action.href} resolves to nothing`,
      );
    }
  }
});

test("each product has a distinct visual world", () => {
  // Blake's requirement: stop shipping the same dark purple card four times.
  const themes = products.map((p) => p.identity.theme);
  assert.equal(new Set(themes).size, themes.length, "two products share a theme");

  const css = read("app/dev-product.css");
  const system = read("app/dev-system.css");
  for (const theme of themes) {
    assert.ok(
      system.includes(`[data-world="${theme}"]`),
      `${theme} has no accent tokens in dev-system.css`,
    );
    assert.ok(
      css.includes(`[data-world="${theme}"]`),
      `${theme} has accent tokens but no rhythm overrides — that's a skin, not an identity`,
    );
  }
});

test("the design tokens are defined exactly once", () => {
  // They used to be copy-pasted into four stylesheets and had begun to drift.
  const files = [
    "app/dev-system.css",
    "app/dev-home.css",
    "app/now-dev.css",
    "app/connect-card.css",
    "app/resume-dev.css",
  ];
  const definitions = files.filter((file) => read(file).includes("--dh-ink:"));
  assert.deepEqual(definitions, ["app/dev-system.css"], "palette tokens are duplicated again");
});

test("field notes are specific, dated, and resolvable", () => {
  assert.ok(notes.length >= 3);
  for (const note of notes) {
    assert.ok(getNote(note.slug), `${note.slug} does not resolve`);
    assert.match(note.date, /^[A-Z][a-z]+ \d{1,2}, \d{4}$/, `${note.slug} has a malformed date`);
    assert.ok(note.body.length >= 3, `${note.slug} is too thin to be a field note`);
    // A note that can't name a number, a break, or a decision isn't a build log.
    assert.match(
      note.body.join(" "),
      /\d/,
      `${note.slug} cites no specifics — it reads as an essay, not a note`,
    );
  }
  assert.equal(new Set(notes.map((n) => n.slug)).size, notes.length, "duplicate note slug");
});

test("every experiment reports what it showed", () => {
  for (const experiment of experiments) {
    assert.ok(experiment.finding.length > 30, `${experiment.name} has no finding`);
  }
});
