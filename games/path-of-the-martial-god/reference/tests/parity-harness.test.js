/**
 * The parity harness is the gate the production port must pass. A gate that cannot
 * fail is not a gate, so these tests corrupt a known-good trace in each way a real
 * port defect would and assert the verifier catches it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SCENARIOS, produce } from '../tools/trace.mjs';
import { compare } from '../tools/verify-trace.mjs';
import { TOLERANCE } from '../tools/trace-format.mjs';

const FIXTURE = new URL('../traces/angle-and-strike.json', import.meta.url).pathname;
const load = async () => JSON.parse(await readFile(FIXTURE, 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const actualOf = (t) => ({ frames: t.frames, events: t.events });

test('a trace verifies against itself', async () => {
  const t = await load();
  const r = compare(t, actualOf(t));
  assert.equal(r.pass, true, JSON.stringify(r.problems.slice(0, 3)));
});

test('the oracle is deterministic: regenerating reproduces the committed trace', async () => {
  const committed = await load();
  const regenerated = produce(SCENARIOS.find((s) => s.name === 'angle-and-strike'));
  assert.equal(JSON.stringify(regenerated.frames), JSON.stringify(committed.frames),
    'the committed fixture no longer matches what the oracle produces — regenerate or investigate');
  assert.equal(JSON.stringify(regenerated.events), JSON.stringify(committed.events));
});

test('float drift INSIDE tolerance passes', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const nudge = TOLERANCE['pos.x'] * 0.5;
  for (const f of a.frames) { f.a.pos.x += nudge; f.b.breath += TOLERANCE.breath * 0.5; }
  const r = compare(t, a);
  assert.equal(r.pass, true, 'tolerance must absorb last-ulp cross-language differences');
});

test('float drift BEYOND tolerance fails and names the field', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  a.frames[120].a.pos.x += TOLERANCE['pos.x'] * 10;
  const r = compare(t, a);
  assert.equal(r.pass, false);
  const p = r.problems.find((x) => x.kind === 'tolerance');
  assert.ok(p, 'expected a tolerance problem');
  assert.equal(p.path, 'a.pos.x');
  assert.equal(p.tick, 120);
});

test('a changed discrete state fails, however small', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.frames.findIndex((f) => f.a.state === 'acting');
  a.frames[i].a.state = 'neutral';
  const r = compare(t, a);
  assert.equal(r.pass, false);
  assert.equal(r.firstDiscrete.path, 'a.state');
});

test('a changed technique id fails', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.frames.findIndex((f) => f.b.techniqueId);
  a.frames[i].b.techniqueId = 'low_river.jab';
  const r = compare(t, a);
  assert.equal(r.pass, false);
});

test('an off-by-one frame counter fails — timing truth is not negotiable', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.frames.findIndex((f) => f.a.formTick > 2);
  a.frames[i].a.formTick += 1;
  const r = compare(t, a);
  assert.equal(r.pass, false);
  assert.equal(r.firstDiscrete.path, 'a.formTick');
});

test('a wrong collapse counter fails', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  a.frames[300].a.collapse.fore += 1;
  const r = compare(t, a);
  assert.equal(r.pass, false);
});

test('a dropped event fails', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  a.events.splice(10, 1);
  const r = compare(t, a);
  assert.equal(r.pass, false);
  assert.ok(r.problems.some((p) => p.kind === 'events' || p.kind === 'event'));
});

test('events out of order fail', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.events.findIndex((e, k) => k > 0 && e.type !== a.events[k - 1].type);
  [a.events[i], a.events[i - 1]] = [a.events[i - 1], a.events[i]];
  const r = compare(t, a);
  assert.equal(r.pass, false);
});

test('a fight that ends early fails on length', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  a.frames = a.frames.slice(0, a.frames.length - 5);
  const r = compare(t, a);
  assert.equal(r.pass, false);
  assert.ok(r.problems.some((p) => p.kind === 'length'));
});

test('a wrong buffered verb fails — hidden state is still state', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.frames.findIndex((f) => f.a.bufferedVerb !== null);
  assert.ok(i >= 0, 'this fixture no longer exercises the input buffer at all');
  a.frames[i].a.bufferedVerb = null;
  const r = compare(t, a);
  assert.equal(r.pass, false);
  assert.equal(r.firstDiscrete.path, 'a.bufferedVerb');
  assert.equal(r.firstDiscrete.tick, i);
});

test('a port that omits its null keys is not thereby wrong', async () => {
  // Swift's synthesised Codable encodes optionals with `encodeIfPresent`, so a nil
  // techniqueId or bufferedVerb produces no key at all. That is the encoder's habit,
  // not a simulation difference, and it describes most frames of most fights.
  const t = await load();
  const a = clone(actualOf(t));
  for (const f of a.frames) {
    for (const who of ['a', 'b']) {
      if (f[who].techniqueId === null) delete f[who].techniqueId;
      if (f[who].bufferedVerb === null) delete f[who].bufferedVerb;
    }
  }
  const r = compare(t, a);
  assert.equal(r.pass, true, JSON.stringify(r.problems.slice(0, 3)));
});

test('but a genuinely missing value still fails', async () => {
  const t = await load();
  const a = clone(actualOf(t));
  const i = a.frames.findIndex((f) => f.a.techniqueId !== null);
  delete a.frames[i].a.techniqueId;
  const r = compare(t, a);
  assert.equal(r.pass, false, 'dropping a key that carried a real value must fail');
  assert.equal(r.firstDiscrete.path, 'a.techniqueId');
});

test('every committed trace verifies against itself and covers its mechanic', async () => {
  for (const s of SCENARIOS) {
    const path = new URL(`../traces/${s.name}.json`, import.meta.url).pathname;
    const t = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(compare(t, actualOf(t)).pass, true, `${s.name} failed self-verification`);
    assert.ok(t.inputs.length === t.frames.length, `${s.name}: inputs and frames must be 1:1`);
    assert.ok(t.frames.length > 100, `${s.name}: too short to be meaningful`);
  }
});

test('the trace set exercises breaks, the Inch and a terminal', async () => {
  const seen = new Set();
  for (const s of SCENARIOS) {
    const path = new URL(`../traces/${s.name}.json`, import.meta.url).pathname;
    const t = JSON.parse(await readFile(path, 'utf8'));
    for (const e of t.events) seen.add(e.type);
  }
  for (const required of ['hit', 'guarded', 'whiff', 'break', 'feint', 'gassed', 'inch_open', 'terminal', 'over']) {
    assert.ok(seen.has(required), `no committed trace exercises "${required}"`);
  }
});

test('the committed traces exercise the input buffer', async () => {
  // Without this the fixtures can quietly stop covering the buffer, and a port would
  // pass the gate with the same dead code the reference shipped for all of M1.
  let buffered = 0, scenarios = 0;
  for (const s of SCENARIOS) {
    const path = new URL(`../traces/${s.name}.json`, import.meta.url).pathname;
    const t = JSON.parse(await readFile(path, 'utf8'));
    const n = t.frames.filter((f) => f.a.bufferedVerb !== null).length;
    buffered += n;
    if (n > 0) scenarios++;
  }
  assert.ok(buffered > 50, `only ${buffered} frames across all traces hold a buffered press`);
  assert.ok(scenarios >= 4, `only ${scenarios} scenarios exercise the buffer`);
});
