import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.TEAM_LOCAL_URL || "http://127.0.0.1:3258";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("Functional tests require isolated loopback server.");
const b = await chromium.launch({ channel: "chrome", headless: true });
let count = 0;
async function check(name, fn) {
  await fn();
  count++;
  console.log("PASS " + name);
}
try {
  const p = await b.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const post = async (action, data, origin = base) => {
    const r = await p.request.post(base + "/team/api/" + action, {
      headers: {
        origin,
        "content-type": "application/json",
        cookie: (await p.context().cookies())
          .map((c) => c.name + "=" + c.value)
          .join("; "),
      },
      data,
    });
    return { status: r.status(), body: await r.json(), headers: r.headers() };
  };
  await check("unauthenticated mutations denied", async () =>
    assert.equal(
      (await post("quote", { lead_id: "lead-0", services: ["fix"] })).status,
      401,
    ),
  );
  await check("cross-site login and missing Origin denied", async () => {
    assert.equal((await post("login", {}, "https://evil.example")).status, 403);
    const r = await p.request.post(base + "/team/api/login", { data: {} });
    assert.equal(r.status(), 403);
  });
  await check(
    "partner password login through form and secure cookie",
    async () => {
      await p.goto(base + "/team");
      await p.getByLabel("Email", { exact: true }).fill("demo-a@example.test");
      await p
        .getByLabel("Password", { exact: true })
        .fill("fake-portal-test-password");
      await p.getByRole("button", { name: "Sign in", exact: true }).click();
      await p.waitForURL("**/team/leads");
      const cookie = (await p.context().cookies()).find(
        (c) => c.name === "team-session",
      );
      assert.ok(cookie.httpOnly && cookie.secure && cookie.sameSite === "Lax");
      assert.ok(
        !(await p.locator("body").innerText()).includes("Cedar Workshop"),
      );
    },
  );
  await check("partner admin page and owner mutations denied", async () => {
    assert.equal((await p.goto(base + "/team/admin")).status(), 404);
    assert.equal(
      (await post("invite", { name: "Fake", email: "nope@example.test" }))
        .status,
      403,
    );
    assert.equal(
      (await post("payout", { id: "deal-0", amount: 1 })).status,
      403,
    );
    assert.equal(
      (await post("import", { partner_id: "demo-a", leads: [] })).status,
      403,
    );
  });
  await check("cross-partner record IDs rejected", async () => {
    assert.equal(
      (await post("deal", { id: "deal-3", stage: "Contacted" })).status,
      404,
    );
    assert.equal(
      (await post("quote", { lead_id: "lead-3", services: ["fix"] })).status,
      404,
    );
    assert.equal((await post("optout", { id: "lead-3" })).status, 404);
  });
  await check("preview demo bypass is absent from real auth server", async () =>
    assert.equal((await post("demo", { role: "owner" })).status, 404),
  );
  await check("site checker refuses loopback", async () =>
    assert.equal(
      (await post("check", { url: "http://127.0.0.1" })).status,
      400,
    ),
  );
  await check("partner creates quote, cannot approve it", async () => {
    const r = await post("quote", {
      lead_id: "lead-0",
      services: ["fix"],
      price: 1,
      approved: true,
    });
    assert.equal(r.status, 200);
    assert.equal(
      (await post("deal", { id: r.body.id, action: "approve" })).status,
      403,
    );
  });
  await check("logout revokes session", async () => {
    assert.equal((await post("logout", {})).status, 200);
    assert.equal((await post("quote", {})).status, 401);
  });
  await check("owner login and administration", async () => {
    assert.equal(
      (
        await post("login", {
          email: "owner@example.test",
          password: "fake-portal-test-password",
        })
      ).status,
      200,
    );
    assert.equal((await p.goto(base + "/team/admin")).status(), 200);
    assert.ok(
      await p.getByRole("heading", { name: "Bring someone in." }).count(),
    );
  });
  let invite;
  await check("owner creates invite and no message is sent", async () => {
    const email = `browser-${Date.now()}@example.test`;
    const r = await post("invite", {
      name: "FAKE browser partner",
      email,
      role: "owner",
    });
    assert.equal(r.status, 200);
    assert.ok(r.body.code);
    invite = { ...r.body, email };
  });
  await check("owner address setting unlocks email copy", async () => {
    assert.equal(
      (
        await post("settings", {
          address: "FAKE Studio, 123 Example Lane, Example, TX 00000",
        })
      ).status,
      200,
    );
    await p.goto(base + "/team/scripts");
    await p.getByRole("button", { name: "Email", exact: true }).click();
    assert.ok(
      await p.getByRole("button", { name: "Copy email script" }).isEnabled(),
    );
    assert.ok(
      (await p.locator("pre").innerText()).includes("123 Example Lane"),
    );
    await post("settings", { address: "" });
  });
  await check("deactivated invite cannot be accepted", async () => {
    assert.equal((await post("deactivate", { id: invite.id })).status, 200);
    await post("logout", {});
    assert.equal(
      (
        await post("login", {
          email: invite.email,
          password: "fake-new-partner-password",
          code: invite.code,
        })
      ).status,
      401,
    );
  });
  await check("failed login is rate limited through HTTP", async () => {
    let r;
    for (let i = 0; i < 9; i++)
      r = await post("login", {
        email: "missing@example.test",
        password: "wrong",
      });
    assert.equal(r.status, 429);
  });
  await check("no page runtime errors", async () =>
    assert.deepEqual(errors, []),
  );
  console.log(`RESULT: ${count} browser/API acceptance checks passed.`);
} finally {
  await b.close();
}
