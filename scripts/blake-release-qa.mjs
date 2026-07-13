import { chromium } from "playwright";
import axe from "axe-core";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const widths = [320, 375, 390, 430, 768, 1440, 1920];
const browser = await chromium.launch();
const failures = [];
const checks = [];
const check = (condition, label, detail = "") => {
  checks.push(label);
  if (!condition) failures.push(`${label}${detail ? `: ${detail}` : ""}`);
};

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 900 : 1000 } });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `homepage no overflow ${width}px`);
    check(errors.length === 0, `homepage console clean ${width}px`, errors.join(" | "));
    await page.goto(`${base}/you-know-ball/play`, { waitUntil: "networkidle" });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `play route no overflow ${width}px`);
    if (width === 390 || width === 1440) {
      await page.getByRole("button", { name: /Peak wins/i }).click();
      await page.getByRole("button", { name: /Send the take/i }).click();
      check(await page.getByText("BanterBot counter", { exact: true }).isVisible(), `gameplay completes ${width}px`);
    }
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const videoRequests = [];
  page.on("request", (request) => { if (/trendi-demo.*\.mp4/.test(request.url())) videoRequests.push(request.url()); });
  await page.goto(base, { waitUntil: "networkidle" });
  check(videoRequests.length === 0, "Trendi video avoids initial transfer", videoRequests.join(", "));

  await page.addScriptTag({ content: axe.source });
  const axeResults = await page.evaluate(() => window.axe.run());
  check(axeResults.violations.length === 0, "homepage accessibility and contrast", axeResults.violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} — ${n.failureSummary}`).join(" | ")}`).join("; "));

  const hrefs = await page.locator("a[href]").evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("href")).filter(Boolean))]);
  for (const href of hrefs) {
    if (href.startsWith("/") && !href.includes("#")) {
      const response = await page.request.get(new URL(href, base).toString());
      check(response.status() < 400, `link ${href}`, String(response.status()));
    }
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  check(await page.evaluate(() => getComputedStyle(document.querySelector(".reveal")).transform === "none"), "reduced motion disables reveal transform");

  await page.locator("video").dispatchEvent("error");
  check(await page.getByText(/demo video is unavailable/i).isVisible(), "failed video shows screenshot fallback");
  await page.close();

  const privacyPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const requests = [];
  privacyPage.on("request", (request) => requests.push({ url: request.url(), postData: request.postData() || "" }));
  await privacyPage.goto(`${base}/you-know-ball/play`, { waitUntil: "networkidle" });
  const sentinel = "PRIVATE_TAKE_SENTINEL_7391 because peak playoff defense matters";
  await privacyPage.getByRole("button", { name: /Peak wins/i }).click();
  await privacyPage.getByLabel(/Your take/i).fill(sentinel);
  await privacyPage.getByRole("button", { name: /Send the take/i }).click();
  const privacy = await privacyPage.evaluate((secret) => ({
    url: location.href,
    cookies: document.cookie,
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
    dataLayer: JSON.stringify(window.dataLayer || []),
    htmlContains: document.documentElement.outerHTML.includes(secret),
  }), sentinel);
  check(!requests.some((request) => request.url.includes(sentinel) || request.postData.includes(sentinel)), "free text absent from network and URLs");
  check(!privacy.url.includes(sentinel), "free text absent from current URL");
  check(!privacy.cookies.includes(sentinel), "free text absent from cookies");
  check(!privacy.local.includes(sentinel), "free text absent from local storage");
  check(!privacy.session.includes(sentinel), "free text absent from session storage");
  check(!privacy.dataLayer.includes(sentinel), "analytics payload is event-name-only");
  check(!privacy.htmlContains, "free text removed from rendered DOM after scoring");
  await privacyPage.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: checks.length - failures.length, total: checks.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
