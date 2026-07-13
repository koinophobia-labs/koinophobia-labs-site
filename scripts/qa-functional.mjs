import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3100";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium",
});
await mkdir("qa-screenshots/interaction", { recursive: true });

// 1) Desktop: audit all links + console errors
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
await page.goto(baseUrl, { waitUntil: "networkidle" });

const links = await page.$$eval("a", (as) =>
  as.map((a) => ({ text: a.textContent.trim().slice(0, 32), href: a.getAttribute("href") }))
);
console.log("=== LINKS ON HOMEPAGE ===");
const dead = [];
for (const l of links) {
  const bad = !l.href || l.href === "#";
  if (bad) dead.push(l);
  console.log(`  ${bad ? "DEAD" : "ok  "}  ${JSON.stringify(l.href)}  «${l.text}»`);
}
console.log(dead.length ? `\n!! ${dead.length} DEAD LINK(S)` : "\nNo dead (# / empty) links.");
console.log("Console errors:", consoleErrors.length ? consoleErrors : "none");

// 2) In-page anchors resolve to real sections
const anchorIds = ["services", "work", "about", "audit"];
const missing = [];
for (const id of anchorIds) {
  const exists = await page.$(`#${id}`);
  if (!exists) missing.push(id);
}
console.log("Anchor targets present:", missing.length ? `MISSING ${missing}` : anchorIds.join(", "));
await page.close();

// 3) Mobile drawer opens and closes
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto(baseUrl, { waitUntil: "networkidle" });
const linksHiddenBefore = await m.$eval(".kl-nav__mobile", (el) => getComputedStyle(el).display);
await m.click(".kl-nav__toggle");
await m.waitForTimeout(250);
const drawerAfter = await m.$eval(".kl-nav__mobile", (el) => getComputedStyle(el).display);
const expanded = await m.$eval(".kl-nav__toggle", (el) => el.getAttribute("aria-expanded"));
await m.screenshot({ path: "qa-screenshots/interaction/390-menu-open.png", fullPage: false });
console.log("\n=== MOBILE DRAWER ===");
console.log(`  closed display=${linksHiddenBefore}  open display=${drawerAfter}  aria-expanded=${expanded}`);
console.log(`  drawer opens: ${drawerAfter !== "none" ? "YES" : "NO"}`);
await m.close();

await browser.close();
process.exit(dead.length || missing.length || consoleErrors.length ? 1 : 0);
