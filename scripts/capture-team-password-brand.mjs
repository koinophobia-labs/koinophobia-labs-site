import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, mkdirSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import { chromium } from "playwright";
import { digest, hashPassword } from "../lib/team/auth.ts";

async function freePort() {
  const server = createServer();
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  await new Promise(r => server.close(r));
  return port;
}
const evidence = resolve(process.env.TEAM_PASSWORD_EVIDENCE || "reports/WO-0264/browser");
mkdirSync(evidence, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "wo0264-browser-pg-")), pgPort = await freePort(), port = await freePort();
const base = `http://127.0.0.1:${port}`;
execFileSync("initdb", ["-D", dir, "-A", "trust", "--no-locale", "-E", "UTF8"], { stdio: "ignore" });
execFileSync("pg_ctl", ["-D", dir, "-l", join(dir, "server.log"), "-o", `-F -p ${pgPort} -h 127.0.0.1 -k ${dir}`, "-w", "start"], { stdio: "ignore" });
const db = new Pool({ host: "127.0.0.1", port: pgPort, database: "postgres" });
let app, browser, passed = 0;
async function capture(page, name) {
 for (const width of [390,1440]) {
  await page.setViewportSize({width,height:width===390?844:900});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0)});
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(evidence,`${name}-${width}.png`),fullPage:true,animations:'disabled'});
 }
}
const check = async (name, fn) => { await fn(); passed++; console.log("PASS " + name); };
const password = "fictional browser password";
try {
  for (const file of ["001_crm_leads.sql", "002_crm_proposals.sql", "006_stripe_payments.sql", "010_team_portal.sql", "012_team_password.sql"])
    await db.query(readFileSync("db/" + file, "utf8"));
  for (const id of ["setup", "skip", "existing", "inactive", "no-password"])
    await db.query("insert into team_partners(id,name,email,role,active,password_hash) values($1,'Fictional tester',$2,'partner',$3,$4)",
      [id, id + "@example.test", id !== "inactive", ["existing", "inactive"].includes(id) ? await hashPassword(password) : null]);
  const output = openSync(join(evidence, "server.log"), "a");
  app = spawn(process.execPath, ["--import", resolve("tests/fixtures/team-no-network.mjs"), "node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    env: { PATH: process.env.PATH, TMPDIR: tmpdir(), NODE_ENV: "production", VERCEL_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
      DATABASE_URL: `postgresql://${process.env.USER}@127.0.0.1:${pgPort}/postgres`, RESEND_API_KEY: "fictional-no-network", CONTACT_FROM_EMAIL: "fictional@example.test" },
    stdio: ["ignore", output, output],
  });
  for (let i = 0; i < 100; i++) {
    if (await fetch(base + "/team").then(r => r.ok).catch(() => false)) break;
    if (i === 99) throw Error("Local server did not start");
    await new Promise(r => setTimeout(r, 200));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage(), errors = [];
  page.on("pageerror", e => errors.push(e.message));
  const post = async (action, data, origin = base) => {
    const r = await page.request.post(base + "/team/api/" + action, { headers: { origin }, data });
    return { status: r.status(), body: await r.json() };
  };
  const clearLimits = () => db.query("update team_rate_limits set reset_at=now()-interval '1 second'");
  async function link(id) {
    await clearLimits();
    const token = crypto.randomUUID();
    await db.query("insert into team_login_tokens values($1,$2,now()+interval '15 minutes')", [digest(token), id]);
    await page.goto(base + "/team?token=" + token);
    await page.getByRole("button", { name: "Confirm sign in" }).click();
  }
  async function save(value, current) {
    if (current) await page.getByLabel("Current password", { exact: true }).fill(current);
    await page.getByLabel("New password", { exact: true }).fill(value);
    await page.getByLabel("Confirm new password", { exact: true }).fill(value);
    await page.getByRole("button", { name: "Save password", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Password saved" }).waitFor();
  }
  await check("password field and both email alternatives visible on mobile and desktop", async () => {
    await page.goto(base + "/team");
    assert.equal(await page.getByLabel("Password", { exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Email me a login link", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Forgot password? Email me a link", exact: true }).count(), 1);
    await capture(page,"password-login");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(evidence, "login-mobile.png"), fullPage: true, animations: "disabled" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  await check("email alternative bypasses password validation and retains generic feedback", async () => {
    await page.getByLabel("Email", { exact: true }).fill("absent@example.test");
    await page.getByRole("button", { name: "Email me a login link", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "If your email" }).waitFor();
  });
  await check("signed-out mutations and cross-origin requests rejected", async () => {
    assert.equal((await post("password", { password })).status, 401);
    assert.equal((await post("login", {}, "https://evil.example")).status, 403);
  });
  await check("one-time prompt can be skipped across subsequent email-link logins", async () => {
    await link("skip");
    await page.waitForURL("**/team/account");
    await page.getByRole("heading", { name: "Set a password for next time" }).waitFor();
    await capture(page,"password-prompt");
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.waitForURL("**/team/leads");
    await link("skip");
    await page.waitForURL("**/team/leads");
    await post("logout", {});
  });
  await check("email first login, account setup and password change through real forms", async () => {
    await link("setup");
    await page.waitForURL("**/team/account");
    await capture(page,"password-setup");
    await save(password);
    await page.getByLabel("Current password", { exact: true }).waitFor();
    assert.equal((await post("password", { password: "fictional replacement", currentPassword: "wrong" })).status, 401);
    await save("fictional replacement", password);
    await capture(page,"password-change");
    await post("logout", {});
    await page.goto(base + "/team");
    await page.getByLabel("Email", { exact: true }).fill("setup@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fictional replacement");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/team/leads");
    const cookie = (await page.context().cookies()).find(c => c.name === "team-session");
    assert.ok(cookie.httpOnly && cookie.secure && cookie.sameSite === "Lax");
  });
  await check("email reset works while already signed in, then current password is required again", async () => {
    await link("setup");
    await page.waitForURL("**/team/account");
    assert.equal(await page.getByLabel("Current password", { exact: true }).count(), 0);
    await save(password);
    await page.getByLabel("Current password", { exact: true }).waitFor();
    await post("logout", {});
  });
  await check("login and magic responses do not enumerate unknown, inactive or passwordless accounts", async () => {
    await clearLimits();
    for (const email of ["absent@example.test", "inactive@example.test", "no-password@example.test", "existing@example.test"]) {
      assert.deepEqual(await post("login", { email, password: "incorrect password" }), { status: 401, body: { error: "Email or password is incorrect." } });
      assert.deepEqual(await post("magic", { email }), { status: 200, body: { message: "If your email has an active invitation, a login link is on its way." } });
    }
    assert.equal((await post("login", { email: "inactive@example.test", password })).status, 401);
  });
  await check("email limit shared by password and magic login (8 per 15 minutes)", async () => {
    await clearLimits();
    for (let i = 0; i < 8; i++) assert.notEqual((await post(i % 2 ? "magic" : "login", { email: "absent@example.test", password })).status, 429);
    assert.equal((await post("login", { email: "absent@example.test", password })).status, 429);
  });
  await check("IP limit rejects attempt 31 across different emails", async () => {
    await clearLimits();
    for (let i = 0; i < 30; i++) assert.equal((await post("magic", { email: `absent-${i}@example.test` })).status, 200);
    assert.equal((await post("login", { email: "existing@example.test", password })).status, 429);
  });
  assert.deepEqual(errors, []);
  console.log(`${passed} browser/HTTP acceptance checks passed; no outbound fetches or real accounts.`);
} finally {
  await browser?.close();
  if (app && app.exitCode === null) { app.kill("SIGTERM"); await new Promise(r => app.once("exit", r)); }
  await db.end();
  execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
  console.log("Retained fictional browser database: " + dir);
}
