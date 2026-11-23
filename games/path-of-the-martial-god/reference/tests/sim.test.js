import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent, intentFromMove } from '../sim/formMachine.js';
import { makeRecording, record, playback, digest, run } from '../sim/replay.js';
import { validateAll, technique, frames } from '../sim/techniques.js';
import { resolve } from '../sim/grammar.js';
import {
  quadrantFromIncoming, freshStructure, applyForce, recoverStructure, bearing,
} from '../sim/structure.js';
import { makeFighter } from '../sim/fighter.js';
import { attempt, windowTicks, isFinished } from '../sim/finalInch.js';

const guardInput = () => ({ ...neutralIntent(), guard: true, verb: 'guard', held: true });

// ---------------------------------------------------------------- data ----
test('TechniqueDB validates with no errors', () => {
  assert.deepEqual(validateAll(), []);
});

test('every offensive technique commits inside its own startup', () => {
  for (const id of ['low_river.jab', 'low_river.through_palm', 'low_river.come_down']) {
    const t = technique(id);
    assert.ok(t.commitAt < frames(t).startup, `${id}: commitAt must fall inside startup`);
  }
});

// ------------------------------------------------------------- grammar ----
test('the same verb with different intent produces different techniques', () => {
  const a = resolve('low_river', 'commit', 'neutral', 'mid');
  const b = resolve('low_river', 'commit', 'pressure', 'mid');
  const c = resolve('low_river', 'commit', 'angle', 'mid');
  assert.notEqual(a.id, b.id);
  assert.notEqual(b.id, c.id);
  assert.equal(b.id, 'low_river.through_palm');
});

test('intent is read from the stick, not from a button', () => {
  assert.equal(intentFromMove(0, 0), 'neutral');
  assert.equal(intentFromMove(1, 0), 'pressure');
  assert.equal(intentFromMove(-1, 0), 'retreat');
  assert.equal(intentFromMove(0, 1), 'angle');
});

test('the grammar refuses sentences the band cannot say', () => {
  assert.equal(resolve('low_river', 'commit', 'pressure', 'long'), null);
  assert.ok(resolve('low_river', 'commit', 'pressure', 'mid'));
});

// ----------------------------------------------------------- structure ----
test('quadrant hit is decided by geometry', () => {
  assert.equal(quadrantFromIncoming(0, 0), 'fore');
  assert.equal(quadrantFromIncoming(0, Math.PI), 'rear');
  assert.equal(quadrantFromIncoming(0, Math.PI / 2), 'leadSide');
  assert.equal(quadrantFromIncoming(0, -Math.PI / 2), 'rearSide');
});

test('a quadrant driven to zero collapses, and the next force through it breaks', () => {
  const st = freshStructure();
  const first = applyForce(st, 'fore', 100);
  assert.equal(first.broke, false, 'reaching zero is not itself the break');
  assert.ok(st.collapse.fore > 0, 'the quadrant collapses');
  const second = applyForce(st, 'fore', 5);
  assert.equal(second.broke, true, 'force through a collapsed base is the break');
});

test('a collapsed quadrant cannot bear weight and does not recover', () => {
  const st = freshStructure();
  applyForce(st, 'rear', 100);
  assert.equal(bearing(st, 'rear'), 0, 'you cannot retreat into a broken rear');
  const before = st.rear;
  recoverStructure(st, 'settling');
  assert.equal(st.rear, before, 'a collapsed quadrant does not recover');
});

test('structure recovery halts entirely while gassed', () => {
  const st = freshStructure();
  st.fore = 40;
  recoverStructure(st, 'gassed');
  assert.equal(st.fore, 40);
});

test('Low River recovers best advancing and worst retreating', () => {
  const adv = freshStructure(); adv.fore = 10;
  const ret = freshStructure(); ret.fore = 10;
  recoverStructure(adv, 'advancing');
  recoverStructure(ret, 'retreating');
  assert.ok(adv.fore > ret.fore, 'advancing must settle the base faster than retreating');
});

// ---------------------------------------------------------- determinism ----
test('identical inputs produce an identical fight, twice', () => {
  const script = (f, n) => ({ input: n % 90 < 45 ? guardInput() : { ...neutralIntent(), forward: 1, verb: n % 30 === 0 ? 'strike' : null, held: true } });
  const one = run(makeFight(), script);
  const two = run(makeFight(), script);
  assert.equal(digest(one), digest(two));
});

test('a recorded fight replays identically, frame for frame', () => {
  const rec = makeRecording({ reaction: 15 });
  const live = makeFight(rec.opts);
  for (let n = 0; n < 900 && !live.over; n++) {
    const input = n % 70 < 30
      ? { ...neutralIntent(), forward: 1, verb: n % 25 === 0 ? 'commit' : null, held: true }
      : guardInput();
    record(rec, input, {});
    step(live, input, {});
  }
  assert.equal(digest(playback(rec)), digest(live));
});

