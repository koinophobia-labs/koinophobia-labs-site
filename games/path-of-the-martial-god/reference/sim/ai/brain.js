/**
 * OpponentBrain — a deliberately small, inspectable, scored decision model.
 *
 * It emits the SAME InputIntent struct the player produces. The opponent has no
 * private vocabulary: if it can do a thing, so can you, with the same seven verbs.
 *
 * It never receives the live player object — only a delayed Snapshot from
 * perception.js. Fairness rules: COMBAT_SYSTEM.md §11.
 *
 * Every option carries its full scoring breakdown so the debug overlay can show
 * exactly WHY a decision was made. We are establishing whether combat decisions feel
 * legible and intentional before adding any sophistication.
 */
import { bandFor, MAX } from '../constants.js';
import { resolve } from '../grammar.js';
import { weakest, quadrantFromIncoming } from '../structure.js';
import { technique } from '../techniques.js';
import { actionable, lineTier } from '../fighter.js';
import { URGENCY } from '../constants.js';

/**
 * The option set. Each is a (verb, movement) pair — the player's own vocabulary.
 * The grammar turns each into a concrete technique for the current band.
 */
const OPTIONS = [
  { id: 'hold', verb: null, fwd: 0, lat: 0 },
  { id: 'advance', verb: null, fwd: 1, lat: 0 },
  { id: 'retreat', verb: null, fwd: -1, lat: 0 },
  { id: 'circle_lead', verb: null, fwd: 0.15, lat: 1 },
  { id: 'circle_rear', verb: null, fwd: 0.15, lat: -1 },
  { id: 'jab', verb: 'strike', fwd: 0, lat: 0 },
  { id: 'step_jab', verb: 'strike', fwd: 1, lat: 0 },
  { id: 'check', verb: 'strike', fwd: -1, lat: 0 },
  { id: 'shoulder_gate', verb: 'strike', fwd: 0.2, lat: 1 },
  { id: 'rear_straight', verb: 'commit', fwd: 0, lat: 0 },
  { id: 'through_palm', verb: 'commit', fwd: 1, lat: 0 },
  { id: 'nail', verb: 'commit', fwd: -1, lat: 0 },
  { id: 'come_down', verb: 'commit', fwd: 0.2, lat: 1 },
  { id: 'guard', verb: 'guard', fwd: 0, lat: 0, guard: true },
  { id: 'deflect', verb: 'deflect', fwd: 0, lat: 0 },
  { id: 'slip_lead', verb: 'evade', fwd: 0, lat: 1 },
  { id: 'slip_back', verb: 'evade', fwd: -1, lat: 0 },
  { id: 'focus', verb: 'focus', fwd: 0, lat: 0 },
];

const ATTACKS = new Set(['jab', 'step_jab', 'check', 'shoulder_gate', 'rear_straight', 'through_palm', 'nail', 'come_down']);
const DEFENCES = new Set(['guard', 'deflect', 'slip_lead', 'slip_back']);
const COMMITS = new Set(['rear_straight', 'through_palm', 'come_down']);

export function makeBrain(opts = {}) {
  return {
    style: opts.style ?? 'low_river',
    aggression: opts.aggression ?? 0.5,   // authored temperament, not a difficulty knob
    patience: opts.patience ?? 0.5,
    dwell: 0,
    /** Ticks since either body last did anything. See URGENCY in constants.js. */
    quiet: 0,
    lastChoice: 'hold',
    /** Tendency counts keyed by observed tell. The Read hook — feints poison this. */
    tendencies: /** @type {Record<string, number>} */ ({}),
    lastSeenTell: /** @type {string|null} */ (null),
    /** Decaying counts of this fighter's OWN recent attacks — keeps it from looping. */
    recent: /** @type {Record<string, number>} */ ({}),
    /** Full scoring breakdown of the most recent decision, for inspection. */
    lastScores: /** @type {any[]} */ ([]),
  };
}

/** Observe a tell. Feints produce tells with no landing — which is the point. */
function noteTendency(brain, snap) {
  if (!snap?.tell) { brain.lastSeenTell = null; return; }
  if (snap.tell === brain.lastSeenTell) return;
  brain.lastSeenTell = snap.tell;
  brain.tendencies[snap.tell] = (brain.tendencies[snap.tell] ?? 0) + 1;
  // Decay so the model tracks recent habits rather than the whole fight.
  for (const k of Object.keys(brain.tendencies)) brain.tendencies[k] *= 0.985;
}

/**
 * Decide this tick.
 * @param {import('../fighter.js').Fighter} self
 * @param {import('./perception.js').Snapshot|null} snap delayed view of the opponent
 * @param {any} brain mutated
 * @returns {import('../formMachine.js').InputIntent}
 */
