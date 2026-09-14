/**
 * Pose — the body IS the HUD.
 *
 * ANIMATION_REQUIREMENTS.md §5: five additive layers (breathing, fatigue, injury,
 * structure, will) driven DIRECTLY from resource values. They are gameplay systems,
 * not polish: with no meters on screen, this file is the only way a player learns
 * that someone is tired, hurt, off-balance or losing their nerve.
 *
 * §7: a reaction is SELECTED, not played — chosen by incoming vector against the
 * victim's base state, so the same blow reads differently depending on which way
 * their weight was going.
 *
 * Coordinates are fighter-local: +x toward the opponent, +y up, +z to their lead side.
 * Everything here is procedural placeholder standing in for the authored clip set
 * (see IMPLEMENTATION_LEDGER.md, ruling C-3).
 */
import { technique, frames } from '../sim/techniques.js';
import { phaseOf } from '../sim/formMachine.js';
import { MAX } from '../sim/constants.js';
import { vitalityFraction } from '../sim/fighter.js';

const H = { pelvis: 0.95, chest: 1.32, head: 1.66, shoulder: 1.42, knee: 0.50 };

/** How each technique loads the body during its wind-up. This is the telegraph. */
const TELLS = {
  lead_load:    { lean: 0.02, leadHand: [0.20, 0.02, 0.06], rearHand: [-0.04, 0, -0.04], crouch: 0.00 },
  step_in:      { lean: 0.10, leadHand: [0.24, 0.03, 0.05], rearHand: [-0.02, 0, -0.05], crouch: 0.02 },
  post_out:     { lean: -0.08, leadHand: [0.26, 0.06, 0.02], rearHand: [-0.08, 0, -0.06], crouch: 0.01 },
  shoulder_turn:{ lean: 0.06, leadHand: [0.10, -0.06, 0.20], rearHand: [0.02, 0, -0.10], crouch: 0.04 },
  rear_load:    { lean: -0.06, leadHand: [0.06, 0, 0.04], rearHand: [-0.22, 0.04, -0.14], crouch: 0.03 },
  drop_weight:  { lean: 0.14, leadHand: [0.04, -0.04, 0.02], rearHand: [-0.26, -0.02, -0.10], crouch: 0.10 },
  low_load:     { lean: -0.04, leadHand: [0.10, 0.04, 0.06], rearHand: [-0.10, 0.02, -0.06], crouch: 0.07 },
  reach_across: { lean: 0.12, leadHand: [0.28, -0.10, -0.16], rearHand: [0.06, 0.02, 0.14], crouch: 0.09 },
  settle:       { lean: 0.00, leadHand: [0.12, 0.14, 0.10], rearHand: [0.06, 0.16, -0.08], crouch: 0.06 },
  shed:         { lean: 0.02, leadHand: [0.22, 0.10, -0.02], rearHand: [0.02, 0.08, -0.06], crouch: 0.02 },
  slip:         { lean: -0.10, leadHand: [0.08, 0.06, 0.04], rearHand: [0.02, 0.06, -0.04], crouch: 0.08 },
  breathe:      { lean: -0.02, leadHand: [0.02, -0.10, 0.10], rearHand: [-0.02, -0.10, -0.10], crouch: -0.02 },
};

/** Where the strike ARRIVES during active frames, per tell. */
const EXTEND = {
  lead_load:    { hand: 'lead', reach: [0.62, 0.24, 0.05] },
  step_in:      { hand: 'lead', reach: [0.70, 0.22, 0.04] },
  post_out:     { hand: 'lead', reach: [0.58, 0.16, 0.02] },
  shoulder_turn:{ hand: 'lead', reach: [0.52, 0.02, 0.18] },
  rear_load:    { hand: 'rear', reach: [0.74, 0.26, -0.04] },
  drop_weight:  { hand: 'rear', reach: [0.72, 0.06, -0.02] },
  low_load:     { hand: 'lead', reach: [0.66, -0.62, 0.08] },
  reach_across: { hand: 'lead', reach: [0.60, -0.16, -0.22] },
};

function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

/**
 * Build the full pose for a fighter this frame.
 * @param {import('../sim/fighter.js').Fighter} f
 * @param {number} time seconds, for idle motion only
 */
