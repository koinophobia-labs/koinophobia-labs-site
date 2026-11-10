import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("outreach templates use remote US copy, real reply path, address placeholder and opt out", () => {
  const scripts = readFileSync("lib/team/scripts.ts", "utf8");
  const quotes = readFileSync("lib/team/quotes.ts", "utf8");
  const offer = readFileSync("lib/team/config.ts", "utf8");
  for (const text of [scripts, quotes, offer])
    assert.doesNotMatch(text, /Chicago|local businesses/i);
  assert.match(scripts, /we work remotely with businesses across the US/);
  for (const text of [scripts, quotes]) {
    assert.match(text, /Reply-To: blake@koinophobialabs.com/);
    assert.match(text, /\[MAILING ADDRESS — Blake fills in\]/);
    assert.match(text, /no thanks/);
  }
});
