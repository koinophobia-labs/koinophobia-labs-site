/**
 * Language-neutral parity verifier.
 *
 *   node tools/verify-trace.mjs <fixture.json> <actual.json>
 *   node tools/verify-trace.mjs --self          check the verifier itself
 *
 * `actual.json` is whatever a port emits after replaying the fixture's `inputs`:
 *   { "frames": [...], "events": [...] }
 *
 * The port does not pass because the fight "felt similar". It passes when every
 * discrete field matches exactly and every continuous field is inside the tolerance
 * declared in trace-format.mjs.
 */
import { readFile } from 'node:fs/promises';
import { TOLERANCE, DISCRETE } from './trace-format.mjs';

/** Walk a frame into flat "a.pos.x" style paths so both classes can be checked. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

/** Strip the leading fighter key so 'a.pos.x' and 'b.pos.x' share one tolerance. */
function fieldKey(path) {
  return path.replace(/^[ab]\./, '');
}

function classOf(path) {
  const key = fieldKey(path);
  if (Object.prototype.hasOwnProperty.call(TOLERANCE, key)) return 'continuous';
  if (DISCRETE.includes(key)) return 'discrete';
  return 'other'; // tick, inch.*, over.* — compared exactly
}

export function compare(fixture, actual) {
  const problems = [];
  const maxDev = {};
  const expFrames = fixture.frames ?? [];
  const gotFrames = actual.frames ?? [];

  if (gotFrames.length !== expFrames.length) {
    problems.push({
      kind: 'length',
      detail: `frame count ${gotFrames.length} != expected ${expFrames.length}` +
        (gotFrames.length < expFrames.length
          ? ' (the port ended the fight early — a discrete branch diverged)'
          : ' (the port ran past the reference)'),
    });
  }

  const n = Math.min(expFrames.length, gotFrames.length);
  for (let i = 0; i < n; i++) {
    const exp = flatten(expFrames[i]);
    const got = flatten(gotFrames[i]);
    for (const [path, ev] of Object.entries(exp)) {
      const gv = got[path];
      const cls = classOf(path);
      if (cls === 'continuous') {
        const tol = TOLERANCE[fieldKey(path)];
        if (typeof gv !== 'number' || !Number.isFinite(gv)) {
          problems.push({ kind: 'type', tick: i, path, expected: ev, got: gv });
          continue;
        }
        const dev = Math.abs(gv - ev);
        const key = fieldKey(path);
        if (!(key in maxDev) || dev > maxDev[key].dev) maxDev[key] = { dev, tick: i, tol };
        if (dev > tol) {
          problems.push({ kind: 'tolerance', tick: i, path, expected: ev, got: gv, dev, tol });
        }
      } else if (ev !== gv) {
        problems.push({ kind: cls === 'discrete' ? 'discrete' : 'state', tick: i, path, expected: ev, got: gv });
      }
    }
  }

  // Events: type, subject and ORDER. Floating payloads are not compared.
  const expEv = fixture.events ?? [];
  const gotEv = actual.events ?? [];
  if (expEv.length !== gotEv.length) {
    problems.push({ kind: 'events', detail: `event count ${gotEv.length} != expected ${expEv.length}` });
  }
  const m = Math.min(expEv.length, gotEv.length);
  for (let i = 0; i < m; i++) {
    const e = expEv[i], g = gotEv[i];
    for (const k of ['tick', 'type', 'who', 'by', 'technique', 'quadrant', 'region', 'actor', 'target', 'executed', 'winnerId', 'reason']) {
      if ((e[k] ?? null) !== (g[k] ?? null)) {
        problems.push({ kind: 'event', index: i, path: k, expected: e[k] ?? null, got: g[k] ?? null, type: e.type });
      }
    }
  }

  // Report the first divergence: everything after a discrete split is noise.
  const firstDiscrete = problems.find((p) => p.kind === 'discrete' || p.kind === 'state' || p.kind === 'event');
  return {
    pass: problems.length === 0,
    problems,
    firstDiscrete: firstDiscrete ?? null,
    maxDeviation: maxDev,
    framesCompared: n,
    eventsCompared: m,
  };
}

export function report(name, result) {
  const lines = [];
  lines.push(`${result.pass ? 'PASS' : 'FAIL'}  ${name}  (${result.framesCompared} frames, ${result.eventsCompared} events)`);
  if (!result.pass) {
    const byKind = {};
    for (const p of result.problems) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
    lines.push(`  problems: ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    const f = result.firstDiscrete;
    if (f) {
      lines.push(`  first discrete divergence: ${f.kind === 'event'
        ? `event #${f.index} (${f.type}) field ${f.path}: expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.got)}`
        : `tick ${f.tick} ${f.path}: expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.got)}`}`);
      lines.push('  everything after a discrete divergence is meaningless; fix this one first.');
    }
    for (const p of result.problems.filter((x) => x.kind === 'tolerance').slice(0, 5)) {
      lines.push(`  tolerance: tick ${p.tick} ${p.path} dev ${p.dev.toExponential(2)} > ${p.tol}`);
    }
    if (result.problems.some((x) => x.kind === 'length' || x.kind === 'events')) {
      for (const p of result.problems.filter((x) => x.kind === 'length' || x.kind === 'events')) {
        lines.push(`  ${p.kind}: ${p.detail}`);
      }
    }
  }
  const worst = Object.entries(result.maxDeviation)
    .sort((a, b) => (b[1].dev / b[1].tol) - (a[1].dev / a[1].tol)).slice(0, 4);
  if (worst.length) {
    lines.push('  closest to tolerance: ' + worst
      .map(([k, v]) => `${k} ${v.dev.toExponential(1)}/${v.tol} (${((v.dev / v.tol) * 100).toFixed(1)}%)`).join('  '));
  }
  return lines.join('\n');
}

if (process.argv[1]?.endsWith('verify-trace.mjs')) {
  const [, , fixturePath, actualPath] = process.argv;
  if (!fixturePath || !actualPath) {
    console.error('usage: node tools/verify-trace.mjs <fixture.json> <actual.json>');
    process.exit(2);
  }
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  const actual = JSON.parse(await readFile(actualPath, 'utf8'));
  const result = compare(fixture, actual);
  console.log(report(fixture.scenario ?? fixturePath, result));
  process.exit(result.pass ? 0 : 1);
}
