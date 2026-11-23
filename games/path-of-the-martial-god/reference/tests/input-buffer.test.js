/**
 * The input buffer.
 *
 * This existed throughout M1 and never once ran. The capture sat inside the
 * new-action block, which control only reaches after `acting`, `staggered`, `down`
 * and `finished` have each already returned — so its `!actionable(f)` test could
 * never be true. It read as a working feature, it was covered by a named constant and
 * a paragraph of documentation, and it was dead.
 *
 * So these tests do not merely assert that the buffer behaves. The first one asserts
 * that it HAPPENS AT ALL during real fights, which is the only assertion that would
 * have caught the original defect, and the last one asserts the opponent still cannot
 * use it — because a buffer handed to both sides closes none of the gap it exists to
 * close.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFight, step } from '../sim/fight.js';
import { makeFighter, actionable } from '../sim/fighter.js';
import { neutralIntent, tickFighter, beginTechnique, stagger, knockDown } from '../sim/formMachine.js';
import { technique } from '../sim/techniques.js';
import { INPUT_BUFFER_TICKS } from '../sim/constants.js';
import { SCENARIOS } from '../tools/trace.mjs';

/** A player and an opponent a stride apart, facing each other. Nothing else moves. */
function pair() {
  const f = makeFighter('player', { x: -0.6, z: 0 }, 0);
  const opp = makeFighter('opponent', { x: 0.6, z: 0 }, Math.PI);
  return { f, opp };
}

const press = (verb, over = {}) => ({ ...neutralIntent(), verb, held: true, ...over });
const sink = () => {};

/**
 * Doing nothing, with the hand still closed. `held` must stay true: releasing during
 * a wind-up is the Lie, which turns the technique into a feint and shortens it — a
 * real rule, but not the one under test here.
 */
const idle = () => ({ ...neutralIntent(), held: true });

/** Run n ticks of a lone fighter against a stationary opponent. */
function run(f, opp, n, input = idle) {
  const events = [];
  for (let i = 0; i < n; i++) tickFighter(f, input(i), opp, (e) => events.push(e));
  return events;
}

test('THE REGRESSION: the buffer is actually populated during real fights', () => {
  // The defect was not that the buffer misbehaved. It was that it never ran. Any test
  // that only exercised the buffer directly would have passed against the broken code.
  let ticksWithBuffer = 0;
  let scenariosThatBuffered = 0;

  for (const s of SCENARIOS) {
    const fight = makeFight(s.opts);
    let sawIt = false;
    for (let n = 0; n < s.ticks; n++) {
      if (fight.over) break;
      step(fight, s.input(fight, n), s.choice ? s.choice(fight, n) : {});
      if (fight.a.buffer) { ticksWithBuffer++; sawIt = true; }
    }
    if (sawIt) scenariosThatBuffered++;
  }

  assert.ok(ticksWithBuffer > 0,
    'the input buffer was never populated in any scenario — it is dead code again');
  assert.ok(scenariosThatBuffered >= 4,
    `only ${scenariosThatBuffered} scenarios ever buffered a press; expected most of them`);
});

test('a verb pressed while committed is remembered, not discarded', () => {
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.rear_straight'));
  assert.equal(actionable(f), false);

  tickFighter(f, press('strike'), opp, sink);
  assert.ok(f.buffer, 'the press was thrown away — this is the original defect');
  assert.equal(f.buffer.verb, 'strike');
  assert.equal(f.buffer.age, 0, 'a press made this tick has its whole window ahead of it');
});

test('a remembered verb fires on the first tick the body is free', () => {
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.jab'));   // 9 + 3 + 12 = 24 ticks
  const events = [];
  let firedAt = null;

  for (let i = 0; i < 40; i++) {
    const wasBusy = !actionable(f);
    // One press, made five ticks before the jab's recovery ends.
    tickFighter(f, i === 19 ? press('strike') : idle(), opp, (e) => {
      events.push(e);
      if (e.type === 'begin' && firedAt === null && i > 19) firedAt = i;
    });
    if (wasBusy && actionable(f)) {
      // The very next tick must spend the buffer; nothing is allowed to sit on it.
      assert.ok(f.buffer, 'the buffer expired before the body was free');
    }
  }

  assert.ok(firedAt !== null, 'the remembered press never produced a technique');
  assert.equal(f.buffer, null, 'the buffer must be spent, not kept');
  assert.ok(firedAt <= 25, `acted at tick ${firedAt}; the body was free at 24`);
});

test('a press held past the window is forgotten rather than acted on late', () => {
  const { f, opp } = pair();
  // A technique long enough that a press at tick 0 cannot survive to its end.
  beginTechnique(f, technique('low_river.come_down'));  // 20 + 5 + 26 = 51 ticks
  tickFighter(f, press('strike'), opp, sink);
  assert.ok(f.buffer);

  run(f, opp, INPUT_BUFFER_TICKS + 1);
  assert.equal(f.buffer, null,
    `a press older than ${INPUT_BUFFER_TICKS} ticks must not still be waiting`);

  const events = run(f, opp, 60);
  assert.equal(events.filter((e) => e.type === 'begin').length, 0,
    'a forgotten press must never fire — the game does not act on its own');
});

