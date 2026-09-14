import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { getProduct } from "../lib/dev/universe";
import {
  engagementShapes,
  labProducts,
  replyPromise,
  shippedProducts,
  siteProducts,
} from "../lib/products";

// The site layer over the evidence registry. These tests keep the studio
// site from presenting anything the registry does not back.

const root = path.resolve(import.meta.dirname, "..");
const exists = (rel: string) => fs.existsSync(path.join(root, rel));
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

test("every shipped product is public in the registry, links to the App Store, and ships a real screen", () => {
  assert.equal(shippedProducts.length, 3);
  for (const product of shippedProducts) {
    assert.equal(product.stage, "public", `${product.name} is shipped but not stage public`);
    assert.equal(product.reach, "public");
    assert.ok(product.appStore, `${product.name} has no App Store listing`);
    assert.match(product.appStore!.url, /^https:\/\/apps\.apple\.com\/us\/app\//);
    assert.match(product.appStore!.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(product.screens.length >= 1, `${product.name} shows no authentic screenshot`);
    for (const screen of product.screens) {
      assert.ok(exists(`public${screen.src}`), `missing public${screen.src}`);
      assert.ok(screen.alt.length > 10, `${screen.src} needs a real alt`);
    }
    assert.ok(product.page, `${product.name} has no page copy`);
    assert.ok(exists(`app${product.href}/page.tsx`), `${product.href} has no route`);
  }
});

test("every demo clip is cut from a QA-verified master and ships both renditions and a poster", () => {
  for (const product of siteProducts.filter((p) => p.demo)) {
    const demo = product.demo!;
    assert.match(demo.master, /QA PASS 2026-\d{2}-\d{2}/, `${product.name}: the demo must name its master and QA date`);
    for (const file of [demo.src, demo.srcSmall, demo.poster]) {
      assert.ok(exists(`public${file}`), `missing public${file}`);
    }
    assert.equal(demo.captions.length, 3);
    assert.ok(demo.seconds >= 12 && demo.seconds <= 25, `${product.name}: a key interaction is 12–25 seconds`);
  }
});

test("lab products are never presented as shipped", () => {
  assert.ok(labProducts.length >= 3);
  for (const product of labProducts) {
    assert.notEqual(product.stage, "public", `${product.name} is public but listed in the lab`);
    assert.equal(product.appStore, undefined, `${product.name} carries an App Store listing in the lab`);
    assert.ok(product.notYetShort.startsWith("Not yet"), `${product.name}: the card's honest line must start with "Not yet"`);
    if (product.href.startsWith("/")) {
      assert.ok(exists(`app${product.href}/page.tsx`), `${product.href} has no route`);
    } else {
      assert.match(product.href, /^https:\/\/testflight\.apple\.com\//);
    }
  }
});

test("the site never claims more than the registry", () => {
  for (const product of siteProducts) {
    const registry = getProduct(product.slug)!;
    assert.equal(product.status, registry.status);
    assert.equal(product.verifiedAt, registry.verifiedAt);
    assert.ok(product.blurb.length > 40);
    assert.doesNotMatch(product.blurb, /\b(revolutionary|cutting-edge|seamless|innovative|transformative|empower|leverage)\b/i, `${product.name}: banned vocabulary`);
  }
});

test("the commercial offer is three shapes with proof, and one reply promise", () => {
  assert.equal(engagementShapes.length, 3);
  for (const shape of engagementShapes) {
    assert.ok(shape.proof.length > 10, `${shape.title} names no shipped proof`);
    assert.ok(shape.timeline.length > 5);
  }
  assert.match(replyPromise, /business days?|week/);
  for (const file of ["app/page.tsx", "app/work-with-me/page.tsx", "app/start/page.tsx"]) {
    assert.match(read(file), /replyPromise/, `${file} must read the reply promise from the registry, not hard-code it`);
  }
});

test("the homepage reads products from the registry and shows no agency offer", () => {
  const page = read("app/page.tsx");
  assert.match(page, /from "@\/lib\/products"/);
  assert.match(page, /withLiveListings\(shippedProducts\)/);
  assert.match(page, /shipped\.map/);
  assert.match(page, /labProducts\.map/);
  assert.doesNotMatch(page, /Revenue Leak|audit|Quick Fix|Landing Page Rebuild|\$250/i);
  assert.doesNotMatch(page, /from "@\/lib\/commercial"/);
});
