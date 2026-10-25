import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// The App Store listings point at these pages. They must stay publication-
// ready and discoverable whatever the rest of the site does.

test("Trendi privacy and support routes are publication-ready and discoverable", async () => {
  const [privacySource, support, sitemap] = await Promise.all([
    readFile(new URL("../app/trendi/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/trendi/support/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
  ]);
  // JSX source line wrapping must not change the policy wording checks.
  const privacy = privacySource.replace(/\s+/g, " ");

  for (const page of [privacy, support]) {
    assert.ok(page.includes("koinophobia999@gmail.com"));
    assert.ok(!page.includes("blake@koinophobialabs.com"));
    assert.ok(!page.match(/placeholder|launch draft|do not publish/i));
  }

  assert.ok(privacy.includes('canonical: "/trendi/privacy"'));
  assert.ok(privacy.includes("Anthropic"));
  assert.ok(privacy.includes("every third party Trendi shares user data with"));
  assert.ok(privacy.includes("provides the same or equal protection of user data"));
  assert.ok(privacy.includes("required by Apple&apos;s App Review Guidelines"));
  assert.ok(!privacy.includes("when recognition is not available on device"));
  assert.ok(privacy.includes("scheduled for deletion 24 hours after delivery"));
  assert.ok(privacy.includes("scheduled for deletion at the end of a seven-day"));
  assert.ok(privacy.includes("Scheduled cleanup removes due results"));
  assert.ok(privacy.includes("After deletion, Trendi may keep content-free safeguards"));
  assert.ok(privacy.includes("safeguards for up to 24 hours, only to stop existing sessions from restoring the deleted account"));
  assert.ok(privacy.includes("up to 90 days"));
  assert.ok(privacy.includes("permanently deletes the account&apos;s Coach results and ordinary service records"));
  assert.ok(privacy.includes("Google"));
  assert.ok(privacy.includes("processes support and inquiry messages"));
  assert.ok(privacy.includes("flagged inputs and outputs may be kept for up to two years"));
  assert.ok(privacy.includes("Trendi asks for your permission again"));
  assert.ok(privacy.includes("Our Coach service refuses any AI request that doesn&apos;t carry a current consent"));
  assert.ok(privacy.includes("Pasted and shared material (Trendi 2.3)"));
  assert.ok(privacy.includes("until you next open Trendi or share something new"));
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

test("Way In privacy explains consent, guest sessions, and separate retention periods", async () => {
  const privacy = await readFile(new URL("../app/way-in/privacy/page.tsx", import.meta.url), "utf8");
  for (const disclosure of [
    "Effective October 2026",
    "Job links you choose to read.",
    "When you approve a job-link read",
    "full HTTPS link, including its query parameters",
    "Vercel receives normal connection information, including your IP address",
    "The job website receives a request from our server",
    "You can cancel and paste the posting text instead",
    "Sessions and abuse prevention.",
    "session lasting up to 24 hours",
    "cannot access Trendi accounts or routes",
    "keyed hashes",
    "each daily counter expires within 48 hours of its last update",
    "They contain no job link, posting text, résumé or profile",
    "session token is held in memory",
    "typically up to 3 days for daily backups",
    "manually created backups may remain until deleted",
    "Backup retention is separate from the 48-hour expiry of active counters",
    "Content and logs.",
    "does not persist the link or posting, send them to an AI provider",
    "runtime and request logs are retained for 30 days",
    "Separate hosting security records follow the provider’s security retention policies",
    "Your résumé and profile stay on your iPhone for tailoring",
    "We do not use this feature for advertising or cross-app tracking",
    "Optional Sign in with Apple does not upload your workspace",
    "Job-link reading uses a separate guest session solely for the reading service",
    "These local product events are separate from the job-link reader’s server logs",
    "Opening a job website yourself still connects your device to that website",
    "Export, Share and Files actions send the material you select to the destination you choose",
  ]) {
    assert.ok(privacy.includes(disclosure), `Missing Way In disclosure: ${disclosure}`);
  }
  assert.ok(!privacy.includes("The current public release has no configured account server"));
  assert.ok(!privacy.includes("Opening or reading a saved job link connects to that website"));
});