export function decide(self, snap, brain) {
  noteTendency(brain, snap);

  // --- how long since anything happened ----------------------------------------
  // Judged only from what a fighter can see: whether either body is doing something.
  // `snap` is the DELAYED, filtered view, so this inherits perception's limits rather
  // than reaching around them — a fighter notices a lull late, like everything else.
  // Only the OPPONENT responding counts as the fight having started. Throwing a
  // technique into empty air is not evidence that it has — it is evidence of the
  // opposite — so a fighter's own swing must not reset its own sense of a lull, or
  // urgency builds, spends itself on one whiff, and collapses back to waiting.
  // Mid-technique the count is frozen rather than reset: busy, but nothing landed.
  const contact =
    self.state === 'staggered' || self.state === 'down' ||
    (snap != null && (snap.phase != null || snap.state === 'staggered' || snap.state === 'down'));
  if (contact) brain.quiet = 0;
  else if (actionable(self)) brain.quiet++;

  // Commitment is real for the AI too. It cannot cancel out of a technique.
  if (!actionable(self)) {
    brain.lastScores = [];
    return { forward: 0, lateral: 0, verb: null, held: true, guard: false };
  }
  if (!snap) return { forward: 0, lateral: 0, verb: null, held: true, guard: false };

  const dx = snap.pos.x - self.pos.x, dz = snap.pos.z - self.pos.z;
  const dist = Math.hypot(dx, dz);
  const band = bandFor(dist);

  // --- situational reads, computed once ---------------------------------------
  const theirPhase = snap.phase;
  const theyAreOpen = snap.state === 'staggered' || snap.state === 'down' || theirPhase === 'recovery';
  const theyAreWinding = theirPhase === 'startup';
  const theirTech = snap.techniqueId ? technique(snap.techniqueId) : null;
  const incomingIsCommit = theirTech ? ['Drive', 'Displace'].includes(theirTech.kind) : false;

  // Which of THEIR quadrants is softest, and am I standing where I can reach it?
  const theirWeak = weakest(snap.structure);
  const myBearingToThem = Math.atan2(dz, dx);
  const quadrantIWouldHit = quadrantFromIncoming(snap.facing, myBearingToThem + Math.PI);
  const onTheOpening = quadrantIWouldHit === theirWeak && theirWeak !== 'fore';

  // My own exposure.
  const myWeak = weakest(self.structure);
  const myExposure = 1 - self.structure[myWeak] / MAX.quadrant;
  const breathLow = self.breath < 28;
  const theirBreathLow = snap.breath < 28;

  const scored = [];
  for (const o of OPTIONS) {
    const terms = {};
    // Can the grammar even say this sentence at this range?
    let tech = null;
    if (o.verb) {
      tech = resolve(brain.style, o.verb, intentOf(o), band);
      if (!tech) continue;
      if (tech.requiresLineTier && lineTier(self) < tech.requiresLineTier) continue;
    }

    // 1. RANGE — is this action appropriate to the distance?
    terms.range = rangeFit(o, band, dist, tech);

    // 2. PUNISH — they are open; take it.
    terms.punish = theyAreOpen && ATTACKS.has(o.id) ? (COMMITS.has(o.id) ? 3.4 : 2.2) : 0;
    if (theyAreOpen && DEFENCES.has(o.id)) terms.punish = -1.6;

    // 3. THREAT — they are winding up at me; committing now is dangerous.
    if (theyAreWinding && dist < 2.0) {
      if (o.id === 'deflect') terms.threat = 2.0 + (incomingIsCommit ? 1.0 : 0);
      else if (o.id === 'guard') terms.threat = 1.5;
      else if (o.id === 'slip_lead') terms.threat = 1.8;
      else if (o.id === 'slip_back') terms.threat = incomingIsCommit ? 0.4 : 1.5;
      else if (COMMITS.has(o.id)) terms.threat = -2.4;
      else if (o.id === 'check') terms.threat = 1.9; // a Check stops an entry
      else terms.threat = 0;
    } else terms.threat = 0;

    // 4. OPENING — hunt the quadrant they are not defending.
    terms.opening = 0;
    if (onTheOpening && ATTACKS.has(o.id)) terms.opening = 1.5;
    if (!onTheOpening && theirWeak !== 'fore' && (o.id === 'circle_lead' || o.id === 'circle_rear')) {
      terms.opening = 1.2; // circle toward the soft side
    }
    if (theirWeak === 'fore' && o.id === 'through_palm') terms.opening = 1.1;

    // 5. EXPOSURE — my own base is going; reset it.
    terms.exposure = 0;
    if (myExposure > 0.55) {
      if (o.id === 'retreat') terms.exposure = 1.4;
      if (o.id === 'circle_lead' || o.id === 'circle_rear') terms.exposure = 1.1;
      if (COMMITS.has(o.id)) terms.exposure = -1.3;
    }

    // 6. BREATH — gassing out is self-inflicted; don't.
    terms.breath = 0;
    if (self.breath < 12) {
      // Critically short. Break off and breathe; everything else can wait.
      if (o.id === 'focus') terms.breath = 4.2;
      else if (o.id === 'retreat') terms.breath = 2.0;
      else if (ATTACKS.has(o.id)) terms.breath = -1.4;
    } else if (breathLow) {
      if (o.id === 'focus') terms.breath = 2.6;
      if (o.id === 'retreat') terms.breath = 1.2;
      if (COMMITS.has(o.id)) terms.breath = -2.0;
      if (o.id === 'guard') terms.breath = -0.8; // guarding while gassed is a trap
    }
    if (theirBreathLow && ATTACKS.has(o.id)) terms.breath += 0.8; // press a tired man

    // 7. TENDENCY — the Read hook. Weak on purpose in M1; feints already poison it.
    terms.tendency = 0;
    const habit = topTendency(brain);
    if (habit && habit.count > 3 && DEFENCES.has(o.id)) {
      terms.tendency = Math.min(0.9, habit.count * 0.06);
    }

    // 8. TEMPERAMENT — authored personality, not difficulty.
    terms.temperament =
      (ATTACKS.has(o.id) ? brain.aggression : 0) +
      (o.id === 'hold' || o.id === 'guard' ? brain.patience * 0.8 : 0);

    // 9. DWELL — stickiness, so the body does not twitch between intentions.
    terms.dwell = o.id === brain.lastChoice ? 0.35 : 0;

    // 10. REPETITION — a fighter who only ever does one thing is not readable as a
    // fighter. This is not adaptation (that is M3); it is refusing to be a machine.
    terms.repetition = ATTACKS.has(o.id) ? -Math.min(2.2, (brain.recent[o.id] ?? 0) * 0.30) : 0;

    // 11. URGENCY — nothing has happened for a while and that is itself information.
    // Ramps rather than switches, so an opponent who has been given nothing to work
    // with starts pressing the way a person does: gradually, and then decisively.
    terms.urgency = 0;
    if (brain.quiet > URGENCY.graceTicks) {
      const u = Math.min(1, (brain.quiet - URGENCY.graceTicks) / URGENCY.rampTicks);
      // Urgency closes DISTANCE. It rewards moving toward them and penalises waiting,
      // and then stops — the existing terms decide what to do on arrival. Two earlier
      // versions did more than that and both failed, in ways worth keeping:
      //
      //   Scoring by category rather than by forward component treated a retreating
      //   attack as an answer. `nail` and `check` commit backwards, so the opponent
      //   backed away swinging.
      //
      //   Adding an attack bonus overrode `rangeFit`'s -2.0 "will simply not arrive"
      //   gate, because a bonus big enough to be felt is big enough to beat it. The
      //   opponent advanced to 1.4m and then spent half its ticks jabbing at air, and
      //   a technique in progress is a technique not closing. It got nearer, then
      //   stopped getting nearer.
      terms.urgency = u * (
        o.fwd * URGENCY.advance
        - (o.id === 'hold' || o.id === 'guard' ? URGENCY.settle : 0)
      );
    }

    const score = Object.values(terms).reduce((a, b) => a + b, 0);
    scored.push({ id: o.id, score, terms, technique: tech?.id ?? null });
  }

  if (scored.length === 0) return { forward: 0, lateral: 0, verb: null, held: true, guard: false };

  // Deterministic: strict comparison, ties broken by option order.
  scored.sort((a, b) => b.score - a.score);
  brain.lastScores = scored.slice(0, 6);
  const best = scored[0];
  brain.lastChoice = best.id;

  // Remember what we just committed to, with decay.
  for (const k of Object.keys(brain.recent)) brain.recent[k] *= 0.992;
  if (ATTACKS.has(best.id)) brain.recent[best.id] = (brain.recent[best.id] ?? 0) + 1;

  const o = OPTIONS.find((x) => x.id === best.id);
  return {
    forward: o.fwd,
    lateral: o.lat,
    verb: o.verb,
    held: true,            // the AI does not feint in M1; the hook is in the machine
    guard: !!o.guard,
  };
}

