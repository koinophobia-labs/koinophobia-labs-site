/**
 * Phase-9 QA for the one-studio rebuild. Runs against a production server:
 *
 *   npm run build && npx next start -p 3011 &
 *   QA_BASE=http://127.0.0.1:3011 npm run qa:rebuild
 *
 * Three passes, one report (artifacts/qa-rebuild/report.json):
 *  1. Six widths × eleven routes: console errors, failed requests, horizontal
 *     overflow, a visible h1, a reachable "Start a project" link. Screenshots
 *     at 390 and 1440 for every route.
 *  2. Reduced motion at 1440 and 390: the koi world reports still mode and
 *     every surfacing element is fully visible without JavaScript help.
 *  3. Performance budgets from the rebuild document, section 13, measured in
 *     the browser (LCP, CLS, long tasks) on a throttled connection, plus
 *     transfer totals from the CDP network log. Not Lighthouse; the same
 *     numbers Lighthouse reads, measured here so CI needs no extra dependency.
 *
 * Note: Playwright's headless shell has no H.264 decoder, so the koi clips
 * fall back to posters here. Video bytes are therefore measured separately by
 * fetching the first clip the engine would request.
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://127.0.0.1:3011";
const OUT = path.resolve(process.env.QA_OUT ?? "artifacts/qa-rebuild");
await fs.mkdir(OUT, { recursive: true });

const WIDTHS = [
  [390, 844],
  [430, 932],
  [768, 1024],
  [1280, 800],
  [1440, 900],
  [2560, 1440],
];
const ROUTES = ["/", "/shipped", "/trendi", "/forget-about-it", "/way-in", "/lab", "/lab/koi", "/blake", "/work-with-me", "/start", "/log"];
const BUDGET = {
  mobileLcpMs: 2000,
  cls: 0.01,
  tbtMs: 150,
  mobileHomeBytes: 1_800_000,
  desktopInitialBytes: 3_500_000,
  desktopJourneyBytes: 12_000_000,
  productBytes: 3_500_000,
};

const report = { base: BASE, at: new Date().toISOString(), layout: [], reducedMotion: [], perf: [], failures: [] };
const fail = (scope, message) => {
  report.failures.push({ scope, message });
  console.log(`  ✖ ${scope}: ${message}`);
};

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

/* ---------- 1. layout at six widths ---------- */
for (const [width, height] of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    const failed = [];
    // Vercel Analytics only exists on Vercel; locally its script 404s. Not a defect.
    const ignorable = (text) => /_vercel\/insights/.test(text);
    page.on("console", (m) => m.type() === "error" && !ignorable(m.text()) && !ignorable(m.location()?.url ?? "") && errors.push(`${m.text().slice(0, 160)} (${m.location()?.url ?? ""})`));
    page.on("response", (r) => r.status() >= 400 && !ignorable(r.url()) && !/\.mp4(\?|$)/.test(r.url()) && failed.push(`${r.url()} ${r.status()}`));
    page.on("requestfailed", (r) => !/\.mp4(\?|$)/.test(r.url()) && !ignorable(r.url()) && failed.push(`${r.url()} ${r.failure()?.errorText ?? ""}`));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(1200);
    const facts = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const rect = h1?.getBoundingClientRect();
      const start = [...document.querySelectorAll('a[href="/start"], a[href="#start"]')];
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: h1?.textContent?.trim().slice(0, 60) ?? null,
        h1Visible: Boolean(rect && rect.width > 0 && rect.height > 0 && getComputedStyle(h1).opacity !== "0"),
        startLinks: start.length,
        title: document.title,
      };
    });
    const label = `${route} @${width}`;
    const row = { route, width, ...facts, errors, failed };
    report.layout.push(row);
    if (facts.overflow > 1) fail(label, `horizontal overflow ${facts.overflow}px`);
    if (!facts.h1Visible) fail(label, "no visible h1");
    if (facts.startLinks < 1) fail(label, "no Start a project link");
    if (errors.length) fail(label, `console errors: ${errors[0]}`);
    if (failed.length) fail(label, `failed requests: ${failed[0]}`);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: path.join(OUT, `${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-${width}.png`), fullPage: false });
    }
    await page.close();
  }
  await context.close();
  console.log(`layout ${width}px: done`);
}

/* ---------- 2. reduced motion ---------- */
for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const facts = await page.evaluate(() => {
    const world = document.querySelector(".koi-world");
    const shell = document.querySelector("[data-motion-shell]");
    const hidden = [...document.querySelectorAll(".s")].filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length;
    const words = [...document.querySelectorAll(".kw-word")].filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length;
    return { worldMotion: world?.getAttribute("data-motion"), shellMotion: shell?.getAttribute("data-motion"), hiddenSurfacing: hidden, hiddenWords: words, videos: document.querySelectorAll("video").length };
  });
  report.reducedMotion.push({ width, ...facts });
  if (facts.worldMotion !== "still") fail(`reduced-motion @${width}`, `koi world mode is ${facts.worldMotion}, expected still`);
  if (facts.hiddenSurfacing > 0) fail(`reduced-motion @${width}`, `${facts.hiddenSurfacing} surfacing elements are not visible`);
  await page.screenshot({ path: path.join(OUT, `home-reduced-motion-${width}.png`) });
  await context.close();
  console.log(`reduced motion ${width}px: done`);
}

