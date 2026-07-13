import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const label = process.env.SHOT_LABEL || "before";
const outDir = `qa-screenshots/${label}`;
const path = process.env.SHOT_PATH || "/";

const widths = [
  { name: "320", w: 320, mobile: true },
  { name: "375", w: 375, mobile: true },
  { name: "390", w: 390, mobile: true },
  { name: "430", w: 430, mobile: true },
  { name: "768-tablet", w: 768, mobile: false },
  { name: "1440-desktop", w: 1440, mobile: false },
  { name: "1920-wide", w: 1920, mobile: false },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
});

const overflow = [];
for (const vp of widths) {
  const page = await browser.newPage({
    viewport: { width: vp.w, height: 900 },
    isMobile: vp.mobile,
    deviceScaleFactor: 1,
  });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  // horizontal-overflow probe
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientW = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollW > clientW + 1) overflow.push(`${vp.name}: scrollWidth ${scrollW} > clientWidth ${clientW}`);
  await page.screenshot({ path: `${outDir}/${vp.name}.png`, fullPage: true });
  await page.close();
}
await browser.close();

if (overflow.length) {
  console.log("HORIZONTAL OVERFLOW DETECTED:");
  overflow.forEach((o) => console.log("  " + o));
} else {
  console.log("No horizontal overflow at any width.");
}
console.log(`Saved ${widths.length} screenshots to ${outDir}/`);
