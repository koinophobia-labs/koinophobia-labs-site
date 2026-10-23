/**
 * The control group.
 *
 * `a-fight-must-be-finishable.test.js` records what does NOT work: a player who backs
 * away and circles is still not reliably caught, and a beaten fighter still has no way
 * to lose except the Final Inch (NATIVE_M1_REPORT.md §9.11, §9.13b).
 *
 * This is the other half, and without it those numbers are unreadable. Every style that
 * actually engages resolves, every time, in a sane number of seconds. That bounds the
 * defect: what is wrong is wrong about players who decline to fight, not about fighting.
 *
 * It is also the regression guard that matters most. The open decisions in
 * OPEN_DECISIONS.md all change the termination or resource economy, and the first thing
 * any of them could break is an ordinary fight. This is what would notice.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGING, TEMPERAMENTS, endureIndexed } from '../tools/endurance.mjs';

const CAP = 60 * 60 * 4;   // four minutes; engaged fights resolve in tens of seconds
const GRID = [];
for (const aggression of TEMPERAMENTS)
  for (const patience of [0.2, 0.5, 0.8])
    for (const reaction of [10, 16, 22]) GRID.push({ aggression, patience, reaction });

test('every engaging style resolves in every configuration', () => {
  for (const [name, input] of ENGAGING) {
    const failures = GRID.filter((g) =>
      !endureIndexed(input, g.aggression, g.patience, g.reaction, CAP).over);
    assert.equal(failures.length, 0,
      `"${name}" did not resolve in ${failures.length} of ${GRID.length} configurations, `
      + `first at ${JSON.stringify(failures[0])}. An ordinary fight must always end.`);
  }
});

test('and does so in seconds, not minutes', () => {
  // A fight that technically resolves after three minutes is a different failure with
  // the same shape. The committed traces all resolve inside 25 seconds.
  for (const [name, input] of ENGAGING) {
    const times = GRID
      .map((g) => endureIndexed(input, g.aggression, g.patience, g.reaction, CAP).ticks / 60)
      .sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const worst = times[times.length - 1];
    assert.ok(median < 45,
      `"${name}" has a median fight of ${median.toFixed(1)}s — engaged fights have run `
      + '11-23s since M1, so something has made them drag');
    assert.ok(worst < 180,
      `"${name}" has a worst case of ${worst.toFixed(1)}s`);
  }
});

test('the defect is specific to keeping distance, and this says so', () => {
  // Pins the diagnosis itself. If a future change makes retreating resolve, that is
  // the open decision landing — and this test is where it gets noticed and recorded.
  const retreatJab = (n) => ({
    forward: -1, lateral: 0, verb: n % 23 === 0 ? 'strike' : null, held: true, guard: false,
  });
  const unresolved = GRID.filter((g) =>
    !endureIndexed(retreatJab, g.aggression, g.patience, g.reaction, CAP).over).length;
  assert.ok(unresolved > 0,
    'retreating while jabbing now always resolves. That is the open decision in '
    + 'OPEN_DECISIONS.md landing — good news; update NATIVE_M1_REPORT.md §9.14 and this test.');
});
