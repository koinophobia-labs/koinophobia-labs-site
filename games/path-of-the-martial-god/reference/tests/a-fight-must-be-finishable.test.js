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

test('KNOWN DEFECT: a fight can be comprehensively won and still not end', () => {
  // The serious one, and it has nothing to do with the opponent being passive. At
  // aggression 0.15 against a motionless player the opponent lands FOUR HUNDRED clean
  // hits and breaks their structure a hundred-odd times over twenty simulated minutes,
  // and the fight does not end.
  //
  // Every terminal route needs something this never produces:
  //   unconscious  needs vitalityFraction <= 0, which sums all six regions — and the
  //                arms are never hit, so the total never reaches zero however
  //                thoroughly the head and torso are destroyed
  //   the Inch     needs will < inchThreshold AND staggered-or-down
  //   yielded      needs will <= yieldThreshold AND down
  // ...and will regenerates. See NATIVE_M1_REPORT.md §9.11.
  const { over, events, types, fight } = endure(byName('does nothing at all'), 0.15, CAP);
  assert.equal(over, null, 'if this now ends, the termination gap has been closed — '
    + 'delete this test and record the fix in NATIVE_M1_REPORT.md §9.11');
  // Thresholds are for the two-minute cap above. Left to run the full twenty minutes
  // the same case reaches 1,193 events and 414 hits — the tool prints that; this only
  // has to establish that the fight is emphatically happening.
  assert.ok(events > 100, `only ${events} events — the premise of this test is that plenty happens`);
  assert.ok((types.get('hit') ?? 0) > 30, 'the player must be getting hit a great deal');
  assert.ok(fight.a.vitality.torso <= 0, 'the torso must actually be destroyed');
  assert.ok(fight.a.vitality.leadArm > 0, 'and an untouched arm is what keeps the total above zero');
});

test('the scale of the defect is what the report says it is', () => {
  let stillStalls = 0;
  for (const [, input] of CASES) {
    for (const aggression of TEMPERAMENTS) {
      if (!endure(input, aggression, CAP).over) stillStalls++;
    }
  }
  // Five at this two-minute cap; four survive the full twenty minutes the tool runs
  // (`retreats and circles` at aggression 0.9 resolves at 245s). Both numbers are in
  // the report, and this pins the one this cap can actually see.
  assert.equal(stillStalls, 5,
    `${stillStalls} of 18 passive-player cases do not resolve inside two minutes; the `
    + 'report records 5 here and 4 over twenty minutes. '
    + 'If this went DOWN, something closed part of the gap — update NATIVE_M1_REPORT.md '
    + '§9.10-9.11 and this count. If it went UP, something made it worse.');
});

test('urgency is inert in an ordinary fight', () => {
  // The term must not change fights that were already working. All seven original
  // committed traces regenerate byte-identically with it in place — this asserts the
  // same thing from the other end: a fight with constant contact never accumulates
  // enough quiet to reach the grace period at all.
  const { fight } = endure(byName('retreats holding guard'), 0.5, CAP);
  assert.ok(fight.brain.quiet <= 300,
    `quiet reached ${fight.brain.quiet} in a fight with constant contact — urgency is `
    + 'firing where it should be dormant');
});
