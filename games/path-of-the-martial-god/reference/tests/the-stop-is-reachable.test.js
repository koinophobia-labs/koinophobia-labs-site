/**
 * The Stop, end to end.
 *
 * `sim.test.js` already tests `attempt('stop', …)` directly: hand it a novice and it
 * overshoots, hand it a master and it holds. That is the leaf. It says nothing about
 * whether a person playing the game can ever ARRIVE there.
 *
 * The whole design points at this one moment. `COMBAT_SYSTEM.md` §10 calls it "the
 * hardest thing in the game", and the thesis is that mercy is gated behind competence —
 * *"restraint is not a moral choice available to the weak."* A chain that long, tested
 * only at its last link, is the shape of every defect this project has produced: the
 * input buffer, five settings, four constants, an audio cue, a pose branch. Each was
 * present, plausible, and never reached.
 *
 * So this plays fights. Land strikes, break their structure, drain their Will, wait for
 * the window, and take it — or fail to.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent } from '../sim/formMachine.js';

/** The circling, striking input of the one committed scenario the player wins. */
const winning = (n) => ({ ...neutralIntent(), forward: 0.2, lateral: 1,
                          verb: n % 19 === 0 ? 'strike' : null, held: true });

/** Play a whole fight, taking `terminal` whenever the Inch is the player's. */
function play({ playerMastery, aggression, reaction, terminal }) {
  const f = makeFight({ aggression, patience: 0.5, reaction, playerMastery });
  let reachedInch = false;
  for (let n = 0; n < 60 * 60 * 4 && !f.over; n++) {
    const mine = f.inch && f.inch.actorId === 'player';
    if (mine) reachedInch = true;
    step(f, winning(n), mine && terminal ? { terminal } : {});
  }
  return { over: f.over, reachedInch };
}

const GRID = [];
for (const playerMastery of [0.0, 0.25, 0.5, 0.6, 0.75, 1.0])
  for (const aggression of [0.3, 0.6, 0.9])
    for (const reaction of [14, 18]) GRID.push({ playerMastery, aggression, reaction });

test('a player can actually reach the Final Inch', () => {
  const reached = GRID.filter((g) => play({ ...g, terminal: null }).reachedInch).length;
  assert.ok(reached >= 24,
    `the window opened for the player in only ${reached} of ${GRID.length} fights — `
    + 'the mechanic the whole game is pointed at is becoming unreachable');
});

test('a player who takes the Stop sometimes holds it, and the fight says so', () => {
  const outcomes = GRID.map((g) => play({ ...g, terminal: 'stop' }).over).filter(Boolean);
  const stopped = outcomes.filter((o) => o.reason === 'stopped' && o.terminal === 'stop');
  assert.ok(stopped.length > 0,
    'not one fight in the grid ended with a held Stop. The game cannot state its own '
    + 'argument if its central outcome is unreachable by playing.');
  assert.ok(stopped.every((o) => o.winnerID === 'player' || o.winnerId === 'player'),
    'a held Stop must record the person who held it as the winner');
});

test('and sometimes does not — competence is the gate, and it bites', () => {
  // The other half, and the more important one. If every attempt succeeded, mercy
  // would be a button rather than a skill, and the design's central claim would be
  // decoration.
  // Must be the PLAYER's overshoot. Counting every `strike_through` outcome includes
  // the fights the OPPONENT won that way, which happens constantly — the first version
  // of this test passed with the competence gate removed entirely, because those
  // outcomes kept the count above zero.
  const overshot = GRID.map((g) => play({ ...g, terminal: 'stop' }).over)
    .filter((o) => o && o.terminal === 'strike_through' && o.winnerId === 'player');
  assert.ok(overshot.length > 0,
    'every attempted Stop succeeded — the competence gate is not biting anywhere in '
    + 'this grid, so restraint is no longer gated on being good enough for it');
});

test('choosing to strike through never produces a Stop', () => {
  // Guards the obvious direction too: the outcome must follow the choice.
  for (const terminal of ['strike_through', null]) {
    const o = GRID.map((g) => play({ ...g, terminal }).over).filter(Boolean);
    assert.ok(o.length > 0, 'no fight resolved at all');
    assert.ok(o.every((x) => x.terminal !== 'stop'),
      `a fight ended in a Stop when the player chose ${terminal ?? 'nothing'}`);
  }
});

test('MEASURED, NOT ENDORSED: two of the four endings have never once fired', () => {
  // Across this grid and the much wider sweep in NATIVE_M1_REPORT.md §9.13, every
  // resolved fight ends through the Final Inch. `unconscious` needs vitalityFraction
  // at zero, and that sums all six regions while the design says damage CONCENTRATES;
  // `yielded` needs Will at or below 12 while down, and Will regenerates. Neither has
  // been observed. See OPEN_DECISIONS.md — this is balance, and it is not chosen here.
  const reasons = new Set();
  for (const terminal of ['stop', 'strike_through', null])
    for (const g of GRID) {
      const o = play({ ...g, terminal }).over;
      if (o) reasons.add(o.reason);
    }
  assert.ok(reasons.has('finished'), 'no fight finished at all — something is badly wrong');
  assert.ok(!reasons.has('unconscious'),
    'a fight ended by knockout. That route was unreachable when this was written, so if '
    + 'it fires now something closed the gap — update NATIVE_M1_REPORT.md §9.13 and N-22.');
  assert.ok(!reasons.has('yielded'),
    'a fight ended by yielding. Same as above: good news, but record it.');
});
