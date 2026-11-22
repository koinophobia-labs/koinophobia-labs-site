import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.CONNECT_CAPTURE_URL || "http://127.0.0.1:3258";
const output = process.env.CONNECT_CAPTURE_OUTPUT;
if (!output)
  throw Error("CONNECT_CAPTURE_OUTPUT required; preserve each capture run.");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const role of ["owner", "partner"])
    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      const calls = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => {
        if (/api.stripe.com/.test(r.url())) calls.push("Stripe API request");
      });
      await page.goto(base + "/team");
      await page.getByRole("button", { name: `Explore ${role} view` }).click();
      await page.waitForURL("**/team/leads");
      const response = await page.goto(base + "/team/commissions");
      await page
        .getByRole("heading", { name: "Transfers & balances" })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow || errors.length || calls.length)
        throw Error(JSON.stringify({ role, width, overflow, errors, calls }));
      if (!response.headers()["x-robots-tag"]?.includes("noindex"))
        throw Error("Missing private robots header");
      if (role === "partner") {
        if (
          await page
            .getByRole("button", { name: "Retry owed transfers" })
            .count()
        )
          throw Error("Owner control visible to partner");
        if ((await page.locator("body").innerText()).includes("Cedar Workshop"))
          throw Error("Cross-partner record leaked");
        if (
          !(await page
            .getByRole("button", { name: "Open Stripe Express dashboard" })
            .isDisabled())
        )
          throw Error("Stripe preview action enabled");
      }
      const file = `${role}-${width}x${height}.png`;
      await page.screenshot({
        path: output + "/" + file,
        animations: "disabled",
      });
      await page.screenshot({
        path: output + "/" + file.replace(".png", "-full.png"),
        fullPage: true,
        animations: "disabled",
      });
      const mutations = {};
      for (const action of [
        "connect-onboard",
        "connect-dashboard",
        "connect-refresh",
        "connect-retry",
      ]) {
        const r = await page.request.post(base + "/team/api/" + action, {
          headers: { Origin: new URL(base).origin },
          data: { partner_id: "demo-b", role: "owner" },
        });
        mutations[action] = r.status();
        if (r.status() !== 409) throw Error("Preview mutation accepted");
      }
      const webhook = await page.request.post(base + "/api/stripe/webhook", {
        data: { livemode: true },
      });
      if (webhook.status() !== 409) throw Error("Preview webhook not isolated");
      results.push({
        role,
        width,
        height,
        status: response.status(),
        overflow,
        errors,
        stripeCalls: calls.length,
        mutations,
        webhook: webhook.status(),
        file,
      });
      await context.close();
    }
  await writeFile(
    output + "/checks.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
