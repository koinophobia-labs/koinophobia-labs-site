import Foundation

/// Simulation constants. Ported 1:1 from `reference/sim/constants.js`.
///
/// Every value here is part of the validated combat behaviour. Changing one is a
/// design decision, not a tuning convenience, and it will break the parity traces.
public enum Sim {
    /// Fixed simulation rate. All frame windows in technique data are in these ticks.
    /// Render rate is independent — ProMotion 120Hz changes presentation only.
    public static let tickHZ: Double = 60
    public static let tickSeconds: Double = 1.0 / 60.0
}

public enum Band: String, Codable, CaseIterable, Sendable {
    case contact, mid, long, outside
}

/// Distance bands, metres, centre-to-centre. COMBAT_SYSTEM.md §4.
public func bandFor(_ d: Double) -> Band {
    if d < 0.95 { return .contact }
    if d < 1.75 { return .mid }
    if d < 2.7 { return .long }
    return .outside
}

public enum Arena {
    public static let halfWidth: Double = 4.6
    public static let halfDepth: Double = 3.0
}

public enum Quadrant: String, Codable, CaseIterable, Sendable {
    /// Declaration order is load-bearing: `weakest()` resolves ties by this order.
    case fore, rear, leadSide, rearSide
}

public enum Region: String, Codable, CaseIterable, Sendable {
    case head, torso, leadArm, rearArm, leadLeg, rearLeg
}

public enum MaxValue {
    public static let quadrant: Double = 100
    public static let breath: Double = 100
    public static let will: Double = 100
    public static func region(_ r: Region) -> Double {
        switch r {
        case .head: return 42
        case .torso: return 70
        case .leadArm: return 40
        case .rearArm: return 40
        case .leadLeg: return 46
        case .rearLeg: return 46
        }
    }
}

/// Locomotion, metres per tick.
public enum Move {
    public static let advance: Double = 0.030
    public static let retreat: Double = 0.024   // Low River "does not retreat well"
    public static let lateral: Double = 0.026
    public static let guardScale: Double = 0.45
}

/// What a fighter is doing, which decides structure recovery.
public enum MoveMode: String, Sendable {
    case advancing, settling, idle, lateral, retreating, acting, gassed, focus
}

/// Structure recovery per tick. Tuned so sustained pressure genuinely accumulates:
/// a static guard recovers ~3.9/s against guarded Drive forces of ~13, which is what
/// makes "guarding does not save you; it postpones" true in the numbers.
public func structureRecovery(_ mode: MoveMode) -> Double {
    switch mode {
    case .advancing: return 0.100
    case .settling: return 0.065
    case .idle: return 0.045
    case .lateral: return 0.055
    case .retreating: return 0.020
    case .acting, .gassed, .focus: return 0.0
    }
}

public enum BreathRate {
    public static let recoverIdle: Double = 0.20
    public static let recoverFocus: Double = 0.62
    public static let recoverMoving: Double = 0.09
    public static let guardDrainPerTick: Double = 0.11
    public static let lateGuardPenalty: Double = 9
    public static let deflectFailPenalty: Double = 16
    public static let impactAbsorb: Double = 0.35
}

/// The Line — Low River's signature mechanic. Three tiers.
public enum LineRule {
    public static let maxTier: Double = 3
    public static let buildPerAdvanceTick: Double = 0.020
    public static let decayPerTick: Double = 0.006
    public static let structureBonusPerTier: Double = 0.16
    public static let recoveryCutPerTier: Double = 0.06
}

public enum WillRule {
    public static let onStructureBreak: Double = 14
    public static let onCleanHit: Double = 2.0
    public static let onHeadHit: Double = 4.0
    public static let onGassed: Double = 0.10
    public static let regenPerTick: Double = 0.05
    public static let answerBonus: Double = 3.5
    public static let inchThreshold: Double = 55
    public static let yieldThreshold: Double = 12
}

public enum InchRule {
    public static let baseWindowTicks: Double = 54
    public static let perMasteryTicks: Double = 30
    /// Presentation only — the simulation never runs at a different rate.
    public static let dilation: Double = 0.35
}

public enum PerceptionRule {
    public static let minLatencyTicks = 11
    public static let maxLatencyTicks = 23
}

/// Input buffer, in ticks. Without it a human is strictly disadvantaged: the brain is
/// consulted every tick and acts the frame it becomes free, while a press made during
/// recovery is silently discarded. Buffers the VERB only.
public let inputBufferTicks = 10

/// How long a quadrant stays collapsed once emptied.
public let collapseTicks = 100

// MARK: - JavaScript-identical arithmetic helpers
//
// The oracle is JavaScript. Two rounding differences would silently break parity if
// they were transliterated naively, so they are named here rather than left implicit.

/// `Math.round` rounds half toward +Infinity; Swift's `.rounded()` rounds half away
/// from zero. They disagree on negative halves (JS -0.5 -> 0, Swift -0.5 -> -1).
@inlinable public func jsRound(_ x: Double) -> Double { (x + 0.5).rounded(.down) }

@inlinable public func jsCeil(_ x: Double) -> Double { x.rounded(.up) }
@inlinable public func jsFloor(_ x: Double) -> Double { x.rounded(.down) }

@inlinable public func clamp(_ v: Double, _ lo: Double, _ hi: Double) -> Double {
    min(hi, max(lo, v))
}
