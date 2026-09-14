/**
 * Fight — the simulation orchestrator. Two fighters, a fixed 60Hz tick, no I/O.
 *
 * This module is the whole of the engine-free contract: it imports nothing from
 * view/, touches no DOM, starts no timers, and contains no randomness. Given the
 * same inputs it produces the same fight, every time, which is what gives us replay,
 * regression tests, and an honest adaptive-AI story later.
 */
import { MAX, WILL } from './constants.js';
import { makeFighter, vitalityFraction, distance, cloneFighter } from './fighter.js';
import { tickFighter, phaseOf, neutralIntent, clampToArena } from './formMachine.js';
import { attemptLand, noteWhiff, isOffensive } from './resolve.js';
import { technique } from './techniques.js';
import { makePerception, observe, perceived } from './ai/perception.js';
import { makeBrain, decide } from './ai/brain.js';
import { isFinished, offer, attempt, windowTicks } from './finalInch.js';

export const PLAYER = 'player';
export const OPPONENT = 'opponent';

/**
 * @param {object} [opts]
 * @param {number} [opts.playerMastery] 0..1 — drives the Final Inch window and the Stop
 * @param {number} [opts.reaction] opponent reaction latency in ticks
 */
export function makeFight(opts = {}) {
  const a = makeFighter(PLAYER, { x: -1.15, z: 0 }, 0, {
    mastery: opts.playerMastery ?? 0.6,
  });
  const b = makeFighter(OPPONENT, { x: 1.15, z: 0 }, Math.PI, {
    mastery: 0.45,
    reaction: opts.reaction ?? 16,
  });
  return {
    tick: 0,
    a,
    b,
    brain: makeBrain({ aggression: opts.aggression ?? 0.55, patience: opts.patience ?? 0.45 }),
    perception: makePerception(b.reaction),
    /** @type {any[]} recent events, for presentation and audio */
    events: [],
    /** @type {any[]} the whole log, for debug and the readability post-mortem */
    log: [],
    /** @type {null|{actorId:string,targetId:string,ticksLeft:number,total:number,terminals:any[]}} */
    inch: null,
    /** @type {null|{winnerId:string|null, reason:string, terminal:string|null, note:string}} */
    over: null,
    lastPlayerInput: neutralIntent(),
  };
}

export function reset(fight, opts = {}) {
  const fresh = makeFight(opts);
  Object.assign(fight, fresh);
  return fight;
}

function fighterById(fight, id) { return id === PLAYER ? fight.a : fight.b; }

/**
 * Advance the whole fight by exactly one simulation tick.
 *
 * @param {ReturnType<makeFight>} fight mutated
 * @param {import('./formMachine.js').InputIntent} playerInput
 * @param {{terminal?: string|null}} [choice] the player's Final Inch decision, if any
 */
export function step(fight, playerInput, choice = {}) {
  fight.events.length = 0;
  const emit = (e) => { e.tick = fight.tick; fight.events.push(e); fight.log.push(e); };

  if (fight.over) return fight;

  // ---- the Final Inch holds the world still while someone decides ---------------
  if (fight.inch) {
    stepInch(fight, playerInput, choice, emit);
    fight.tick++;
    return fight;
  }

  const { a, b } = fight;
  fight.lastPlayerInput = playerInput;

  // ---- perception: the brain only ever sees a delayed, filtered snapshot ---------
  observe(fight.perception, a, fight.tick);
  const snap = perceived(fight.perception);
  const aiInput = decide(b, snap, fight.brain);

  // ---- advance both fighters against the SAME view of the world ------------------
  //
  // Both read a positional snapshot taken before either moves. Ticking one against
  // the other's already-updated position hands the second mover a permanent aiming
  // advantage: with identical brains on both sides it produced a 4-0 record for
  // whichever fighter ticked second.
  const aRef = { id: a.id, pos: { x: a.pos.x, z: a.pos.z }, facing: a.facing };
  const bRef = { id: b.id, pos: { x: b.pos.x, z: b.pos.z }, facing: b.facing };
  tickFighter(a, playerInput, bRef, emit);
  tickFighter(b, aiInput, aRef, emit);

  // ---- two bodies cannot occupy the same ground ---------------------------------
  separate(a, b);

  // ---- resolve landings, alternating who resolves first --------------------------
  // Resolving one side first every tick means their hit can stagger the other out of
  // active frames before it is ever tested. Alternating by tick parity keeps that
  // fair across a fight and stays perfectly deterministic.
  if (fight.tick % 2 === 0) {
    attemptLand(a, b, emit);
    attemptLand(b, a, emit);
  } else {
    attemptLand(b, a, emit);
    attemptLand(a, b, emit);
  }

  // ---- a miss is its own information ---------------------------------------------
  for (const f of [a, b]) {
    if (f.state === 'acting' && f.form.techniqueId
        && isOffensive(technique(f.form.techniqueId))
        && !f.form.landed && !f.form.whiffed && phaseOf(f) === 'recovery') {
      f.form.whiffed = true;
      noteWhiff(f, emit);
    }
  }

  // ---- gassing out is a state the world can hear ----------------------------------
  for (const f of [a, b]) {
    if (f.breath <= 0.001) {
      f.will = Math.max(0, f.will - WILL.onGassed);
      if (!f._gassedNoted) { f._gassedNoted = true; emit({ type: 'gassed', who: f.id }); }
    } else if (f.breath > 14) {
      f._gassedNoted = false;
    }
    f.will = Math.min(MAX.will, f.will + WILL.regenPerTick);
  }

  // ---- has someone been finished? -------------------------------------------------
  checkTermination(fight, emit);

  fight.tick++;
  return fight;
}

