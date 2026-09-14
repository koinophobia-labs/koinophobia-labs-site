import Foundation

/// StructureModel — ported from `reference/sim/structure.js`.
///
/// Structure is NOT a bar. It is a base with four quadrants held relative to the
/// fighter's own facing. Which quadrant absorbs a blow is decided by geometry, not by
/// the attacker's choice of move. That is the whole reason footwork exists
/// mechanically rather than cosmetically.
public struct Structure: Sendable, Equatable {
    public var fore: Double = MaxValue.quadrant
    public var rear: Double = MaxValue.quadrant
    public var leadSide: Double = MaxValue.quadrant
    public var rearSide: Double = MaxValue.quadrant

    /// Ticks remaining on a collapsed quadrant. Canon wants a two-stage break — a
    /// quadrant hits zero, and the NEXT force through it dumps you off your base.
    /// Without this latch, recovery nudges the quadrant back above zero between blows
    /// and the break never fires at all.
    public var collapseFore: Int = 0
    public var collapseRear: Int = 0
    public var collapseLeadSide: Int = 0
    public var collapseRearSide: Int = 0

    public init() {}

    public subscript(q: Quadrant) -> Double {
        get {
            switch q {
            case .fore: return fore
            case .rear: return rear
            case .leadSide: return leadSide
            case .rearSide: return rearSide
            }
        }
        set {
            switch q {
            case .fore: fore = newValue
            case .rear: rear = newValue
            case .leadSide: leadSide = newValue
            case .rearSide: rearSide = newValue
            }
        }
    }

    public func collapse(_ q: Quadrant) -> Int {
        switch q {
        case .fore: return collapseFore
        case .rear: return collapseRear
        case .leadSide: return collapseLeadSide
        case .rearSide: return collapseRearSide
        }
    }

    public mutating func setCollapse(_ q: Quadrant, _ v: Int) {
        switch q {
        case .fore: collapseFore = v
        case .rear: collapseRear = v
        case .leadSide: collapseLeadSide = v
        case .rearSide: collapseRearSide = v
        }
    }

    public func isCollapsed(_ q: Quadrant) -> Bool { collapse(q) > 0 }
}

/// `@usableFromInline` rather than `private`: `wrapAngle` is `@inlinable`, and an
/// inlinable body may only touch symbols a client module can also see.
@usableFromInline let tau = Double.pi * 2

/// Wrap to (-PI, PI].
@inlinable public func wrapAngle(_ a: Double) -> Double {
    var x = (a + Double.pi).truncatingRemainder(dividingBy: tau)
    if x < 0 { x += tau }
    return x - Double.pi
}

/// Which of the defender's quadrants faces the incoming force.
///
/// `toAttacker` is the world bearing from the defender to whoever is hitting them.
/// A blow from in front degrades `fore`; circle to their flank and the same blow lands
/// on a side quadrant they are not defending. leadSide is the fighter's left.
public func quadrantFromIncoming(defenderFacing: Double, toAttacker: Double) -> Quadrant {
    let rel = wrapAngle(toAttacker - defenderFacing)
    let a = abs(rel)
    if a <= Double.pi / 4 { return .fore }
    if a >= (3 * Double.pi) / 4 { return .rear }
    return rel > 0 ? .leadSide : .rearSide
}

/// Quadrants sharing an edge — force spills into them.
private func adjacent(_ q: Quadrant) -> [Quadrant] {
    switch q {
    case .fore, .rear: return [.leadSide, .rearSide]
    case .leadSide, .rearSide: return [.fore, .rear]
    }
}

public struct ForceResult {
    public let broke: Bool
    public let quadrant: Quadrant
    public let before: Double
    public let after: Double
}

/// Apply directional force to a base. Driving force through a quadrant that has
/// already collapsed is the break.
@discardableResult
public func applyForce(_ s: inout Structure, _ quadrant: Quadrant, _ force: Double) -> ForceResult {
    let before = s[quadrant]
    let broke = s.collapse(quadrant) > 0 && force > 0
    s[quadrant] = max(0, before - force)
    if s[quadrant] <= 0 { s.setCollapse(quadrant, collapseTicks) }

    let spill = force * 0.22
    for adj in adjacent(quadrant) {
        s[adj] = max(0, s[adj] - spill)
        if s[adj] <= 0 { s.setCollapse(adj, collapseTicks) }
    }
    if broke { s.setCollapse(quadrant, 0) } // the break resolves the collapse
    return ForceResult(broke: broke, quadrant: quadrant, before: before, after: s[quadrant])
}

/// Recovery by footwork. Standing still recovers slowly; panicking recovers not at
/// all; Low River recovers best advancing and worst retreating.
public func recoverStructure(_ s: inout Structure, _ mode: MoveMode, lineTier: Double = 0) {
    // Collapse counters always run down, even mid-technique: the base is being re-found.
    for q in Quadrant.allCases where s.collapse(q) > 0 {
        s.setCollapse(q, s.collapse(q) - 1)
    }
    let base = structureRecovery(mode)
    if base <= 0 { return }
    let rate = base * (1 + lineTier * 0.10)
    for q in Quadrant.allCases {
        if s.collapse(q) > 0 { continue } // a collapsed quadrant does not recover
        s[q] = min(MaxValue.quadrant, s[q] + rate)
    }
}

/// A quadrant that cannot bear weight gates movement in that direction — you cannot
/// advance into a broken fore, nor retreat into a broken rear.
public func bearing(_ s: Structure, _ q: Quadrant) -> Double {
    if s.collapse(q) > 0 { return 0 }
    let v = s[q] / MaxValue.quadrant
    if v <= 0.001 { return 0 }
    if v < 0.25 { return 0.35 + v }
    return 1
}

/// The quadrant a fighter is most exposed on. Ties resolve by `Quadrant.allCases`
/// order, matching the oracle's fixed iteration order.
public func weakest(_ s: Structure) -> Quadrant {
    var q = Quadrant.fore
    for k in Quadrant.allCases where s[k] < s[q] { q = k }
    return q
}

/// Mean integrity 0..1 — presentation and AI weighting only; never shown as a bar.
public func integrity(_ s: Structure) -> Double {
    (s.fore + s.rear + s.leadSide + s.rearSide) / (4 * MaxValue.quadrant)
}

/// Line tier 0...3 from the accumulated Line value.
public func lineTier(_ line: Double) -> Double {
    max(0, min(LineRule.maxTier, jsFloor(line)))
}
