import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../components/About.tsx", import.meta.url), "utf8");

test("homepage About uses Blake's approved portrait and first-person biography", () => {
  assert.match(source, /src="\/blake-portrait\.jpg"/);
  assert.doesNotMatch(source, /Portrait placeholder|\/koi-mark\.png/);
  assert.match(source, /Hi, I&amp;apos;m Blake Taylor|Hi, I&apos;m Blake Taylor/);
});

test("homepage About uses only the approved credibility chips", () => {
  const principles = source.match(/const principles = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.match(principles, /"Founder-led"/);
  assert.match(principles, /"Built from real problems"/);
  assert.match(principles, /"Chicago"/);
  assert.equal((principles.match(/"/g) ?? []).length, 6);
});
