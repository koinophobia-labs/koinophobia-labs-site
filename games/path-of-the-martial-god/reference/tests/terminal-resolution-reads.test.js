/**
 * The last image of the fight must say which choice was made.
 *
 * Both terminals put the loser in `.finished`, and `.finished` had no pose at all — it
 * fell through to the default case, so the culmination of the game rendered a fighter
 * standing in a normal guard as though nothing had happened. Once that was fixed, the
 * second and larger problem: a knockout and a Stop still looked identical.
 *
 * That is not a polish issue. COMBAT_SYSTEM.md §10 calls the Stop "the hardest thing in
 * the game", and the thesis of the whole design is that mercy is gated behind
 * competence — "restraint is not a moral choice available to the weak". If the two
 * outcomes render the same, the game cannot state its own argument, and the one moment
 * it exists to be about becomes invisible.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const POSE = new URL('../../apple/MartialGod/Presentation/Pose.swift', import.meta.url).pathname;
const RENDER = new URL('../../apple/MartialGod/Presentation/Renderer.swift', import.meta.url).pathname;

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

test('a finished fighter has a pose of their own', () => {
  const src = strip(readFileSync(POSE, 'utf8'));
  assert.ok(/case\s+\.finished/.test(src),
    'Pose.swift does not handle .finished — the loser stands in a fighting guard ' +
    'at the moment the fight ends');
});

test('a Stop and a knockout do not look the same', () => {
  const src = strip(readFileSync(POSE, 'utf8'));
  const from = src.indexOf('case .finished');
  const to = src.indexOf('case .down', from);
  assert.ok(from >= 0 && to > from, 'could not isolate the .finished branch');
  const branch = src.slice(from, to);

  assert.ok(/terminal\s*==\s*"stop"/.test(branch),
    'the .finished pose does not branch on the terminal, so being knocked out and ' +
    'being spared render identically');

  // The Stop must leave them standing; the knockout must not.
  assert.ok(!/isDown\s*=\s*true[\s\S]*?terminal\s*==\s*"stop"/.test(branch),
    'the Stop branch must not put them on the floor — being let go means still standing');
  assert.ok(/isDown\s*=\s*true/.test(branch),
    'the knockout branch must put them down');
});

test('the renderer actually knows which terminal happened', () => {
  const src = strip(readFileSync(RENDER, 'utf8'));
  assert.ok(/fight\.over\?\.terminal/.test(src),
    'the renderer never reads the terminal, so the pose can never tell the two apart');
  assert.ok(/terminal:\s*terminal/.test(src),
    'the terminal is read but not passed to the pose builder');
});
