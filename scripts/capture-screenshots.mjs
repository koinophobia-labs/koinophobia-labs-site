import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const outDir = "outreach-screenshots";

const pages = [
  { name: "homepage-concepts", path: "/#concepts" },
  { name: "tattoo-studio", path: "/demos/tattoo-studio" },
  { name: "fitness-coach", path: "/demos/fitness-coach" },
  { name: "coffee-shop", path: "/demos/coffee-shop" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const pageInfo of pages) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktop.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: "networkidle" });
  await desktop.screenshot({ path: `${outDir}/${pageInfo.name}-desktop.png`, fullPage: true });
  await desktop.close();

  const mobile = await browser.newPage({ isMobile: true, viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: `${outDir}/${pageInfo.name}-mobile.png`, fullPage: true });
  await mobile.close();
}

await browser.close();

console.log(`Saved screenshots to ${outDir}/`);
