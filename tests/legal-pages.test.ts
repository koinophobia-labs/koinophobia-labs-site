import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// The App Store listings point at these pages. They must stay publication-
// ready and discoverable whatever the rest of the site does.

test("Trendi privacy and support routes are publication-ready and discoverable", async () => {
  const [privacy, support, sitemap] = await Promise.all([
    readFile(new URL("../app/trendi/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/trendi/support/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
  ]);

  for (const page of [privacy, support]) {
    assert.ok(page.includes("koinophobia999@gmail.com"));
    assert.ok(!page.includes("blake@koinophobialabs.com"));
    assert.ok(!page.match(/placeholder|launch draft|do not publish/i));
  }

  assert.ok(privacy.includes('canonical: "/trendi/privacy"'));
  assert.ok(privacy.includes("Anthropic"));
  assert.ok(privacy.includes("every third party with whom Trendi shares"));
  assert.ok(privacy.includes("provides the same or equal protection of user data"));
  assert.ok(privacy.includes("required by Apple&apos;s App Review Guidelines"));
  assert.ok(privacy.includes("on device or send it to Apple for recognition"));
  assert.ok(!privacy.includes("when recognition is not available on device"));
  assert.ok(privacy.includes("scheduled for deletion 24 hours after delivery"));
  assert.ok(privacy.includes("scheduled for deletion at the end of a seven-day"));
  assert.ok(privacy.includes("Recurring cleanup removes due results"));
  assert.ok(privacy.includes("content-free deletion and revoked-session"));
  assert.ok(privacy.includes("safeguards for up to 24 hours solely"));
  assert.ok(privacy.includes("up to 90 days"));
  assert.ok(privacy.includes("account-scoped Coach results"));
  assert.ok(privacy.includes("Google"));
  assert.ok(privacy.includes("Support and inquiry messages"));
  assert.ok(privacy.includes("flagged inputs and outputs may be retained for up to two"));
  assert.ok(privacy.includes("reset your AI"));
  assert.ok(privacy.includes("asks for consent again before sending another request"));
  assert.ok(support.includes('href="/trendi/privacy"'));
  assert.ok(support.includes("Coach results and"));
  assert.ok(support.includes("safeguards may remain for"));
  assert.ok(sitemap.includes('"/trendi/privacy"'));
  assert.ok(sitemap.includes('"/trendi/support"'));
});

test("every shipped app's legal pages exist and are in the sitemap", async () => {
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  for (const route of ["/forget-about-it/privacy", "/forget-about-it/support", "/you-know-ball/privacy", "/you-know-ball/support", "/privacy"]) {
    assert.ok(sitemap.includes(`"${route}"`), `${route} missing from the sitemap`);
    await readFile(new URL(`../app${route}/page.tsx`, import.meta.url), "utf8");
  }
});