function intentOf(o) {
  const mag = Math.hypot(o.fwd, o.lat);
  if (mag < 0.30) return 'neutral';
  if (Math.abs(o.lat) > Math.abs(o.fwd) * 1.1) return 'angle';
  return o.fwd > 0 ? 'pressure' : 'retreat';
}

function rangeFit(o, band, dist, tech) {
  if (o.verb === null) {
    if (band === 'outside') return o.id === 'advance' ? 2.2 : 0;
    if (band === 'long') return o.id === 'advance' ? 1.7 : 0.1;
    if (band === 'contact') return o.id === 'retreat' ? 0.7 : 0.3;
    return o.id === 'hold' ? 0.4 : 0.5;
  }
  // Breathing is something you do because you NEED to, not because of where you stand.
  // The range term only says it is *permissible* here; the breath term makes it wanted.
  if (o.id === 'focus') return band === 'outside' || band === 'long' ? 0.15 : -1.8;
  if (!tech) return 0;
  // Attacks want to be thrown from inside their own reach.
  if (tech.reach != null) {
    const over = dist - tech.reach;
    if (over > 0.30) return -2.0;      // will simply not arrive
    if (over > 0.05) return -0.4;
    return 1.0 + Math.max(0, 0.4 - Math.abs(over)) * 0.8;
  }
  return 0.5;
}

function topTendency(brain) {
  let best = null;
  for (const [tell, count] of Object.entries(brain.tendencies)) {
    if (!best || count > best.count) best = { tell, count };
  }
  return best;
}
