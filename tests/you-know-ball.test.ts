import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { debatePrompts, scoreTake } from "../lib/youKnowBall";

test("a reasoned sports take earns more than a vague response", () => {
  const prompt = debatePrompts[0];
  const vague = scoreTake("peak", prompt);
  const reasoned = scoreTake(
    "Peak matters because playoff defenses force the best players to reveal every counter in their game.",
    prompt,
  );
  assert.ok(reasoned.points > vague.points);
  assert.ok(reasoned.takeStrength > vague.takeStrength);
});

test("betting requests pause scoring", () => {
  const score = scoreTake(
    "Give me the best parlay and moneyline pick",
    debatePrompts[0],
  );
  assert.equal(score.paused, true);
  assert.equal(score.points, 0);
});

test("the koi-first homepage leads with shipped apps, then the lab, then the offer", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const shippedScene = page.indexOf('className="dest dest--shipped"');
  const labScene = page.indexOf('className="dest dest--lab"');
  const workScene = page.indexOf('className="dest dest--work"');

  assert.ok(shippedScene > 0, "the shipped chapter must exist");
  assert.ok(shippedScene < labScene, "shipped apps come before the lab");
  assert.ok(labScene < workScene, "the lab leads into the offer");
  assert.match(page, /shipped\.map\(\(product, index\) =>/);
  assert.match(page, /labProducts\.map\(\(product, index\) =>/);
  // You Know Ball is a lab card read from the registry, never a hardcoded status.
  assert.doesNotMatch(page, /Internal Product · /);
});