export function poseFor(f, time) {
  // ---------- base stance: square-ish, weight 60/40 front (MARTIAL_STYLES.md §3) ----
  const p = {
    lean: 0, crouch: 0, twist: 0,
    pelvis: [0, H.pelvis, 0],
    chest: [0.02, H.chest, 0],
    head: [0.04, H.head, 0],
    leadHand: [0.30, 1.17, 0.16],
    rearHand: [0.15, 1.13, -0.17],
    leadFoot: [0.30, 0, 0.20],
    rearFoot: [-0.30, 0, -0.21],
    guardDrop: 0,
    down: false,
    weight: 0.6, // fraction on the front foot
  };

  const breathFrac = f.breath / MAX.breath;
  const vit = vitalityFraction(f);
  const willFrac = f.will / MAX.will;

  // ---------- LAYER 1: BREATHING — the primary read for Breath -------------------
  // Rate and depth both rise as Breath falls. A gassed fighter heaves.
  const rate = lerp(5.2, 1.6, breathFrac);
  const depth = lerp(0.055, 0.008, breathFrac);
  const breathPhase = Math.sin(time * rate);
  p.chest[1] += breathPhase * depth;
  p.head[1] += breathPhase * depth * 0.7;
  p.chest[0] -= breathPhase * depth * 0.4;

  // ---------- LAYER 2: FATIGUE — the guard drifts down and the feet get heavy ----
  const fatigue = 1 - breathFrac;
  p.guardDrop = fatigue * 0.22;
  p.leadHand[1] -= p.guardDrop;
  p.rearHand[1] -= p.guardDrop * 1.1;
  p.crouch += fatigue * 0.05;
  p.leadFoot[0] -= fatigue * 0.04; // stance shortens; no drive left in it

  // ---------- LAYER 3: INJURY — asymmetry a stranger can name -------------------
  if (f.vitality.leadArm <= 0) { p.leadHand[1] -= 0.30; p.leadHand[0] -= 0.10; }
  if (f.vitality.rearArm <= 0) { p.rearHand[1] -= 0.30; }
  if (f.vitality.leadLeg <= 0) { p.weight = 0.28; p.leadFoot[0] -= 0.07; p.crouch += 0.05; }
  if (f.vitality.rearLeg <= 0) { p.weight = 0.82; p.rearFoot[0] += 0.07; p.crouch += 0.05; }
  if (f.vitality.head <= 0.35 * MAX.region.head) p.head[0] -= 0.04;
  p.crouch += (1 - vit) * 0.06;

  // ---------- LAYER 4: STRUCTURE — the base, quadrant by quadrant ----------------
  // A degraded quadrant cannot carry weight, so the stance visibly collapses away
  // from it. This is the only readout of the game's primary resource.
  const q = f.structure;
  const soft = (k) => 1 - q[k] / MAX.quadrant;
  const collapsed = (k) => q.collapse[k] > 0;

  // Gains are deliberately strong: with no meters on screen this is the ONLY readout
  // of the game's primary resource, and a base that is going must be obvious.
  p.lean += soft('fore') * 0.34 - soft('rear') * 0.26;     // walked backward = weight off the front
  p.twist += soft('leadSide') * 0.30 - soft('rearSide') * 0.30;
  p.crouch += (soft('fore') + soft('rear') + soft('leadSide') + soft('rearSide')) * 0.055;
  p.leadFoot[0] -= soft('fore') * 0.10;                    // the stance shortens as it degrades
  p.weight -= soft('fore') * 0.18;

  // A collapsed quadrant is a base that is gone — the foot on that side gives out.
  if (collapsed('fore')) { p.leadFoot[0] -= 0.22; p.lean += 0.26; p.weight = 0.18; p.crouch += 0.06; }
  if (collapsed('rear')) { p.rearFoot[0] += 0.22; p.lean -= 0.22; p.weight = 0.90; p.crouch += 0.06; }
  if (collapsed('leadSide')) { p.leadFoot[2] -= 0.18; p.twist += 0.30; p.crouch += 0.05; }
  if (collapsed('rearSide')) { p.rearFoot[2] += 0.18; p.twist -= 0.30; p.crouch += 0.05; }

  // ---------- LAYER 5: WILL — they stop coming forward --------------------------
  if (willFrac < 0.6) {
    p.lean -= (0.6 - willFrac) * 0.22;   // weight off the front foot
    p.head[0] -= (0.6 - willFrac) * 0.08;
    p.guardDrop += (0.6 - willFrac) * 0.06;
  }

  // ---------- state overrides ---------------------------------------------------
  if (f.state === 'down') {
    p.down = true;
    p.pelvis = [-0.2, 0.22, 0]; p.chest = [-0.42, 0.32, 0]; p.head = [-0.62, 0.36, 0];
    p.leadHand = [-0.2, 0.14, 0.28]; p.rearHand = [-0.5, 0.10, -0.24];
    p.leadFoot = [0.22, 0.06, 0.22]; p.rearFoot = [0.06, 0.06, -0.24];
    return p;
  }

  if (f.state === 'staggered') {
    // Dumped off the base. Arms come off guard; the feet are trying to find the floor.
    const t = Math.min(1, f.stateTicks / 12);
    p.lean -= 0.34 * (1 - t * 0.4);
    p.crouch += 0.10;
    p.leadHand[1] -= 0.26; p.rearHand[1] -= 0.30;
    p.leadHand[2] += 0.16; p.rearHand[2] -= 0.16;
    p.rearFoot[0] -= 0.22;
    p.weight = 0.15;
    return p;
  }

  // ---------- guard -------------------------------------------------------------
  if (f.state === 'guard') {
    const raised = Math.min(1, f.guardTicks / 3);
    p.leadHand = [0.32, 1.37 - p.guardDrop, 0.14];
    p.rearHand = [0.21, 1.40 - p.guardDrop, -0.13];
    p.crouch += 0.05 * raised;
    p.chest[0] -= 0.03;
  }

  // ---------- the running technique: load, arrive, be stuck ---------------------
  if (f.state === 'acting' && f.form.techniqueId) {
    const t = technique(f.form.techniqueId);
    const fr = frames(t);
    const ph = phaseOf(f);
    const tell = TELLS[t.tell] ?? TELLS.settle;

    if (ph === 'startup') {
      // Wind-up. The telegraph. Grows through the startup window so it reads.
      const k = ease(Math.min(1, f.form.tick / Math.max(1, fr.startup)));
      applyTell(p, tell, k * (f.form.feint ? 0.8 : 1));
    } else if (ph === 'active') {
      const ex = EXTEND[t.tell];
      applyTell(p, tell, 1);
      if (ex) {
        const hand = ex.hand === 'lead' ? 'leadHand' : 'rearHand';
        p[hand] = [ex.reach[0], H.chest + ex.reach[1], ex.reach[2]];
        p.lean += 0.14;
        p.twist += ex.hand === 'lead' ? 0.10 : -0.16;
        p.chest[0] += 0.05;
      }
    } else {
      // RECOVERY — the most important thing on screen. The body stays out, off its
      // base, unable to act. A stranger must be able to see that he is stuck.
      const done = (f.form.tick - fr.startup - fr.active) / Math.max(1, fr.recovery);
      const k = 1 - ease(Math.min(1, done));
      const ex = EXTEND[t.tell];
      if (ex) {
        const hand = ex.hand === 'lead' ? 'leadHand' : 'rearHand';
        p[hand] = [
          lerp(p[hand][0], ex.reach[0], k * 0.85),
          lerp(p[hand][1], H.chest + ex.reach[1], k * 0.85),
          lerp(p[hand][2], ex.reach[2], k * 0.85),
        ];
      }
      p.lean += 0.30 * k;
      p.crouch += 0.08 * k;
      p.weight = lerp(p.weight, 0.95, k);  // weight dumped onto the front foot
      p.guardDrop += 0.20 * k;
      p.rearFoot[0] -= 0.20 * k;           // trailing foot has not caught up
      p.chest[0] += 0.06 * k;              // still reaching after the moment has gone
    }
  }

  return p;
}

