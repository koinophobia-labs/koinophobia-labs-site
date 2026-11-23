/**
 * StructureModel — TECHNICAL_ARCHITECTURE.md §3.4, COMBAT_SYSTEM.md §2.
 *
 * Structure is NOT a bar. It is a base with four quadrants — fore, rear, leadSide,
 * rearSide — held relative to the fighter's own facing. Which quadrant absorbs a blow
 * is decided by geometry, not by the attacker's choice of move. That is the whole
 * reason footwork exists mechanically rather than cosmetically.
 */
import { MAX, STRUCTURE_RECOVERY, LINE, QUADRANTS } from './constants.js';

/**
 * How long a quadrant stays collapsed once it is emptied.
 *
 * Canon (COMBAT_SYSTEM.md §2) wants a two-stage break: a quadrant hits zero, and the
 * NEXT force through it dumps you off your base. Without a latch that window is
 * vanishingly small, because recovery nudges the quadrant back above zero between
 * blows and the break never fires. A collapsed quadrant therefore stops recovering
 * and cannot bear weight until it is re-established — which is also exactly what
 * "you cannot bear weight in that direction" describes.
 */
export const COLLAPSE_TICKS = 100;

/** @typedef {'fore'|'rear'|'leadSide'|'rearSide'} Quadrant */

const TAU = Math.PI * 2;

/** Wrap to (-PI, PI]. */
export function wrapAngle(a) {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

/**
 * Which of the defender's quadrants faces the incoming force.
 *
 * `toAttacker` is the world-space bearing from the defender to whoever is hitting them.
 * A blow arriving from in front degrades `fore`; circle to their flank and the same blow
 * starts landing on a side quadrant they are not defending.
 *
 * leadSide is the fighter's left, rearSide their right (orthodox Low River stance).
 *
 * @param {number} defenderFacing radians
 * @param {number} toAttacker radians
 * @returns {Quadrant}
 */
export function quadrantFromIncoming(defenderFacing, toAttacker) {
  const rel = wrapAngle(toAttacker - defenderFacing);
  const a = Math.abs(rel);
  if (a <= Math.PI / 4) return 'fore';
  if (a >= (3 * Math.PI) / 4) return 'rear';
  return rel > 0 ? 'leadSide' : 'rearSide';
}

/** Quadrants sharing an edge with the given one — force spills into them. */
const ADJACENT = {
  fore: ['leadSide', 'rearSide'],
  rear: ['leadSide', 'rearSide'],
  leadSide: ['fore', 'rear'],
  rearSide: ['fore', 'rear'],
};

/** @returns {{fore:number, rear:number, leadSide:number, rearSide:number}} */
export function freshStructure() {
  return {
    fore: MAX.quadrant, rear: MAX.quadrant, leadSide: MAX.quadrant, rearSide: MAX.quadrant,
    collapse: { fore: 0, rear: 0, leadSide: 0, rearSide: 0 },
  };
}

/** Deep copy — the collapse counters must not be shared by reference. */
export function cloneStructure(st) {
  return { ...st, collapse: { ...st.collapse } };
}

export function isCollapsed(st, q) { return st.collapse[q] > 0; }

/**
 * Apply directional force to a base.
 *
 * A Structure Break happens when a quadrant is already at zero AND force is driven
 * through it — the fighter is dumped off their base in that direction. Reaching zero
 * is not itself the break; being hit again once you have nothing left is.
 *
 * @param {{fore:number,rear:number,leadSide:number,rearSide:number}} structure mutated
 * @param {Quadrant} quadrant
 * @param {number} force
 * @returns {{broke:boolean, quadrant:Quadrant, before:number, after:number}}
 */
export function applyForce(structure, quadrant, force) {
  const before = structure[quadrant];
  // Driving force through a quadrant that has already collapsed is the break.
  const broke = structure.collapse[quadrant] > 0 && force > 0;
  structure[quadrant] = Math.max(0, before - force);
  if (structure[quadrant] <= 0) structure.collapse[quadrant] = COLLAPSE_TICKS;

  const spill = force * 0.22;
  for (const adj of ADJACENT[quadrant]) {
    structure[adj] = Math.max(0, structure[adj] - spill);
    if (structure[adj] <= 0) structure.collapse[adj] = COLLAPSE_TICKS;
  }
  if (broke) structure.collapse[quadrant] = 0; // the break resolves the collapse
  return { broke, quadrant, before, after: structure[quadrant] };
}

/**
 * Recovery by footwork. Standing still recovers slowly; panicking recovers not at all;
 * Low River recovers best while advancing and worst while retreating (MARTIAL_STYLES.md §3).
 *
 * @param {{fore:number,rear:number,leadSide:number,rearSide:number}} structure mutated
 * @param {'advancing'|'retreating'|'lateral'|'settling'|'idle'|'acting'|'gassed'} mode
 * @param {number} lineTier
 */
export function recoverStructure(structure, mode, lineTier = 0) {
  // Collapse counters always run down, even mid-technique: the base is being re-found.
  for (const q of QUADRANTS) {
    if (structure.collapse[q] > 0) structure.collapse[q]--;
  }
  const base = STRUCTURE_RECOVERY[mode] ?? 0;
  if (base <= 0) return;
  // Holding the Line settles the base faster; it is what the style is for.
  const rate = base * (1 + lineTier * 0.10);
  for (const q of QUADRANTS) {
    if (structure.collapse[q] > 0) continue; // a collapsed quadrant does not recover
    structure[q] = Math.min(MAX.quadrant, structure[q] + rate);
  }
}

/**
 * A quadrant at or near zero cannot bear weight: you cannot advance into a broken
 * fore, and you cannot retreat into a broken rear. Movement is gated, not merely slowed.
 * @returns {number} 0..1 multiplier on movement in that direction
 */
export function bearing(structure, quadrant) {
  if (structure.collapse[quadrant] > 0) return 0; // no weight on a collapsed base
  const v = structure[quadrant] / MAX.quadrant;
  if (v <= 0.001) return 0;
  if (v < 0.25) return 0.35 + v;
  return 1;
}

/** The quadrant a fighter is most exposed on — what an opponent should be hunting. */
export function weakest(structure) {
  let q = 'fore';
  for (const k of QUADRANTS) {
    if (structure[k] < structure[q]) q = k;
  }
  return /** @type {Quadrant} */ (q);
}

/** Mean integrity 0..1 — for presentation and AI weighting only; never shown as a bar. */
export function integrity(structure) {
  return (structure.fore + structure.rear + structure.leadSide + structure.rearSide) / (4 * MAX.quadrant);
}

/** Line tier 0..3 from the accumulated Line value (MARTIAL_STYLES.md §3). */
export function lineTier(line) {
  return Math.max(0, Math.min(LINE.maxTier, Math.floor(line)));
}