/** Open the Final Inch if a break has left someone genuinely finished. */
function checkTermination(fight, emit) {
  const { a, b } = fight;

  for (const [actor, target] of [[a, b], [b, a]]) {
    if (fight.inch || fight.over) return;

    if (vitalityFraction(target) <= 0) {
      fight.over = { winnerId: actor.id, reason: 'unconscious', terminal: null, note: 'Could not continue.' };
      emit({ type: 'over', ...fight.over });
      return;
    }

    if (isFinished(target) && distance(actor, target) < 2.0 && actor.state !== 'staggered' && actor.state !== 'down') {
      const total = windowTicks(actor.mastery);
      fight.inch = {
        actorId: actor.id,
        targetId: target.id,
        ticksLeft: total,
        total,
        terminals: offer(actor, target),
      };
      emit({ type: 'inch_open', actor: actor.id, target: target.id, ticks: total });
      return;
    }

    if (target.will <= WILL.yieldThreshold && target.state === 'down') {
      fight.over = { winnerId: actor.id, reason: 'yielded', terminal: null, note: 'They stopped.' };
      emit({ type: 'over', ...fight.over });
      return;
    }
  }
}

/**
 * The Inch. No prompt tells you what the options mean; the inputs you already know
 * are the options. Letting the window lapse is itself a choice.
 */
function stepInch(fight, playerInput, choice, emit) {
  const inch = fight.inch;
  const actor = fighterById(fight, inch.actorId);
  const target = fighterById(fight, inch.targetId);

  /** @type {string|null} */
  let picked = null;

  if (inch.actorId === PLAYER) {
    if (choice.terminal) picked = choice.terminal;
    else if (playerInput.verb === 'commit' || playerInput.verb === 'strike') picked = 'strike_through';
    else if (playerInput.verb === 'guard' || playerInput.verb === 'deflect') picked = 'stop';
  } else {
    // The opponent's temperament decides, and it decides DELIBERATELY — part-way
    // through the window, not on the last possible tick. A fighter who lets every
    // finish lapse is not merciful, it is broken: lapsing is the unusual choice.
    if (inch.ticksLeft <= Math.round(inch.total * 0.45)) {
      picked = fight.brain.patience > 0.66 ? 'stop' : 'strike_through';
    }
  }

  inch.ticksLeft--;

  if (!picked && inch.ticksLeft <= 0) picked = 'lapse';
  if (!picked) return;

  const result = attempt(picked, actor, target);
  emit({ type: 'terminal', actor: actor.id, target: target.id, ...result });
  fight.inch = null;

  if (target.state === 'finished') {
    fight.over = {
      winnerId: actor.id,
      reason: result.executed === 'stop' ? 'stopped' : 'finished',
      terminal: result.executed,
      note: result.note,
    };
    emit({ type: 'over', ...fight.over });
  } else {
    // Lapsed. They live, and the fight continues — which is also an answer.
    target.will = Math.max(target.will, WILL.inchThreshold + 8);
  }
}

/**
 * Minimum separation between two standing fighters, metres.
 *
 * This sits just inside the MID band (0.95–1.75) on purpose. Low River's preferred
 * distance is mid — "it wants to be exactly where hands reach and to stay there" —
 * and M1 ships no clinch, so the contact band has almost nothing in its grammar.
 * Allowing fighters to press into contact put them somewhere their own style could
 * not speak: pressure forward, the correct Low River behaviour, resolved to no
 * technique at all and the player threw literally nothing.
 *
 * Two bodies also stop reading as two bodies below about a metre on screen.
 */
const MIN_SEPARATION = 1.02;

/** Push overlapping fighters apart, symmetrically and deterministically. */
function separate(a, b) {
  if (a.state === 'down' || b.state === 'down') return;
  const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
  const d = Math.hypot(dx, dz);
  if (d >= MIN_SEPARATION) return;
  if (d < 1e-5) { b.pos.x += MIN_SEPARATION; return; }
  const push = (MIN_SEPARATION - d) / 2;
  const ux = dx / d, uz = dz / d;
  a.pos.x -= ux * push; a.pos.z -= uz * push;
  b.pos.x += ux * push; b.pos.z += uz * push;
  clampToArena(a); clampToArena(b);
}

/** A serialisable snapshot of the whole fight, for replay and rollback. */
export function snapshotFight(fight) {
  return {
    tick: fight.tick,
    a: cloneFighter(fight.a),
    b: cloneFighter(fight.b),
    inch: fight.inch ? { ...fight.inch } : null,
    over: fight.over ? { ...fight.over } : null,
  };
}
