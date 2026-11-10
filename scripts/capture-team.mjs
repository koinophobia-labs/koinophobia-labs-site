import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.TEAM_CAPTURE_URL || "http://127.0.0.1:3257";
const output = process.env.TEAM_CAPTURE_OUTPUT;
if (!output)
  throw Error("TEAM_CAPTURE_OUTPUT required; use a new evidence directory.");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      }),
      page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const screen of [
      "login",
      "leads",
      "check",
      "quote",
      "pipeline",
      "commissions",
      "scripts",
      "admin",
    ]) {
      if (screen === "leads") {
        await page.getByRole("button", { name: "Explore owner view" }).click();
        await page.waitForURL("**/team/leads");
      }
      const response = await page.goto(
        base + "/team" + (screen === "login" ? "" : "/" + screen),
      );
      await page.evaluate(() => document.fonts.ready);
      await page.locator("h1").waitFor();
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
      await page.waitForFunction(() => window.scrollY === 0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw Error(`${screen} overflows ${width}`);
      if (!response.headers()["x-robots-tag"]?.includes("noindex"))
        throw Error(`${screen} missing noindex header`);
      if (
        !(await page
          .locator("meta[name=robots]")
          .getAttribute("content")
          .then((v) => v.includes("noindex")))
      )
        throw Error("Missing robots metadata");
      const path = `${screen}-${width}x${height}.png`;
      await page.screenshot({
        path: output + "/" + path,
        animations: "disabled",
      });
      await page.screenshot({
        path: output + "/" + path.replace(".png", "-full.png"),
        fullPage: true,
        animations: "disabled",
      });
      results.push({
        screen,
        width,
        height,
        status: response.status(),
        overflow,
        errors: [...errors],
        path,
      });
      if (screen === "scripts") {
        await page.getByRole("button", { name: "Email", exact: true }).click();
        if (
          !(await page
            .getByRole("button", { name: "Copy email script" })
            .isDisabled())
        )
          throw Error("Address gate missing");
        await page.getByRole("button", { name: "DM", exact: true }).click();
        if (
          !(await page
            .getByRole("button", { name: "Copy dm script" })
            .isEnabled())
        )
          throw Error("DM missing");
      }
    }
    await context.close();
  }
  const p = await browser.newPage();
  await p.goto(base + "/team");
  await p.getByRole("button", { name: "Explore partner view" }).click();
  await p.waitForURL("**/team/leads");
  if (await p.getByRole("link", { name: "Team admin" }).count())
    throw Error("Partner sees admin nav");
  if ((await p.goto(base + "/team/admin")).status() !== 404)
    throw Error("Partner admin authorization missing");
  if (results.some((r) => r.errors.length))
    throw Error("Browser errors: " + JSON.stringify(results));
  await writeFile(
    output + "/manifest.json",
    JSON.stringify(
      {
        base,
        checkedAt: new Date().toISOString(),
        screens: results,
        checks:
          "16 screen/viewport checks; noindex, no overflow, no page errors; email hold; DM copy; partner admin denied",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 16 screen/viewport captures, 32 PNGs, partner admin denied, noindex, overflow and script checks.",
  );
} finally {
  await browser.close();
}
