/**
 * FormMachine — TECHNICAL_ARCHITECTURE.md §3.1.
 *
 * Deterministic combat state machine, one per fighter, ticking at a fixed 60Hz.
 * Pure function of (state, input, opponent state). No randomness anywhere in the
 * decision path. Windows come from TechniqueDB, never from animation notifies:
 * animation is driven BY this machine, not the reverse.
 */
import { MOVE, BREATH, LINE, ARENA, MAX, bandFor, INPUT_BUFFER_TICKS } from './constants.js';
import { technique, frames } from './techniques.js';
import { resolve } from './grammar.js';
import { recoverStructure, bearing, wrapAngle, lineTier as tierOf } from './structure.js';
import { actionable, gassed, distance, bearingTo } from './fighter.js';

/**
 * @typedef {object} InputIntent
 * @property {number} forward -1..1 toward the opponent
 * @property {number} lateral -1..1 across the line
 * @property {import('./techniques.js').Verb|null} verb the verb pressed this tick
 * @property {boolean} held is the verb still held
 * @property {boolean} guard is guard held
 */

export function neutralIntent() {
  return { forward: 0, lateral: 0, verb: null, held: false, guard: false };
}

/**
 * The left stick supplies INTENT, not a combo selector (COMBAT_SYSTEM.md §4).
 * This is the whole of "the inputs never change; the meaning of the inputs changes".
 * @returns {import('./techniques.js').Intent}
 */
export function intentFromMove(forward, lateral) {
  const mag = Math.hypot(forward, lateral);
  if (mag < 0.30) return 'neutral';
  if (Math.abs(lateral) > Math.abs(forward) * 1.1) return 'angle';
  return forward > 0 ? 'pressure' : 'retreat';
}

/** Phase of the currently-running technique. */
export function phaseOf(f) {
  if (f.state !== 'acting' || !f.form.techniqueId) return null;
  const t = technique(f.form.techniqueId);
  const fr = frames(t);
  const tick = f.form.tick;
  if (f.form.feint) return tick < fr.startup ? 'startup' : 'recovery';
  if (tick < fr.startup) return 'startup';
  if (tick < fr.startup + fr.active) return 'active';
  return 'recovery';
}

/** Total ticks this technique instance will run for, including any deflect penalty. */
function instanceLength(f, t) {
  const fr = frames(t);
  if (f.form.feint) return fr.startup + Math.ceil(fr.recovery * 0.45);
  const tier = tierOf(f.line);
  const cut = Math.round(fr.recovery * LINE.recoveryCutPerTier * tier);
  return fr.startup + fr.active + Math.max(2, fr.recovery - cut) + f.form.recoveryAdd;
}

/** Begin a technique. Assumes it has already been validated as available. */
export function beginTechnique(f, t) {
  f.state = 'acting';
  f.form = { techniqueId: t.id, tick: 0, released: false, feint: false, landed: false, recoveryAdd: 0 };
  f.stateTicks = 0;
  const cost = frames(t).breath;
  if (cost) f.breath = Math.max(0, f.breath - cost);
}

/** Put a fighter into stagger — dumped off their base in `dir` (world radians). */
export function stagger(f, dir, ticks, push) {
  f.state = 'staggered';
  f.stateTicks = 0;
  f.staggerTicks = ticks;
  f.line = 0;
  f.form.techniqueId = null;
  f.pos.x += Math.cos(dir) * push;
  f.pos.z += Math.sin(dir) * push;
}

export function knockDown(f, dir, push) {
  f.state = 'down';
  f.stateTicks = 0;
  f.line = 0;
  f.form.techniqueId = null;
  f.pos.x += Math.cos(dir) * push;
  f.pos.z += Math.sin(dir) * push;
}

const STAGGER_TICKS = 34;
const DOWN_TICKS = 78;

/**
 * Advance one fighter by one tick.
 *
 * @param {import('./fighter.js').Fighter} f
 * @param {InputIntent} input
 * @param {import('./fighter.js').Fighter} opp
 * @param {(e:any)=>void} emit
 */