test('the window is exactly INPUT_BUFFER_TICKS, on both sides of the edge', () => {
  for (const [age, shouldSurvive] of [[INPUT_BUFFER_TICKS, true], [INPUT_BUFFER_TICKS + 1, false]]) {
    const { f, opp } = pair();
    beginTechnique(f, technique('low_river.come_down'));
    tickFighter(f, press('strike'), opp, sink);          // captured, age 0
    run(f, opp, age);                                     // aged by `age` ticks
    assert.equal(!!f.buffer, shouldSurvive,
      `a press ${age} ticks old should ${shouldSurvive ? 'still' : 'no longer'} be held`);
  }
});

test('a live press beats a remembered one', () => {
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.jab'));
  tickFighter(f, press('commit'), opp, sink);
  assert.equal(f.buffer.verb, 'commit');

  const events = [];
  for (let i = 0; i < 30; i++) {
    tickFighter(f, actionable(f) ? press('strike') : idle(), opp, (e) => events.push(e));
    if (events.some((e) => e.type === 'begin')) break;
  }
  const began = events.find((e) => e.type === 'begin');
  assert.ok(began, 'nothing came out');
  assert.equal(technique(began.technique).verb, 'strike',
    'what you are doing now must beat what you meant a tenth of a second ago');
});

test('one press is one action — a buffered verb cannot fire twice', () => {
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.jab'));
  tickFighter(f, press('strike'), opp, sink);

  const events = run(f, opp, 200);

  const begins = events.filter((e) => e.type === 'begin').length;
  assert.ok(begins <= 1, `one press produced ${begins} techniques`);
});

test('a press made while staggered is honoured when the feet come back', () => {
  const { f, opp } = pair();
  stagger(f, 0, 34, 0.1);
  // Press late in the stagger, the way a person recovering their balance does.
  run(f, opp, 28);
  tickFighter(f, press('strike'), opp, sink);
  assert.ok(f.buffer, 'a press during a stagger must be remembered');

  const events = run(f, opp, 12);
  assert.ok(events.some((e) => e.type === 'begin'),
    'coming out of a stagger must honour the press that was waiting');
});

test('a press made early in a knockdown is NOT still queued when you stand up', () => {
  const { f, opp } = pair();
  knockDown(f, 0, 0.2);                       // 78 ticks on the floor
  tickFighter(f, press('commit'), opp, sink);  // pressed immediately
  const events = run(f, opp, 120);
  assert.equal(events.filter((e) => e.type === 'begin').length, 0,
    'you cannot queue an attack from the floor most of a second in advance');
});

test('a finished fighter holds nothing', () => {
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.jab'));
  tickFighter(f, press('strike'), opp, sink);
  assert.ok(f.buffer);
  f.state = 'finished';
  tickFighter(f, neutralIntent(), opp, sink);
  assert.equal(f.buffer, null);
});

test('FAIRNESS: the opponent never buffers, because it never needs to', () => {
  // The brain returns verb:null whenever it is not actionable, so it cannot capture.
  // That asymmetry IS the fix: the brain already acts on the exact frame it becomes
  // free, and the buffer is what gives a pair of hands the same privilege. If the
  // opponent ever starts buffering, the gap this closes has been reopened.
  let opponentBufferTicks = 0;
  for (const s of SCENARIOS) {
    const fight = makeFight(s.opts);
    for (let n = 0; n < s.ticks; n++) {
      if (fight.over) break;
      step(fight, s.input(fight, n), s.choice ? s.choice(fight, n) : {});
      if (fight.b.buffer) opponentBufferTicks++;
    }
  }
  assert.equal(opponentBufferTicks, 0,
    'the opponent buffered an input; the advantage the buffer exists to cancel is back');
});

test('the buffer measurably closes the gap it exists to close', () => {
  // Press four ticks before the body frees, then stop pressing. Measure how long the
  // fighter stands there doing nothing. Before the fix this was the full length of a
  // second attempt; it should now be the next tick.
  const { f, opp } = pair();
  beginTechnique(f, technique('low_river.rear_straight'));  // 15 + 4 + 20 = 39
  let freeAt = null, actedAt = null;

  for (let i = 0; i < 80; i++) {
    const wasBusy = !actionable(f);
    tickFighter(f, i === 35 ? press('strike') : idle(), opp, (e) => {
      if (e.type === 'begin' && i > 35) actedAt ??= i;
    });
    if (wasBusy && actionable(f)) freeAt ??= i;
  }

  assert.ok(freeAt !== null && actedAt !== null, 'the fighter never freed or never acted');
  assert.ok(actedAt - freeAt <= 1,
    `stood idle for ${actedAt - freeAt} ticks after becoming free; the press was waiting`);
});
