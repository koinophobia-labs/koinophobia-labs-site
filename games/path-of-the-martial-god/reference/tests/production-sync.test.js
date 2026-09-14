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
