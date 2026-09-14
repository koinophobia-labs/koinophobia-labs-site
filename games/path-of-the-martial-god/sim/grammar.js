/**
 * StanceSystem — TECHNICAL_ARCHITECTURE.md §3.3.
 *
 * The intent grammar. This table IS Pillar 2 and it is pure data:
 *   resolve(style, verb, intent, band, oppState) -> TechniqueId
 *
 * "The inputs never change. The meaning of the inputs changes."
 * COMBAT_SYSTEM.md §4. Milestone 1 loads one style; the signature is already plural.
 */
import { _grammarIndex, grammarKey, technique } from './techniques.js';

/** @typedef {import('./techniques.js').Technique} Technique */

/**
 * Resolve an intent into a concrete technique for a style.
 * Returns null when the grammar has no sentence for this combination.
 *
 * @param {string} style
 * @param {import('./techniques.js').Verb} verb
 * @param {import('./techniques.js').Intent} intent
 * @param {string} band
 * @returns {Technique|null}
 */
export function resolve(style, verb, intent, band) {
  let t = _grammarIndex.get(grammarKey(style, verb, intent));
  // Defensive verbs are intent-agnostic: they are registered under 'any'.
  if (!t) t = _grammarIndex.get(grammarKey(style, verb, 'any'));
  if (!t) return null;
  if (t.band && !t.band.includes(band)) return null;
  return t;
}

/**
 * Everything this style can express right now, for the AI's option list and for debug.
 * @param {string} style @param {string} band @returns {Technique[]}
 */
export function availableAt(style, band) {
  const out = [];
  for (const [key, t] of _grammarIndex) {
    if (!key.startsWith(`${style}|`)) continue;
    if (t.band && !t.band.includes(band)) continue;
    out.push(t);
  }
  return out;
}

export { technique };
