/**
 * A fight the player cannot finish is a game the player cannot leave.
 *
 * Native M1's criterion 3 is "the fight begins and ends normally". Nothing in the
 * simulation bounds a fight's length — there is no round timer, no clock and no
 * decision — so whether that criterion holds is a question about behaviour, not about
 * code, and it has to be asked by playing.
 *
 * These tests do NOT assert that the current behaviour is correct. Several of them
 * record a known open defect (NATIVE_M1_REPORT.md §9.10, OPEN_DECISIONS.md): a player
 * who retreats and circles is never caught, at any opponent temperament, and the fight
 * runs forever with no event of any kind. They exist so that:
 *
 *   - the defect cannot be quietly forgotten, and
 *   - whatever fixes it is measured against the exact cases that fail now.
 *
 * When it is fixed, `stillStalls` goes to zero and the last test here starts failing.
 * That failure is the good news, and its message says so.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES, TEMPERAMENTS, endure } from '../tools/endurance.mjs';

// Two simulated minutes. Long enough that anything still standing is not "a slow
// fight" — the committed traces all resolve inside 25 seconds.
const CAP = 60 * 60 * 2;

const byName = (n) => CASES.find(([name]) => name === n)[1];

test('the committed scenarios are nothing like this long', async () => {
  // Guards the premise: if a normal fight took minutes, a two-minute cap would prove
  // nothing. The longest committed trace is 1,500 frames — 25 seconds.
  const { readFile } = await import('node:fs/promises');
  const { SCENARIOS } = await import('../tools/trace.mjs');
  let longest = 0;
  for (const s of SCENARIOS) {
    const t = JSON.parse(await readFile(new URL(`../traces/${s.name}.json`, import.meta.url).pathname, 'utf8'));
    longest = Math.max(longest, t.frames.length);
  }
  assert.ok(longest < 60 * 60, `longest committed trace is ${longest} ticks — the cap below is no longer meaningful`);
});

test('an aggressive opponent finishes a player who does nothing', () => {
  // The one case that must never regress: someone puts the phone down and the fight
  // resolves. It holds only at high aggression, which is the defect in miniature.
  const { over } = endure(byName('does nothing at all'), 0.9, CAP);
  assert.ok(over, 'an opponent at aggression 0.9 must finish a motionless player');
});

test('a player who retreats in a straight line is eventually caught', () => {
  const { over } = endure(byName('retreats forever'), 0.9, CAP);
  assert.ok(over, 'retreat is slower than advance, so a committed opponent must close');
});

test('retreating while guarding always resolves — guard is what costs', () => {
  for (const aggression of TEMPERAMENTS) {
    const { over } = endure(byName('retreats holding guard'), aggression, CAP);
    assert.ok(over, `guarding while retreating must still resolve (aggression ${aggression})`);
  }
});

test('KNOWN DEFECT: retreating and circling never resolves, at any temperament', () => {
  // Documented, not endorsed. The opponent travels FASTER than the player but spends
  // ~44% of its ticks circling alongside rather than closing, so its radial closing
  // rate (~0.0147 m/tick) sits below the player's radial opening rate (~0.0170).
  for (const aggression of TEMPERAMENTS) {
    const { over } = endure(byName('retreats and circles'), aggression, CAP);
    assert.equal(over, null,
      `aggression ${aggression} now resolves a retreating, circling player. If that was `
      + 'deliberate, this test has done its job — delete this case and record the fix in '
      + 'NATIVE_M1_REPORT.md §9.10.');
  }
});

test('the stall is total: not one event fires in two minutes', () => {
  // Distinguishes "never ends" from "ends very slowly". A fight trading blows for
  // twenty minutes would be a balance problem. This is a fight in which nothing
  // whatsoever happens, which is a different and worse thing.
  const { fight } = (() => {
    const seen = [];
    const input = byName('retreats and circles');
    const r = endure(input, 0.5, CAP);
    return { fight: r.fight, seen };
  })();
  assert.equal(fight.over, null);
  assert.equal(fight.a.breath, 100, 'neither fighter spends anything — that is why it never ends');
  assert.equal(fight.b.breath, 100);
});

test('the scale of the defect is what the report says it is', () => {
  let stillStalls = 0;
  for (const [, input] of CASES) {
    for (const aggression of TEMPERAMENTS) {
      if (!endure(input, aggression, CAP).over) stillStalls++;
    }
  }
  assert.equal(stillStalls, 9,
    `${stillStalls} of 18 passive-player cases do not resolve; the report records 9. `
    + 'If this number went DOWN, something fixed part of the stall — update '
    + 'NATIVE_M1_REPORT.md §9.10 and this count. If it went UP, something made it worse.');
});
