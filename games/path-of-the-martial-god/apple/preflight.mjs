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

/**
 * Strip comments but KEEP string contents.
 *
 * `strip()` below removes both, which is right for counting braces and wrong for any
 * check whose subject is a string literal — a shader function name, for one. Asking
 * `strip()` for those found nothing and reported it as a missing function.
 */
function stripComments(src) {
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
    out += c; i++;
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
    // Raw strings: one or more '#' then a quote. Inside one, a backslash is not an
    // escape and a bare quote is not a terminator — only quote-plus-the-same-run-of-#
    // ends it. Missing this reads `#"a ""#` as TWO plain strings and then swallows
    // whatever follows, braces included, until the next quote anywhere in the file.
    // That produced a confident "unbalanced braces" report on a file swiftc compiles.
    if (c === '#') {
      let k = 0;
      while (src[i + k] === '#') k++;
      if (src[i + k] === '"') {
        const hashes = '#'.repeat(k);
        const close = (src.startsWith('"""', i + k) ? '"""' : '"') + hashes;
        i += close.length;                         // opening delimiter is the same length
        while (i < n && !src.startsWith(close, i)) i++;
        i += close.length; continue;
      }
      out += c; i++; continue;
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

// ---------------------------------------------------------------------------------
// The shader ABI.
//
// Renderer.swift and Shaders.metal are compiled by two different compilers that never
// see each other. Everything they agree on — function names, attribute indices and
// formats, buffer indices, and the field order of the uniform struct — is agreed by
// hand. A mismatch does not fail the build: it produces garbled geometry, or a black
// screen, or a pipeline that silently fails to create, on a device, hours from the
// change that caused it.
//
// None of it needs a GPU to check.
// ---------------------------------------------------------------------------------
const METAL = join(ROOT, 'MartialGod/Presentation/Shaders.metal');
const RENDERER = join(ROOT, 'MartialGod/Presentation/Renderer.swift');
if (existsSync(METAL) && existsSync(RENDERER)) {
  const metal = readFileSync(METAL, 'utf8');
  const swift = stripComments(readFileSync(RENDERER, 'utf8'));   // string literals matter here
  const abi = (msg) => problems.push(`shader ABI: ${msg}`);

  // 1. Every function Swift looks up must exist in the shader, with a matching kind.
  const declared = new Map();
  for (const m of metal.matchAll(/^\s*(vertex|fragment|kernel)\s+\S+\s+(\w+)\s*\(/gm)) {
    declared.set(m[2], m[1]);
  }
  const looked = [...swift.matchAll(/makeFunction\(name:\s*"(\w+)"\)/g)].map((m) => m[1]);
  if (looked.length === 0) abi('Renderer.swift looks up no shader functions — this check has gone blind');
  for (const name of looked) {
    if (!declared.has(name)) {
      abi(`Renderer.swift asks for "${name}", which Shaders.metal does not define`);
    }
  }
  for (const [name, kind] of declared) {
    if ((kind === 'vertex' || kind === 'fragment') && !looked.includes(name)) {
      abi(`Shaders.metal defines ${kind} "${name}" that nothing looks up`);
    }
  }

  // 2. Vertex attributes: index, and format against the shader's declared type.
  const METAL_TO_MTL = { float: 'float', float2: 'float2', float3: 'float3', float4: 'float4' };
  const stageIn = metal.match(/struct\s+VertexIn\s*\{([\s\S]*?)\}/);
  if (!stageIn) {
    abi('no `struct VertexIn` found — the stage_in layout cannot be checked');
  } else {
    const shaderAttrs = new Map();
    for (const m of stageIn[1].matchAll(/(\w+)\s+(\w+)\s*\[\[attribute\((\d+)\)\]\]/g)) {
      shaderAttrs.set(Number(m[3]), { type: m[1], name: m[2] });
    }
    const swiftAttrs = new Map();
    for (const m of swift.matchAll(/attributes\[(\d+)\]\.format\s*=\s*\.(\w+)/g)) {
      swiftAttrs.set(Number(m[1]), m[2]);
    }
    for (const [i, a] of shaderAttrs) {
      if (!swiftAttrs.has(i)) {
        abi(`shader declares attribute(${i}) "${a.name}" and the vertex descriptor never sets it`);
      } else if (METAL_TO_MTL[a.type] !== swiftAttrs.get(i)) {
        abi(`attribute(${i}) "${a.name}" is ${a.type} in the shader but .${swiftAttrs.get(i)} in the descriptor`);
      }
    }
    for (const i of swiftAttrs.keys()) {
      if (!shaderAttrs.has(i)) abi(`the vertex descriptor sets attribute ${i}, which the shader does not declare`);
    }
    // The buffer the attributes are fed from must be the one the encoder binds.
    const bufIdx = [...swift.matchAll(/attributes\[\d+\]\.bufferIndex\s*=\s*(\d+)/g)].map((m) => Number(m[1]));
    const layouts = [...swift.matchAll(/layouts\[(\d+)\]\.stride/g)].map((m) => Number(m[1]));
    for (const b of new Set(bufIdx)) {
      if (!layouts.includes(b)) abi(`attributes are fed from buffer ${b} and layouts[${b}].stride is never set`);
      const bound = new RegExp(`setVertexBuffer\\([^)]*index:\\s*${b}\\s*\\)`).test(swift);
      if (!bound) abi(`attributes are fed from buffer ${b} and no setVertexBuffer binds index ${b}`);
    }
  }

  // 3. Every `constant T& [[buffer(n)]]` argument must actually be bound at n.
  for (const m of metal.matchAll(/\[\[buffer\((\d+)\)\]\]/g)) {
    const n = Number(m[1]);
    const bound = new RegExp(`setVertex(?:Buffer|Bytes)\\([^)]*index:\\s*${n}\\b`).test(swift)
               || new RegExp(`setFragment(?:Buffer|Bytes)\\([^)]*index:\\s*${n}\\b`).test(swift);
    if (!bound) abi(`shader reads buffer(${n}) and nothing is bound at index ${n}`);
  }

  // 4. The uniform struct, field by field and IN ORDER. A reordered field is the worst
  //    case here: both sides compile, the sizes match, and every matrix is wrong.
  const SWIFT_TO_METAL = {
    'simd_float4x4': 'float4x4', 'simd_float3x3': 'float3x3',
    'SIMD4<Float>': 'float4', 'SIMD3<Float>': 'float3', 'SIMD2<Float>': 'float2',
    'Float': 'float', 'Int32': 'int', 'UInt32': 'uint',
  };
  const mU = metal.match(/struct\s+Uniforms\s*\{([\s\S]*?)\}/);
  const sU = swift.match(/struct\s+Uniforms\s*\{([\s\S]*?)\n\s{4}\}/);
  if (!mU || !sU) {
    abi('could not find `struct Uniforms` on both sides — the uniform layout is unchecked');
  } else {
    const mFields = [...mU[1].matchAll(/^\s*([\w<>]+)\s+(\w+)\s*;/gm)].map((m) => ({ type: m[1], name: m[2] }));
    const sFields = [...sU[1].matchAll(/^\s*var\s+(\w+)\s*:\s*([\w<>]+)/gm)].map((m) => ({ type: m[2], name: m[1] }));
    if (mFields.length !== sFields.length) {
      abi(`Uniforms has ${sFields.length} field(s) in Swift and ${mFields.length} in Metal`);
    }
    for (let i = 0; i < Math.min(mFields.length, sFields.length); i++) {
      const want = SWIFT_TO_METAL[sFields[i].type];
      if (!want) { abi(`Uniforms field ${i} is Swift type ${sFields[i].type}, which this check cannot map to a Metal type`); continue; }
      if (want !== mFields[i].type) {
        abi(`Uniforms field ${i}: Swift ${sFields[i].name}: ${sFields[i].type} vs Metal ${mFields[i].type} ${mFields[i].name}`);
      }
      if (sFields[i].name !== mFields[i].name) {
        abi(`Uniforms field ${i} is named "${sFields[i].name}" in Swift and "${mFields[i].name}" in Metal — same layout, but one of them is lying about what it holds`);
      }
    }
  }
}

// ---------------------------------------------------------------------------------
// #selector target/action pairs.
//
// The type-check harness rewrites `#selector(x)` into `Selector("x")` because Linux
// Swift has no Objective-C runtime, so the pairing goes unchecked there — and a
// selector naming a method that does not exist passes every gate and then crashes the
// moment the gesture fires. Named as a blind spot in tools/typecheck/README.md; this
// closes the static half of it.
// ---------------------------------------------------------------------------------
for (const f of swiftFiles) {
  const src = strip(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(/#selector\(([\w.]+)\)/g)) {
    const name = m[1].split('.').pop();
    const decl = new RegExp(`func\\s+${name}\\s*\\(`).test(src);
    if (!decl) { note(f, `#selector(${m[1]}) names a method not declared in this file`); continue; }
    // It must also be exposed to the Objective-C runtime, or the selector is real and
    // unreachable — which fails at RUNTIME, when the gesture fires, not at build.
    const objc = new RegExp(`@objc[^\\n]*\\n?[^\\n]*func\\s+${name}\\s*\\(`).test(src);
    if (!objc) note(f, `#selector(${m[1]}) names a method that is not @objc — it will not be found at runtime`);
  }
}

// ---------------------------------------------------------------------------------
// NotificationCenter observer blocks.
//
// The real signature takes a `@Sendable` block:
//
//   addObserver(forName:object:queue:using block: @escaping @Sendable (Notification) -> Void)
//
// A `@Sendable` closure does NOT inherit the enclosing context's actor isolation, so a
// block written inside a @MainActor type cannot touch that type's state — it is a
// compile error on a Mac. swift-corelibs-foundation on Linux is not annotated, so the
// type-check harness cannot see any of this and reports a clean pass.
//
// The convention here: register on `.main`, then hop explicitly. `assumeIsolated` is
// sound precisely BECAUSE the queue is `.main` — the two halves are one decision and
// this checks they stay together.
// ---------------------------------------------------------------------------------
for (const f of swiftFiles) {
  const src = strip(readFileSync(f, 'utf8'));
  // `removeObserver(` does not contain `addObserver(`, so no filtering is needed.
  let i = 0;
  while ((i = src.indexOf('addObserver(', i)) !== -1) {
    // Consume the call AND its trailing closure. Swift puts the block after the
    // closing paren, so a scan that stops at depth 0 there sees no block at all and
    // silently passes every call — which is exactly what the first version of this
    // check did, on all four of them.
    let depth = 0, end = -1;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (c === '(' || c === '{') depth++;
      else if (c === ')' || c === '}') {
        if (--depth === 0) {
          let k = j + 1;
          while (k < src.length && /\s/.test(src[k])) k++;
          if (src[k] === '{') continue;          // trailing closure continues the call
          end = j; break;
        }
      }
    }
    const call = src.slice(i, end === -1 ? src.length : end + 1);
    i += 12;
    if (!call.includes('{')) continue;           // no block: nothing to be isolated
    if (!/queue:\s*\.main/.test(call)) {
      note(f, 'addObserver block without `queue: .main` — it may then run on any queue, '
            + 'and nothing inside it may touch main-actor state');
      continue;
    }
    if (!call.includes('MainActor.assumeIsolated')) {
      note(f, 'addObserver block on `.main` does not hop with MainActor.assumeIsolated — '
            + 'the real signature is @Sendable, so the block inherits no isolation and '
            + 'this will not compile on a Mac');
    }
  }
}

// ---------------------------------------------------------------------------------
// The asset catalog, and the two things that reference it by NAME.
//
// Names in Info.plist and project.yml are resolved by the asset compiler, not by a
// compiler that knows about them. A missing colour set is a launch screen that does
// not appear; a missing icon set is an app that uploads without an icon and is
// rejected at that point, which is the most expensive place to find it.
// ---------------------------------------------------------------------------------
{
  const CAT = join(ROOT, 'MartialGod/Resources/Assets.xcassets');
  const plist = existsSync(join(ROOT, 'MartialGod/Resources/Info.plist'))
    ? readFileSync(join(ROOT, 'MartialGod/Resources/Info.plist'), 'utf8') : '';
  const asset = (msg) => problems.push(`assets: ${msg}`);

  if (!existsSync(CAT)) {
    asset('no Assets.xcassets at all');
  } else {
    // 1. Every Contents.json must be valid JSON. A malformed one fails the build with
    //    a message that names the catalog rather than the file.
    for (const f of walk(CAT, '.json')) {
      try { JSON.parse(readFileSync(f, 'utf8')); }
      catch (e) { note(f, `is not valid JSON: ${e.message}`); }
    }

    // 2. Names referenced from outside must resolve to a set that exists.
    const has = (name, ext) => existsSync(join(CAT, `${name}.${ext}`));
    const launch = plist.match(/<key>UIColorName<\/key>\s*<string>([^<]+)<\/string>/);
    if (launch && !has(launch[1], 'colorset')) {
      asset(`Info.plist's launch screen names colour "${launch[1]}" and no ${launch[1]}.colorset exists`);
    }
    const yml2 = readFileSync(join(ROOT, 'project.yml'), 'utf8');
    for (const [key, ext] of [['ASSETCATALOG_COMPILER_APPICON_NAME', 'appiconset'],
                              ['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME', 'colorset']]) {
      const m = yml2.match(new RegExp(`${key}:\\s*(\\S+)`));
      if (!m) { asset(`project.yml does not set ${key} — the asset is built and never used`); continue; }
      if (!has(m[1], ext)) asset(`project.yml sets ${key}: ${m[1]} and no ${m[1]}.${ext} exists`);
    }

    // 3. Every file an image set names must be on disk, and the icon must satisfy the
    //    two rules the App Store enforces: 1024x1024, and NO alpha channel.
    for (const f of walk(CAT, '.json')) {
      let j; try { j = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
      for (const img of j.images ?? []) {
        if (!img.filename) continue;
        const onDisk = join(f.replace(/\/Contents\.json$/, ''), img.filename);
        if (!existsSync(onDisk)) { note(f, `names "${img.filename}", which is not on disk`); continue; }
        if (!f.includes('.appiconset') || !img.filename.endsWith('.png')) continue;
        const png = readFileSync(onDisk);
        if (png.slice(1, 4).toString() !== 'PNG') { note(f, `"${img.filename}" is not a PNG`); continue; }
        const w = png.readUInt32BE(16), h = png.readUInt32BE(20), colourType = png[25];
        if (w !== 1024 || h !== 1024) note(f, `app icon "${img.filename}" is ${w}x${h}; the store requires 1024x1024`);
        // Colour types 4 and 6 carry an alpha channel; a tRNS chunk adds one to the rest.
        if (colourType === 4 || colourType === 6 || png.includes(Buffer.from('tRNS'))) {
          note(f, `app icon "${img.filename}" has an alpha channel — the App Store rejects transparent icons`);
        }
      }
    }

    // 4. The launch background must match the renderer's clear colour.
    //    They are the first and second things drawn, in that order, and if they differ
    //    the app flashes on every single launch — a defect nobody writes down and
    //    everybody notices.
    const lc = join(CAT, launch ? `${launch[1]}.colorset/Contents.json` : 'nope');
    const rend = join(ROOT, 'MartialGod/Presentation/Renderer.swift');
    if (existsSync(lc) && existsSync(rend)) {
      let j; try { j = JSON.parse(readFileSync(lc, 'utf8')); } catch { j = null; }
      const c = j?.colors?.[0]?.color?.components;
      const m = stripComments(readFileSync(rend, 'utf8'))
        .match(/MTLClearColor\(red:\s*([\d.]+),\s*green:\s*([\d.]+),\s*blue:\s*([\d.]+)/);
      if (c && m) {
        for (const [i, ch] of ['red', 'green', 'blue'].entries()) {
          const a = parseFloat(c[ch]), b = parseFloat(m[i + 1]);
          if (Math.abs(a - b) > 0.002) {
            asset(`launch background ${ch} is ${a} and the renderer clears to ${b} — the app will flash on launch`);
          }
        }
      }
    }
  }
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
