import Foundation

/// The simulation's event stream. Presentation, audio, haptics and telemetry all read
/// this; nothing in the simulation reads presentation back.
public enum EventType: String, Sendable {
    case begin, feint, hit, guarded, deflected, deflectFailed = "deflect_failed"
    case lateGuard = "late_guard", guardBypassed = "guard_bypassed", evaded
    case whiff, interrupted, brokeStructure = "break", rise, gassed
    case inchOpen = "inch_open", terminal, over
}

public struct CombatEvent: Sendable {
    public var tick: Int = 0
    public let type: EventType
    public var who: String?
    public var by: String?
    public var technique: String?
    public var tell: String?
    public var quadrant: Quadrant?
    public var region: Region?
    public var force: Double?
    public var broke: Bool?
    public var down: Bool?
    public var actor: String?
    public var target: String?
    public var executed: String?
    public var clean: Bool?
    public var note: String?
    public var winnerId: String?
    public var reason: String?
    public var ticks: Int?

    public init(type: EventType, who: String? = nil, by: String? = nil,
                technique: String? = nil, tell: String? = nil,
                quadrant: Quadrant? = nil, region: Region? = nil,
                force: Double? = nil, broke: Bool? = nil, down: Bool? = nil,
                actor: String? = nil, target: String? = nil,
                executed: String? = nil, clean: Bool? = nil, note: String? = nil,
                winnerId: String? = nil, reason: String? = nil, ticks: Int? = nil) {
        self.type = type; self.who = who; self.by = by
        self.technique = technique; self.tell = tell
        self.quadrant = quadrant; self.region = region
        self.force = force; self.broke = broke; self.down = down
        self.actor = actor; self.target = target
        self.executed = executed; self.clean = clean; self.note = note
        self.winnerId = winnerId; self.reason = reason; self.ticks = ticks
    }
}