export function tickFighter(f, input, opp, emit) {
  f.stateTicks++;

  // ---- input buffer --------------------------------------------------------------
  // Must run BEFORE the early returns below, because the states a buffer exists to
  // serve — acting, staggered, down — are exactly the states those returns exit from.
  tickBuffer(f, input);

  // ---- face the opponent (soft lock: biases facing, never welds it) -------------
  //
  // These rates decide whether ANGLING IS A REAL MECHANIC. Circling at mid range wins
  // roughly 0.022 rad/tick; if re-facing is faster than that in every state, a
  // defender simply rotates to keep you in front and the four-quadrant base collapses
  // into a single front-facing bar. So: a committed fighter can barely turn, a GUARDING
  // fighter turns slower than you can circle (guarding is a commitment to a direction,
  // which is what makes walking around a turtle the answer to a turtle), and only a
  // free fighter re-faces comfortably.
  const want = bearingTo(f, opp);
  const turn = wrapAngle(want - f.facing);
  const turnRate =
    f.state === 'acting' ? 0.010 :
    f.state === 'staggered' || f.state === 'down' ? 0.005 :
    f.state === 'guard' ? 0.016 :
    0.040;
  f.facing += Math.max(-turnRate, Math.min(turnRate, turn));

  // ---- recovery from stagger / knockdown ---------------------------------------
  if (f.state === 'staggered') {
    if (f.stateTicks >= (f.staggerTicks ?? STAGGER_TICKS)) { f.state = 'neutral'; f.stateTicks = 0; }
    // A stagger IS the act of re-finding the base. Without this a broken fighter comes
    // out of the stagger with nothing under them and is broken again on the next blow,
    // which compounds into a spiral no amount of skill can climb out of.
    recoverStructure(f.structure, gassed(f) ? 'gassed' : 'settling', 0);
    breathe(f, 'idle');
    return;
  }
  if (f.state === 'down') {
    if (f.stateTicks >= DOWN_TICKS) { f.state = 'neutral'; f.stateTicks = 0; emit({ type: 'rise', who: f.id }); }
    // Getting up re-establishes the base properly — the one real comeback in the loop.
    recoverStructure(f.structure, gassed(f) ? 'gassed' : 'advancing', 0);
    breathe(f, 'idle');
    return;
  }
  if (f.state === 'finished') return;

  // ---- run the active technique -------------------------------------------------
  if (f.state === 'acting' && f.form.techniqueId) {
    const t = technique(f.form.techniqueId);

    // The Lie (COMBAT_SYSTEM.md §6.1): releasing before the commitment frame turns
    // the technique into a feint. After commitAt, release does nothing — you are committed.
    if (!f.form.feint && !input.held && f.form.tick < (t.commitAt ?? 0) && isOffensive(t)) {
      f.form.feint = true;
      emit({ type: 'feint', who: f.id, technique: t.id });
    }

    applyTechniqueMotion(f, t, opp);
    f.form.tick++;

    if (f.form.tick >= instanceLength(f, t)) {
      f.state = input.guard ? 'guard' : 'neutral';
      f.form.techniqueId = null;
      f.stateTicks = 0;
      f.guardTicks = 0;
    }
    recoverStructure(f.structure, 'acting', tierOf(f.line));
    // Focus IS the deliberate-breathing technique: it must actually recover Breath,
    // otherwise it is a no-op that costs time (COMBAT_SYSTEM.md §3, Focus).
    breathe(f, t.kind === 'Focus' ? 'focus' : 'acting');
    decayLine(f);
    return;
  }

  // ---- cancel window: a recovery may be cancelled only after cancelFrom ----------
  // (there is no universal dodge-cancel; commitment is real)

  // ---- new action ---------------------------------------------------------------
  const d = distance(f, opp);
  const band = bandFor(d);

  // Honour a buffered verb. Control only arrives here when the body is free, which is
  // precisely the moment the buffer exists for. A live press always wins over a
  // remembered one: what you are doing now beats what you meant a tenth of a second ago.
  let verb = input.verb;
  if (!verb && f.buffer) { verb = f.buffer.verb; f.buffer = null; }

  if (actionable(f) && verb) {
    const t = resolve(f.style, verb, intentFromMove(input.forward, input.lateral), band);
    if (t && canUse(f, t)) {
      if (t.verb === 'guard') {
        if (f.state !== 'guard') { f.state = 'guard'; f.guardTicks = 0; f.stateTicks = 0; }
      } else {
        beginTechnique(f, t);
        if (t.kind === 'Evade') {
          // Capture the slip direction now, in world space. Undirected slips go straight back.
          const mag = Math.hypot(input.forward, input.lateral);
          const local = mag < 0.2 ? Math.PI : Math.atan2(input.lateral, input.forward);
          f.form.evadeDir = bearingTo(f, opp) + local;
        }
        emit({ type: 'begin', who: f.id, technique: t.id, tell: t.tell });
        return;
      }
    }
  }

  // ---- guard hold ----------------------------------------------------------------
  if (f.state === 'guard') {
    if (!input.guard) { f.state = 'neutral'; f.guardTicks = 0; }
    else {
      f.guardTicks++;
      f.breath = Math.max(0, f.breath - BREATH.guardDrainPerTick);
    }
  } else if (input.guard && actionable(f)) {
    f.state = 'guard';
    f.guardTicks = 0;
  }

  // ---- locomotion ----------------------------------------------------------------
  const mode = move(f, input, opp);
  recoverStructure(f.structure, gassed(f) ? 'gassed' : mode, tierOf(f.line));
  breathe(f, mode);
  buildLine(f, mode, input);
}