/* ---------- 3. performance budgets ---------- */
async function measure({ width, height, route, throttle, scrollThrough }) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 768 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, longTasks: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__vitals.lcp = Math.max(window.__vitals.lcp, entry.renderTime || entry.loadTime || entry.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__vitals.longTasks += Math.max(0, entry.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  if (throttle) {
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  let bytes = 0;
  const byType = {};
  const types = new Map();
  cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
  cdp.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
    const t = types.get(e.requestId) ?? "other";
    byType[t] = (byType[t] ?? 0) + e.encodedDataLength;
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 90_000 });
  await page.waitForTimeout(2500);
  if (scrollThrough) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += height * 0.8) {
      await page.evaluate((py) => window.scrollTo(0, py), y);
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1500);
  }
  const vitals = await page.evaluate(() => window.__vitals);
  await context.close();
  return { route, width, throttle, scrollThrough, lcpMs: Math.round(vitals.lcp), cls: Number(vitals.cls.toFixed(4)), tbtMs: Math.round(vitals.longTasks), bytes, byType };
}

const firstClip = await fetch(`${BASE}/koi/koi-surface-854.mp4`).then((r) => r.arrayBuffer());
const mobileVideoBytes = firstClip.byteLength;

const mobileHome = await measure({ width: 390, height: 844, route: "/", throttle: true });
mobileHome.bytesWithFirstClip = mobileHome.bytes + mobileVideoBytes;
report.perf.push(mobileHome);
if (mobileHome.lcpMs > BUDGET.mobileLcpMs) fail("perf mobile /", `LCP ${mobileHome.lcpMs}ms > ${BUDGET.mobileLcpMs}ms`);
if (mobileHome.cls > BUDGET.cls) fail("perf mobile /", `CLS ${mobileHome.cls} > ${BUDGET.cls}`);
if (mobileHome.tbtMs > BUDGET.tbtMs) fail("perf mobile /", `TBT ${mobileHome.tbtMs}ms > ${BUDGET.tbtMs}ms`);
if (mobileHome.bytesWithFirstClip > BUDGET.mobileHomeBytes) fail("perf mobile /", `transfer ${mobileHome.bytesWithFirstClip} B (incl. first clip) > ${BUDGET.mobileHomeBytes} B`);

const desktopInitial = await measure({ width: 1440, height: 900, route: "/", throttle: false });
report.perf.push(desktopInitial);
if (desktopInitial.cls > BUDGET.cls) fail("perf desktop /", `CLS ${desktopInitial.cls} > ${BUDGET.cls}`);
if (desktopInitial.bytes > BUDGET.desktopInitialBytes) fail("perf desktop /", `initial transfer ${desktopInitial.bytes} B > ${BUDGET.desktopInitialBytes} B`);
const desktopJourney = await measure({ width: 1440, height: 900, route: "/", throttle: false, scrollThrough: true });
report.perf.push(desktopJourney);
if (desktopJourney.bytes > BUDGET.desktopJourneyBytes) fail("perf desktop / journey", `full journey ${desktopJourney.bytes} B > ${BUDGET.desktopJourneyBytes} B`);

for (const route of ["/trendi", "/forget-about-it", "/way-in"]) {
  // No scroll: LCP keeps updating without user input, so a scrolled run
  // reports the last big screenshot instead of the hero.
  const product = await measure({ width: 390, height: 844, route, throttle: true });
  report.perf.push(product);
  if (product.cls > BUDGET.cls) fail(`perf ${route}`, `CLS ${product.cls} > ${BUDGET.cls}`);
  if (product.bytes > BUDGET.productBytes) fail(`perf ${route}`, `transfer ${product.bytes} B > ${BUDGET.productBytes} B`);
}

await browser.close();
await fs.writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

console.log("\nPerformance");
for (const p of report.perf) {
  console.log(`  ${p.route} @${p.width}${p.throttle ? " (4G, 4× CPU)" : ""}${p.scrollThrough ? " full journey" : ""}: LCP ${p.lcpMs}ms · CLS ${p.cls} · TBT ${p.tbtMs}ms · ${(p.bytes / 1024).toFixed(0)} KB${p.bytesWithFirstClip ? ` · ${(p.bytesWithFirstClip / 1024).toFixed(0)} KB with first clip` : ""}`);
}
console.log(`\n${report.failures.length === 0 ? "✔ all budgets and layout checks passed" : `✖ ${report.failures.length} failure(s)`} — report at ${path.relative(process.cwd(), OUT)}/report.json`);
process.exit(report.failures.length ? 1 : 0);
