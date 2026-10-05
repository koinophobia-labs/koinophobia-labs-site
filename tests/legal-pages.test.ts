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
  assert.ok(privacy.includes("on device or send it to Apple for recognition"));
  assert.ok(!privacy.includes("when recognition is not available on device"));
  assert.ok(privacy.includes("scheduled for deletion 24 hours after delivery"));
  assert.ok(privacy.includes("scheduled for deletion at the end of a seven-day"));
  assert.ok(privacy.includes("Cleanup is scheduled daily"));
  assert.ok(privacy.includes("up to 90 days"));
  assert.ok(privacy.includes("account-scoped Coach results"));
  assert.ok(privacy.includes("Google"));
  assert.ok(privacy.includes("Support and inquiry messages"));
  assert.ok(privacy.includes("reset your AI"));
  assert.ok(privacy.includes("asks for consent again before sending another request"));
  // Shipping 0.2.3 does not revoke Apple authorization or invalidate old
  // sessions server-side. Disclosures must not promise absent safeguards.
  assert.ok(!privacy.includes("revoked-session"));
  assert.ok(!privacy.includes("attempts to revoke"));
  assert.ok(!support.includes("does not offer a subscription"));
  assert.ok(support.includes("Restore Purchases"));
  assert.ok(support.includes("100 per subscription month"));
  assert.ok(support.includes("does not cancel"));
  assert.ok(support.includes('href="/trendi/privacy"'));
  assert.ok(support.includes("Coach results and"));
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
