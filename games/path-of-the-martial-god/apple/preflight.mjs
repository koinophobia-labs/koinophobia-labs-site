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

console.log(`preflight: ${swiftFiles.length} Swift files checked`);
if (problems.length === 0) {
  console.log('no structural problems found');
  console.log('NOTE: this is not a compiler. It catches gross errors only.');
} else {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log('  ' + p);
  process.exitCode = 1;
}
