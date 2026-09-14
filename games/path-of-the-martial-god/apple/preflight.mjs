/**
 * Static preflight for the Apple sources.
 *
 * This environment has no Swift toolchain, so nothing here can replace a compiler.
 * What it CAN do is catch the gross structural mistakes that hand-written,
 * never-compiled code accumulates, and verify that every path the build definition
 * references actually exists. Run it before shipping the tree to a Mac.
 *
 *   node preflight.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const problems = [];
const note = (f, msg) => problems.push(`${relative(ROOT, f)}: ${msg}`);

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

/** Strip strings and comments so brace counting is not fooled by their contents. */
function strip(src) {
  let out = '', i = 0, n = src.length;
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') {
      i += 2; let depth = 1;
      while (i < n && depth > 0) {
        if (src[i] === '/' && src[i + 1] === '*') { depth++; i += 2; }
        else if (src[i] === '*' && src[i + 1] === '/') { depth--; i += 2; }
        else i++;
      }
      continue;
    }
    if (c === '"') {
      if (src.startsWith('"""', i)) {
        i += 3;
        while (i < n && !src.startsWith('"""', i)) i++;
        i += 3; continue;
      }
      i++;
      while (i < n && src[i] !== '"') { if (src[i] === '\\') i++; i++; }
      i++; continue;
    }
    out += c; i++;
  }
  return out;
}

const swiftFiles = [...walk(join(ROOT, 'MartialGod'), '.swift'),
                    ...walk(join(ROOT, 'Packages'), '.swift')];

const KNOWN_IMPORTS = new Set([
  'Foundation', 'UIKit', 'SwiftUI', 'Metal', 'MetalKit', 'simd', 'QuartzCore',
  'AVFoundation', 'CoreHaptics', 'GameController', 'XCTest', 'PackageDescription',
  'MartialGodCore', 'os',
]);

for (const f of swiftFiles) {
  const raw = readFileSync(f, 'utf8');
  const src = strip(raw);

  for (const [open, close, label] of [['{', '}', 'braces'], ['(', ')', 'parens'], ['[', ']', 'brackets']]) {
    const a = (src.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const b = (src.match(new RegExp(`\\${close}`, 'g')) || []).length;
    if (a !== b) note(f, `unbalanced ${label}: ${a} ${open} vs ${b} ${close}`);
  }

  for (const m of raw.matchAll(/^\s*import\s+(\w+)/gm)) {
    if (!KNOWN_IMPORTS.has(m[1])) note(f, `unrecognised import "${m[1]}"`);
  }

  // `guard` must have an `else` on the same statement.
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (/^guard\b/.test(t) && !/\belse\b/.test(t) && !t.endsWith(',')) {
      note(f, `guard without else: ${t.slice(0, 70)}`);
    }
  }

  // A keyword used as a bare member access is the mistake this port is prone to.
  if (/[^`.\w]\.guard\b/.test(src) || /\b\w+\.guard[^`\w]/.test(src)) {
    if (!src.includes('`guard`')) note(f, 'accesses a `guard` member without backticks');
  }
}

// Build definition must reference real paths.
const yml = readFileSync(join(ROOT, 'project.yml'), 'utf8');
for (const m of yml.matchAll(/^\s*-?\s*(?:path:\s*)?(MartialGod\/[\w./-]+|Packages\/[\w./-]+)\s*$/gm)) {
  const p = join(ROOT, m[1]);
  if (!existsSync(p)) problems.push(`project.yml references missing path: ${m[1]}`);
}
for (const required of [
  'MartialGod/Resources/Info.plist',
  'MartialGod/Resources/PrivacyInfo.xcprivacy',
  'MartialGod/Resources/Assets.xcassets',
  'Packages/MartialGodCore/Package.swift',
  'Packages/MartialGodCore/Sources/MartialGodCore/Resources/low-river.json',
]) {
  if (!existsSync(join(ROOT, required))) problems.push(`missing required file: ${required}`);
}

// Every Package.swift target path must exist.
const pkg = readFileSync(join(ROOT, 'Packages/MartialGodCore/Package.swift'), 'utf8');
for (const m of pkg.matchAll(/name:\s*"(\w+)"/g)) {
  const t = m[1];
  if (t === 'MartialGodCore' || t === 'TraceDump') {
    if (!existsSync(join(ROOT, `Packages/MartialGodCore/Sources/${t}`))) {
      problems.push(`Package.swift target "${t}" has no Sources directory`);
    }
  }
}
if (!existsSync(join(ROOT, 'Packages/MartialGodCore/Tests/MartialGodCoreTests'))) {
  problems.push('Package.swift test target has no Tests directory');
}

console.log(`preflight: ${swiftFiles.length} Swift files checked`);
if (problems.length === 0) {
  console.log('no structural problems found');
  console.log('NOTE: this is not a compiler. It catches gross errors only.');
} else {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log('  ' + p);
  process.exitCode = 1;
}
