import test from "node:test";
import assert from "node:assert/strict";
import { requestMagicLink } from "../lib/team/auth";
import type { Queryable } from "../lib/payments";

test("login email has consistent identity, explanatory plain text and provider idempotency", async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  const sent: { headers: Headers; body: Record<string, string> }[] = [];
  // The database concurrency behavior is covered against real PostgreSQL.
  const db = { query: async () => ({ rows: [{ id: "fake-partner", key: "fake-claim" }] }) } as unknown as Queryable;
  try {
    process.env.VERCEL_ENV = "production";
    process.env.RESEND_API_KEY = "fake-test-only";
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://api.resend.com/emails");
      sent.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
      return new Response("{}", { status: 200 });
    };
    for (const from of ["leads@example.test", "Old Name <leads@example.test>"]) {
      process.env.CONTACT_FROM_EMAIL = from;
      await requestMagicLink(db, "owner@example.test", "https://example.test");
    }
    assert.equal(sent.length, 2, "each independent request makes one provider call");
    for (const message of sent) {
      assert.equal(message.body.from, "Koinophobia Labs <leads@example.test>");
      assert.equal(message.body.reply_to, "leads@example.test");
      assert.equal(message.body.to, "owner@example.test");
      assert.equal(message.body.subject, "Sign in to your Koinophobia Labs team portal");
      assert.match(message.body.text, /manage your leads, pipeline and commissions/);
      assert.match(message.body.text, /within 15 minutes/);
      assert.match(message.body.text, /If you did not request it/);
      assert.match(message.body.text, /Reply to this email/);
      assert.match(message.headers.get("Idempotency-Key")!, /^team-login\/[a-f0-9]{64}$/);
    }
    process.env.VERCEL_ENV = "preview";
    await assert.rejects(requestMagicLink(db, "owner@example.test", "https://example.test"), /unavailable/);
    assert.equal(sent.length, 2, "preview cannot send mail");
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});