function applyTell(p, tell, k) {
  p.lean += tell.lean * k;
  p.crouch += tell.crouch * k;
  p.leadHand = [
    p.leadHand[0] + tell.leadHand[0] * k,
    p.leadHand[1] + tell.leadHand[1] * k,
    p.leadHand[2] + tell.leadHand[2] * k,
  ];
  p.rearHand = [
    p.rearHand[0] + tell.rearHand[0] * k,
    p.rearHand[1] + tell.rearHand[1] * k,
    p.rearHand[2] + tell.rearHand[2] * k,
  ];
}

/**
 * ANIMATION_REQUIREMENTS.md §7 — the reaction is chosen by (incoming vector ×
 * victim's base quadrant × structure), so the same punch reads differently depending
 * on which way their weight was already going.
 */
export function reactionFor(quadrant, force, structure) {
  const severity = force > 28 ? 'heavy' : force > 14 ? 'medium' : 'light';
  const already = structure[quadrant] / MAX.quadrant;
  return {
    severity,
    quadrant,
    // A blow into a base that is already going gets a much bigger displacement.
    amplitude: (severity === 'heavy' ? 1 : severity === 'medium' ? 0.6 : 0.3) * (1.6 - already),
    ticks: severity === 'heavy' ? 16 : severity === 'medium' ? 10 : 6,
  };
}
