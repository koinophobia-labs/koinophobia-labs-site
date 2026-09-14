/**
 * Simulation constants. Engine-free.
 * COMBAT_SYSTEM.md §1 (determinism), §4 (distance bands).
 */

/** Fixed simulation rate. All frame windows in technique data are in these ticks. */
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

/**
 * Distance bands, metres, centre-to-centre.
 * COMBAT_SYSTEM.md §4: Outside / Long / Mid / Contact.
 */
export const BANDS = {
  contact: { min: 0.0, max: 0.95 },
  mid: { min: 0.95, max: 1.75 },
  long: { min: 1.75, max: 2.7 },
  outside: { min: 2.7, max: Infinity },
};

/** @param {number} d metres @returns {'contact'|'mid'|'long'|'outside'} */
export function bandFor(d) {
  if (d < BANDS.contact.max) return 'contact';
  if (d < BANDS.mid.max) return 'mid';
  if (d < BANDS.long.max) return 'long';
  return 'outside';
}

/** Arena. A yard, not an open world. Walls matter: a broken rear against a wall is a disaster. */
export const ARENA = { halfWidth: 4.6, halfDepth: 3.0 };

export const QUADRANTS = /** @type {const} */ (['fore', 'rear', 'leadSide', 'rearSide']);
export const REGIONS = /** @type {const} */ ([
  'head', 'torso', 'leadArm', 'rearArm', 'leadLeg', 'rearLeg',
]);

export const MAX = {
  quadrant: 100,
  breath: 100,
  will: 100,
  region: { head: 42, torso: 70, leadArm: 40, rearArm: 40, leadLeg: 46, rearLeg: 46 },
};

/**
 * URGENCY — what happens when no opening is ever offered.
 *
 * Patience is waiting for an opening. It is not the same thing as standing still
 * forever, and the difference only shows against an opponent who never gives one: a
 * player who backs away and circles was never caught at any temperament, and the fight
 * ran for twenty simulated minutes without a single event (NATIVE_M1_REPORT.md §9.10).
 *
 * The fighter could not see that anything was wrong, because nothing in the model
 * measured "how long since anything happened". This is that measurement. A fighter who
 * lets someone dance in front of them for a quarter of a minute is not being patient,
 * they are being passive — and the same note already exists in `finalInch.js` about
 * mercy: "A fighter who lets every finish lapse is not merciful, it is broken."
 *
 * Quiet is judged only from what a fighter can SEE: whether either body is doing
 * something. Not events, not resources, and never the opponent's input buffer.
 */
export const URGENCY = {
  graceTicks: 300,   // five seconds of no contact is ordinary circling, not a stall
  rampTicks: 600,    // ten more to reach full pressure, so it arrives as a mood
  advance: 1.6,      // enough to beat `hold`'s patience term and the circle options
  settle: 1.3,       // what waiting stops being worth
};

/** Locomotion, metres per tick. */
export const MOVE = {
  advance: 0.030,
  retreat: 0.024,   // Low River "does not retreat well"
  lateral: 0.026,
  guardScale: 0.45, // moving while guarding is slow
  // A slip's burst is NOT here. It belongs to the technique, in low-river.json
  // (`evade.burst`), which is the value formMachine actually reads. A second copy in
  // this file would be a number you could tune all day with no effect.
};

/**
 * Structure recovery per tick, by what the fighter is doing (COMBAT_SYSTEM.md §2).
 *
 * Tuned so that sustained pressure genuinely accumulates: a static guard recovers
 * ~3.9/s against guarded Drive forces of ~13, so "guarding does not save you; it
 * postpones" is true in the numbers and not just in the fiction. Recovery must never
 * approach the rate at which a committed opponent can apply force.
 */
export const STRUCTURE_RECOVERY = {
  advancing: 0.100, // Low River: best while advancing
  settling: 0.065,  // deliberate settle with the base set
  idle: 0.045,
  lateral: 0.055,
  retreating: 0.020, // Low River: worst while retreating
  acting: 0.0,       // no recovery during a technique
  gassed: 0.0,       // COMBAT_SYSTEM.md §2: at zero Breath, structure recovery halts
};

export const BREATH = {
  recoverIdle: 0.20,
  recoverFocus: 0.62,
  recoverMoving: 0.09,
  guardDrainPerTick: 0.11,
  // A guard that went up too late costs this and protects nothing. "Too late" means
  // the raise has not finished: resolve.js compares guardTicks against the settle
  // technique's own startup, from low-river.json. There used to be a `lateGuardTicks`
  // here claiming the window was 8 ticks. Nothing read it and it was wrong — the real
  // window is settle's startup, which is 3. A tuning file that lies is worse than a
  // tuning file that is silent, because the lie gets believed and acted on.
  lateGuardPenalty: 9,
  deflectFailPenalty: 16,
  // A slip's Breath cost is likewise the technique's own `frames.breath`, not a copy.
  impactAbsorb: 0.35,    // per point of structure force absorbed while guarding
};

/** The Line — Low River's signature mechanic (MARTIAL_STYLES.md §3). Three tiers. */
export const LINE = {
  maxTier: 3,
  buildPerAdvanceTick: 0.020,
  decayPerTick: 0.006,
  structureBonusPerTier: 0.16,   // escalating structure damage
  recoveryCutPerTier: 0.06,      // shortened recovery
  // There was an `antiFlinchFromTier: 2` here, for a flinch mechanic that exists
  // nowhere — not in this code, not in the Swift port, not in COMBAT_SYSTEM.md. If the
  // Line should eventually let you eat a jab without breaking stride, that is a design
  // decision to make and write down, not a number to leave lying about looking settled.
};

export const WILL = {
  onStructureBreak: 14,
  onCleanHit: 2.0,
  onHeadHit: 4.0,
  onGassed: 0.10,          // per tick while at zero breath
  regenPerTick: 0.05,
  answerBonus: 3.5,        // landing a hit restores composure
  inchThreshold: 55,       // below this, a structure break is finishing rather than a scramble
  yieldThreshold: 12,
};

/** Final Inch (COMBAT_SYSTEM.md §10). Window scales with mastery. */
export const INCH = {
  baseWindowTicks: 54,
  perMasteryTicks: 30,
  dilation: 0.35,
};

export const PERCEPTION = { minLatencyTicks: 11, maxLatencyTicks: 23 };

/**
 * Input buffer, in ticks. 10 ticks is 167ms at 60Hz. COMBAT_SYSTEM.md §3.1.
 *
 * Without this the player is strictly disadvantaged against the opponent: the brain
 * is consulted every tick and therefore acts on the exact frame it becomes free,
 * while a human pressing a button during recovery has the press silently discarded.
 * A verb pressed this early fires on the first tick the body is able to honour it.
 * It buffers the VERB only — movement is continuous, so intent is always read from
 * the stick as it is now, and so is `held`, which is what decides the Lie. Tapping a
 * verb during a recovery and letting go therefore still produces a feint, exactly as
 * tapping it in neutral does: commitment is expressed by holding, buffered or not.
 *
 * This window is long enough to cover a missed frame or a press made just before the
 * body frees, and short enough that it cannot queue an action from across a whole
 * knockdown. Above roughly 15 ticks the game starts acting on intentions you have
 * already abandoned; below about 5 it stops being felt at all.
 *
 * See `formMachine.js:tickBuffer` for where this is applied, and why the position of
 * that call in the tick is load-bearing.
 */
export const INPUT_BUFFER_TICKS = 10;
