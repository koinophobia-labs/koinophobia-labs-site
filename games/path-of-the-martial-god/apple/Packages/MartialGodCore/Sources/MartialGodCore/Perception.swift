import Foundation

/// Perception — ported from `reference/sim/ai/perception.js`.
///
/// "No input reading, ever. The AI's perception layer sees only what a person could
/// see." Enforced STRUCTURALLY: the brain is handed a Snapshot and has no reference to
/// the live fighter or to any input. A Snapshot deliberately carries no verb, no
/// release state, and no `will` — Will is hidden.

/// Ticks of startup that must elapse before a technique is visually identifiable.
private let tellVisibleAfter = 4

public struct Snapshot: Sendable {
    public let tick: Int
    public let pos: Vec2
    public let facing: Double
    public let state: FormState
    public let phase: Phase?
    public let tell: String?
    public let techniqueId: String?
    public let structure: Structure
    public let breath: Double
    public let vitality: Vitality
    public let velocity: Vec2
}

public final class Perception {
    public let latency: Int
    private var buffer: [Snapshot] = []

    public init(latencyTicks: Int) {
        latency = max(PerceptionRule.minLatencyTicks, min(PerceptionRule.maxLatencyTicks, latencyTicks))
    }

    /// What is externally observable about a fighter. Everything omitted here is, by
    /// construction, invisible to any brain.
    public static func snapshot(_ f: Fighter, tick: Int) -> Snapshot {
        let phase = FormMachine.phaseOf(f)
        let visible = f.state == .acting && f.form.tick >= tellVisibleAfter
        let t: Technique? = (visible ? f.form.techniqueId.map { TechniqueDB.technique($0) } : nil)
        return Snapshot(
            tick: tick,
            pos: f.pos,
            facing: f.facing,
            state: f.state,
            phase: phase,
            tell: t?.tell,
            techniqueId: t?.id,
            structure: f.structure,
            breath: f.breath,
            vitality: f.vitality,
            velocity: f.lastMove
        )
    }

    public func observe(_ f: Fighter, tick: Int) {
        buffer.append(Perception.snapshot(f, tick: tick))
        let keep = latency + 4
        while buffer.count > keep { buffer.removeFirst() }
    }

    /// The world as it was `latency` ticks ago. Reaction time is modelled, never instant.
    public func perceived() -> Snapshot? {
        if buffer.isEmpty { return nil }
        let idx = max(0, buffer.count - 1 - latency)
        return buffer[idx]
    }
}
