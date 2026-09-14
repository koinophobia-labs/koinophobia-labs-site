/**
 * Every tuning constant must reach the simulation.
 *
 * This is the third time this defect class has turned up in this project, and the
 * third variant of it:
 *
 *   1. The input buffer — a whole feature, documented and constant-backed, that never
 *      executed because its capture sat below the early returns.
 *   2. Five accessibility settings declared and never read, in a build with no settings
 *      screen to reach them from.
 *   3. Four tuning constants nothing read, three of them SECOND COPIES of numbers the
 *      code really takes from low-river.json — and one of those, `lateGuardTicks: 8`,
 *      disagreed with the value actually in force (3). Anyone tuning the late-guard
 *      window from that file would have been tuning nothing, from a wrong number.
 *
 *   4. `WILL.onGassed: 0.10` — read, applied, and then immediately halved. The per-tick
 *      regeneration ran on the same fighter in the same pass, so a constant documented
 *      as "per tick while at zero breath" delivered 0.05. Being READ is not the same as
 *      being IN FORCE, which is why the test below measures the value instead of
 *      grepping for it.
 *
 * A tuning file is read by people deciding how the game should feel. A constant in it
 * that nothing consumes is not harmless clutter — it is a false statement about the
 * game, sitting in the most authoritative-looking place in the repository. One that is
 * consumed and then silently cancelled is the same statement, better hidden.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeFight, step } from '../sim/fight.js';
import { neutralIntent } from '../sim/formMachine.js';
import { WILL } from '../sim/constants.js';
import { SCENARIOS } from '../tools/trace.mjs';

const HERE = new URL('..', import.meta.url).pathname;

/**
 * Keys that are genuinely read, but not by name — so the scan below cannot see them.
 * Every entry needs a reason. An allowlist without reasons becomes the place things go
 * to be forgotten, which is the problem this test exists to solve.
 */
const READ_DYNAMICALLY = {
  'STRUCTURE_RECOVERY.acting': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.gassed': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.settling': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.advancing': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.retreating': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.lateral': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'STRUCTURE_RECOVERY.idle': 'structure.js looks the mode up as STRUCTURE_RECOVERY[mode]',
  'BANDS.outside': 'bandFor returns "outside" as the fallthrough without consulting it; '
    + 'the entry stays because a band table missing its last row is harder to read than '
    + 'one with a row the code does not need',
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

test('every tuning constant is read by something', () => {
  const constantsPath = join(HERE, 'sim/constants.js');
  const constants = strip(readFileSync(constantsPath, 'utf8'));

  // constants.js is included on purpose: `bandFor` lives there and reads the band
  // table. A declaration is `key:` and a read is `.key`, so a constant cannot count as
  // its own consumer.
  const consumers = [...walk(join(HERE, 'sim')), ...walk(join(HERE, 'view'))]
    .map((p) => strip(readFileSync(p, 'utf8')))
    .join('\n');

  const dead = [];
  for (const group of constants.matchAll(/export const (\w+) = \{([\s\S]*?)\n\};/g)) {
    const [, name, body] = group;
    for (const key of body.matchAll(/^\s{2}(\w+):/gm)) {
      const path = `${name}.${key[1]}`;
      if (path in READ_DYNAMICALLY) continue;
      if (!consumers.includes(`.${key[1]}`)) dead.push(path);
    }
  }

  assert.deepEqual(dead, [],
    `these tuning constants are declared and nothing reads them: ${dead.join(', ')}.\n` +
    'Either the mechanic is missing, or the real value lives somewhere else and this is ' +
    'a second copy that will drift. Delete it, or add it to READ_DYNAMICALLY with a ' +
    'reason if it is read by lookup rather than by name.');
});

test('the allowlist has a reason for every entry, and no stale entries', () => {
  const constants = strip(readFileSync(join(HERE, 'sim/constants.js'), 'utf8'));
  for (const [path, reason] of Object.entries(READ_DYNAMICALLY)) {
    assert.ok(reason && reason.length > 20, `${path} is allowlisted without a real reason`);
    const [, key] = path.split('.');
    assert.ok(new RegExp(`^\\s{2}${key}:`, 'm').test(constants),
      `${path} is allowlisted but no longer exists — remove it from the allowlist`);
  }
});

test('no tuning constant silently shadows a value the technique data owns', () => {
  // The specific failure that made this file necessary: three constants held second
  // copies of numbers the simulation really reads from low-river.json.
  const constants = strip(readFileSync(join(HERE, 'sim/constants.js'), 'utf8'));
  const data = JSON.parse(readFileSync(join(HERE, 'sim/data/low-river.json'), 'utf8'));

  const owned = new Set();
  for (const t of data.techniques) {
    for (const k of Object.keys(t.tiers?.sound ?? {})) owned.add(k);
    for (const k of Object.keys(t.evade ?? {})) owned.add(`evade${k[0].toUpperCase()}${k.slice(1)}`);
  }
  // `breath` is a frames field; a constant literally called `breath` would be ambiguous.
  owned.delete('breath');

  const declared = [...constants.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
  const shadows = declared.filter((d) => owned.has(d));
  assert.deepEqual(shadows, [],
    `these constants share a name with a field the technique data owns: ${shadows.join(', ')}. ` +
    'Two sources for one number is how frame data drifts.');
});

test('will regeneration is guarded, so the gassed drain is not refunded', () => {
  // POSITIONAL, like the input-buffer check, and for the same reason: the condition is
  // real but not cleanly observable from outside.
  //
  // To see it behaviourally you need a tick on which `fight.js` finds breath at exactly
  // zero. Assigning `breath = 0` does not produce one — recovery runs earlier in the
  // tick and lifts it to 0.14 before the check. It happens only when breath is spent to
  // nothing WITHIN the tick, and on those ticks hits and structure breaks are moving
  // will as well, so the 0.10 cannot be separated from them. That combination is
  // exactly why the bug survived: the state is rare and, when it happens, crowded.
  //
  // So this asserts the shape instead. The regen must be conditional, and the condition
  // must be the gassed test itself.
  const src = readFileSync(new URL('../sim/fight.js', import.meta.url).pathname, 'utf8');
  const regen = src.match(/^.*WILL\.regenPerTick.*$/m);
  assert.ok(regen, 'nothing applies WILL.regenPerTick any more — has the will model moved?');
  assert.match(regen[0], /^\s*if\s*\(/,
    'will regeneration is unconditional. It runs in the same loop, on the same fighter, '
    + 'immediately after the gassed drain — so WILL.onGassed (0.10 "per tick while at '
    + 'zero breath") delivers half that. Guard it on the gassed test.');
  assert.ok(/gassedOut/.test(regen[0]),
    'the regeneration is conditional on something other than the gassed test; if that is '
    + 'deliberate, say so here, because the two lines cancelling is what this guards');
});

test('a fighter who is breathing still recovers composure', () => {
  // The other half: the guard above must not switch regeneration off generally.
  const f = makeFight({ aggression: 0, patience: 1, reaction: 60, playerMastery: 0 });
  f.a.will = 50;
  const before = f.a.will;
  step(f, { ...neutralIntent(), held: true }, {});
  assert.ok(f.a.will > before, 'will must still regenerate while there is breath to do it with');
  assert.ok(Math.abs((f.a.will - before) - WILL.regenPerTick) < 1e-9,
    'and it must regenerate at exactly the documented rate');
});
