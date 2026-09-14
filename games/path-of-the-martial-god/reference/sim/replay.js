/**
 * Replay — TECHNICAL_ARCHITECTURE.md §3.1.
 *
 * The combat core is a pure function of (state, input), so a fight is fully described
 * by its options plus its per-tick input stream. That buys three things at once:
 * regression tests, the future Meditation feature, and a fair adaptive-AI story.
 */
import { makeFight, step } from './fight.js';

export function makeRecording(opts = {}) {
  return { opts, inputs: /** @type {any[]} */ ([]) };
}

/** @param {any} rec @param {import('./formMachine.js').InputIntent} input */
export function record(rec, input, choice) {
  rec.inputs.push({ ...input, _t: choice?.terminal ?? null });
}

/**
 * Replay a recording to completion and return the resulting fight.
 * @param {any} rec
 */
export function playback(rec) {
  const fight = makeFight(rec.opts);
  for (const raw of rec.inputs) {
    const { _t, ...input } = raw;
    step(fight, input, { terminal: _t });
  }
  return fight;
}

/**
 * A stable fingerprint of fight state. Two runs that diverge by a single tick in a
 * single quadrant produce different digests.
 */
export function digest(fight) {
  const parts = [String(fight.tick)];
  for (const f of [fight.a, fight.b]) {
    parts.push(
      f.id, f.state,
      f.pos.x.toFixed(6), f.pos.z.toFixed(6), f.facing.toFixed(6),
      f.structure.fore.toFixed(4), f.structure.rear.toFixed(4),
      f.structure.leadSide.toFixed(4), f.structure.rearSide.toFixed(4),
      `c${f.structure.collapse.fore}/${f.structure.collapse.rear}/${f.structure.collapse.leadSide}/${f.structure.collapse.rearSide}`,
      f.breath.toFixed(4), f.will.toFixed(4), f.line.toFixed(4),
      Object.keys(f.vitality).sort().map((k) => `${k}:${f.vitality[k].toFixed(3)}`).join(','),
      f.form.techniqueId ?? '-', String(f.form.tick),
      // The buffered verb decides what happens on the next tick, so it belongs in a
      // fingerprint that claims to catch a divergence of one tick in one quadrant.
      f.buffer ? `b:${f.buffer.verb}@${f.buffer.age}` : 'b:-',
    );
  }
  parts.push(fight.over ? `${fight.over.winnerId}/${fight.over.reason}/${fight.over.terminal}` : 'live');
  return parts.join('|');
}

/** Drive a fight with a deterministic scripted input function. Used by tests. */
export function run(fight, inputFor, maxTicks = 60 * 120) {
  let n = 0;
  while (!fight.over && n < maxTicks) {
    const { input, choice } = inputFor(fight, n);
    step(fight, input, choice ?? {});
    n++;
  }
  return fight;
}
