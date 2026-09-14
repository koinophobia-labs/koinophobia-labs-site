/**
 * Parity check: the built (hosted) simulation must produce the SAME fight as the
 * canonical repository simulation, tick for tick. If this fails, the adapter has
 * changed behaviour and the hosted build is no longer M1.
 */
import assert from 'node:assert/strict';
import * as srcFight from './sim/fight.js';
import * as srcReplay from './sim/replay.js';
import * as srcForm from './sim/formMachine.js';
import * as srcTech from './sim/techniques.js';
import * as dstFight from './dist/sim/fight.js';
import * as dstReplay from './dist/sim/replay.js';
import * as dstForm from './dist/sim/formMachine.js';
import * as dstTech from './dist/sim/techniques.js';

// 1. technique data identical, field for field
const a = srcTech.allTechniques().map((t) => JSON.stringify(t)).sort();
const b = dstTech.allTechniques().map((t) => JSON.stringify(t)).sort();
assert.deepEqual(a, b, 'technique data diverged');
console.log(`technique data:      identical (${a.length} techniques)`);
assert.deepEqual(srcTech.validateAll(), [], 'canonical data invalid');
assert.deepEqual(dstTech.validateAll(), [], 'built data invalid');

// 2. the same scripted fights, compared by digest
function script(form) {
  return (f, n) => {
    const N = form.neutralIntent();
    if (n % 90 < 26) return { ...N, forward: 1, verb: n % 23 === 0 ? 'commit' : null, held: true };
    if (n % 90 < 44) return { ...N, forward: 0.2, lateral: 1, verb: n % 19 === 0 ? 'strike' : null, held: true };
    if (n % 90 < 62) return { ...N, guard: true, held: true };
    if (n % 90 < 74) return { ...N, forward: -1, verb: n % 31 === 0 ? 'evade' : null, held: true };
    return { ...N, forward: 0, verb: n % 37 === 0 ? 'deflect' : null, held: true };
  };
}
const inchChoice = (f) => (f.inch && f.inch.actorId === 'player'
  && f.inch.ticksLeft <= Math.round(f.inch.total * 0.5)) ? { terminal: 'strike_through' } : {};

let checked = 0;
for (const reaction of [12, 14, 16, 18, 20, 22]) {
  const A = srcFight.makeFight({ reaction });
  const B = dstFight.makeFight({ reaction });
  const sa = script(srcForm), sb = script(dstForm);
  for (let n = 0; n < 60 * 200; n++) {
    if (A.over && B.over) break;
    srcFight.step(A, sa(A, n), inchChoice(A));
    dstFight.step(B, sb(B, n), inchChoice(B));
    const da = srcReplay.digest(A), db = dstReplay.digest(B);
    if (da !== db) {
      console.error(`DIVERGED at tick ${n} (reaction ${reaction})\n  src: ${da}\n  dst: ${db}`);
      process.exit(1);
    }
  }
  checked++;
  console.log(`fight reaction=${reaction}: identical for ${A.tick} ticks -> ${A.over?.winnerId ?? 'unresolved'}/${A.over?.reason ?? '-'}`);
}
console.log(`\nPARITY OK — ${checked} fights, tick-for-tick identical digests.`);
