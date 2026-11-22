import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import { transaction } from "../lib/team/db";
import { consumeMagicLink, digest, dismissPasswordPrompt, hashPassword, newSession, passwordInput, passwordLogin, passwordState, requestMagicLink, sessionActor, setPassword, verifyPassword } from "../lib/team/auth";

test("WO-0264 isolated PostgreSQL password acceptance", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0264-pg-"));
  const net = createServer();
  await new Promise<void>((r) => net.listen(0, "127.0.0.1", r));
  const port = (net.address() as { port: number }).port;
  await new Promise<void>((r) => net.close(() => r()));
  execFileSync("initdb", ["-D", dir, "-A", "trust", "--no-locale", "-E", "UTF8"], { stdio: "ignore" });
  execFileSync("pg_ctl", ["-D", dir, "-l", join(dir, "server.log"), "-o", `-F -p ${port} -h 127.0.0.1 -k ${dir}`, "-w", "start"], { stdio: "ignore" });
  const db = new Pool({ host: "127.0.0.1", port, database: "postgres" });
  const tx = <T>(work: Parameters<typeof transaction<T>>[0]) => transaction(work, db);
  const change = (session: string, password: string, currentPassword?: string) => tx(q => setPassword(q, session, { password, currentPassword }));
  const first = "  fictional password  ", second = "replacement test password";
  async function magic(id: string) {
    const token = crypto.randomUUID();
    await db.query("insert into team_login_tokens values($1,$2,now()+interval '15 minutes')", [digest(token), id]);
    return tx(q => consumeMagicLink(q, token));
  }
  try {
    for (const file of ["001_crm_leads.sql", "002_crm_proposals.sql", "006_stripe_payments.sql", "010_team_portal.sql", "012_team_password.sql", "012_team_password.sql"])
      await db.query(readFileSync("db/" + file, "utf8"));
    for (const id of ["first", "skip", "disabled", "no-password", "concurrent"])
      await db.query("insert into team_partners(id,name,email,role) values($1,'Fictional account',$2,'partner')", [id, id + "@example.test"]);
    await t.test("first password after email link, salted scrypt, exact whitespace, other sessions revoked", async () => {
      const other = await newSession(db, "first"), session = await magic("first");
      assert.deepEqual(await passwordState(db, session), { hasPassword: false, canReset: true, prompt: true });
      await change(session, first);
      assert.equal(await sessionActor(db, other), null);
      assert.equal((await sessionActor(db, session))?.id, "first");
      assert.deepEqual(await passwordState(db, session), { hasPassword: true, canReset: false, prompt: false });
      const hash = (await db.query("select password_hash from team_partners where id='first'")).rows[0].password_hash;
      assert.match(hash, /^scrypt:/);
      assert.notEqual(hash, await hashPassword(first));
      assert.ok(await verifyPassword(first, hash));
      assert.equal(passwordInput(first), first);
      assert.equal((await sessionActor(db, await tx(q => passwordLogin(q, "first@example.test", first))))?.id, "first");
      await assert.rejects(tx(q => passwordLogin(q, "first@example.test", first.trim())), /Email or password is incorrect/);
    });
    await t.test("wrong or missing current password cannot change; valid change revokes other sessions", async () => {
      const session = await tx(q => passwordLogin(q, "first@example.test", first));
      const other = await tx(q => passwordLogin(q, "first@example.test", first));
      await assert.rejects(change(session, second), /Current password is incorrect/);
      await assert.rejects(change(session, second, "incorrect"), /Current password is incorrect/);
      assert.ok(await sessionActor(db, other));
      await change(session, second, first);
      assert.equal(await sessionActor(db, other), null);
      await assert.rejects(change(other, first, second), /Please sign in/);
      await assert.rejects(tx(q => passwordLogin(q, "first@example.test", first)), /incorrect/);
      assert.ok(await tx(q => passwordLogin(q, "first@example.test", second)));
    });
    await t.test("12–256 character boundaries, including passwords made of spaces", async () => {
      const session = await magic("no-password");
      for (const n of [0, 11, 257]) await assert.rejects(change(session, "a".repeat(n)), /12–256/);
      await change(session, " ".repeat(12));
      await change(session, "z".repeat(256), " ".repeat(12));
      assert.ok(await tx(q => passwordLogin(q, "no-password@example.test", "z".repeat(256))));
    });
    await t.test("email-link reset is one-use; old sessions, pending links and old password lose access", async () => {
      const other = await tx(q => passwordLogin(q, "first@example.test", second));
      const links: string[] = [];
      await requestMagicLink(db, "first@example.test", "https://example.test", async (_email, url) => { links.push(url); });
      const token = new URL(links[0]).searchParams.get("token")!;
      const session = await tx(q => consumeMagicLink(q, token));
      await assert.rejects(tx(q => consumeMagicLink(q, token)), /invalid or expired/);
      await db.query("insert into team_login_tokens values($1,'first',now()+interval '15 minutes')", [digest("outstanding-fictional-token")]);
      await change(session, first);
      assert.equal(await sessionActor(db, other), null);
      await assert.rejects(tx(q => consumeMagicLink(q, "outstanding-fictional-token")), /invalid or expired/);
      await assert.rejects(change(session, second), /Current password/);
      await assert.rejects(tx(q => passwordLogin(q, "first@example.test", second)), /incorrect/);
    });
    await t.test("reset permission expires; skipped setup prompt stays dismissed on future email logins", async () => {
      const session = await magic("first");
      await db.query("update team_sessions set password_reset_until=now()-interval '1 second' where token_hash=$1", [digest(session)]);
      await assert.rejects(change(session, second), /Current password/);
      const skip = await magic("skip");
      assert.equal((await passwordState(db, skip)).prompt, true);
      await tx(q => dismissPasswordPrompt(q, skip));
      assert.equal((await passwordState(db, await magic("skip"))).prompt, false);
      await change(skip, first);
    });
    await t.test("inactive, unknown, no-password and wrong-password logins share generic failures", async () => {
      await db.query("update team_partners set password_hash=$1,active=false where id='disabled'", [await hashPassword(first)]);
      const failures = [];
      for (const email of ["absent@example.test", "disabled@example.test", "concurrent@example.test", "first@example.test"]) {
        try { await tx(q => passwordLogin(q, email, "incorrect password")); assert.fail("login must fail"); }
        catch (e) { failures.push({ message: (e as Error).message, status: (e as {status: number}).status }); }
      }
      for (const failure of failures) assert.deepEqual(failure, { message: "Email or password is incorrect.", status: 401 });
      await assert.rejects(tx(q => passwordLogin(q, "disabled@example.test", first)), /incorrect/);
      await assert.rejects(magic("disabled"), /invalid or expired/);
      await requestMagicLink(db, "disabled@example.test", "https://example.test", async () => { assert.fail("No delivery for inactive account"); });
      const inactiveSession = await newSession(db, "disabled");
      await assert.rejects(change(inactiveSession, first), /Please sign in/);
    });
    await t.test("concurrent first-password requests allow only one session to succeed", async () => {
      const a = await magic("concurrent"), b = await magic("concurrent");
      const results = await Promise.allSettled([change(a, first), change(b, second)]);
      assert.equal(results.filter(x => x.status === "fulfilled").length, 1);
    });
  } finally {
    await db.end();
    execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
    t.diagnostic("Retained fictional fixture: " + dir);
  }
});
