/**
 * Build identity.
 *
 * Presentation-layer only: nothing in `sim/` imports this, and nothing here can reach
 * the simulation. It exists so a person looking at a hosted build in debug mode can
 * say exactly which reference implementation they are playing, and so a playtest
 * result can be filed against the baseline it was actually produced on.
 *
 * `build-artifact.mjs` OVERWRITES this file in `dist/` with the real commit and build
 * time. The values below are what the canonical repository checkout reports when run
 * directly with `npm run serve`.
 */

/**
 * The playtest baseline this build belongs to.
 *
 * Bumped when a change makes earlier human results incomparable. The input buffer did
 * that: before the fix, 27.1% of presses made while the body was busy were silently
 * discarded, so a pre-fix session measured whether the interface dropped the player's
 * command at least as much as it measured whether the player understood the fight.
 */
export const BASELINE = 'REFERENCE v2 / INPUT BUFFER FIXED';

/** The label the earlier hosted build's results are filed under. Never reused. */
export const PRIOR_BASELINE = 'PRE-BUFFER / INVALID FOR CURRENT INPUT-READABILITY BASELINE';

export const BUILD = {
  product: 'POMG M1',
  baseline: BASELINE,
  commit: 'dev',
  built: 'local',
};

/** One line, for the debug overlay. */
export function buildLabel() {
  return `${BUILD.product} · ${BUILD.baseline} · ${BUILD.commit} · ${BUILD.built}`;
}