/**
 * Input buffer — COMBAT_SYSTEM.md §3.1, tuned by INPUT_BUFFER_TICKS.
 *
 * A verb pressed while the body is busy is remembered and honoured on the first tick
 * the body is free. Without it the human is strictly disadvantaged: the brain is
 * consulted every tick and therefore acts on the exact frame it becomes actionable,
 * while a person pressing during a recovery has the press silently thrown away.
 *
 * Only the human is served by this. `ai/brain.js` returns `verb: null` whenever it is
 * not actionable, so the opponent never captures anything — which is the whole point.
 * It is not a handicap given to the player; it is the player being given the same
 * frame-accuracy the opponent already had for free.
 *
 * THIS WAS DEAD CODE THROUGHOUT M1. The capture used to live in the new-action block
 * below, where control only arrives once `acting`, `staggered`, `down` and `finished`
 * have already returned — so its `!actionable(f)` test could never be true. Measured
 * across the seven trace scenarios before the fix: 474 of 1747 presses (27.1%) were
 * thrown away and the buffer was populated on 0 ticks. Hence the position of the call
 * at the top of the tick, and hence `input-buffer.test.js`, which fails if it moves.
 *
 * @param {import('./fighter.js').Fighter} f
 * @param {InputIntent} input
 */
function tickBuffer(f, input) {
  if (f.state === 'finished') { f.buffer = null; return; }

  // Capture. A press made this tick has its whole window ahead of it, so it does not
  // also age on the tick it arrives.
  if (input.verb && !actionable(f)) {
    f.buffer = { verb: input.verb, age: 0 };
    return;
  }

  // Age. The memory is deliberately short: a press from half a second ago is not what
  // you mean now, and firing it would feel like the game moving on its own.
  if (f.buffer) {
    f.buffer.age++;
    if (f.buffer.age > INPUT_BUFFER_TICKS) f.buffer = null;
  }
}

function isOffensive(t) {
  return ['Strike', 'Drive', 'Check', 'Displace', 'Break'].includes(t.kind);
}

/** Gate on Line requirements and on a base that cannot bear the technique. */
export function canUse(f, t) {
  if (t.requiresLineTier && tierOf(f.line) < t.requiresLineTier) return false;
  // You cannot drive forward off a fore quadrant that cannot carry you.
  if ((t.advance ?? 0) > 0.25 && bearing(f.structure, 'fore') <= 0) return false;
  return true;
}

