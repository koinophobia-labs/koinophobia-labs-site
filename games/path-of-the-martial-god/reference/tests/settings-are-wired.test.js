/**
 * Every setting must do something.
 *
 * This milestone has already shipped one feature that read as implemented, carried a
 * named constant and a paragraph of documentation, and never executed: the input
 * buffer. The lesson was not "be more careful". It was that a declaration which LOOKS
 * live will be believed by the next person to read it, and nothing in the codebase was
 * arranged to notice.
 *
 * Settings are where that failure is cheapest to make and most expensive to ship,
 * because an accessibility switch that does nothing is worse than an absent one: it
 * tells a player their need has been met. So a field in `GameSettings` either has a
 * consumer, or it lives in `GameSettings.Reserved`, where its name cannot be read
 * without the call site saying `reserved.` out loud.
 *
 * This test runs in the reference suite because that is the suite this environment can
 * execute for free, on every change, without a toolchain.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP = new URL('../../apple/MartialGod/', import.meta.url).pathname;
const SETTINGS = join(APP, 'Persistence/Settings.swift');

function swiftFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...swiftFiles(p));
    else if (name.endsWith('.swift')) out.push(p);
  }
  return out;
}

/** Strip comments so a field only "mentioned" in prose does not count as wired. */
function code(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');
}

/**
 * Split Settings.swift into the live struct and the quarantined one, so a field can be
 * told apart from a reserved field by where it is declared rather than by its name.
 */
function declaredFields() {
  const src = code(readFileSync(SETTINGS, 'utf8'));
  const reservedAt = src.indexOf('public struct Reserved');
  assert.ok(reservedAt > 0, 'GameSettings.Reserved is gone — this test needs rewriting');
  const reservedEnd = src.indexOf('public var reserved', reservedAt);

  const grab = (text) => [...text.matchAll(/public var (\w+)\s*[:=]/g)].map((m) => m[1]);
  const live = grab(src.slice(0, reservedAt)).filter((n) => n !== 'schemaVersion');
  const reserved = grab(src.slice(reservedAt, reservedEnd));
  return { live, reserved };
}

test('every live setting is read by something', () => {
  const { live } = declaredFields();
  assert.ok(live.length >= 5, `only ${live.length} live settings found; the parse is wrong`);

  const consumers = swiftFiles(APP)
    .filter((p) => !p.endsWith('Persistence/Settings.swift'))
    .map((p) => code(readFileSync(p, 'utf8')))
    .join('\n');

  const dead = live.filter((f) => !consumers.includes(`.${f}`));
  assert.deepEqual(dead, [],
    `these settings are declared and never read: ${dead.join(', ')}.\n` +
    'A setting that does nothing is a promise the game does not keep. Wire it, delete ' +
    'it, or move it into GameSettings.Reserved where its name cannot be mistaken for ' +
    'a working feature.');
});

test('reserved settings are honestly labelled as not yet wired', () => {
  const { reserved } = declaredFields();
  assert.ok(reserved.length > 0, 'nothing is reserved — if that is true, delete the struct');

  const src = readFileSync(SETTINGS, 'utf8');
  const block = src.slice(src.indexOf('public struct Reserved'), src.indexOf('public var reserved'));

  // Each field owns the doc comment between the previous declaration and its own.
  let cursor = 0;
  for (const f of reserved) {
    const at = block.indexOf(`public var ${f}`, cursor);
    assert.ok(at > 0, `could not locate Reserved.${f}`);
    const doc = block.slice(cursor, at);
    assert.ok(doc.includes('NOT WIRED'),
      `Reserved.${f} must say NOT WIRED and why, so nobody has to run the code to find out`);
    cursor = at + 1;
  }
});

test('a reserved setting that gets wired must be promoted, not left in quarantine', () => {
  // The opposite failure: a field quietly starts working but keeps the name that tells
  // everyone it does not. Then the honest label is the lie.
  const { reserved } = declaredFields();
  const consumers = swiftFiles(APP)
    .filter((p) => !p.endsWith('Persistence/Settings.swift'))
    .map((p) => code(readFileSync(p, 'utf8')))
    .join('\n');

  const wired = reserved.filter((f) => consumers.includes(`.${f}`));
  assert.deepEqual(wired, [],
    `these are in Reserved but something reads them: ${wired.join(', ')}. ` +
    'Move them out of Reserved — the quarantine is only honest while it is accurate.');
});

test('accessibility is a behaviour, not only a data structure', () => {
  // Native M1 ships no settings screen, so a switch nobody can reach is a switch that
  // does not exist. The system's own answer has to be taken instead.
  const src = code(readFileSync(SETTINGS, 'utf8'));
  assert.ok(src.includes('UIAccessibility.isReduceMotionEnabled'),
    'nothing reads the system Reduce Motion switch, and there is no in-app way to set it');
  assert.ok(src.includes('reduceMotionStatusDidChangeNotification'),
    'the switch can be flipped mid-session; a fight in progress must respond to it');
});
