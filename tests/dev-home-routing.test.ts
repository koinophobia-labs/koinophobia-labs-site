import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Guards the two-host routing contract for the shared app:
//   koinophobia.dev  /  -> personal home (app/home)
//   koinophobialabs.com  /  -> studio home (app/page.tsx)
// plus canonicalization of the internal /home target and the /connect card.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

const nextConfig = read("next.config.ts");
const nextConfigCompact = nextConfig.replace(/\s/g, "");
const vercelJson = JSON.parse(read("vercel.json"));
const devHome = read("app/home/page.tsx");
const studioHome = read("app/page.tsx");
const connect = read("app/connect/page.tsx");
const resumePage = read("app/resume/page.tsx");

test("koinophobia.dev / rewrites to the personal home", () => {
  assert.ok(
    nextConfigCompact.includes('{source:"/",has:[{type:"host",value:"koinophobia.dev"}],destination:"/home"'),
    "expected a host-scoped rewrite of / -> /home for koinophobia.dev",
  );
});

test("koinophobialabs.com keeps the studio homepage at /", () => {
  // The studio page is app/page.tsx and no rewrite redirects the .com root away.
  assert.match(studioHome, /className="studio-site"/);
  assert.ok(
    !nextConfigCompact.includes('{source:"/",has:[{type:"host",value:"koinophobialabs.com"}],destination:"/home"'),
    "koinophobialabs.com root must not rewrite to /home",
  );
});

test("/home canonicalizes to one public URL per host", () => {
  for (const host of ["koinophobia.dev", "koinophobialabs.com"]) {
    assert.ok(
      nextConfigCompact.includes(`{source:"/home",has:[{type:"host",value:"${host}"}],destination:"https://koinophobia.dev/"`),
      `expected /home to redirect to canonical root for ${host}`,
    );
  }
});

test("the legacy koinophobia.dev / -> /connect redirect is gone", () => {
  const hasConnectRootRedirect = (vercelJson.redirects ?? []).some(
    (r: { source: string; destination: string; has?: Array<{ value: string }> }) =>
      r.source === "/" &&
      r.destination === "/connect" &&
      (r.has ?? []).some((h) => h.value === "koinophobia.dev"),
  );
  assert.equal(hasConnectRootRedirect, false, "root should no longer redirect to /connect");
});

test("the www.koinophobia.dev -> apex redirect is preserved", () => {
  const hasWwwRedirect = (vercelJson.redirects ?? []).some(
    (r: { destination: string; has?: Array<{ value: string }> }) =>
      r.destination === "https://koinophobia.dev/:path*" &&
      (r.has ?? []).some((h) => h.value === "www.koinophobia.dev"),
  );
  assert.equal(hasWwwRedirect, true, "www.koinophobia.dev must still redirect to the apex");
});

test("/connect remains available as the fast networking card", () => {
  assert.ok(exists("app/connect/page.tsx"), "app/connect/page.tsx must exist");
});

test("every internal link on the personal home resolves to a real route", () => {
  // Extract internal routes from both JSX attributes (href="/x") and the
  // systems data literals (href: "/x"). Dynamic href={LINKS.*} are external.
  const hrefs = [...devHome.matchAll(/href[=:]\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  const internal = [...new Set(hrefs)].filter((h) => !h.startsWith("//"));
  assert.ok(internal.length >= 3, "expected several internal links to verify");

  const routeFile = (route: string) => {
    const clean = route.replace(/\/+$/, "") || "/";
    if (clean === "/") return "app/page.tsx";
    return `app/${clean.slice(1)}/page.tsx`;
  };

  for (const route of internal) {
    assert.ok(exists(routeFile(route)), `internal link ${route} has no page file (${routeFile(route)})`);
  }
});

test("You Know Ball links to the playable route, not the missing /you-know-ball index", () => {
  assert.doesNotMatch(devHome, /href="\/you-know-ball"/, "/you-know-ball has no index page");
  assert.match(devHome, /href:\s*"\/you-know-ball\/play"/);
  assert.ok(exists("app/you-know-ball/play/page.tsx"));
});

test("internal navigation uses next/link to avoid full document reloads", () => {
  assert.match(devHome, /import Link from "next\/link"/);
  // Hash and external links stay as plain anchors; internal route links use Link.
  assert.match(devHome, /<Link className="devhome__btn devhome__btn--ghost" href="\/connect">/);
});

test("/connect wears the dark .connectcard identity, not the legacy .founder system", () => {
  assert.match(connect, /className="connectcard"/);
  assert.doesNotMatch(connect, /founder-page|founder-shell|founder-card|founder-hero/);
});

test("/connect has personal metadata independent of the studio title template", () => {
  // title.absolute bypasses the "%s | Koinophobia Labs" layout template.
  assert.match(connect, /title:\s*\{\s*absolute:\s*"Connect with Blake Taylor"\s*\}/);
  assert.match(connect, /canonical:\s*"https:\/\/koinophobia\.dev\/connect"/);
});

test("/connect links back to the homepage client-side and every internal link resolves", () => {
  assert.match(connect, /import Link from "next\/link"/);
  assert.match(connect, /<Link className="connectcard__home" href="\/">/);
  const hrefs = [...connect.matchAll(/href[=:]\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  for (const route of [...new Set(hrefs)]) {
    const clean = route.replace(/\/+$/, "") || "/";
    const file = clean === "/" ? "app/page.tsx" : `app/${clean.slice(1)}/page.tsx`;
    assert.ok(exists(file), `/connect internal link ${route} has no page file (${file})`);
  }
});

test("/resume wears the dark .resumedev identity, not the legacy .mini/.founder system", () => {
  assert.match(resumePage, /className="resumedev"/);
  assert.doesNotMatch(resumePage, /className="mini-page|className="page-field|founder-/);
});

test("/resume keeps personal metadata and the ATS PDF download intact", () => {
  assert.match(resumePage, /title:\s*\{\s*absolute:\s*"Blake Taylor — Résumé"\s*\}/);
  assert.match(resumePage, /canonical:\s*"https:\/\/koinophobia\.dev\/resume"/);
  // The downloadable ATS artifact must remain wired to the generated PDF.
  assert.match(resumePage, /const PDF_PATH = "\/resume\/Blake-Taylor-Resume\.pdf"/);
  assert.match(resumePage, /download="Blake-Taylor-Resume\.pdf"/);
});

test("/resume renders from lib/resume.json (single source of truth), not inlined facts", () => {
  assert.match(resumePage, /import resume from "@\/lib\/resume\.json"/);
  assert.match(resumePage, /resume\.experience\.map/);
  assert.match(resumePage, /\{resume\.summary\}/);
});
