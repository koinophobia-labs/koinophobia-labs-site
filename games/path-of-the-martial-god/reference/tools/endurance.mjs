/**
 * Does a fight always end?
 *
 * Nothing in the simulation limits a fight's length: no round timer, no clock, no
 * decision. `replay.js` caps at 60*120 ticks, but that is a TEST harness guard, not a
 * rule of the game — nothing in `fight.js` knows about it.
 *
 * So the question has to be asked by playing, and the answer is no. This tool holds a
 * fixed input for twenty simulated minutes across a spread of opponent temperaments and
 * reports which combinations never resolve.
 *
 *   node tools/endurance.mjs           # the summary
 *   node tools/endurance.mjs --why     # plus why the opponent fails to close
 *
 * See NATIVE_M1_REPORT.md §9.10. This is a characterisation tool, not a gate: it
 * describes current behaviour so a fix can be measured against it. Nothing here asserts
 * that the behaviour is correct.
 */
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent } from '../sim/formMachine.js';

const MINUTES = 20;
const CAP = 60 * 60 * MINUTES;
const WHY = process.argv.includes('--why');

const hold = (o) => () => ({ ...neutralIntent(), held: true, ...o });

export const CASES = [
  ['does nothing at all',    hold({})],
  ['holds guard forever',    hold({ guard: true })],
  ['retreats forever',       hold({ forward: -1 })],
  ['retreats holding guard', hold({ forward: -1, guard: true })],
  ['circles forever',        hold({ lateral: 1 })],
  ['retreats and circles',   hold({ forward: -1, lateral: 1 })],
];

export const TEMPERAMENTS = [0.15, 0.5, 0.9];

/**
 * Run one case to resolution or to the cap.
 *
 * Events are read from `fight.log`, the cumulative record. NOTE for anyone extending
 * this: `step(fight, input, choice)` takes NO emit callback — `fight.events` is cleared
 * every tick and `fight.log` is the history. Passing a fourth argument is silently
 * ignored, which is how the first version of this tool reported "not one event in five
 * minutes" for a fight that was landing blows.
 */
export function endure(input, aggression, cap = CAP) {
  const f = makeFight({ aggression, patience: 0.5, reaction: 12, playerMastery: 0.25 });
  let n = 0;
  while (!f.over && n < cap) { step(f, input(), {}); n++; }
  const types = new Map();
  for (const e of f.log) types.set(e.type, (types.get(e.type) ?? 0) + 1);
  return { over: f.over, ticks: n, fight: f, events: f.log.length, types };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let stalled = 0;
  for (const [name, input] of CASES) {
    for (const aggression of TEMPERAMENTS) {
      const r = endure(input, aggression);
      const { over, ticks, fight } = r;
      if (!over) stalled++;
      const { events, types } = r;
      const sep = Math.hypot(fight.a.pos.x - fight.b.pos.x, fight.a.pos.z - fight.b.pos.z);
      console.log(
        `${over ? 'ends ' : 'NEVER'}  ${name.padEnd(23)} aggression ${aggression}  ` +
        `${(ticks / 60).toFixed(1).padStart(7)}s  ` +
        (over ? over.reason
              : `${sep.toFixed(2)}m apart, ${events} events` +
                (events ? ` (${[...types].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, c]) => `${k} ${c}`).join(' ')})` : '')));
    }
  }
  console.log(`\n${stalled} of ${CASES.length * TEMPERAMENTS.length} never resolved ` +
              `inside ${MINUTES} simulated minutes.`);

  if (WHY) {
    console.log('\nWhy the opponent fails to close, against "retreats and circles":\n');
    for (const aggression of TEMPERAMENTS) {
      const f = makeFight({ aggression, patience: 0.5, reaction: 12, playerMastery: 0.25 });
      const input = hold({ forward: -1, lateral: 1 });
      const modes = new Map();
      let oppTravel = 0, playerTravel = 0;
      let bp = { ...f.b.pos }, ap = { ...f.a.pos };
      const N = 60 * 120;
      for (let n = 0; n < N; n++) {
        step(f, input(), {});
        oppTravel += Math.hypot(f.b.pos.x - bp.x, f.b.pos.z - bp.z);
        playerTravel += Math.hypot(f.a.pos.x - ap.x, f.a.pos.z - ap.z);
        bp = { ...f.b.pos }; ap = { ...f.a.pos };
        modes.set(f.b.moveMode, (modes.get(f.b.moveMode) ?? 0) + 1);
      }
      const advancing = (modes.get('advancing') ?? 0) / N;
      console.log(`  aggression ${aggression}`);
      console.log(`    travels ${(oppTravel / N).toFixed(5)} m/tick vs the player's ${(playerTravel / N).toFixed(5)}`);
      console.log(`    but advances only ${(advancing * 100).toFixed(0)}% of ticks: ` +
                  `${[...modes].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(0)}%`).join(', ')}`);
      console.log(`    closing ~${(advancing * 0.030).toFixed(4)} m/tick against the player's ` +
                  `~${(0.707 * 0.024).toFixed(4)} m/tick of opening. ` +
                  `${advancing * 0.030 > 0.707 * 0.024 ? 'Closes.' : 'Never closes.'}\n`);
    }
  }
}
