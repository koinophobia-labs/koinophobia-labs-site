import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { faqs, getWorkProject, processSteps, products, serviceOffers, studioConfig, workProjects } from "../lib/commercial";
import { getProduct as getUniverseProduct, publicStatusLabel } from "../lib/dev/universe";

const root = path.resolve(import.meta.dirname, "..");

test("business work renders only supported, visible categories", () => {
  assert.ok(workProjects.length > 0);
  assert.ok(workProjects.every((project) => project.status === "concept-build"));
  assert.ok(workProjects.every((project) => project.statusLabel === "Concept Build"));
  assert.ok(workProjects.every((project) => project.intendedImpact?.length));
  assert.ok(workProjects.every((project) => !project.measuredResults));
  assert.ok(workProjects.every((project) => !project.testimonial));
});

test("optional project fields can remain absent", () => {
  const project = getWorkProject("blackline-ritual");
  assert.ok(project);
  assert.equal(project.liveUrl, undefined);
  assert.equal(project.image, undefined);
  assert.equal(project.testimonial, undefined);
  assert.equal(project.measuredResults, undefined);
});

test("pricing and timelines match the approved commercial ranges", () => {
  assert.equal(studioConfig.auditPrice, "$250");
  assert.equal(studioConfig.quickFixRange, "$149–$499");
  assert.equal(studioConfig.landingPageRange, "$499–$1,200");
  assert.equal(studioConfig.websiteRange, "$1,500–$3,500");
  assert.equal(serviceOffers.length, 5);
  assert.ok(serviceOffers.every((offer) => offer.price && offer.timeline && offer.deliverable));
});

test("commercial CTAs resolve to local routes", () => {
  const localTargets = serviceOffers.map((offer) => offer.href.split("?")[0]);
  for (const href of new Set(["/services", "/work", "/products", "/process", "/about", "/intake", "/audit", ...localTargets])) {
    const page = href === "/" ? "app/page.tsx" : `app${href}/page.tsx`;
    assert.ok(fs.existsSync(path.join(root, page)), `missing route: ${href}`);
  }
});

test("every case-study slug resolves and has a static route", () => {
  assert.ok(fs.existsSync(path.join(root, "app/work/[slug]/page.tsx")));
  for (const project of workProjects) assert.equal(getWorkProject(project.slug)?.title, project.title);
});

test("products are explicitly internal and commercial guidance is complete", () => {
  assert.deepEqual(products.map((product) => product.title), ["Career Forge", "Trendi", "You Know Ball"]);
  assert.ok(products.every((product) => product.status.startsWith("Internal Product")));
  assert.equal(processSteps.length, 6);
  assert.ok(faqs.length >= 13);
});

test("studio product statuses are single-sourced from the dev universe and gate 'Live' behind reach (XP-04)", () => {
  const bySlug: Record<string, string> = { "Career Forge": "career-forge", Trendi: "trendi", "You Know Ball": "you-know-ball" };
  for (const product of products) {
    const universe = getUniverseProduct(bySlug[product.title]);
    assert.ok(universe, `no dev/universe product for ${product.title}`);
    // The card label is derived from the dated source of truth, not hand-written.
    assert.equal(product.status, `Internal Product · ${publicStatusLabel(universe)}`);
    // Any "Live" label must be backed by public reach — never a demo route alone.
    if (/\bLive\b/.test(product.status)) assert.equal(universe.reach, "public", `${product.title} labeled Live without public reach`);
  }
  // Trendi is limited-reach, so it must no longer read as "Live" or "Working Demo".
  const trendi = products.find((product) => product.title === "Trendi")!;
  assert.doesNotMatch(trendi.status, /\bLive\b/);
  assert.doesNotMatch(trendi.status, /Working Demo/);
});
