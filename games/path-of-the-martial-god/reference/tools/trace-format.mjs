/**
 * The parity trace format — the contract between the reference oracle and any
 * production port of the simulation.
 *
 * A trace file carries THREE things:
 *   options  the exact makeFight() options, so both sides start identically
 *   inputs   the exact per-tick player input, so neither side needs the script
 *   frames   the reference's per-tick state, which the port must reproduce
 *   events   the reference's event stream, which the port must reproduce in order
 *
 * A port therefore never needs to reimplement a test script: it reads `inputs`,
 * replays them, and emits its own {frames, events} in this same shape. The verifier
 * is language-neutral and lives on the JS side, so the comparison logic exists once.
 *
 * FIELD CLASSES — these decide how a difference is judged.
 *
 *   DISCRETE   must match EXACTLY. Any difference is a port defect: the two
 *              simulations have taken different branches and everything after is
 *              meaningless. State names, technique ids, integer frame counters,
 *              collapse counters, event types and their order.
 *
 *   CONTINUOUS must match within a documented tolerance. Exact bit equality across
 *              languages is not achievable: JavaScript engines implement Math.hypot,
 *              atan2, sin and cos in their own code, Swift calls the platform libm,
 *              and the two disagree in the last ulp. Tolerances below are chosen to
 *              be far tighter than anything gameplay could perceive while leaving
 *              room for that.
 */

export const FORMAT_VERSION = 2;
// v2 added `bufferedVerb`. A port that gets the input buffer wrong diverges anyway —
// but several ticks later, in `state`, where the cause is no longer visible. The
// buffer decides a branch, so it is captured where the branch is decided.

/** Absolute tolerances for continuous fields. Units are metres, radians, or points. */
export const TOLERANCE = {
  'pos.x': 1e-4,          // 0.1 mm
  'pos.z': 1e-4,
  facing: 1e-4,           // ~0.006 degrees
  'structure.fore': 1e-3,
  'structure.rear': 1e-3,
  'structure.leadSide': 1e-3,
  'structure.rearSide': 1e-3,
  breath: 1e-3,
  will: 1e-3,
  line: 1e-4,
  'vitality.head': 1e-3,
  'vitality.torso': 1e-3,
  'vitality.leadArm': 1e-3,
  'vitality.rearArm': 1e-3,
  'vitality.leadLeg': 1e-3,
  'vitality.rearLeg': 1e-3,
};

/** Fields that must match exactly. A mismatch here means the branches diverged. */
export const DISCRETE = [
  'state', 'techniqueId', 'formTick', 'feint', 'landed', 'bufferedVerb',
  'collapse.fore', 'collapse.rear', 'collapse.leadSide', 'collapse.rearSide',
  'guardTicks', 'stateTicks',
];

/** Capture one fighter in the trace shape. Order is stable for readable diffs. */
export function captureFighter(f) {
  return {
    state: f.state,
    techniqueId: f.form.techniqueId ?? null,
    formTick: f.form.tick,
    feint: !!f.form.feint,
    landed: !!f.form.landed,
    // The verb waiting to be honoured, if any. Hidden state, but state that decides
    // what happens next — so the port has to reproduce it, not merely end up somewhere
    // similar. The age is deliberately not captured: an off-by-one there shows up here
    // one tick later as a buffer that fired or expired when it should not have.
    bufferedVerb: f.buffer ? f.buffer.verb : null,
    pos: { x: f.pos.x, z: f.pos.z },
    facing: f.facing,
    structure: {
      fore: f.structure.fore, rear: f.structure.rear,
      leadSide: f.structure.leadSide, rearSide: f.structure.rearSide,
    },
    collapse: { ...f.structure.collapse },
    breath: f.breath,
    will: f.will,
    line: f.line,
    guardTicks: f.guardTicks,
    stateTicks: f.stateTicks,
    vitality: { ...f.vitality },
  };
}

/** Capture the fight-level state that is not inside a fighter. */
export function captureFight(fight) {
  return {
    tick: fight.tick,
    a: captureFighter(fight.a),
    b: captureFighter(fight.b),
    inch: fight.inch
      ? { actorId: fight.inch.actorId, targetId: fight.inch.targetId, ticksLeft: fight.inch.ticksLeft, total: fight.inch.total }
      : null,
    over: fight.over
      ? { winnerId: fight.over.winnerId, reason: fight.over.reason, terminal: fight.over.terminal }
      : null,
  };
}

/** Events are compared on type, subject and order — not on floating payloads. */
export function captureEvent(e) {
  return {
    tick: e.tick,
    type: e.type,
    who: e.who ?? null,
    by: e.by ?? null,
    technique: e.technique ?? null,
    quadrant: e.quadrant ?? null,
    region: e.region ?? null,
    actor: e.actor ?? null,
    target: e.target ?? null,
    executed: e.executed ?? null,
    winnerId: e.winnerId ?? null,
    reason: e.reason ?? null,
  };
}
