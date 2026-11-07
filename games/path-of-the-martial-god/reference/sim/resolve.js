/**
 * Hit resolution — COMBAT_SYSTEM.md §5 (four tools, four costs) and §2 (structure).
 *
 * The important property here is spatial: GUARD ONLY COVERS THE QUADRANT YOU FACE.
 * Circle to someone's flank and the same blow lands on a base they are not defending.
 * That is what makes footwork mechanically real rather than decorative.
 */
import { BREATH, WILL, LINE, MAX } from './constants.js';
import { technique, frames } from './techniques.js';
import { applyForce, quadrantFromIncoming, wrapAngle, lineTier as tierOf } from './structure.js';
import { distance, bearingTo } from './fighter.js';
import { phaseOf, stagger, knockDown } from './formMachine.js';

const OFFENSIVE = ['Strike', 'Drive', 'Check', 'Displace', 'Break'];
export function isOffensive(t) { return OFFENSIVE.includes(t.kind); }

/**
 * Which quadrant of the defender's base absorbs this blow.
 * Geometry decides. A strike to a leg attacks the base that leg carries, wherever
 * the attacker happens to be standing.
 */
export function targetQuadrant(defender, attacker, t) {
  const geo = quadrantFromIncoming(defender.facing, bearingTo(defender, attacker));
  const region = t.vitality?.region;
  if (region === 'leadLeg') return 'leadSide';
  if (region === 'rearLeg') return 'rearSide';
  return geo;
}

/**
 * Did the slip move the defender off the line of the attack?
 * I-frames are conditional (COMBAT_SYSTEM.md §5): a slip in the correct direction
 * relative to the incoming vector grants them; a slip in the wrong direction just moves you.
 * Backing straight off works against a jab and fails against a lunging Drive, which follows.
 */
export function evadeWorked(defender, attacker, t) {
  const dir = defender.form.evadeDir;
  if (typeof dir !== 'number') return false;
  const attackAxis = bearingTo(attacker, defender); // direction the force travels
  const rel = wrapAngle(dir - attackAxis);
  const perpendicular = Math.abs(Math.sin(rel));    // how far off-line the slip goes
  const withAttack = Math.cos(rel);                 // +1 = moving away, -1 = into it
  if (perpendicular > 0.5) return true;             // a real angle always works
  if (withAttack > 0.5 && (t.advance ?? 0) < 0.30) return true; // backing off beats non-lunging strikes
  return false;
}

/**
 * Attempt to land the attacker's currently-active technique on the defender.
 * Called only during active frames. Returns an outcome record, or null if nothing
 * happened this tick (still in range-seeking).
 *
 * @param {import('./fighter.js').Fighter} a attacker (mutated)
 * @param {import('./fighter.js').Fighter} d defender (mutated)
 * @param {(e:any)=>void} emit
 */
