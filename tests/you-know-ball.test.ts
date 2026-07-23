import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { debatePrompts, scoreTake, SCORING_ENGINE_NOTE } from "../lib/youKnowBall";

test("a reasoned sports take earns more than a vague response", () => {
  const prompt = debatePrompts[0];
  const vague = scoreTake("peak", prompt);
  const reasoned = scoreTake("Peak matters because playoff defenses force the best players to reveal every counter in their game.", prompt);
  assert.ok(reasoned.points > vague.points);
  assert.ok(reasoned.takeStrength > vague.takeStrength);
});

test("betting requests pause scoring", () => {
  const score = scoreTake("Give me the best parlay and moneyline pick", debatePrompts[0]);
  assert.equal(score.paused, true);
  assert.equal(score.points, 0);
});

test("the web scoring engine is labeled an illustrative reimplementation, not the shipped engine (XP-06)", async () => {
  // The exported note the UI renders.
  assert.match(SCORING_ENGINE_NOTE, /not the shipped You Know Ball engine/i);
  // Code-level label in the module itself, and the misleading "faithful port" note is gone.
  const lib = await readFile(new URL("../lib/youKnowBall.ts", import.meta.url), "utf8");
  assert.match(lib, /ILLUSTRATIVE REIMPLEMENTATION/);
  assert.match(lib, /NOT the shipped You Know Ball engine/i);
  assert.doesNotMatch(lib, /Ported from public\/you-know-ball-scoring\.js in the authoritative private app\./);
  // The user-facing demo surfaces carry the label.
  const game = await readFile(new URL("../components/YouKnowBallGame.tsx", import.meta.url), "utf8");
  const play = await readFile(new URL("../app/you-know-ball/play/page.tsx", import.meta.url), "utf8");
  assert.match(game, /SCORING_ENGINE_NOTE/);
  assert.match(play, /SCORING_ENGINE_NOTE/);
});

test("the homepage keeps services and business work ahead of internal products", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(page.indexOf("client_work_view") < page.indexOf("Products built inside the lab"));
  assert.ok(page.indexOf("id=\"services\"") < page.indexOf("Products built inside the lab"));
  assert.ok(page.includes("Technical depth, separated from client proof"));
});
