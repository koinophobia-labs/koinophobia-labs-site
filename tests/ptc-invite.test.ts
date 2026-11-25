import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { metadata } from "../app/ptc/join/page";
import InviteJoin from "../app/ptc/join/InviteJoin";
import {
  inviteAppLinks, inviteSecretFromHash, PTC_ANDROID_PACKAGE, PTC_APP_STORE_ID, PTC_APP_STORE_URL,
  PTC_APPLE_APP_ID, PTC_INVITE_OG_IMAGE, PTC_INVITE_URL, PTC_PLAY_STORE_URL,
} from "../lib/ptc-invite";
import { preachingRelease } from "../lib/releases";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("invite metadata has the title, description and an absolute 1200x630 og:image", () => {
  assert.deepEqual(metadata.title, { absolute: "Join my prayer group" });
  assert.equal(metadata.description, "You're invited to pray together on Preaching to the Choir.");
  const og = metadata.openGraph as Record<string, unknown>;
  assert.equal(og.title, "Join my prayer group");
  assert.equal(og.siteName, "Preaching to the Choir");
  assert.equal(og.type, "website");
  assert.equal(og.url, "https://koinophobialabs.com/ptc/join");
  const [image] = og.images as Array<{ url: string; width: number; height: number }>;
  assert.equal(image.url, "https://koinophobialabs.com/ptc/invite-og.jpg");
  assert.equal(image.url, PTC_INVITE_OG_IMAGE);
  assert.deepEqual([image.width, image.height], [1200, 630]);
  const twitter = metadata.twitter as Record<string, unknown>;
  assert.equal(twitter.card, "summary_large_image");
  assert.deepEqual(twitter.images, [PTC_INVITE_OG_IMAGE]);
  assert.deepEqual(metadata.robots, { index: false, follow: false });
  assert.deepEqual(metadata.itunes, { appId: "6808442357" });
});

test("the og image ships as a 1200x630 JPEG", () => {
  const jpg = fs.readFileSync(path.join(root, "public/ptc/invite-og.jpg"));
  assert.equal(jpg.readUInt16BE(0), 0xffd8);
  // Walk JPEG segments to the start-of-frame marker for the dimensions.
  let offset = 2;
  let size: [number, number] | undefined;
  while (offset < jpg.length) {
    const marker = jpg.readUInt16BE(offset);
    const length = jpg.readUInt16BE(offset + 2);
    if (marker >= 0xffc0 && marker <= 0xffc2) { size = [jpg.readUInt16BE(offset + 7), jpg.readUInt16BE(offset + 5)]; break; }
    offset += 2 + length;
  }
  assert.deepEqual(size, [1200, 630]);
});

test("store ids and links match the app's real listings", () => {
  assert.equal(PTC_APP_STORE_URL, preachingRelease.url);
  assert.ok(PTC_APP_STORE_URL.endsWith(`/id${PTC_APP_STORE_ID}`));
  assert.equal(PTC_PLAY_STORE_URL, "https://play.google.com/store/apps/details?id=com.koinophobialabs.preachingtothechoir");
  assert.equal(PTC_INVITE_URL, "https://koinophobialabs.com/ptc/join");
});

test("deep links carry the fragment, never a query string", () => {
  assert.equal(inviteSecretFromHash("#abc-123_XYZ"), "abc-123_XYZ");
  assert.equal(inviteSecretFromHash(""), "");
  const links = inviteAppLinks("abc-123_XYZ");
  assert.equal(links.universal, "https://koinophobialabs.com/ptc/join#abc-123_XYZ");
  assert.equal(links.scheme, "ptc://join#abc-123_XYZ");
  assert.ok(!links.universal.includes("?") && !links.scheme.includes("?"));
});

test("the server render shows the invite, store buttons, and no secret-bearing link", () => {
  const $ = load(renderToStaticMarkup(createElement(InviteJoin)));
  assert.equal($("h1").text(), "You’re invited to a prayer group");
  assert.match($.text(), /private and encrypted/);
  assert.equal($("a").filter((_, a) => $(a).text() === "Get it on the App Store").attr("href"), PTC_APP_STORE_URL);
  assert.equal($("a").filter((_, a) => $(a).text() === "Get it on Google Play").attr("href"), PTC_PLAY_STORE_URL);
  // Without a fragment (as on the server) there is nothing to open.
  assert.equal($("a").filter((_, a) => $(a).text() === "Open in Preaching to the Choir").length, 0);
});

test("the invite route adds no analytics, logging or network calls", () => {
  for (const file of ["app/ptc/join/page.tsx", "app/ptc/join/InviteJoin.tsx", "lib/ptc-invite.ts"]) {
    assert.doesNotMatch(read(file), /console\.|@vercel\/analytics|trackStudioEvent|ProductPageView|data-analytics|fetch\(|sendBeacon|localStorage|sessionStorage|document\.cookie/, file);
  }
  assert.match(read("components/team/PrivateAwareAnalytics.tsx"), /path\.startsWith\("\/ptc\/"\) \? null/);
});

test("apple-app-site-association is valid JSON for the app with components and legacy paths", () => {
  const aasa = JSON.parse(read("public/.well-known/apple-app-site-association"));
  const [detail] = aasa.applinks.details;
  assert.deepEqual(aasa.applinks.apps, []);
  assert.deepEqual(detail.appIDs, [PTC_APPLE_APP_ID]);
  assert.equal(detail.appID, "3TY4W55YC5.com.koinophobialabs.preachingtothechoir");
  assert.ok(detail.components.some((c: Record<string, string>) => c["/"] === "/ptc/join*"));
  assert.deepEqual(detail.paths, ["/ptc/join*"]);
});

test("assetlinks.json delegates handle_all_urls to the Android app", () => {
  const links = JSON.parse(read("public/.well-known/assetlinks.json"));
  assert.ok(Array.isArray(links) && links.length === 1);
  const [statement] = links;
  assert.deepEqual(statement.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(statement.target.namespace, "android_app");
  assert.equal(statement.target.package_name, PTC_ANDROID_PACKAGE);
  assert.equal(statement.target.package_name, "com.koinophobialabs.preachingtothechoir");
  const fingerprints: string[] = statement.target.sha256_cert_fingerprints;
  assert.ok(fingerprints.length > 0);
  // Real fingerprints are 32 colon-separated hex bytes. Until the Play App
  // Signing fingerprint is added, the one clearly marked placeholder is allowed.
  for (const print of fingerprints) {
    assert.ok(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(print) || print.startsWith("PLACEHOLDER_"), print);
  }
});

test("well-known files are served as JSON and the proxy does not intercept them", async () => {
  const config = (await import("../next.config")).default;
  const headers = await config.headers!();
  for (const source of ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"]) {
    const rule = headers.find(h => h.source === source);
    assert.ok(rule, source);
    assert.deepEqual(rule.headers, [{ key: "Content-Type", value: "application/json" }]);
  }
  const redirects = await config.redirects!();
  assert.ok(!redirects.some(r => !r.has && (r.source.startsWith("/.well-known") || r.source.startsWith("/ptc"))));
  assert.doesNotMatch(read("proxy.ts"), /well-known|\/ptc/);
});
