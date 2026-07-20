import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.KOI_QA_URL || "http://127.0.0.1:3000";
const output = "qa-screenshots/koi/visual";
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const results = [];

async function capture(path, width, height, name, options = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: options.reducedMotion ? "reduce" : "no-preference" });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(options.reducedMotion ? 150 : 2_100);
  if (options.openPanel) {
    const trigger = page.getByTestId("koi-companion-trigger");
    for (let index = 0; index < 8 && !(await trigger.isVisible().catch(() => false)); index += 1) {
      await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: "instant" }), (index + 1) * 320);
      await page.waitForTimeout(120);
    }
    await trigger.click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(420);
  }
  if (options.pointerInfluence) {
    await page.mouse.move(Math.round(width * 0.58), Math.round(height * 0.72));
    await page.waitForTimeout(850);
  }
  if (options.compare) {
    const panel = page.getByRole("dialog");
    await panel.getByRole("button", { name: "Compare two options" }).click();
    await panel.getByRole("heading", { name: "Which of these fits better?" }).waitFor();
  }
  if (options.siteHelp) {
    const panel = page.getByRole("dialog");
    await panel.getByRole("button", { name: "Ask a question about the site" }).click();
    await panel.getByRole("button", { name: "How much does a project cost?" }).click();
    await page.waitForTimeout(180);
  }
  if (options.startFlow) {
    const panel = page.getByRole("dialog");
    await panel.getByRole("button", { name: /Help me figure out what I need/i }).click();
    await panel.getByRole("button", { name: /Help me figure it out/i }).waitFor();
    await panel.getByRole("button", { name: /Help me figure it out/i }).click();
    await panel.locator(".concierge-question").waitFor();
    await page.waitForTimeout(180);
    if (options.focusInput) await panel.getByLabel("What are you seeing?").focus();
  }
  const file = `${output}/${name}.png`;
  await page.screenshot({ path: file, fullPage: options.fullPage === true });
  const metrics = await page.evaluate(() => {
    const trigger = document.querySelector("[data-testid='koi-companion-trigger']")?.getBoundingClientRect();
    const panel = document.querySelector(".koi-companion-panel")?.getBoundingClientRect();
    const active = document.activeElement?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      trigger: trigger ? { left: trigger.left, top: trigger.top, right: trigger.right, bottom: trigger.bottom } : null,
      panel: panel ? { left: panel.left, top: panel.top, right: panel.right, bottom: panel.bottom } : null,
      active: active ? { top: active.top, bottom: active.bottom } : null,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
  results.push({ name, path, width, height, ...metrics });
  await context.close();
}

try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await capture("/", width, width <= 390 ? 844 : width <= 768 ? 900 : 1000, `home-${width}`);
  }
  await capture("/services", 1440, 1000, "services-1440");
  await capture("/work", 1440, 1000, "work-1440");
  await capture("/products", 1440, 1000, "products-1440");
  await capture("/audit", 1440, 1000, "audit-1440");
  await capture("/intake", 1440, 1000, "intake-1440");
  await capture("/services", 1440, 1000, "panel-menu-1440", { openPanel: true });
  await capture("/services", 1440, 1000, "services-comparison-1440", { openPanel: true, compare: true });
  await capture("/services", 390, 844, "mobile-comparison-390", { openPanel: true, compare: true });
  await capture("/", 1440, 1000, "anchored-reaction-1440", { pointerInfluence: true });
  await capture("/services", 1440, 1000, "site-help-1440", { openPanel: true, siteHelp: true });
  await capture("/services", 1024, 900, "panel-question-1024", { openPanel: true, startFlow: true });
  await capture("/", 390, 844, "mobile-focused-question-390", { openPanel: true, startFlow: true, focusInput: true });
  await capture("/", 390, 844, "reduced-motion-390", { reducedMotion: true });
  await writeFile(`${output}/metrics.json`, `${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}

const overflow = results.filter((result) => result.scrollWidth > result.clientWidth);
console.log(JSON.stringify({ captures: results.length, overflow: overflow.map((result) => result.name) }, null, 2));
if (overflow.length) process.exitCode = 1;
