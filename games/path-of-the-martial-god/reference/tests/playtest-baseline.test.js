/**
 * The playtest baseline label.
 *
 * A result is only meaningful against the build that produced it. The input-buffer
 * fix broke that comparability: before it, 27.1% of presses made while the body was
 * busy were silently discarded, so a pre-fix session measured whether the interface
 * dropped the player's command at least as much as whether the player understood the
 * fight. Those results are still real data about that build, so they are labelled —
 * never deleted.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE, PRIOR_BASELINE } from '../view/build.js';
import { makeTelemetry, persist, load, summarise, consume } from '../view/telemetry.js';

const KEY = 'pomg.m1.playtest';

/** The smallest localStorage that behaves like one, including throwing when asked. */
function stubStorage({ readOnly = false } = {}) {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (readOnly) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
  };
  return map;
}

/** A record exactly as the pre-fix build wrote it: no baseline field at all. */
const legacyRow = () => ({
  at: '2026-09-14T12:00:00.000Z',
  metrics: { duration_s: 41.2, winner: 'opponent' },
  survey: { control: 'The opponent', danger: 'Rarely' },
});

beforeEach(() => { stubStorage(); });

test('a fight recorded now carries the current baseline', () => {
  persist(makeTelemetry(), { control: 'Me' });
  const [row] = load();
  assert.equal(row.baseline, BASELINE);
  assert.equal(row.baseline, 'REFERENCE v2 / INPUT BUFFER FIXED');
});

test('a pre-fix result is labelled, not deleted', () => {
  const map = stubStorage();
  map.set(KEY, JSON.stringify([legacyRow()]));

  const rows = load();
  assert.equal(rows.length, 1, 'the old result must survive');
  assert.equal(rows[0].baseline, PRIOR_BASELINE);
  assert.equal(rows[0].baseline, 'PRE-BUFFER / INVALID FOR CURRENT INPUT-READABILITY BASELINE');
  assert.equal(rows[0].metrics.duration_s, 41.2, 'its metrics must be untouched');
  assert.deepEqual(rows[0].survey, { control: 'The opponent', danger: 'Rarely' },
    'its answers must be untouched');
});

test('the label is written back, so an export later still carries it', () => {
  const map = stubStorage();
  map.set(KEY, JSON.stringify([legacyRow()]));
  load();
  const stored = JSON.parse(map.get(KEY));
  assert.equal(stored[0].baseline, PRIOR_BASELINE, 'the migration must persist');
});

test('labelling is idempotent and never relabels a current result', () => {
  const map = stubStorage();
  map.set(KEY, JSON.stringify([legacyRow()]));
  load(); load(); load();
  persist(makeTelemetry(), null);
  const rows = load();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].baseline, PRIOR_BASELINE);
  assert.equal(rows[1].baseline, BASELINE);
});

test('the two baselines are never the same string', () => {
  assert.notEqual(BASELINE, PRIOR_BASELINE);
});

test('unwritable storage degrades to reading, and still labels what it returns', () => {
  // A private window, or storage the browser refuses to write. The label still has to
  // reach anything the reviewer reads, even if it cannot be saved back.
  const map = stubStorage();
  map.set(KEY, JSON.stringify([legacyRow()]));
  stubStorage({ readOnly: true });
  globalThis.localStorage.getItem = () => JSON.stringify([legacyRow()]);
  const rows = load();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].baseline, PRIOR_BASELINE);
});

test('corrupt storage yields nothing rather than throwing', () => {
  const map = stubStorage();
  map.set(KEY, 'not json at all');
  assert.deepEqual(load(), []);
  map.set(KEY, '{"not":"an array"}');
  assert.deepEqual(load(), []);
});

test('the buffer metric counts a technique begun with no live press', () => {
  // The only telemetry the buffer fix adds. A `begin` on a tick where no verb was
  // pressed can only have come from the buffer: the new-action block takes the live
  // verb first.
  const t = makeTelemetry();
  const fight = { a: { id: 'player', breath: 80 }, b: { id: 'opponent', breath: 80 } };
  const begin = { type: 'begin', who: 'player', technique: 'low_river.jab' };

  consume(t, [begin], fight, { verb: 'strike' });
  assert.equal(t.bufferedHonoured.player, 0, 'a live press is not a buffered one');

  consume(t, [begin], fight, { verb: null });
  assert.equal(t.bufferedHonoured.player, 1);

  assert.equal(summarise(t).presses_honoured_from_buffer.you, 1);
  assert.equal(summarise(t).presses_honoured_from_buffer.him, 0);
});
