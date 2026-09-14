/**
 * The production port ships its own copy of the technique data as a bundle resource.
 * Two copies of the same numbers is exactly how frame data silently drifts, so this
 * asserts they are byte-identical. It runs in the reference suite because that is the
 * suite this environment can actually execute.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const CANONICAL = new URL('../sim/data/low-river.json', import.meta.url).pathname;
const PRODUCTION = new URL(
  '../../apple/Packages/MartialGodCore/Sources/MartialGodCore/Resources/low-river.json',
  import.meta.url,
).pathname;

test('the Apple target ships the canonical technique data, byte for byte', () => {
  assert.ok(existsSync(PRODUCTION), 'production copy is missing');
  assert.equal(
    readFileSync(PRODUCTION, 'utf8'),
    readFileSync(CANONICAL, 'utf8'),
    'technique frame data has drifted between the reference and the Apple target',
  );
});

test('the committed traces match the fixtures bundled with the Swift tests', () => {
  const dir = new URL('../traces/', import.meta.url).pathname;
  const fixtures = new URL(
    '../../apple/Packages/MartialGodCore/Tests/MartialGodCoreTests/Fixtures/',
    import.meta.url,
  ).pathname;
  for (const name of [
    'idle-standoff', 'guard-under-pressure', 'pressure-and-commit',
    'angle-and-strike', 'feint-and-slip', 'breath-to-empty', 'to-the-final-inch',
  ]) {
    assert.ok(existsSync(`${fixtures}${name}.json`), `fixture ${name}.json missing from the Swift test bundle`);
    assert.equal(
      readFileSync(`${fixtures}${name}.json`, 'utf8'),
      readFileSync(`${dir}${name}.json`, 'utf8'),
      `${name}: the Swift test fixture has drifted from the committed trace`,
    );
  }
});

test('the port expects the trace format the oracle actually writes', async () => {
  const { FORMAT_VERSION } = await import('../tools/trace-format.mjs');
  const swift = readFileSync(
    new URL('../../apple/Packages/MartialGodCore/Tests/MartialGodCoreTests/ParityTests.swift', import.meta.url).pathname,
    'utf8',
  );
  const m = swift.match(/static let expectedFormatVersion = (\d+)/);
  assert.ok(m, 'ParityTests.swift no longer declares expectedFormatVersion');
  assert.equal(Number(m[1]), FORMAT_VERSION,
    'the Swift gate expects a different trace format from the one the oracle writes');

  const dir = new URL('../traces/', import.meta.url).pathname;
  for (const name of ['idle-standoff', 'angle-and-strike', 'to-the-final-inch']) {
    const t = JSON.parse(readFileSync(`${dir}${name}.json`, 'utf8'));
    assert.equal(t.formatVersion, FORMAT_VERSION, `${name}.json was written by an older format`);
  }
});

test('every discrete field is compared by the Swift gate, not just declared', () => {
  // The verifier on this side walks the frame generically; the Swift side lists the
  // fields one by one. A field added to DISCRETE and not added there is a field the
  // production gate silently ignores.
  const swift = readFileSync(
    new URL('../../apple/Packages/MartialGodCore/Tests/MartialGodCoreTests/ParityTests.swift', import.meta.url).pathname,
    'utf8',
  );
  for (const field of ['state', 'techniqueId', 'formTick', 'feint', 'landed', 'bufferedVerb',
                       'guardTicks', 'stateTicks']) {
    assert.ok(swift.includes(`g.${field}, e.${field}`),
      `ParityTests.swift never compares "${field}" — the gate would not catch it`);
  }
  for (const q of ['fore', 'rear', 'leadSide', 'rearSide']) {
    assert.ok(swift.includes(`g.collapse.${q}, e.collapse.${q}`),
      `ParityTests.swift never compares "collapse.${q}"`);
  }
});

test('the input buffer is captured before the early returns, in BOTH trees', () => {
  // The original defect was positional, not logical. The capture read correctly; it
  // simply sat below the early returns for `acting`, `staggered`, `down` and
  // `finished`, so its "am I busy?" test could never be true. Behaviour tests catch
  // that in the reference because they can run here. Nothing in this environment can
  // run Swift — so this asserts the same property by position, in both files, which is
  // the only guard against the port silently regressing on a machine with no Xcode.
  const files = [
    {
      label: 'reference/sim/formMachine.js',
      path: new URL('../sim/formMachine.js', import.meta.url).pathname,
      call: 'tickBuffer(f, input);',
      firstEarlyReturn: "if (f.state === 'staggered') {",
    },
    {
      label: 'apple/.../FormMachine.swift',
      path: new URL('../../apple/Packages/MartialGodCore/Sources/MartialGodCore/FormMachine.swift', import.meta.url).pathname,
      call: 'tickBuffer(f, input)',
      firstEarlyReturn: 'if f.state == .staggered {',
    },
  ];

  for (const f of files) {
    const src = readFileSync(f.path, 'utf8');
    const callAt = src.indexOf(f.call);
    const returnAt = src.indexOf(f.firstEarlyReturn);
    assert.ok(callAt >= 0, `${f.label}: the buffer step is not called at all`);
    assert.ok(returnAt >= 0, `${f.label}: could not find the stagger early return — this test needs updating`);
    assert.ok(callAt < returnAt,
      `${f.label}: the input buffer is captured AFTER the early returns again, which makes it dead code`);
  }
});

test('every constant the port hardcodes still matches the oracle', async () => {
  // A port is a transliteration, so these numbers are duplicated by definition, and a
  // silent drift in one of them is the least visible and most damaging kind of bug.
  // Two declaration shapes are parsed separately rather than guessed at with one
  // regex, because `lateral` legitimately appears twice with different values.
  const swift = readFileSync(
    new URL('../../apple/Packages/MartialGodCore/Sources/MartialGodCore/Constants.swift', import.meta.url).pathname,
    'utf8',
  );
  const { STRUCTURE_RECOVERY, BREATH, WILL, LINE, INCH, MOVE } = await import('../sim/constants.js');

  /** `case .name: return 1.23` inside structureRecovery(_:) */
  const switchCases = {};
  for (const m of swift.matchAll(/case\s+\.(\w+)(?:,\s*\.\w+)*:\s*return\s+(-?[\d.]+)/g)) {
    switchCases[m[1]] = Number(m[2]);
  }
  /** `public static let name: Double = 1.23` */
  const lets = {};
  for (const m of swift.matchAll(/static let (\w+)\s*:\s*Double\s*=\s*(-?[\d.]+)/g)) {
    lets[m[1]] = Number(m[2]);
  }

  const expectSwitch = {
    advancing: STRUCTURE_RECOVERY.advancing,
    settling: STRUCTURE_RECOVERY.settling,
    idle: STRUCTURE_RECOVERY.idle,
    lateral: STRUCTURE_RECOVERY.lateral,
    retreating: STRUCTURE_RECOVERY.retreating,
  };
  for (const [name, value] of Object.entries(expectSwitch)) {
    assert.ok(name in switchCases, `structureRecovery case "${name}" not found in Constants.swift`);
    assert.equal(switchCases[name], value, `structureRecovery.${name} drifted`);
  }

  const expectLet = {
    advance: MOVE.advance, retreat: MOVE.retreat, guardScale: MOVE.guardScale,
    recoverIdle: BREATH.recoverIdle, recoverFocus: BREATH.recoverFocus,
    recoverMoving: BREATH.recoverMoving, guardDrainPerTick: BREATH.guardDrainPerTick,
    lateGuardPenalty: BREATH.lateGuardPenalty, deflectFailPenalty: BREATH.deflectFailPenalty,
    impactAbsorb: BREATH.impactAbsorb,
    onStructureBreak: WILL.onStructureBreak, onCleanHit: WILL.onCleanHit,
    onHeadHit: WILL.onHeadHit, onGassed: WILL.onGassed, regenPerTick: WILL.regenPerTick,
    answerBonus: WILL.answerBonus, inchThreshold: WILL.inchThreshold, yieldThreshold: WILL.yieldThreshold,
    maxTier: LINE.maxTier, buildPerAdvanceTick: LINE.buildPerAdvanceTick,
    decayPerTick: LINE.decayPerTick, structureBonusPerTier: LINE.structureBonusPerTier,
    recoveryCutPerTier: LINE.recoveryCutPerTier,
    baseWindowTicks: INCH.baseWindowTicks, perMasteryTicks: INCH.perMasteryTicks, dilation: INCH.dilation,
  };
  for (const [name, value] of Object.entries(expectLet)) {
    assert.ok(name in lets, `constant "${name}" not found in Constants.swift`);
    assert.equal(lets[name], value, `constant "${name}" drifted: Swift ${lets[name]} vs oracle ${value}`);
  }

  // Move.lateral is a different number from structureRecovery lateral; check it by
  // its own declaration so the two can never be confused.
  const moveLateral = swift.match(/public static let lateral: Double = (-?[\d.]+)/);
  assert.ok(moveLateral, 'Move.lateral not found');
  assert.equal(Number(moveLateral[1]), MOVE.lateral, 'Move.lateral drifted');
});