export function attemptLand(a, d, emit) {
  if (!a.form.techniqueId || a.form.landed || a.form.feint) return null;
  const t = technique(a.form.techniqueId);
  if (!isOffensive(t)) return null;
  if (phaseOf(a) !== 'active') return null;

  const dist = distance(a, d);
  if (dist > (t.reach ?? 0) + 0.10) return null;
  const off = Math.abs(wrapAngle(bearingTo(a, d) - a.facing));
  if (off > Math.PI / 3) return null;

  a.form.landed = true; // one landing per technique instance

  const quadrant = targetQuadrant(d, a, t);
  const pushDir = bearingTo(a, d);
  const tier = tierOf(a.line);
  let force = (t.structure?.force ?? 0) * (1 + LINE.structureBonusPerTier * tier);
  // A technique used as designed does its full work; used off-design it still lands.
  if (t.structure?.quadrant && t.structure.quadrant !== quadrant) force *= 0.72;
  let vit = t.vitality?.amount ?? 0;
  const region = t.vitality?.region ?? 'torso';

  const dTech = d.form.techniqueId ? technique(d.form.techniqueId) : null;
  const dPhase = phaseOf(d);

  // ---- EVADE ---------------------------------------------------------------
  if (dTech?.kind === 'Evade' && dPhase === 'active') {
    if (evadeWorked(d, a, t)) {
      emit({ type: 'evaded', who: d.id, by: a.id, technique: t.id, quadrant });
      return { outcome: 'evaded', quadrant };
    }
    // Wrong direction. It just moved them, and they are still hit.
  }

  // ---- DEFLECT -------------------------------------------------------------
  if (dTech?.kind === 'Redirect') {
    if (dPhase === 'active') {
      const ret = dTech.deflect?.returnForce ?? 0;
      applyForce(a.structure, quadrantFromIncoming(a.facing, bearingTo(a, d)), ret);
      a.form.recoveryAdd += dTech.deflect?.attackerRecoveryAdd ?? 0;
      a.line = 0;
      d.will = Math.min(MAX.will, d.will + WILL.answerBonus);
      emit({ type: 'deflected', who: d.id, by: a.id, technique: t.id, quadrant });
      return { outcome: 'deflected', quadrant };
    }
    if (dPhase === 'recovery') {
      // Deflected too early. Heavy Breath and Structure on failure.
      d.breath = Math.max(0, d.breath - BREATH.deflectFailPenalty);
      force *= 1.25;
      emit({ type: 'deflect_failed', who: d.id, by: a.id });
    }
  }

  // ---- GUARD ---------------------------------------------------------------
  let guarded = false;
  if (d.state === 'guard') {
    const settle = technique('low_river.settle');
    const raised = d.guardTicks >= frames(settle).startup;
    if (!raised) {
      // Late guard costs Breath and does not protect.
      d.breath = Math.max(0, d.breath - BREATH.lateGuardPenalty);
      emit({ type: 'late_guard', who: d.id });
    } else if (quadrant === 'fore') {
      guarded = true;
      const g = settle.guard;
      d.breath = Math.max(0, d.breath - force * BREATH.impactAbsorb);
      force *= 1 - g.absorb;
      vit *= 1 - g.vitalityAbsorb;
    } else {
      // Guard is up, but it is pointed the wrong way. This is the spatial payoff.
      emit({ type: 'guard_bypassed', who: d.id, quadrant });
    }
  }

  // ---- apply ----------------------------------------------------------------
  if (vit > 0) d.vitality[region] = Math.max(0, d.vitality[region] - vit);
  const res = applyForce(d.structure, quadrant, force);

  d.will = Math.max(0, d.will - (guarded ? 0.5 : region === 'head' ? WILL.onHeadHit : WILL.onCleanHit));
  a.will = Math.min(MAX.will, a.will + WILL.answerBonus * (guarded ? 0.3 : 1));
  if (t.lineBuild) a.line = Math.min(LINE.maxTier, a.line + t.lineBuild * 0.35);

  // A Check that lands during an entry stops it (COMBAT_SYSTEM.md §6, kind: Check).
  if (t.interrupts && dPhase === 'startup' && d.state === 'acting') {
    d.form.tick = Math.max(d.form.tick, frames(technique(d.form.techniqueId)).startup);
    d.form.feint = true;
    emit({ type: 'interrupted', who: d.id, by: a.id });
  }

  const outcome = guarded ? 'guarded' : 'hit';
  emit({
    type: outcome, who: d.id, by: a.id, technique: t.id,
    quadrant, region, force, vit, broke: res.broke,
    quadrantAfter: res.after, lineTier: tier,
  });

  // ---- structure break ------------------------------------------------------
  if (res.broke) {
    const heavy = t.displaces || d.will < WILL.yieldThreshold;
    d.will = Math.max(0, d.will - WILL.onStructureBreak);
    if (heavy) knockDown(d, pushDir, 0.40);
    else stagger(d, pushDir, 34, 0.26);
    emit({ type: 'break', who: d.id, by: a.id, quadrant, down: !!heavy });
    return { outcome, quadrant, broke: true };
  }

  return { outcome, quadrant, broke: false };
}

/** Called when active frames end without a landing. A miss is its own information. */
export function noteWhiff(a, emit) {
  if (a.form.feint) return;
  emit({ type: 'whiff', who: a.id, technique: a.form.techniqueId });
}
