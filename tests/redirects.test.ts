import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import nextConfig from "../next.config";

// One studio, one domain. Every retired URL, on either host, lands on the
// page that does its job now, permanently, and every destination exists.

const root = path.resolve(import.meta.dirname, "..");
const routeExists = (route: string) =>
  route === "/" || fs.existsSync(path.join(root, "app", route.replace(/^\//, ""), "page.tsx"));

type Rule = { source: string; destination: string; permanent: boolean; has?: Array<{ type: string; value: string }> };

async function rules(): Promise<Rule[]> {
  return (await nextConfig.redirects!()) as Rule[];
}

test("no host-scoped rewrites remain; the personal host only redirects", async () => {
  assert.equal(nextConfig.rewrites, undefined, "the dual-host rewrite table must be gone");
  const all = await rules();
  const personal = all.filter((r) => r.has?.some((h) => h.value === "koinophobia.dev"));
  assert.ok(personal.length >= 10, "expected the personal-host map plus a catch-all");
  for (const rule of personal) {
    assert.match(rule.destination, /^https:\/\/koinophobialabs\.com\//, `${rule.source} must leave for the studio host`);
    assert.equal(rule.permanent, true);
  }
  const catchAll = personal.find((r) => r.source === "/:path*");
  assert.ok(catchAll, "the personal host needs a catch-all");
  assert.equal(personal.indexOf(catchAll!), personal.length - 1, "the catch-all must come last");
});

test("the personal-host map lands on real studio pages", async () => {
  const all = await rules();
  const expected: Record<string, string> = {
    "/": "/",
    "/products": "/shipped",
    "/products/career-forge": "/way-in",
    "/products/trendi": "/trendi",
    "/products/forget-about-it": "/forget-about-it",
    "/products/you-know-ball": "/lab/do-you-know-ball",
    "/log": "/log",
    "/lab": "/lab",
    "/about": "/blake",
    "/connect": "/blake",
    "/now": "/log",
    "/resume": "/resume",
  };
  for (const [source, destination] of Object.entries(expected)) {
    const rule = all.find((r) => r.source === source && r.has?.some((h) => h.value === "koinophobia.dev"));
    assert.ok(rule, `no personal-host redirect for ${source}`);
    assert.equal(rule!.destination, `https://koinophobialabs.com${destination}`);
    assert.ok(routeExists(destination), `${destination} does not exist`);
  }
});

test("retired studio routes redirect to living pages", async () => {
  const all = await rules();
  const expected: Record<string, string> = {
    "/services": "/work-with-me",
    "/process": "/work-with-me",
    "/audit": "/work-with-me",
    "/revenue-leak-audit": "/work-with-me",
    "/concierge": "/work-with-me",
    "/intake": "/start",
    "/products": "/shipped",
    "/about": "/blake",
    "/work": "/shipped",
    "/you-know-ball": "/lab/do-you-know-ball",
    "/home": "/",
  };
  for (const [source, destination] of Object.entries(expected)) {
    const rule = all.find((r) => r.source === source && !r.has);
    assert.ok(rule, `no studio redirect for ${source}`);
    assert.equal(rule!.destination, destination);
    assert.equal(rule!.permanent, true);
    assert.ok(routeExists(destination), `${destination} does not exist`);
    assert.equal(routeExists(source), false, `${source} still has a page and a redirect`);
  }
});

test("the www hosts collapse onto the studio host", () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8")) as { redirects: Rule[] };
  for (const host of ["www.koinophobia.dev", "www.koinophobialabs.com"]) {
    const rule = vercel.redirects.find((r) => r.has?.some((h) => h.value === host));
    assert.ok(rule, `${host} has no redirect`);
    assert.equal(rule!.destination, "https://koinophobialabs.com/:path*");
    assert.equal(rule!.permanent, true);
  }
});
