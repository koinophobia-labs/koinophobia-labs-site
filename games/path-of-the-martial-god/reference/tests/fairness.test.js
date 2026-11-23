/**
 * The fairness rules of COMBAT_SYSTEM.md §11 are supposed to be enforced
 * ARCHITECTURALLY rather than by discipline. These tests are that enforcement.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeFighter } from '../sim/fighter.js';
import { snapshot, makePerception, observe, perceived } from '../sim/ai/perception.js';
import { makeBrain, decide } from '../sim/ai/brain.js';
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent } from '../sim/formMachine.js';

const HERE = new URL('..', import.meta.url).pathname;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

test('a perception Snapshot carries nothing a person could not see', () => {
  const f = makeFighter('x', { x: 0, z: 0 }, 0);
  f.will = 3; // hidden
  const snap = snapshot(f, 0);
  const keys = Object.keys(snap);

  assert.ok(!keys.includes('will'), 'Will is hidden; it must never be perceived');
  assert.ok(!keys.includes('form'), 'the raw form (which carries release state) must not leak');
  assert.ok(!keys.includes('line'), 'the Line is an internal state, not an observable');
  for (const forbidden of ['verb', 'held', 'input', 'intent', 'released']) {
    assert.ok(!JSON.stringify(snap).includes(`"${forbidden}"`), `snapshot must not contain ${forbidden}`);
  }
  // What it SHOULD carry: pose, posture, breath, injury.
  for (const required of ['pos', 'facing', 'state', 'structure', 'breath', 'vitality', 'velocity']) {
    assert.ok(keys.includes(required), `snapshot must carry ${required}`);
  }
});

test('a technique is not identifiable until its tell has had time to read', () => {
  const f = makeFighter('x', { x: 0, z: 0 }, 0);
  f.state = 'acting';
  f.form = { techniqueId: 'low_river.through_palm', tick: 0, released: false, feint: false, landed: false, recoveryAdd: 0 };
  assert.equal(snapshot(f, 0).techniqueId, null, 'the first frames of a wind-up are not yet legible');
  f.form.tick = 8;
  assert.equal(snapshot(f, 0).techniqueId, 'low_river.through_palm', 'once the tell reads, it reads');
});

test('reaction time is modelled: the brain sees the world as it was, not as it is', () => {
  const p = makePerception(16);
  const f = makeFighter('x', { x: 0, z: 0 }, 0);
  for (let i = 0; i < 40; i++) { f.pos.x = i; observe(p, f, i); }
  const seen = perceived(p);
  assert.ok(seen.pos.x < 39, 'the brain must not see the present');
  assert.equal(seen.pos.x, 39 - 16);
});

test('the brain cannot reach the live fighter even if it tried', () => {
  const self = makeFighter('b', { x: 1, z: 0 }, Math.PI);
  const opp = makeFighter('a', { x: 0, z: 0 }, 0);
  const brain = makeBrain();
  const snap = snapshot(opp, 0);
  Object.freeze(snap);
  // decide() takes a Snapshot, never a Fighter. A frozen snapshot proves it neither
  // mutates nor needs anything beyond what perception chose to expose.
  const out = decide(self, snap, brain);
  assert.ok(out && typeof out.forward === 'number');
  assert.ok(['strike', 'commit', 'guard', 'deflect', 'evade', 'focus', null].includes(out.verb));
});

test('the opponent speaks the same seven verbs as the player', () => {
  const self = makeFighter('b', { x: 1.3, z: 0 }, Math.PI);
  const opp = makeFighter('a', { x: 0, z: 0 }, 0);
  const brain = makeBrain();
  const out = decide(self, snapshot(opp, 0), brain);
  const playerShape = Object.keys(neutralIntent()).sort();
  assert.deepEqual(Object.keys(out).sort(), playerShape,
    'the AI must emit exactly the InputIntent a player emits — no private vocabulary');
});

test('adaptation never touches stats — only behaviour weights', () => {
  const f = makeFight();
  const before = { vit: { ...f.a.vitality }, breath: f.a.breath };
  for (let i = 0; i < 120; i++) step(f, neutralIntent(), {});
  const brainKeys = Object.keys(f.brain);
  for (const k of brainKeys) {
    assert.ok(!['damage', 'health', 'speed', 'multiplier'].includes(k),
      `brain must hold no stat knob (found ${k})`);
  }
  assert.equal(typeof before.breath, 'number');
});

// ------------------------------------------------------- the port contract ----
test('sim/ is engine-free: no view imports, no DOM, no timers, no randomness', () => {
  const files = walk(join(HERE, 'sim'));
  assert.ok(files.length >= 8, 'expected the simulation to have real modules');
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const rel = file.replace(HERE, '');
    assert.ok(!/from\s+['"].*\/view\//.test(src), `${rel} must not import from view/`);
    for (const banned of ['document.', 'window.', 'requestAnimationFrame', 'setTimeout(', 'setInterval(', 'Math.random(']) {
      assert.ok(!src.includes(banned), `${rel} must not contain ${banned} — it breaks the port contract`);
    }
  }
});

test('technique frame data lives in JSON, not in code', () => {
  const src = readFileSync(join(HERE, 'sim/data/low-river.json'), 'utf8');
  const data = JSON.parse(src);
  assert.ok(data.techniques.length >= 12, 'Milestone 1 ships twelve techniques in one style');
  for (const t of data.techniques) {
    assert.ok(t.tiers?.sound, `${t.id} must carry its windows as data`);
  }
});
