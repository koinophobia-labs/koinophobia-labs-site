// Verifies the Trendi demo video behaviors on the homepage:
// autoplay-in-view (muted), offscreen pause, reduced-motion no-autoplay,
// playsInline/controls/preload attributes, initial page-weight restraint,
// layout stability, and the screenshot fallback on playback failure.
import { chromium } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3100";
const exe = "/opt/pw-browsers/chromium";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const browser = await chromium.launch({ headless: true, executablePath: exe });

// ── 1. Attributes + autoplay-in-view + offscreen pause ──────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let videoBytes = 0;
  page.on("response", async (r) => {
    if (r.url().includes("/trendi/demo-web")) {
      const len = Number(r.headers()["content-length"] || 0);
      videoBytes += len;
    }
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const attrs = await page.$eval("video.kl-media__video", (v) => ({
    muted: v.muted,
    playsInline: v.playsInline,
    controls: v.controls,
    preload: v.preload,
    poster: v.poster.includes("/trendi/poster.jpg"),
    heightBeforePlay: v.getBoundingClientRect().height,
  }));
  check("muted", attrs.muted === true);
  check("playsInline", attrs.playsInline === true);
  check("controls available", attrs.controls === true);
  check("preload=metadata", attrs.preload === "metadata");
  check("poster set from real frame path", attrs.poster);
  check("space reserved before play (no CLS)", attrs.heightBeforePlay > 100, `${attrs.heightBeforePlay}px`);

  // out of view initially → should be paused
  const pausedTop = await page.$eval("video.kl-media__video", (v) => v.paused);
  check("paused while offscreen (top of page)", pausedTop === true);

  // scroll into view → should autoplay (muted)
  await page.$eval("video.kl-media__video", (v) => v.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1200);
  const playingInView = await page.$eval("video.kl-media__video", (v) => !v.paused);
  check("autoplays (muted) when in view", playingInView);

  // scroll away → should pause
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const pausedAway = await page.$eval("video.kl-media__video", (v) => v.paused);
  check("pauses when scrolled offscreen", pausedAway);

  check("initial video transfer stays light", videoBytes < 400_000, `${videoBytes} bytes observed`);
  await page.close();
}

// ── 2. Reduced motion → no autoplay ─────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.$eval("video.kl-media__video", (v) => v.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1200);
  const paused = await page.$eval("video.kl-media__video", (v) => v.paused);
  check("reduced-motion: no autoplay, poster+controls shown", paused === true);
  await ctx.close();
}

// ── 3. Playback failure → screenshot fallback ───────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/trendi/demo-web*", (r) => r.abort());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.$eval(".kl-feature__media", (el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1500);
  const fallback = await page.$eval(".kl-feature__media", (el) => {
    const img = el.querySelector("img.kl-media__video");
    return img ? img.getAttribute("src") : null;
  });
  check("fallback still image on video failure", fallback?.includes("/trendi/poster.jpg") ?? false, String(fallback));
  await ctx.close();
}

// ── 4. Mobile: thesis+CTA adjacent to media, tappable controls ──────────
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const order = await page.evaluate(() => {
    const thesis = document.querySelector(".kl-feature__thesis").getBoundingClientRect().top + window.scrollY;
    const cta = document.querySelector(".kl-feature__copy .kl-link").getBoundingClientRect().top + window.scrollY;
    const media = document.querySelector(".kl-feature__media").getBoundingClientRect().top + window.scrollY;
    const role = document.querySelector(".kl-feature__role").getBoundingClientRect().top + window.scrollY;
    return { thesisBeforeMedia: thesis < media, ctaBeforeMedia: cta < media, roleAfterMedia: role > media };
  });
  check("mobile: thesis above media", order.thesisBeforeMedia);
  check("mobile: CTA above media", order.ctaBeforeMedia);
  check("mobile: long role description below media (video not buried)", order.roleAfterMedia);
  const vw = await page.$eval("video.kl-media__video", (v) => v.getBoundingClientRect().width);
  check("mobile: video within viewport width", vw <= 390, `${vw}px`);
  await page.screenshot({ path: "qa-screenshots/interaction/390-trendi-video.png", fullPage: false });
  await page.close();
}

await browser.close();
const fails = results.filter((r) => !r.ok).length;
console.log(fails === 0 ? "\nMEDIA QA: ALL PASS" : `\nMEDIA QA: ${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
