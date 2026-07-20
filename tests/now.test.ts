import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  nowActiveWork,
  nowLastUpdated,
  nowSnapshot,
} from "../lib/now";

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

const nowPage = read("app/now/page.tsx");
const nowData = read("lib/now.ts");
const nowCss = read("app/now-dev.css");
const home = read("app/home/page.tsx");

test("/now route exists and renders under the .nowdev identity", () => {
  assert.ok(exists("app/now/page.tsx"), "app/now/page.tsx must exist");
  assert.match(nowPage, /className="nowdev"/);
});

test("/now has independent personal metadata with the .dev canonical", () => {
  assert.match(nowPage, /title:\s*\{\s*absolute:\s*"What I'm Doing Now — Blake Taylor"\s*\}/);
  assert.match(nowPage, /canonical:\s*"https:\/\/koinophobia\.dev\/now"/);
});

test("/now renders from the shared lib/now source, not inlined status copy", () => {
  assert.match(nowPage, /from "@\/lib\/now"/);
  assert.match(nowPage, /nowActiveWork\.map/);
  assert.ok(nowActiveWork.length >= 4, "expected the four principal systems");
});

test("/now shows a manually-maintained literal updated date (never a runtime date)", () => {
  assert.equal(typeof nowLastUpdated, "string");
  assert.match(nowLastUpdated, /\b20\d{2}\b/);
  assert.match(nowPage, /Last updated \{nowLastUpdated\}/);
  // No runtime date generation anywhere in the /now surface.
  assert.doesNotMatch(nowPage, /new Date\(|Date\.now\(/);
  assert.doesNotMatch(nowData, /new Date\(|Date\.now\(/);
});

test("every internal link on /now resolves to a real route", () => {
  const pageHrefs = [...nowPage.matchAll(/href[=:]\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  const dataHrefs = [...nowData.matchAll(/href:\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  for (const route of [...new Set([...pageHrefs, ...dataHrefs])]) {
    const clean = route.replace(/\/+$/, "") || "/";
    if (clean === "/") {
      assert.ok(exists("app/page.tsx"));
      continue;
    }
    // Personal routes that collide with studio pages are served on
    // koinophobia.dev by a host rewrite into app/dev/*, and product/note pages
    // are dynamic segments. Accept any of those resolutions.
    const segments = clean.slice(1).split("/");
    const parent = segments.slice(0, -1).join("/");
    const candidates = [
      `app/${segments.join("/")}/page.tsx`,
      `app/dev/${segments.join("/")}/page.tsx`,
      ...(parent ? [`app/${parent}/[slug]/page.tsx`, `app/dev/${parent}/[slug]/page.tsx`] : []),
    ];
    assert.ok(
      candidates.some((file) => exists(file)),
      `/now internal link ${route} has no page file (tried ${candidates.join(", ")})`,
    );
  }
});

test("homepage navigation points to /now with next/link", () => {
  assert.match(home, /<Link href="\/now">Now<\/Link>/);
  assert.match(home, /<Link className="devhome__now-more" href="\/now">/);
  // The old scroll-anchor nav destination is gone.
  assert.doesNotMatch(home, /<a href="#now">Now<\/a>/);
});

test("homepage status snapshot and /now cannot contradict (shared source)", () => {
  // Homepage renders the shared snapshot; it does not define its own status copy.
  assert.match(home, /from "@\/lib\/now"/);
  assert.match(home, /nowSnapshot\.map/);
  assert.doesNotMatch(home, /const nowEntries = \[/);
  // The snapshot is derived from the same active-work entries /now renders.
  assert.equal(nowSnapshot.length, nowActiveWork.length);
  for (let i = 0; i < nowSnapshot.length; i++) {
    assert.equal(nowSnapshot[i].line, nowActiveWork[i].snapshot);
  }
});

test("/now carries no legacy founder/mini identity or gold/cyan classes", () => {
  for (const src of [nowPage, nowCss]) {
    assert.doesNotMatch(src, /founder-|mini-page|mini-hero|mini-panel|kicker-gold|kicker-cyan|chip-gold|chip-cyan/);
  }
});

test("/now invents no progress percentages", () => {
  assert.doesNotMatch(nowData, /\b\d{1,3}\s*%/);
  assert.doesNotMatch(nowPage, /\b\d{1,3}\s*%/);
});

test("/now uses no forbidden private-finance language", () => {
  const forbidden = /\b(severance|runway|in debt|my debt|savings|rent money|broke|financially)\b/i;
  assert.doesNotMatch(nowData, forbidden);
});

test("/now claims no external paying users or closed clients", () => {
  // Guardrail against ASSERTING traction that has not happened. Honest,
  // aspirational phrasing ("the first paying users", "a business paying for a
  // system") is allowed; claims of existing customers/clients/revenue are not.
  const overclaim =
    /\b(paying customers|already paying|paying users right now|our clients\b|closed (a |the )?client|signed (a |the )?client|first paid client|clients who|customers who paid|revenue of|\bMRR\b|\bARR\b)\b|\$\s?\d/i;
  assert.doesNotMatch(nowData, overclaim);
});
