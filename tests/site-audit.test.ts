import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { liveListings, withLiveListing } from "@/lib/app-store";
import { shippedProducts } from "@/lib/products";
import { nowEntries } from "@/components/site/NowStrip";
import EvidenceDetails from "@/components/site/EvidenceDetails";

test("separate product lookups do not reuse the first product's cached result", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const id = url.searchParams.get("id")!;
    calls.push(id);
    return Response.json({ results: [{ trackId: Number(id), version: "9.9.9" }] });
  };
  try {
    for (const product of shippedProducts) {
      const result = await withLiveListing(product);
      assert.equal(result.appStore?.version, "9.9.9");
    }
    assert.equal(new Set(calls).size, shippedProducts.length);
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await liveListings(shippedProducts)).size, 0);
    assert.equal((await withLiveListing(shippedProducts[0])).appStore?.version, shippedProducts[0].appStore?.version);
  } finally { globalThis.fetch = original; }
});

test("same-day log milestones preserve the recorded release order", () => {
  assert.equal(nowEntries[0].slug, "one-studio-rebuild-live");
  assert.equal(nowEntries[1].slug, "one-studio-rebuild-pull-request");
});

test("evidence links explicit URLs without inventing links for local files", () => {
  const html = renderToStaticMarkup(createElement(EvidenceDetails, { evidence: [
    { claim: "Public record", source: "https://example.com/record, checked today" },
    { claim: "Local record", source: "private/results.json" },
  ] }));
  assert.match(html, /href="https:\/\/example.com\/record"/);
  assert.match(html, /private\/results.json/);
  assert.doesNotMatch(html, /href="private/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});
