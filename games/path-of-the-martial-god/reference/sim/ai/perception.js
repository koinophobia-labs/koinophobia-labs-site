/**
 * Perception — COMBAT_SYSTEM.md §11, fairness rule 1.
 *
 * "No input reading, ever. The AI's perception layer sees only what a person could
 * see: your pose, velocity, facing, distance, current animation state AFTER its
 * startup has become visible, and its own memory."
 *
 * This is enforced STRUCTURALLY, not by discipline: the brain is handed a Snapshot
 * and has no reference to the live fighter or to any input. A Snapshot deliberately
 * carries no `form.released`, no verb, no intent, and no `will` — Will is hidden.
 * `tests/fairness.test.js` asserts these fields never appear.
 */
import { PERCEPTION } from '../constants.js';
import { phaseOf } from '../formMachine.js';
import { technique } from '../techniques.js';
import { cloneStructure } from '../structure.js';

/** Ticks of startup that must elapse before a technique is visually identifiable. */
const TELL_VISIBLE_AFTER = 4;

/**
 * @typedef {object} Snapshot
 * @property {number} tick
 * @property {{x:number,z:number}} pos
 * @property {number} facing
 * @property {string} state
 * @property {string|null} phase
 * @property {string|null} tell what the body is showing — null until the tell reads
 * @property {string|null} techniqueId null until the tell reads
 * @property {{fore:number,rear:number,leadSide:number,rearSide:number}} structure posture is visible
 * @property {number} breath shoulders and sound are visible
 * @property {Record<string,number>} vitality injury is visible
 * @property {{x:number,z:number}} velocity
 */

export function makePerception(latencyTicks) {
  const latency = Math.max(
    PERCEPTION.minLatencyTicks,
    Math.min(PERCEPTION.maxLatencyTicks, Math.round(latencyTicks)),
  );
  return { latency, buffer: /** @type {Snapshot[]} */ ([]) };
}

/**
 * Take a snapshot of what is externally observable about a fighter.
 * Everything omitted here is, by construction, invisible to any brain.
 * @returns {Snapshot}
 */
export function snapshot(f, tick) {
  const phase = phaseOf(f);
  const visible = f.state === 'acting' && f.form.tick >= TELL_VISIBLE_AFTER;
  const t = visible && f.form.techniqueId ? technique(f.form.techniqueId) : null;
  return {
    tick,
    pos: { x: f.pos.x, z: f.pos.z },
    facing: f.facing,
    state: f.state,
    phase,
    tell: t ? t.tell : null,
    techniqueId: t ? t.id : null,
    structure: cloneStructure(f.structure),
    breath: f.breath,
    vitality: { ...f.vitality },
    velocity: { x: f.lastMove.x, z: f.lastMove.z },
  };
}

/** Record what is observable this tick. */
export function observe(p, f, tick) {
  p.buffer.push(snapshot(f, tick));
  const keep = p.latency + 4;
  while (p.buffer.length > keep) p.buffer.shift();
}

/**
 * What the brain is allowed to believe right now: the world as it was `latency`
 * ticks ago. Reaction time is modelled, never instant.
 * @returns {Snapshot|null}
 */
export function perceived(p) {
  if (p.buffer.length === 0) return null;
  const idx = Math.max(0, p.buffer.length - 1 - p.latency);
  return p.buffer[idx];
}