/** Techniques carry their own motion — a Drive walks you in, a Check gives ground. */
function applyTechniqueMotion(f, t, opp) {
  const ph = phaseOf(f);

  // A slip is a burst along the direction chosen at the moment it was pressed.
  // Whether that direction was the right one is decided in resolve.js, not here.
  if (t.kind === 'Evade') {
    if (ph === 'active' && typeof f.form.evadeDir === 'number') {
      const step = t.evade?.burst ?? 0;
      f.pos.x += Math.cos(f.form.evadeDir) * step;
      f.pos.z += Math.sin(f.form.evadeDir) * step;
      clampToArena(f);
    }
    return;
  }

  if (ph !== 'startup' && ph !== 'active') return;
  const fr = frames(t);
  const span = Math.max(1, fr.startup + fr.active);
  const adv = (t.advance ?? 0) / span;
  const lat = (t.lateral ?? 0) / span;
  const fwd = bearingTo(f, opp);
  const scale = f.form.feint ? 0.35 : 1;
  f.pos.x += (Math.cos(fwd) * adv + Math.cos(fwd + Math.PI / 2) * lat) * scale;
  f.pos.z += (Math.sin(fwd) * adv + Math.sin(fwd + Math.PI / 2) * lat) * scale;
  clampToArena(f);
}

/** @returns {string} move mode, which decides structure recovery */
function move(f, input, opp) {
  const fwd = bearingTo(f, opp);
  let fx = input.forward, lx = input.lateral;
  const mag = Math.hypot(fx, lx);
  if (mag < 0.12) { f.moveMode = f.state === 'guard' ? 'settling' : 'idle'; f.lastMove = { x: 0, z: 0 }; return f.moveMode; }
  if (mag > 1) { fx /= mag; lx /= mag; }

  // A quadrant that cannot bear weight cannot be moved into. This is the whole
  // point of the base being spatial: being walked backward has consequences.
  const fwdGate = fx > 0 ? bearing(f.structure, 'fore') : bearing(f.structure, 'rear');
  const latGate = lx > 0 ? bearing(f.structure, 'leadSide') : bearing(f.structure, 'rearSide');

  const speedF = (fx > 0 ? MOVE.advance : MOVE.retreat) * fwdGate;
  const speedL = MOVE.lateral * latGate;
  const gScale = f.state === 'guard' ? MOVE.guardScale : 1;
  const injuryScale = (f.vitality.leadLeg <= 0 || f.vitality.rearLeg <= 0) ? 0.72 : 1;
  const gasScale = gassed(f) ? 0.66 : 1;
  const k = gScale * injuryScale * gasScale;

  const dx = (Math.cos(fwd) * fx * speedF + Math.cos(fwd + Math.PI / 2) * lx * speedL) * k;
  const dz = (Math.sin(fwd) * fx * speedF + Math.sin(fwd + Math.PI / 2) * lx * speedL) * k;
  f.pos.x += dx; f.pos.z += dz;
  f.lastMove = { x: dx, z: dz };
  clampToArena(f);

  if (Math.abs(lx) > Math.abs(fx) * 1.1) { f.moveMode = 'lateral'; }
  else if (fx > 0) { f.moveMode = 'advancing'; }
  else { f.moveMode = 'retreating'; }
  return f.moveMode;
}

export function clampToArena(f) {
  f.pos.x = Math.max(-ARENA.halfWidth, Math.min(ARENA.halfWidth, f.pos.x));
  f.pos.z = Math.max(-ARENA.halfDepth, Math.min(ARENA.halfDepth, f.pos.z));
}

/** Breath is spent by inefficiency and panic, recovered by making distance. */
function breathe(f, mode) {
  let r;
  if (mode === 'acting') r = 0;
  else if (mode === 'focus') r = BREATH.recoverFocus;
  else if (mode === 'idle') r = BREATH.recoverIdle;
  else if (mode === 'settling') r = BREATH.recoverIdle * 0.7;
  else r = BREATH.recoverMoving;
  f.breath = Math.max(0, Math.min(MAX.breath, f.breath + r));
}

/** The Line: built by walking straight in, dropped instantly by retreating. */
function buildLine(f, mode, input) {
  if (mode === 'advancing' && Math.abs(input.lateral) < 0.5) {
    f.line = Math.min(LINE.maxTier, f.line + LINE.buildPerAdvanceTick);
  } else if (mode === 'retreating') {
    f.line = 0;
  } else {
    decayLine(f);
  }
}

function decayLine(f) {
  f.line = Math.max(0, f.line - LINE.decayPerTick);
}
