/**
 * Fighter state — TECHNICAL_ARCHITECTURE.md §3.1 (FighterState).
 * Plain serialisable data. No behaviour beyond construction and small pure readers.
 */
import { MAX, REGIONS } from './constants.js';
import { freshStructure, cloneStructure, lineTier as tierOf } from './structure.js';

/** @typedef {'neutral'|'acting'|'guard'|'staggered'|'down'|'finished'} FormState */

/**
 * @typedef {object} Fighter
 * @property {string} id
 * @property {string} style
 * @property {number} mastery 0..1 — drives the Final Inch window and, later, the Stop
 * @property {{x:number,z:number}} pos metres on the ground plane
 * @property {number} facing radians
 * @property {FormState} state
 * @property {{techniqueId:string|null, tick:number, released:boolean, feint:boolean, landed:boolean, recoveryAdd:number}} form
 * @property {{fore:number,rear:number,leadSide:number,rearSide:number}} structure
 * @property {number} breath
 * @property {number} will
 * @property {Record<string, number>} vitality
 * @property {number} line
 * @property {number} guardTicks how long the guard has actually been up
 * @property {number} stateTicks
 * @property {string} moveMode
 * @property {{x:number,z:number}} lastMove
 * @property {number} reaction perception latency in ticks (AI only)
 */

/**
 * @param {string} id
 * @param {{x:number,z:number}} pos
 * @param {number} facing
 * @param {Partial<Fighter>} [over]
 * @returns {Fighter}
 */
export function makeFighter(id, pos, facing, over = {}) {
  /** @type {Record<string, number>} */
  const vitality = {};
  for (const r of REGIONS) vitality[r] = MAX.region[r];
  return {
    id,
    style: 'low_river',
    mastery: 0.5,
    pos: { x: pos.x, z: pos.z },
    facing,
    state: 'neutral',
    form: { techniqueId: null, tick: 0, released: false, feint: false, landed: false, recoveryAdd: 0 },
    structure: freshStructure(),
    breath: MAX.breath,
    will: MAX.will,
    vitality,
    line: 0,
    guardTicks: 0,
    stateTicks: 0,
    moveMode: 'idle',
    lastMove: { x: 0, z: 0 },
    staggerTicks: 0,
    buffer: /** @type {null|{verb:string,ttl:number}} */ (null),
    reaction: 16,
    ...over,
  };
}

/** Total remaining vitality as a fraction 0..1. Never shown as a bar. */
export function vitalityFraction(f) {
  let cur = 0, max = 0;
  for (const r of REGIONS) { cur += f.vitality[r]; max += MAX.region[r]; }
  return cur / max;
}

/** A region at zero is an injury: it changes what the body can do, visibly. */
export function injured(f, region) { return f.vitality[region] <= 0; }

/** Gassed — COMBAT_SYSTEM.md §2. Entirely self-inflicted, and the worst place to be. */
export function gassed(f) { return f.breath <= 0.001; }

export function lineTier(f) { return tierOf(f.line); }

/** Can this fighter begin a new action at all? */
export function actionable(f) {
  return f.state === 'neutral' || f.state === 'guard';
}

/** Distance between two fighters, metres. */
export function distance(a, b) { return Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z); }

/** World bearing from `from` to `to`. */
export function bearingTo(from, to) { return Math.atan2(to.pos.z - from.pos.z, to.pos.x - from.pos.x); }

/** Deep copy for replay/rollback. Structured, explicit, no prototypes. */
export function cloneFighter(f) {
  return {
    ...f,
    pos: { ...f.pos },
    form: { ...f.form },
    structure: cloneStructure(f.structure),
    vitality: { ...f.vitality },
    lastMove: { ...f.lastMove },
    buffer: f.buffer ? { ...f.buffer } : null,
  };
}
