import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3259";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "local tests only");
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage();
  let requests = 0;
  await page.route("**/team/api/magic", async (route) => {
    requests++;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ json: { message: "If invited, your login link is on its way." } });
  });
  await page.goto(base + "/team");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  // Same-turn events exercise the gap before React commits disabled={busy}.
  await page.locator("form").evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
  await page.getByRole("status").waitFor();
  assert.equal(requests, 1);
  await page.getByRole("button", { name: "Email me a login link" }).click();
  await page.waitForTimeout(250);
  assert.equal(requests, 1, "rapid click after completion stays deduplicated");
  await page.clock.install();
  await page.clock.fastForward(61_000);
  await page.getByRole("button", { name: "Email me a login link" }).click();
  await page.getByRole("status").waitFor();
  assert.equal(requests, 2, "resend allowed after 60 seconds");
  console.log("PASS: same-turn double submit, fast repeat, resend after 60 seconds; all email requests intercepted locally.");
} finally {
  await browser.close();
}
