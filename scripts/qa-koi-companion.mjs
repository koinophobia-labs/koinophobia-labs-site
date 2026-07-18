import { chromium, webkit } from "playwright";
import axe from "axe-core";
import { mkdir } from "node:fs/promises";

const base = process.env.KOI_QA_URL || "http://127.0.0.1:3000";
const checks = [];
const failures = [];
await mkdir("qa-screenshots/koi", { recursive: true });

function check(condition, label, detail = "") {
  checks.push(label);
  if (!condition) failures.push(`${label}${detail ? `: ${detail}` : ""}`);
}

async function pageAt(browser, path = "/", options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  return { context, page };
}

async function openPanel(page) {
  const trigger = page.getByTestId("koi-companion-trigger");
  for (let index = 0; index < 8 && !(await trigger.isVisible().catch(() => false)); index += 1) {
    await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: "instant" }), (index + 1) * 320);
    await page.waitForTimeout(120);
  }
  await trigger.waitFor({ state: "visible" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "Find the smallest sensible next step." });
  await panel.waitFor();
  return panel;
}

async function startFlow(page, panel) {
  const primary = panel.getByRole("button", { name: /Help me figure out what I need|Continue my concierge session/i });
  await primary.click();
  const start = panel.getByRole("button", { name: /Help me figure it out/i });
  await start.waitFor();
  await start.click();
  await panel.locator(".concierge-question").waitFor();
}

async function advance(panel) {
  await panel.locator(".concierge-form-actions").getByRole("button", { name: /Continue|Get my recommendation/i }).click();
}

async function completeWebsiteFlow(page, panel) {
  await startFlow(page, panel);
  const question = panel.locator(".concierge-question");
  await question.getByRole("button", { name: /website is not converting/i }).click();
  await question.getByLabel("What are you seeing?").fill("Our mobile service page is unclear and qualified visitors do not complete the consultation form.");
  await advance(panel);
  await question.getByLabel("Current situation").fill("The offer, trust signals, mobile CTA, and inquiry handoff need a material rebuild.");
  await question.locator("input").first().fill("Next.js, Vercel, Resend");
  await advance(panel);
  await question.getByLabel("Operational or financial impact").fill("Qualified inquiries leave and the owner spends five hours each week manually qualifying poor-fit leads.");
  await advance(panel);
  await question.getByLabel("Desired outcome").fill("Qualified visitors should understand the offer and complete a clear consultation handoff.");
  await advance(panel);
  await question.getByLabel("Business or organization name").fill("Living Koi QA Co");
  await question.getByLabel("Industry or business type").fill("Professional services");
  await question.getByLabel("Website URL (optional)").fill("https://example.com");
  await advance(panel);
  await question.getByLabel("Approximate budget").selectOption("$3,500+");
  await question.getByLabel("Desired timing").selectOption("1-2 months");
  await advance(panel);
  await question.getByLabel("Name").fill("Koi QA");
  await question.getByLabel("Email").fill("koi-qa@example.com");
  await advance(panel);
  await panel.locator(".concierge-result").waitFor();
}

