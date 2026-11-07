import Foundation

public struct Vec2: Sendable, Equatable {
    public var x: Double
    public var z: Double
    public init(x: Double, z: Double) { self.x = x; self.z = z }
}

public struct Vitality: Sendable, Equatable {
    public var head = MaxValue.region(.head)
    public var torso = MaxValue.region(.torso)
    public var leadArm = MaxValue.region(.leadArm)
    public var rearArm = MaxValue.region(.rearArm)
    public var leadLeg = MaxValue.region(.leadLeg)
    public var rearLeg = MaxValue.region(.rearLeg)
    public init() {}

    public subscript(r: Region) -> Double {
        get {
            switch r {
            case .head: return head
            case .torso: return torso
            case .leadArm: return leadArm
            case .rearArm: return rearArm
            case .leadLeg: return leadLeg
            case .rearLeg: return rearLeg
            }
        }
        set {
            switch r {
            case .head: head = newValue
            case .torso: torso = newValue
            case .leadArm: leadArm = newValue
            case .rearArm: rearArm = newValue
            case .leadLeg: leadLeg = newValue
            case .rearLeg: rearLeg = newValue
            }
        }
    }

    public var total: Double { head + torso + leadArm + rearArm + leadLeg + rearLeg }
    public static let maximum: Double = Region.allCases.reduce(0) { $0 + MaxValue.region($1) }
    public var fraction: Double { total / Vitality.maximum }
}

public enum FormState: String, Sendable {
    case neutral, acting
    case guardState = "guard"
    case staggered, down, finished
}

public struct Form: Sendable {
    public var techniqueId: String?
    public var tick: Int = 0
    public var released = false
    public var feint = false
    public var landed = false
    public var recoveryAdd: Int = 0
    public var whiffed = false
    /// World-space direction chosen at the instant a slip was pressed.
    public var evadeDir: Double?
    public init() {}
}

/// A verb pressed while the body was busy, waiting for the first tick it can be
/// honoured. Human only: the brain returns a nil verb whenever it is not actionable,
/// so it never captures one.
public struct InputBuffer: Sendable {
    public var verb: Verb
    /// Ticks since the press. Dropped once this passes `inputBufferTicks`.
    public var age: Int
}

/// A positional snapshot of the other fighter. Both fighters are ticked against refs
/// taken BEFORE either moves — ticking one against the other's already-updated
/// position hands the second mover a permanent aiming advantage.
public struct Ref: Sendable {
    public let id: String
    public let pos: Vec2
    public let facing: Double
    public init(id: String, pos: Vec2, facing: Double) {
        self.id = id; self.pos = pos; self.facing = facing
    }
}

/// FighterState — ported from `reference/sim/fighter.js`.
///
/// A reference type on purpose: the oracle mutates fighters in place and passes them
/// between functions, and matching that shape exactly keeps the port mechanical.
public final class Fighter {
    public let id: String
    public var style: String = "low_river"
    /// 0...1 — drives the Final Inch window and, later, whether the Stop can be held.
    public var mastery: Double = 0.5
    public var pos: Vec2
    public var facing: Double
    public var state: FormState = .neutral
    public var form = Form()
    public var structure = Structure()
    public var breath = MaxValue.breath
    public var will = MaxValue.will
    public var vitality = Vitality()
    public var line: Double = 0
    public var guardTicks: Int = 0
    public var stateTicks: Int = 0
    public var moveMode: MoveMode = .idle
    public var lastMove = Vec2(x: 0, z: 0)
    public var staggerTicks: Int = 0
    public var buffer: InputBuffer?
    /// Perception latency in ticks (AI only).
    public var reaction: Int = 16
    /// Whether the "gassed" event has already been emitted for this bout of empty lungs.
    public var gassedNoted = false

    public init(id: String, pos: Vec2, facing: Double) {
        self.id = id
        self.pos = pos
        self.facing = facing
    }

    public var ref: Ref { Ref(id: id, pos: pos, facing: facing) }

    /// Gassed — the most vulnerable state in the game, and entirely self-inflicted.
    public var isGassed: Bool { breath <= 0.001 }

    /// Can this fighter begin a new action at all?
    public var isActionable: Bool { state == .neutral || state == .guardState }

    public func injured(_ r: Region) -> Bool { vitality[r] <= 0 }

    public func copy() -> Fighter {
        let f = Fighter(id: id, pos: pos, facing: facing)
        f.style = style; f.mastery = mastery; f.state = state; f.form = form
        f.structure = structure; f.breath = breath; f.will = will; f.vitality = vitality
        f.line = line; f.guardTicks = guardTicks; f.stateTicks = stateTicks
        f.moveMode = moveMode; f.lastMove = lastMove; f.staggerTicks = staggerTicks
        f.buffer = buffer; f.reaction = reaction; f.gassedNoted = gassedNoted
        return f
    }
}

@inlinable public func distance(_ a: Fighter, _ b: Fighter) -> Double {
    hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z)
}

@inlinable public func distance(_ a: Fighter, _ b: Ref) -> Double {
    hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z)
}

@inlinable public func bearingTo(_ from: Fighter, _ to: Fighter) -> Double {
    atan2(to.pos.z - from.pos.z, to.pos.x - from.pos.x)
}

@inlinable public func bearingTo(_ from: Fighter, _ to: Ref) -> Double {
    atan2(to.pos.z - from.pos.z, to.pos.x - from.pos.x)
}