// ------------------------------------------------- defence, spatially ----
/** Place two fighters, drive one technique to completion, report what happened. */
function duel({ defenderFacing, defenderState = 'neutral', techniqueId = 'low_river.rear_straight' }) {
  const a = makeFighter('a', { x: 0, z: 0 }, 0);
  const d = makeFighter('d', { x: 1.2, z: 0 }, defenderFacing);
  if (defenderState === 'guard') { d.state = 'guard'; d.guardTicks = 60; }
  const events = [];
  const t = technique(techniqueId);
  a.state = 'acting';
  a.form = { techniqueId, tick: frames(t).startup, released: false, feint: false, landed: false, recoveryAdd: 0 };
  return { a, d, events, t };
}

test('guard covers the quadrant you face, and nothing else', async () => {
  const { attemptLand } = await import('../sim/resolve.js');

  // Defender faces the attacker: the blow lands on a guarded fore.
  {
    const { a, d, events } = duel({ defenderFacing: Math.PI, defenderState: 'guard' });
    attemptLand(a, d, (e) => events.push(e));
    assert.ok(events.some((e) => e.type === 'guarded'), 'facing the attack, guard holds');
  }
  // Defender guards but is facing away: the same guard does not cover the flank.
  {
    const { a, d, events } = duel({ defenderFacing: Math.PI / 2, defenderState: 'guard' });
    attemptLand(a, d, (e) => events.push(e));
    assert.ok(events.some((e) => e.type === 'guard_bypassed'), 'a guard pointed the wrong way is bypassed');
    assert.ok(events.some((e) => e.type === 'hit'), 'and the blow lands clean');
  }
});

test('evade i-frames are conditional on direction', async () => {
  const { evadeWorked } = await import('../sim/resolve.js');
  const a = makeFighter('a', { x: 0, z: 0 }, 0);
  const d = makeFighter('d', { x: 1.2, z: 0 }, Math.PI);
  const jab = technique('low_river.jab');
  const drive = technique('low_river.through_palm');

  d.form.evadeDir = Math.PI / 2;               // straight off the line
  assert.equal(evadeWorked(d, a, drive), true, 'a real angle beats even a lunge');

  d.form.evadeDir = 0;                          // straight back
  assert.equal(evadeWorked(d, a, jab), true, 'backing off beats a non-lunging strike');
  assert.equal(evadeWorked(d, a, drive), false, 'backing off does not beat a lunge that follows');

  d.form.evadeDir = Math.PI;                    // into the attack
  assert.equal(evadeWorked(d, a, jab), false, 'slipping the wrong way just moves you');
});

// ------------------------------------------------------- the Final Inch ----
test('the window widens with mastery — skill buys time to decide', () => {
  assert.ok(windowTicks(1.0) > windowTicks(0.0));
});

test('the Stop is gated on competence, not on intent', () => {
  const novice = makeFighter('n', { x: 0, z: 0 }, 0, { mastery: 0.1 });
  const master = makeFighter('m', { x: 0, z: 0 }, 0, { mastery: 0.9 });

  const t1 = makeFighter('t', { x: 1, z: 0 }, Math.PI);
  const r1 = attempt('stop', novice, t1);
  assert.equal(r1.clean, false);
  assert.equal(r1.executed, 'strike_through', 'reaching for mercy without control connects anyway');

  const t2 = makeFighter('t', { x: 1, z: 0 }, Math.PI);
  const r2 = attempt('stop', master, t2);
  assert.equal(r2.clean, true);
  assert.equal(r2.executed, 'stop');
});

test('a break only finishes someone whose Will is gone', () => {
  const f = makeFighter('x', { x: 0, z: 0 }, 0);
  f.state = 'staggered';
  f.will = 90;
  assert.equal(isFinished(f), false, 'high Will scrambles and resets');
  f.will = 10;
  assert.equal(isFinished(f), true, 'low Will is finished');
});

// ------------------------------------------------------------ the loop ----
test('a passive guard loses: guarding postpones, it does not save', () => {
  const f = run(makeFight(), () => ({ input: guardInput() }), 60 * 150);
  assert.ok(f.over, 'the fight must actually end');
  assert.equal(f.over.winnerId, 'opponent');
});

test('Focus actually recovers Breath', () => {
  const f = makeFight();
  f.a.breath = 20;
  for (let i = 0; i < 30; i++) {
    step(f, { ...neutralIntent(), verb: i === 0 ? 'focus' : null, held: true }, {});
  }
  assert.ok(f.a.breath > 20, 'Breathe must not be a no-op that only costs time');
});
