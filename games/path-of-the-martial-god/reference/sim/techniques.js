/**
 * TechniqueDB — TECHNICAL_ARCHITECTURE.md §3.2.
 * Frame windows live here, in data. Never on animation notifies.
 */
import lowRiver from './data/low-river.json' with { type: 'json' };

/** @typedef {'Strike'|'Drive'|'Check'|'Redirect'|'Seize'|'Displace'|'Break'|'Guard'|'Evade'|'Focus'} TechniqueKind */
/** @typedef {'strike'|'commit'|'guard'|'deflect'|'evade'|'focus'} Verb */
/** @typedef {'neutral'|'pressure'|'retreat'|'angle'|'any'} Intent */

/**
 * @typedef {object} Frames
 * @property {number} startup @property {number} active @property {number} recovery
 * @property {number} breath @property {number} cancelFrom
 */

/**
 * @typedef {object} Technique
 * @property {string} id @property {string} name @property {TechniqueKind} kind
 * @property {Verb} verb @property {Intent} intent @property {string[]} band
 * @property {number} [reach] @property {number} [advance] @property {number} [lateral]
 * @property {number} [commitAt] @property {string} tell
 * @property {Record<string, Frames>} tiers
 * @property {{quadrant?:string, force:number}} [structure]
 * @property {{region:string, amount:number}} [vitality]
 * @property {number} [lineBuild] @property {number} [requiresLineTier]
 * @property {boolean} [displaces] @property {boolean} [interrupts] @property {boolean} [holdsLine]
 * @property {{absorb:number, vitalityAbsorb:number}} [guard]
 * @property {{returnForce:number, attackerRecoveryAdd:number}} [deflect]
 * @property {{burst:number}} [evade]
 * @property {string|null} [terminal]
 */

/** @type {Map<string, Technique>} */
const byId = new Map();
/** @type {Map<string, Technique>} */
const byGrammar = new Map();

const STYLES = [lowRiver];

function grammarKey(style, verb, intent) {
  return `${style}|${verb}|${intent}`;
}

/**
 * Validation is a build step (TECHNICAL_ARCHITECTURE.md §3.2). A technique whose
 * windows are incoherent fails loudly rather than rotting silently.
 * @param {any} t @param {string} style @returns {string[]} errors
 */
export function validateTechnique(t, style) {
  const e = [];
  const where = `${style}:${t?.id ?? '<no id>'}`;
  if (!t.id) e.push(`${where}: missing id`);
  if (!t.kind) e.push(`${where}: missing kind`);
  if (!t.verb) e.push(`${where}: missing verb`);
  if (!t.intent) e.push(`${where}: missing intent`);
  if (!Array.isArray(t.band) || t.band.length === 0) e.push(`${where}: missing band`);
  const tier = t.tiers?.sound;
  if (!tier) { e.push(`${where}: no 'sound' tier (M1 ships Sound only)`); return e; }
  for (const k of ['startup', 'active', 'recovery', 'breath', 'cancelFrom']) {
    if (typeof tier[k] !== 'number' || tier[k] < 0) e.push(`${where}: tier.${k} must be a non-negative number`);
  }
  // A cancel window must sit inside the technique's own length, or it can never fire.
  const len = tier.startup + tier.active + tier.recovery;
  if (tier.cancelFrom > len) e.push(`${where}: cancelFrom ${tier.cancelFrom} exceeds length ${len}`);
  // Anything that can land needs reach and a force.
  const offensive = ['Strike', 'Drive', 'Check', 'Displace', 'Break'].includes(t.kind);
  if (offensive) {
    if (typeof t.reach !== 'number') e.push(`${where}: offensive technique needs reach`);
    if (!t.structure || typeof t.structure.force !== 'number') e.push(`${where}: offensive technique needs structure.force`);
    if (tier.active <= 0) e.push(`${where}: offensive technique needs active frames`);
    if (typeof t.commitAt !== 'number') e.push(`${where}: offensive technique needs commitAt (the Lie boundary)`);
    else if (t.commitAt >= tier.startup) e.push(`${where}: commitAt ${t.commitAt} must fall inside startup ${tier.startup}`);
  }
  return e;
}

/** @returns {string[]} all validation errors across every loaded style */
export function validateAll() {
  const errs = [];
  for (const s of STYLES) for (const t of s.techniques) errs.push(...validateTechnique(t, s.style));
  return errs;
}

function load() {
  byId.clear();
  byGrammar.clear();
  const errs = validateAll();
  if (errs.length) throw new Error(`TechniqueDB invalid:\n  ${errs.join('\n  ')}`);
  for (const s of STYLES) {
    for (const t of s.techniques) {
      byId.set(t.id, /** @type {Technique} */ (t));
      byGrammar.set(grammarKey(s.style, t.verb, t.intent), /** @type {Technique} */ (t));
    }
  }
}
load();

/** @param {string} id @returns {Technique} */
export function technique(id) {
  const t = byId.get(id);
  if (!t) throw new Error(`unknown technique: ${id}`);
  return t;
}

/** @param {Technique} t @param {string} [tier] @returns {Frames} */
export function frames(t, tier = 'sound') {
  const f = t.tiers[tier] ?? t.tiers.sound;
  return f;
}

/** @param {Technique} t @returns {number} total ticks */
export function length(t, tier = 'sound') {
  const f = frames(t, tier);
  return f.startup + f.active + f.recovery;
}

export function allTechniques() { return [...byId.values()]; }
export { byGrammar as _grammarIndex, grammarKey };
