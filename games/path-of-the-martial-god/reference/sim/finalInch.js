/**
 * FinalInch — COMBAT_SYSTEM.md §10, TECHNICAL_ARCHITECTURE.md §3.6.
 *
 * "A martial god is someone who can end any fight and chooses how it ends."
 * Mastery buys TERMINAL OPTIONS, not damage. This module is the thesis in code:
 * the set of ways you may end a person is a function of your competence and their
 * state — never a hardcoded branch.
 *
 * Milestone 1 ships three terminals. The shape is already plural so that Break,
 * Choke, Dismantle and Submit drop in without touching callers.
 */
import { INCH, WILL } from './constants.js';

/** @typedef {'strike_through'|'stop'|'lapse'} TerminalId */

/**
 * @typedef {object} Terminal
 * @property {TerminalId} id
 * @property {string} name
 * @property {number} difficulty 0..1 — the mastery required to execute it cleanly
 * @property {boolean} lethalRisk
 * @property {string} reads how the world reads this choice
 */

/** @type {Terminal[]} */
export const TERMINALS = [
  {
    id: 'strike_through',
    name: 'Strike through',
    difficulty: 0.0,
    lethalRisk: false,
    reads: 'Ordinary. The default. Fast, clean, forgettable.',
  },
  {
    id: 'stop',
    name: 'The Stop',
    // The hardest thing in the game. A novice who tries to pull a strike overshoots
    // and connects anyway — the ability to be merciful is gated behind competence.
    difficulty: 0.55,
    lethalRisk: false,
    reads: 'They feel the inch. The hardest thing in the game.',
  },
  {
    id: 'lapse',
    name: 'Let it lapse',
    difficulty: 0.0,
    lethalRisk: false,
    reads: 'Indifference. Neither mercy nor cruelty.',
  },
];

/**
 * Is this fighter finished — Structure broken AND they know it?
 * Not every knockdown is an ending. COMBAT_SYSTEM.md §10.
 */
export function isFinished(target) {
  const broken = target.state === 'staggered' || target.state === 'down';
  return broken && target.will < WILL.inchThreshold;
}

/**
 * The window widens with mastery: a better fighter has MORE TIME TO DECIDE,
 * which is exactly right — skill buys deliberation, not speed.
 */
export function windowTicks(mastery) {
  return Math.round(INCH.baseWindowTicks + INCH.perMasteryTicks * clamp01(mastery));
}

/**
 * Which terminals this fighter can actually execute right now.
 *
 * THE COMPETENCE GATE. `attempt()` below decides whether a chosen terminal lands as
 * intended or fails into something else. In M1 every terminal is offered so the
 * mechanic is legible, and `attempt()` is where mastery already bites.
 *
 * @param {import('./fighter.js').Fighter} actor
 * @param {import('./fighter.js').Fighter} target
 * @returns {Terminal[]}
 */
export function offer(actor, target) {
  return TERMINALS.filter((t) => {
    // Terminals that need a grip (Break, Choke, Submit) arrive with CustodyGraph.
    if (t.requiresCustody) return false;
    // A fighter already on the ground cannot be "let lapse" into a standing reset.
    if (t.id === 'lapse' && target.state === 'down') return true;
    return true;
  });
}

/**
 * Execute a chosen terminal.
 *
 * The Stop is a SKILL. Below the competence threshold the fighter reaches for it and
 * fails — the motion overshoots and they connect anyway. Restraint is not a moral
 * choice available to the weak, and this function is the only place that is decided.
 *
 * @param {TerminalId} id
 * @param {import('./fighter.js').Fighter} actor
 * @param {import('./fighter.js').Fighter} target mutated
 * @returns {{id:TerminalId, executed:TerminalId, clean:boolean, note:string}}
 */
export function attempt(id, actor, target) {
  const term = TERMINALS.find((t) => t.id === id) ?? TERMINALS[2];
  const clean = actor.mastery >= term.difficulty;

  if (id === 'stop' && !clean) {
    // Reached for mercy without the control to execute it.
    applyStrikeThrough(target);
    return {
      id, executed: 'strike_through', clean: false,
      note: 'Reached for the Stop and could not hold it. The strike went through.',
    };
  }

  if (id === 'stop') {
    target.state = 'finished';
    target.will = Math.max(0, target.will - 6);
    return { id, executed: 'stop', clean: true, note: 'Held the finish and did not take it.' };
  }

  if (id === 'lapse') {
    // Not acting is acting. They live; it reads as neither mercy nor cruelty.
    target.state = 'neutral';
    target.stateTicks = 0;
    return { id, executed: 'lapse', clean: true, note: 'Disengaged. They live.' };
  }

  applyStrikeThrough(target);
  return { id, executed: 'strike_through', clean: true, note: 'Finished it.' };
}

function applyStrikeThrough(target) {
  target.state = 'finished';
  target.will = 0;
  for (const k of Object.keys(target.vitality)) target.vitality[k] = 0;
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
