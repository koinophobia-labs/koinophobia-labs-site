/**
 * Golden trace producer. Runs the reference oracle over fixed scenarios and writes
 * fixtures a production port must reproduce.
 *
 *   node tools/trace.mjs            write all scenarios to traces/
 *   node tools/trace.mjs --list     name them
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent, phaseOf } from '../sim/formMachine.js';
import { distance } from '../sim/fighter.js';
import { bandFor } from '../sim/constants.js';
import { FORMAT_VERSION, captureFight, captureEvent } from './trace-format.mjs';

const N = neutralIntent;

/**
 * Scenarios are chosen to exercise every mechanic the port must preserve, and are
 * kept short enough that cross-language float drift has little room to compound into
 * a discrete divergence. Each returns the player input for a tick.
 */
export const SCENARIOS = [
  {
    name: 'idle-standoff',
    note: 'Player does nothing. Exercises AI approach, breath recovery, line decay.',
    ticks: 600,
    opts: { reaction: 16 },
    input: () => N(),
  },
  {
    name: 'refuses-to-engage',
    note: 'Player backs away and circles, forever, offering nothing. Exercises URGENCY — '
        + 'the only scenario long enough to cross the grace period and see the opponent '
        + 'stop waiting. Without it the parity gate cannot see that term at all.',
    // Long on purpose. Grace is 300 ticks and the ramp is 600, so a shorter scenario
    // would leave the whole mechanic at zero and prove nothing about it.
    ticks: 1500,
    opts: { reaction: 16, aggression: 0.5 },
    input: () => ({ ...N(), forward: -1, lateral: 1, held: true }),
  },
  {
    name: 'guard-under-pressure',
    note: 'Static guard. Exercises guard drain, late guard, spatial bypass, collapse, break.',
    ticks: 1200,
    opts: { reaction: 16 },
    input: () => ({ ...N(), guard: true, verb: 'guard', held: true }),
  },
  {
    name: 'pressure-and-commit',
    note: 'Walking him down with heavy commits. Exercises the Line, advance gating, recovery.',
    ticks: 1200,
    opts: { reaction: 14 },
    input: (f, n) => ({ ...N(), forward: 1, verb: n % 23 === 0 ? 'commit' : null, held: true }),
  },
  {
    name: 'angle-and-strike',
    note: 'Circling and striking. Exercises lateral gating, facing rates, quadrant geometry.',
    ticks: 1200,
    opts: { reaction: 18 },
    input: (f, n) => ({ ...N(), forward: 0.2, lateral: 1, verb: n % 19 === 0 ? 'strike' : null, held: true }),
  },
  {
    name: 'feint-and-slip',
    note: 'Releases before the commit frame and slips. Exercises the Lie and conditional i-frames.',
    ticks: 900,
    opts: { reaction: 16 },
    input: (f, n) => {
      const beat = n % 40;
      if (beat === 0) return { ...N(), forward: 1, verb: 'commit', held: true };
      if (beat < 4) return { ...N(), forward: 1, verb: null, held: false };   // release -> feint
      if (beat === 12) return { ...N(), lateral: 1, verb: 'evade', held: true };
      if (beat === 24) return { ...N(), forward: 0, verb: 'deflect', held: true };
      return { ...N(), forward: 0.3, held: true };
    },
  },
  {
    name: 'breath-to-empty',
    note: 'Spams commits until gassed, then breathes. Exercises breath floor and Focus.',
    ticks: 1500,
    opts: { reaction: 20 },
    input: (f, n) => (f.a.breath < 10
      ? { ...N(), forward: -1, verb: n % 40 === 0 ? 'focus' : null, held: true }
      : { ...N(), forward: 1, verb: n % 14 === 0 ? 'commit' : null, held: true }),
  },
  {
    name: 'to-the-final-inch',
    note: 'Reactive play driven to a terminal. Exercises the Inch window and resolution.',
    ticks: 3000,
    opts: { reaction: 22 },
    input: (f, n) => {
      const band = bandFor(distance(f.a, f.b));
      if (f.a.breath < 30) return { ...N(), forward: -1, verb: n % 36 === 0 ? 'focus' : null, held: true, guard: true };
      if (band === 'outside' || band === 'long') return { ...N(), forward: 1, held: true };
      const ph = phaseOf(f.b);
      if (ph === 'recovery' || f.b.state === 'staggered') return { ...N(), forward: 1, verb: 'commit', held: true };
      if (ph === 'startup') return { ...N(), guard: true, held: true };
      return { ...N(), forward: 0.2, lateral: 1, verb: n % 20 === 0 ? 'strike' : null, held: true };
    },
    // A human presses something at the Inch; the port must be given the same choice.
    choice: (f) => (f.inch && f.inch.actorId === 'player'
      && f.inch.ticksLeft <= Math.round(f.inch.total * 0.5)) ? { terminal: 'strike_through' } : {},
  },
];

/** Run one scenario and build its fixture. */
export function produce(scenario) {
  const fight = makeFight(scenario.opts);
  const inputs = [];
  const frames = [];
  const events = [];

  for (let n = 0; n < scenario.ticks; n++) {
    if (fight.over) break;
    const input = scenario.input(fight, n);
    const choice = scenario.choice ? scenario.choice(fight, n) : {};
    // Record the resolved input, so a port never has to reimplement the script.
    inputs.push({
      forward: input.forward, lateral: input.lateral,
      verb: input.verb ?? null, held: !!input.held, guard: !!input.guard,
      terminal: choice.terminal ?? null,
    });
    step(fight, input, choice);
    for (const e of fight.events) events.push(captureEvent(e));
    frames.push(captureFight(fight));
  }

  return {
    formatVersion: FORMAT_VERSION,
    scenario: scenario.name,
    note: scenario.note,
    options: scenario.opts,
    tickCount: frames.length,
    inputs,
    frames,
    events,
  };
}

if (process.argv[1]?.endsWith('trace.mjs')) {
  if (process.argv.includes('--list')) {
    for (const s of SCENARIOS) console.log(`${s.name.padEnd(24)} ${s.ticks} ticks  ${s.note}`);
  } else {
    const dir = new URL('../traces/', import.meta.url).pathname;
    await mkdir(dir, { recursive: true });
    let totalFrames = 0, totalEvents = 0;
    for (const s of SCENARIOS) {
      const t = produce(s);
      await writeFile(`${dir}${s.name}.json`, JSON.stringify(t));
      totalFrames += t.frames.length; totalEvents += t.events.length;
      const last = t.frames[t.frames.length - 1];
      console.log(`${s.name.padEnd(24)} ${String(t.tickCount).padStart(5)} ticks  ${String(t.events.length).padStart(4)} events  -> ${last.over ? `${last.over.winnerId}/${last.over.reason}` : 'unresolved'}`);
    }
    console.log(`\n${SCENARIOS.length} traces, ${totalFrames} frames, ${totalEvents} events.`);
  }
}
