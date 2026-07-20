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
  await page.addInitScript(() => {
    window.__koiAnalytics = [];
    window.addEventListener("koinophobia:analytics", (event) => window.__koiAnalytics.push(event.detail));
  });
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

async function completeWebsiteFlow(page, panel, { expectResult = true } = {}) {
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
  if (expectResult) await panel.locator(".concierge-result").waitFor();
}

const chromiumBrowser = await chromium.launch();
try {
  {
    const { context, page } = await pageAt(chromiumBrowser, "/", { viewport: { width: 1440, height: 1000 } });
    const trigger = page.getByTestId("koi-companion-trigger");
    await trigger.waitFor();
    check(await trigger.getAttribute("aria-label") === "Open Koinophobia Labs site guide", "homepage renders semantic active site guide");
    const initialKoiBox = await trigger.boundingBox();
    if (initialKoiBox) await page.mouse.move(initialKoiBox.x + 10, initialKoiBox.y + 10);
    await page.waitForTimeout(650);
    const influencedKoiBox = await trigger.boundingBox();
    const influencedDistance = initialKoiBox && influencedKoiBox ? Math.hypot(influencedKoiBox.x - initialKoiBox.x, influencedKoiBox.y - initialKoiBox.y) : Infinity;
    check(influencedDistance <= 42, "desktop koi reacts only inside its bounded anchor region", JSON.stringify({ initialKoiBox, influencedKoiBox, influencedDistance }));
    await page.mouse.move(120, 120);
    await page.waitForTimeout(1_100);
    const returnedKoiBox = await trigger.boundingBox();
    const returnedDistance = initialKoiBox && returnedKoiBox ? Math.hypot(returnedKoiBox.x - initialKoiBox.x, returnedKoiBox.y - initialKoiBox.y) : Infinity;
    check(returnedDistance <= 42, "desktop koi never chases a distant pointer", JSON.stringify({ initialKoiBox, returnedKoiBox, returnedDistance }));
    check(await trigger.locator("[data-companion-koi-art]").count() === 1, "trigger renders the official two-koi companion art");
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
    const invitationEvents = await page.evaluate(() => window.__koiAnalytics.filter((event) => event.event === "koi_companion_invitation_shown"));
    check(invitationEvents.some((event) => event.route_category === "home" && event.invitation_kind === "route"), "invitation analytics are categorical and route-aware", JSON.stringify(invitationEvents));
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
    check(await panel.getByText(/Published starting points: the Revenue Leak Audit is \$250/).isVisible(), "site guide answers a basic pricing question from published information");
    check(await panel.getByRole("link", { name: "See prices and engagement options" }).isVisible(), "site answer provides a relevant source route");
    await panel.getByRole("button", { name: "Back to options" }).click();
    await page.keyboard.press("Escape");
    const trigger = page.getByTestId("koi-companion-trigger");
    check(await trigger.evaluate((element) => element === document.activeElement), "Escape minimizes panel and restores trigger focus");
    await context.close();
  }

  {
    const { context, page } = await pageAt(chromiumBrowser, "/services");
    const invitation = page.getByRole("status").filter({ hasText: "I can help match the problem to a service." });
    await invitation.waitFor({ timeout: 7_000 });
    await invitation.getByRole("button", { name: /I can help match the problem to a service/i }).click();
    const panel = page.getByRole("dialog");
    await panel.getByRole("heading", { name: "Which of these fits better?" }).waitFor();
    check(await panel.getByRole("heading", { name: "Which of these fits better?" }).isVisible(), "services invitation opens the one relevant comparison action");
    await context.close();
  }

  {
    const context = await chromiumBrowser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__koiAnalytics = [];
      window.addEventListener("koinophobia:analytics", (event) => window.__koiAnalytics.push(event.detail));
      window.sessionStorage.setItem("koinophobia:koi-companion:v1", JSON.stringify({
        version: 1,
        hidden: false,
        minimized: true,
        invitationCount: 0,
        lastInvitationAt: 0,
        lastInvitationRoute: "",
        dismissedUntil: 0,
        visitedRoutes: ["services", "work"],
        engagedRoutes: ["services", "work"],
        planOfferShown: false,
      }));
    });
    await page.goto(`${base}/products`, { waitUntil: "networkidle" });
    const invitation = page.getByRole("status").filter({ hasText: "turn what you explored into a recommended project plan" });
    await invitation.waitFor({ timeout: 6_000 });
    await invitation.getByRole("button", { name: /turn what you explored into a recommended project plan/i }).click();
    const panel = page.getByRole("dialog");
    await panel.getByRole("heading", { name: "Get a practical starting recommendation." }).waitFor();
    check(await panel.getByRole("heading", { name: "Get a practical starting recommendation." }).isVisible(), "meaningful browsing opens directly into the existing concierge");
    const planEvents = await page.evaluate(() => window.__koiAnalytics.filter((event) => event.event === "koi_companion_plan_invitation_shown"));
    check(planEvents.length === 1 && planEvents[0].route_category === "products", "project-plan offer emits one categorical analytics event", JSON.stringify(planEvents));
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
    await panel.getByRole("button", { name: "Minimize site guide" }).click();
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
    const { context, page } = await pageAt(chromiumBrowser, "/services");
    await page.route("**/api/concierge/evaluate", (route) => route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, message: "Recommendation service temporarily unavailable." }),
    }));
    const panel = await openPanel(page);
    await completeWebsiteFlow(page, panel, { expectResult: false });
    await panel.getByRole("heading", { name: "The recommendation did not load." }).waitFor();
    check(await panel.getByRole("button", { name: "Retry recommendation" }).isVisible(), "backend outage exposes a safe retry");
    check(await panel.getByRole("link", { name: "Prefer the standard form?" }).isVisible(), "backend outage preserves the standard-intake escape path");
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
    await page.route("**/api/intake", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "Controlled QA lead accepted." }),
    }));
    await panel.getByRole("link", { name: /Continue with a prefilled intake/i }).click();
    await page.waitForURL(/\/intake\?concierge=/);
    await page.getByText("Concierge details loaded.", { exact: true }).waitFor();
    check(await page.getByLabel("Business name").inputValue() === "Living Koi QA Co", "intake handoff preserves qualified business details");
    check(await page.getByLabel("Email").inputValue() === "koi-qa@example.com", "intake handoff preserves qualified contact details");
    await page.getByRole("button", { name: "Submit intake" }).click();
    await page.getByText("Controlled QA lead accepted.", { exact: true }).waitFor();
    check(true, "mobile preview journey reaches a successful controlled lead submission");
    const completionEvents = await page.evaluate(() => window.__koiAnalytics.filter((event) => ["concierge_intake_prefilled", "concierge_intake_submitted", "intake_form_completion"].includes(event.event)));
    check(completionEvents.length === 3, "handoff and successful submission analytics fire exactly once", JSON.stringify(completionEvents));
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
