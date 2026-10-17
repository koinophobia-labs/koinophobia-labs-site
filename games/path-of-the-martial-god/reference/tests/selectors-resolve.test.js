/**
 * Every `#selector` must name a method that exists and is exposed to the runtime.
 *
 * This is the one thing `typecheck.sh` structurally cannot check: Linux Swift has no
 * Objective-C runtime, so the harness rewrites `#selector(foo)` into `Selector("foo")`
 * in a throwaway copy and the pairing goes unverified. A selector naming a method that
 * does not exist compiles cleanly on a Mac too — and then throws
 * `unrecognized selector sent to instance` the first time a player touches the screen.
 *
 * It is a small enough surface to check by reading, so it is checked by reading.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP = new URL('../../apple/MartialGod/', import.meta.url).pathname;

function swiftFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? swiftFiles(p) : (n.endsWith('.swift') ? [p] : []);
  });
}

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

test('every #selector names a method declared in the same file', () => {
  let checked = 0;
  for (const file of swiftFiles(APP)) {
    const src = strip(readFileSync(file, 'utf8'));
    for (const m of src.matchAll(/#selector\(([A-Za-z_][A-Za-z0-9_]*)\)/g)) {
      const name = m[1];
      checked++;
      const declared = new RegExp(`func\\s+${name}\\s*\\(`).test(src);
      assert.ok(declared,
        `${file.split('/').pop()}: #selector(${name}) names a method that is not ` +
        'declared in this file. On a device that is "unrecognized selector sent to ' +
        'instance" the first time the gesture fires.');
    }
  }
  assert.ok(checked > 0, 'no #selector found at all — has the restart gesture been removed?');
});

test('every #selector target is exposed to the Objective-C runtime', () => {
  // A plain Swift method is invisible to target/action. Without @objc the selector
  // still compiles and still fails at runtime.
  for (const file of swiftFiles(APP)) {
    const src = strip(readFileSync(file, 'utf8'));
    for (const m of src.matchAll(/#selector\(([A-Za-z_][A-Za-z0-9_]*)\)/g)) {
      const name = m[1];
      const decl = new RegExp(`@objc[\\s\\S]{0,80}?func\\s+${name}\\s*\\(`);
      assert.ok(decl.test(src),
        `${file.split('/').pop()}: ${name} is used as a selector target but is not ` +
        'marked @objc, so the runtime cannot find it.');
    }
  }
});
