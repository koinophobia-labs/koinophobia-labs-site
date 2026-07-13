import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3100";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium",
});

let total = 0;
for (const vp of [
  { name: "desktop 1440", w: 1440, mobile: false },
  { name: "mobile 390", w: 390, mobile: true },
]) {
  const page = await browser.newPage({
    viewport: { width: vp.w, height: 900 },
    isMobile: vp.mobile,
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    // WCAG 2.1 A/AA rule set
    return await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
  });
  const violations = results.violations;
  total += violations.length;
  console.log(`\n=== axe @ ${vp.name} — ${violations.length} violation(s) ===`);
  for (const v of violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
    v.nodes.slice(0, 3).forEach((n) => console.log(`      ${n.target.join(" ")}`));
  }
  if (!violations.length) console.log("  none");
  await page.close();
}
await browser.close();
console.log(total === 0 ? "\nAXE: no WCAG A/AA violations." : `\nAXE: ${total} total violation(s).`);
process.exit(total === 0 ? 0 : 1);