const chromiumBrowser = await chromium.launch();
try {
  {
    const { context, page } = await pageAt(chromiumBrowser, "/", { viewport: { width: 1440, height: 1000 } });
    const trigger = page.getByTestId("koi-companion-trigger");
    await trigger.waitFor();
    check(await trigger.getAttribute("aria-label") === "Open Koinophobia Labs site guide", "homepage renders semantic active site guide");
    const initialKoiBox = await trigger.boundingBox();
    await page.mouse.move(420, 420);
    await page.waitForTimeout(850);
    const followedKoiBox = await trigger.boundingBox();
    check(Boolean(initialKoiBox && followedKoiBox && Math.abs(followedKoiBox.x - initialKoiBox.x) > 500 && followedKoiBox.x < 600), "desktop koi freely follows the pointer across the viewport", JSON.stringify({ initialKoiBox, followedKoiBox }));
    const collision = await page.evaluate(() => {
      const triggerRect = document.querySelector("[data-testid='koi-companion-trigger']")?.getBoundingClientRect();
      const navRect = document.querySelector(".studio-nav")?.getBoundingClientRect();
      const ctaRect = document.querySelector(".studio-hero__actions")?.getBoundingClientRect();
      if (!triggerRect) return "missing";
      const overlaps = (a, b) => Boolean(b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
      return overlaps(triggerRect, navRect) || overlaps(triggerRect, ctaRect) ? "collision" : "clear";
    });
    check(collision === "clear", "resting koi avoids primary navigation and hero CTAs", collision);
    await page.waitForTimeout(6_300);
    const invitation = page.getByRole("status").filter({ hasText: "Not sure where to start?" });
    check(await invitation.isVisible(), "homepage invitation waits and appears contextually");
    await page.screenshot({ path: "qa-screenshots/koi/home-invitation-1440.png", fullPage: false });
    await invitation.getByRole("button", { name: "Dismiss koi invitation" }).click();
    check(await trigger.evaluate((element) => element === document.activeElement), "invitation dismissal returns focus to koi");
    await page.goto(`${base}/services`, { waitUntil: "networkidle" });
    await page.waitForTimeout(750);
    check(await page.getByText("I can help match the problem to a service.", { exact: true }).count() === 0, "dismissal prevents repeated invitations across navigation");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/services");
    const panel = await openPanel(page);
    check(await panel.getByText("I can help match the problem to a service.", { exact: true }).isVisible(), "services panel uses deterministic page context");
    await panel.getByRole("button", { name: "Ask a question about the site" }).click();
    await panel.getByRole("button", { name: "How much does a project cost?" }).click();
    check(await panel.getByText(/Published starting points range from a focused \$250 Revenue Leak Audit/).isVisible(), "site guide answers a basic pricing question from published information");
    check(await panel.getByRole("link", { name: "See prices and engagement options" }).isVisible(), "site answer provides a relevant source route");
    await panel.getByRole("button", { name: "Back to options" }).click();
    await page.keyboard.press("Escape");
    const trigger = page.getByTestId("koi-companion-trigger");
    check(await trigger.evaluate((element) => element === document.activeElement), "Escape minimizes panel and restores trigger focus");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/");
    let panel = await openPanel(page);
    await startFlow(page, panel);
    const question = panel.locator(".concierge-question");
    await question.getByRole("button", { name: /website is not converting/i }).click();
    const primary = "Our website loses qualified mobile visitors before they complete the inquiry path.";
    await question.getByLabel("What are you seeing?").fill(primary);
    await advance(panel);
    await panel.getByRole("button", { name: "Minimize project concierge" }).click();
    await page.goto(`${base}/work`, { waitUntil: "networkidle" });
    panel = await openPanel(page);
    check(await panel.getByRole("button", { name: /Continue my concierge session/i }).isVisible(), "work page recognizes the saved companion session");
    await panel.getByRole("button", { name: /Continue my concierge session/i }).click();
    await panel.getByRole("heading", { name: "What happens on the website today?" }).waitFor();
    check(true, "minimize and navigation resume at the same step");
    await panel.getByRole("link", { name: /Continue on the full page/i }).click();
    await page.waitForURL(/\/concierge\?entry=koi/);
    await page.getByRole("heading", { name: "What happens on the website today?" }).waitFor();
    check(true, "dedicated concierge page continues the companion session");
    check(await page.locator("[data-testid='koi-companion-trigger']").count() === 0, "dedicated concierge suppresses duplicate companion UI");
    await page.goto(`${base}/work`, { waitUntil: "networkidle" });
    panel = await openPanel(page);
    await panel.getByRole("button", { name: /Continue my concierge session/i }).click();
    await panel.getByRole("heading", { name: "What happens on the website today?" }).waitFor();
    check(true, "dedicated page draft resumes back through the koi");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/products");
    const panel = await openPanel(page);
    await panel.getByRole("link", { name: "Start a project" }).click();
    await page.waitForURL(/\/intake/);
    check(await page.getByRole("heading", { name: "Know the direction already?" }).isVisible(), "companion standard project action reaches editable intake");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/", { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.waitForTimeout(220);
    const mobileDock = await page.evaluate(() => {
      const trigger = document.querySelector("[data-testid='koi-companion-trigger']");
      const cta = document.querySelector(".studio-hero__actions");
      if (!trigger || !cta) return { safe: false, detail: "missing trigger or CTA" };
      const a = trigger.getBoundingClientRect();
      const b = cta.getBoundingClientRect();
      const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const hidden = getComputedStyle(trigger).visibility === "hidden";
      return { safe: !overlaps || hidden, detail: JSON.stringify({ overlaps, hidden }) };
    });
    check(mobileDock.safe, "mobile collision guard never covers the hero CTA", mobileDock.detail);
    const panel = await openPanel(page);
    await completeWebsiteFlow(page, panel);
    check(await panel.getByRole("heading", { name: "Website or Landing Page Rebuild" }).isVisible(), "mobile AI-unavailable koi journey completes deterministically");
    check(await panel.getByText(/no AI provider was needed|deterministic rules fallback/i).isVisible(), "koi journey retains AI-unavailable fallback disclosure");
    const mobile = await page.evaluate(() => {
      const panel = document.querySelector(".koi-companion-panel");
      const koi = document.querySelector(".koi-companion-trigger__koi");
      const active = document.activeElement?.getBoundingClientRect();
      const style = koi ? getComputedStyle(koi) : null;
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        panelHeight: panel?.getBoundingClientRect().height || 0,
        viewportHeight: window.innerHeight,
        animationIterations: style?.animationIterationCount || "",
        activeVisible: !active || (active.top >= 0 && active.bottom <= window.innerHeight),
      };
    });
    check(!mobile.overflow, "390px companion has no horizontal overflow");
    check(mobile.panelHeight <= mobile.viewportHeight, "mobile sheet respects viewport and safe-area boundary", JSON.stringify(mobile));
    check(mobile.animationIterations === "1", "reduced motion disables repeated koi swimming", mobile.animationIterations);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    check(violations.violations.length === 0, "open mobile companion passes automated WCAG A/AA", violations.violations.map((item) => item.id).join(", "));
    await page.screenshot({ path: "qa-screenshots/koi/mobile-result-390.png", fullPage: false });
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/", { reducedMotion: "reduce" });
    const panel = await openPanel(page);
    check(await panel.isVisible(), "reduced-motion koi remains fully operable");
    await page.keyboard.press("Escape");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/");
    for (const route of ["/crm", "/crm/login", "/crm/leads/example", "/payment/success", "/concierge", "/trendi", "/you-know-ball/play"]) {
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
      check(await page.locator("[data-testid='koi-companion-trigger']").count() === 0, `companion suppressed on ${route}`);
    }
    await context.close();
  }
} finally {
  await chromiumBrowser.close();
}

const webkitBrowser = await webkit.launch();
try {
  const { context, page } = await pageAt(webkitBrowser, "/services", { viewport: { width: 1024, height: 900 } });
  const panel = await openPanel(page);
  check(await panel.isVisible(), "WebKit opens the contextual companion panel");
  await page.keyboard.press("Escape");
  check(await page.getByTestId("koi-companion-trigger").evaluate((element) => element === document.activeElement), "WebKit restores focus after Escape");
  await page.goto(`${base}/crm`, { waitUntil: "domcontentloaded" });
  check(await page.locator("[data-testid='koi-companion-trigger']").count() === 0, "WebKit suppresses companion on CRM");
  await context.close();
} finally {
  await webkitBrowser.close();
}

console.log(JSON.stringify({ passed: checks.length - failures.length, total: checks.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
