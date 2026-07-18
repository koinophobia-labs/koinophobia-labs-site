import { chromium } from "playwright";
import axe from "axe-core";
import { mkdir } from "node:fs/promises";

const base = process.env.CONCIERGE_QA_URL || "http://localhost:3100";
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const checks = [];
const failures = [];
await mkdir("qa-screenshots", { recursive: true });

function check(condition, label, detail = "") {
  checks.push(label);
  if (!condition) failures.push(`${label}${detail ? `: ${detail}` : ""}`);
}

async function pageAt(path = "/concierge?entry=direct", viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  return { context, page };
}

async function advance(page) {
  await page.locator(".concierge-form-actions").getByRole("button", { name: /continue|get my recommendation/i }).click();
}

async function complete(page, fixture) {
  const start = page.getByRole("button", { name: /help me figure it out/i });
  await start.focus();
  await page.keyboard.press("Enter");
  const question = page.locator(".concierge-question");
  await question.getByRole("button", { name: fixture.choice }).click();
  await question.getByLabel("What are you seeing?").fill(fixture.primary);
  await advance(page);
  await question.getByLabel("Current situation").fill(fixture.context);
  await question.locator("input").first().fill(fixture.tools || "Gmail, Google Sheets");
  await advance(page);
  await question.getByLabel("Operational or financial impact").fill(fixture.impact || "The owner loses several hours each week and qualified inquiries are delayed.");
  await advance(page);
  await question.getByLabel("Desired outcome").fill(fixture.outcome || "Create a reliable path that makes the next action clear and measurable.");
  await advance(page);
  await question.getByLabel("Business or organization name").fill(fixture.business || "Concierge QA Co");
  await question.getByLabel("Industry or business type").fill(fixture.industry || "Professional services");
  await question.getByLabel("Website URL (optional)").fill("https://example.com");
  await advance(page);
  await question.getByLabel("Approximate budget").selectOption(fixture.budget || "$1,500-$3,500");
  await question.getByLabel("Desired timing").selectOption(fixture.timeline || "1-2 months");
  await advance(page);
  await question.getByLabel("Name").fill("Quinn Tester");
  await question.getByLabel("Email").fill("quinn@example.com");
  await advance(page);
  await page.locator(".concierge-result").waitFor();
  return (await page.locator("#recommendation-title").textContent())?.trim() || "";
}

const website = {
  choice: /website is not converting/i,
  primary: "Our website is unclear on mobile and qualified visitors do not complete the inquiry form.",
  context: "The offer, trust, CTA, and booking path need a material rebuild rather than one isolated fix.",
  tools: "WordPress, Google Analytics",
};
const automation = {
  choice: /team repeats manual work/i,
  primary: "Staff manually copy every lead between email, a spreadsheet, the CRM, and the calendar.",
  context: "The same routing, scheduling, reminder, and reporting steps repeat for every inquiry.",
  tools: "Gmail, Google Sheets, HubSpot, Calendly",
};
const uncertain = {
  choice: /not sure yet/i,
  primary: "Qualified inquiries disappear somewhere between the website, first reply, and booking.",
  context: "We can see several symptoms across the customer journey, but we cannot isolate the root cause.",
  tools: "Squarespace, Gmail, Calendly",
  budget: "$500-$1,500",
};
const quickFix = {
  choice: /smaller technical problem/i,
  primary: "One responsive bug hides the contact button on iPhone.",
  context: "This is an isolated mobile CSS repair on one page with a clear pass or fail test.",
  tools: "Webflow",
  budget: "$500-$1,500",
  timeline: "This month",
};
const ambiguous = {
  choice: /website is not converting/i,
  primary: "The website needs improvement, but the actual request also includes a custom customer portal and dashboard platform.",
  context: "We need conversion pages and a custom app with authenticated workflows, so the service boundary conflicts.",
  tools: "WordPress, Airtable, custom database",
};

try {
  {
    const { context, page } = await pageAt("/concierge?entry=home");
    const result = await complete(page, website);
    check(result === "Website or Landing Page Rebuild", "website journey recommends rebuild", result);
    check(await page.getByText(/no AI provider was needed|deterministic rules fallback/i).isVisible(), "AI-disabled journey exposes deterministic fallback");
    let submitted = "";
    await page.route("**/api/intake", async (route) => { submitted = route.request().postData() || ""; await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, message: "Mocked persistence accepted." }) }); });
    await page.locator(".concierge-next").getByRole("link").click();
    await page.getByText("Concierge details loaded.").waitFor();
    check(await page.getByLabel("Business name").inputValue() === "Concierge QA Co", "website journey prefills intake");
    await page.screenshot({ path: "qa-screenshots/concierge-intake-prefill.png", fullPage: true });
    await page.getByRole("button", { name: "Submit intake" }).click();
    await page.getByText("Intake received.").waitFor();
    check(submitted.includes("conciergeSessionId") && submitted.includes("conciergeAnswers"), "mock persistence receives verifiable concierge envelope");
    await context.close();
  }
  {
    const { context, page } = await pageAt("/concierge?entry=services");
    check(await complete(page, automation) === "AI Workflow or Automation", "automation journey recommends workflow service");
    await context.close();
  }
  {
    const { context, page } = await pageAt();
    check(await complete(page, uncertain) === "Revenue Leak Audit", "uncertain journey recommends audit");
    const href = await page.locator(".concierge-next").getByRole("link").getAttribute("href");
    check(Boolean(href?.startsWith("/audit?concierge=") && href.endsWith("#project-intake")), "audit journey preserves existing audit intake handoff", href || "missing href");
    await context.close();
  }
  {
    const { context, page } = await pageAt();
    check(await complete(page, ambiguous) === "Human Scope Review", "ambiguous journey routes to human review");
    await context.close();
  }
  {
    const { context, page } = await pageAt();
    await page.getByRole("button", { name: /help me figure it out/i }).click();
    const question = page.locator(".concierge-question");
    await question.getByRole("button", { name: website.choice }).click();
    await question.getByLabel("What are you seeing?").fill(website.primary);
    await advance(page);
    await page.reload({ waitUntil: "networkidle" });
    check(await page.getByRole("heading", { name: /what happens on the website today/i }).isVisible(), "refresh recovers the active branch and step");
    await context.close();
  }
  {
    const { context, page } = await pageAt("/concierge?entry=direct", { width: 390, height: 844 });
    check(await complete(page, quickFix) === "Quick Fix Sprint", "mobile quick-fix journey completes");
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "mobile concierge has no horizontal overflow");
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    check(violations.violations.length === 0, "concierge result passes automated WCAG A/AA checks", violations.violations.map((item) => item.id).join(", "));
    await page.screenshot({ path: "qa-screenshots/concierge-mobile-result.png", fullPage: true });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: checks.length - failures.length, total: checks.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
