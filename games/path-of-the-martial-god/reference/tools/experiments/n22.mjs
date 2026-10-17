/**
 * N-22, measured three ways.
 *
 * A fight can be comprehensively won and still not end: 414 clean hits, 137 structure
 * breaks, torso destroyed, no terminal route reachable (NATIVE_M1_REPORT.md §9.11).
 * OPEN_DECISIONS.md offers three fixes. Which one is right is a design question, but
 * "what does each actually do" is not — it is measurable, and nobody should have to
 * choose between them from prose.
 *
 * This applies each candidate to a COPY of the simulation, runs the same three
 * measurements over it, and throws the copy away. The real tree is never modified.
 *
 *   node tools/experiments/n22.mjs
 *
 * Adding a candidate is four lines. That is deliberate: the answer may be none of
 * these, and the next person should be able to price a fourth idea in a minute.
 */
import { cp, rm, readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REF = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

/** Each candidate edits one file by exact string replacement. */
const CANDIDATES = [
  {
    id: 'baseline',
    what: 'unchanged, for comparison',
    edits: [],
  },
  {
    id: 'option 1',
    what: 'a destroyed head or torso ends it, whatever the total',
    edits: [[
      'sim/fight.js',
      'if (vitalityFraction(target) <= 0) {',
      'if (vitalityFraction(target) <= 0 || target.vitality.head <= 0 || target.vitality.torso <= 0) {',
    ]],
  },
  {
    id: 'option 2',
    what: 'weight vitalityFraction so head and torso dominate',
    edits: [[
      'sim/fighter.js',
      'for (const r of REGIONS) { cur += f.vitality[r]; max += MAX.region[r]; }',
      "const W = { head: 3, torso: 3, leadArm: 0.5, rearArm: 0.5, leadLeg: 1, rearLeg: 1 };\n  for (const r of REGIONS) { cur += f.vitality[r] * W[r]; max += MAX.region[r] * W[r]; }",
    ]],
  },
  {
    id: 'option 3',
    what: 'no composure recovery while gassed, staggered or down',
    edits: [[
      'sim/fight.js',
      'if (!gassedOut) f.will = Math.min(MAX.will, f.will + WILL.regenPerTick);',
      "const composed = !gassedOut && f.state !== 'staggered' && f.state !== 'down';\n    if (composed) f.will = Math.min(MAX.will, f.will + WILL.regenPerTick);",
    ]],
  },
  {
    id: '1 + 3',
    what: 'both, since they address different halves',
    edits: [
      ['sim/fight.js',
       'if (vitalityFraction(target) <= 0) {',
       'if (vitalityFraction(target) <= 0 || target.vitality.head <= 0 || target.vitality.torso <= 0) {'],
      ['sim/fight.js',
       'if (!gassedOut) f.will = Math.min(MAX.will, f.will + WILL.regenPerTick);',
       "const composed = !gassedOut && f.state !== 'staggered' && f.state !== 'down';\n    if (composed) f.will = Math.min(MAX.will, f.will + WILL.regenPerTick);"],
    ],
  },
];

async function measure(dir) {
  const { makeFight, step } = await import(join(dir, 'sim/fight.js') + `?v=${Math.random()}`);
  const { neutralIntent: N } = await import(join(dir, 'sim/formMachine.js') + `?v=${Math.random()}`);

  const PASSIVE = [
    () => ({ ...N(), held: true }),
    () => ({ ...N(), held: true, guard: true }),
    () => ({ ...N(), held: true, forward: -1 }),
    () => ({ ...N(), held: true, forward: -1, guard: true }),
    () => ({ ...N(), held: true, lateral: 1 }),
    () => ({ ...N(), held: true, forward: -1, lateral: 1 }),
  ];
  const ENGAGING = [
    () => ({ ...N(), held: true, guard: true }),
    (n) => ({ ...N(), held: true, forward: 1, verb: n % 17 === 0 ? 'strike' : null }),
    (n) => ({ ...N(), held: true, forward: 1, verb: n % 11 === 0 ? 'commit' : null }),
    (n) => ({ ...N(), held: true, forward: 0.2, lateral: 1, verb: n % 19 === 0 ? 'strike' : null }),
  ];
  const run = (input, opts, cap) => {
    const f = makeFight(opts);
    let n = 0;
    while (!f.over && n < cap) { step(f, input(n), {}); n++; }
    return { over: f.over, ticks: n };
  };

  // 1. passive stalls, the defect itself
  let stalls = 0;
  for (const input of PASSIVE)
    for (const aggression of [0.15, 0.5, 0.9])
      if (!run(input, { aggression, patience: 0.5, reaction: 12, playerMastery: 0.25 }, 60 * 60 * 20).over) stalls++;

  // 2. engaged fights, the thing that must not break
  let broke = 0; const times = [];
  for (const input of ENGAGING)
    for (const aggression of [0.15, 0.5, 0.9])
      for (const patience of [0.2, 0.5, 0.8])
        for (const reaction of [10, 16, 22]) {
          const r = run(input, { aggression, patience, reaction, playerMastery: 0.25 }, 60 * 60 * 4);
          if (!r.over) broke++; else times.push(r.ticks / 60);
        }
  times.sort((a, b) => a - b);

  // 3. which endings become reachable
  const reasons = new Map();
  for (const input of [...PASSIVE, ...ENGAGING])
    for (const aggression of [0.15, 0.5, 0.9])
      for (const reaction of [12, 18]) {
        const r = run(input, { aggression, patience: 0.5, reaction, playerMastery: 0.25 }, 60 * 60 * 4);
        if (r.over) reasons.set(r.over.reason, (reasons.get(r.over.reason) ?? 0) + 1);
      }

  return {
    stalls,
    broke,
    median: times[Math.floor(times.length / 2)] ?? NaN,
    worst: times[times.length - 1] ?? NaN,
    reasons,
  };
}

/** Do the committed traces still reproduce? A "no" means re-baselining. */
async function tracesChanged(dir) {
  const { SCENARIOS, produce } = await import(join(dir, 'tools/trace.mjs') + `?v=${Math.random()}`);
  const changed = [];
  for (const s of SCENARIOS) {
    const committed = JSON.parse(await readFile(join(dir, `traces/${s.name}.json`), 'utf8'));
    if (JSON.stringify(produce(s).frames) !== JSON.stringify(committed.frames)) changed.push(s.name);
  }
  return changed;
}

const rows = [];
for (const c of CANDIDATES) {
  const dir = await mkdtemp(join(tmpdir(), 'n22-'));
  await cp(REF, dir, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('/.git') });
  for (const [file, from, to] of c.edits) {
    const p = join(dir, file);
    const src = await readFile(p, 'utf8');
    if (!src.includes(from)) throw new Error(`${c.id}: anchor not found in ${file} — the candidate is stale`);
    await writeFile(p, src.replace(from, to));
  }
  const m = await measure(dir);
  const changed = await tracesChanged(dir);
  rows.push({ c, m, changed });
  await rm(dir, { recursive: true, force: true });
}

console.log('\nN-22 candidates, measured. The real tree was not modified.\n');
console.log('id'.padEnd(10) + 'stalls'.padStart(7) + 'engaged'.padStart(9)
          + 'median'.padStart(8) + 'worst'.padStart(8) + '  traces  endings');
console.log('-'.repeat(86));
for (const { c, m, changed } of rows) {
  const endings = [...m.reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' ');
  console.log(
    c.id.padEnd(10)
    + `${m.stalls}/18`.padStart(7)
    + (m.broke === 0 ? 'all ok' : `${m.broke} BROKE`).padStart(9)
    + `${m.median.toFixed(1)}s`.padStart(8)
    + `${m.worst.toFixed(1)}s`.padStart(8)
    + `  ${String(changed.length).padStart(2)}/8    ${endings}`);
}
console.log('\n' + rows.map(({ c }) => `  ${c.id.padEnd(10)} ${c.what}`).join('\n'));
console.log('\nstalls   = passive-player cases not resolving in 20 simulated minutes (lower is better)');
console.log('engaged  = ordinary fights that stopped resolving (must be "all ok")');
console.log('traces   = committed fixtures needing re-baselining if this is chosen');
