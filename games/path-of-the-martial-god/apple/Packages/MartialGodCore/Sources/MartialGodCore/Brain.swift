import Foundation

/// OpponentBrain — ported from `reference/sim/ai/brain.js`.
///
/// A deliberately small, inspectable, scored decision model. It emits the SAME
/// InputIntent a player produces: the opponent has no private vocabulary. It never
/// receives the live player object — only a delayed Snapshot.
///
/// TWO PARITY HAZARDS ARE HANDLED EXPLICITLY HERE, because a naive transliteration
/// would drift from the oracle:
///
///  1. TERM SUMMATION ORDER. JavaScript sums `Object.values(terms)` in insertion
///     order. Floating-point addition is not associative, so the Swift port must add
///     the ten terms in exactly the same sequence. `ScoreTerms.total` does.
///
///  2. SORT STABILITY. `Array.prototype.sort` is stable by specification; Swift's
///     `sort` is not. Equal scores must therefore keep their option order, which is
///     done by an explicit index tiebreak rather than by trusting the sort.

struct Option {
    let id: String
    let verb: Verb?
    let fwd: Double
    let lat: Double
    let guardHeld: Bool

    init(_ id: String, _ verb: Verb?, _ fwd: Double, _ lat: Double, guardHeld: Bool = false) {
        self.id = id; self.verb = verb; self.fwd = fwd; self.lat = lat; self.guardHeld = guardHeld
    }
}

/// The option set. Each is a (verb, movement) pair — the player's own vocabulary.
/// Declaration order is load-bearing: it is the tiebreak for equal scores.
let brainOptions: [Option] = [
    Option("hold", nil, 0, 0),
    Option("advance", nil, 1, 0),
    Option("retreat", nil, -1, 0),
    Option("circle_lead", nil, 0.15, 1),
    Option("circle_rear", nil, 0.15, -1),
    Option("jab", .strike, 0, 0),
    Option("step_jab", .strike, 1, 0),
    Option("check", .strike, -1, 0),
    Option("shoulder_gate", .strike, 0.2, 1),
    Option("rear_straight", .commit, 0, 0),
    Option("through_palm", .commit, 1, 0),
    Option("nail", .commit, -1, 0),
    Option("come_down", .commit, 0.2, 1),
    Option("guard", .guardVerb, 0, 0, guardHeld: true),
    Option("deflect", .deflect, 0, 0),
    Option("slip_lead", .evade, 0, 1),
    Option("slip_back", .evade, -1, 0),
    Option("focus", .focus, 0, 0),
]

private let attackIDs: Set<String> = ["jab", "step_jab", "check", "shoulder_gate",
                                      "rear_straight", "through_palm", "nail", "come_down"]
private let defenceIDs: Set<String> = ["guard", "deflect", "slip_lead", "slip_back"]
private let commitIDs: Set<String> = ["rear_straight", "through_palm", "come_down"]

/// The ten scoring terms, summed in the oracle's insertion order.
public struct ScoreTerms {
    public var range = 0.0
    public var punish = 0.0
    public var threat = 0.0
    public var opening = 0.0
    public var exposure = 0.0
    public var breath = 0.0
    public var tendency = 0.0
    public var temperament = 0.0
    public var dwell = 0.0
    public var repetition = 0.0
    /// Assigned LAST in the oracle, so it sums last here. See `total`.
    public var urgency = 0.0

    /// Summation order matches `Object.values(terms)` in the oracle exactly.
    public var total: Double {
        var s = range
        s += punish
        s += threat
        s += opening
        s += exposure
        s += breath
        s += tendency
        s += temperament
        s += dwell
        s += repetition
        s += urgency
        return s
    }
}

public struct ScoredOption {
    public let id: String
    public let score: Double
    public let terms: ScoreTerms
    public let techniqueId: String?
}

public final class Brain {
    public var style = "low_river"
    /// Authored temperament, not a difficulty knob.
    public var aggression: Double
    public var patience: Double
    /// Ticks since either body last did anything. See `Urgency` in Constants.swift.
    public var quiet = 0
    public var lastChoice = "hold"
    /// Tendency counts keyed by observed tell. The Read hook — feints poison this.
    /// An ordered array, not a dictionary: the oracle's object preserves insertion
    /// order and `topTendency` resolves ties by it.
    var tendencies: [(tell: String, count: Double)] = []
    var lastSeenTell: String?
    /// Decaying counts of this fighter's OWN recent attacks — keeps it from looping.
    var recent: [(id: String, count: Double)] = []
    /// Full scoring breakdown of the most recent decision, for inspection.
    public private(set) var lastScores: [ScoredOption] = []

    public init(aggression: Double = 0.55, patience: Double = 0.45) {
        self.aggression = aggression
        self.patience = patience
    }

    private func tendencyCount(_ tell: String) -> Double {
        tendencies.first { $0.tell == tell }?.count ?? 0
    }

    private func bumpTendency(_ tell: String) {
        if let i = tendencies.firstIndex(where: { $0.tell == tell }) {
            tendencies[i].count += 1
        } else {
            tendencies.append((tell, 1))
        }
        // Decay so the model tracks recent habits rather than the whole fight.
        for i in tendencies.indices { tendencies[i].count *= 0.985 }
    }

    private func topTendency() -> (tell: String, count: Double)? {
        var best: (tell: String, count: Double)?
        for t in tendencies where best == nil || t.count > best!.count { best = t }
        return best
    }

    private func recentCount(_ id: String) -> Double {
        recent.first { $0.id == id }?.count ?? 0
    }

    /// Observe a tell. Feints produce tells with no landing — which is the point.
    private func noteTendency(_ snap: Snapshot?) {
        guard let tell = snap?.tell else { lastSeenTell = nil; return }
        if tell == lastSeenTell { return }
        lastSeenTell = tell
        bumpTendency(tell)
    }

    public func decide(for selfF: Fighter, snap: Snapshot?) -> InputIntent {
        noteTendency(snap)

        // How long since anything happened. Judged only from what a fighter can see,
        // and from the DELAYED snapshot, so it inherits perception's limits rather
        // than reaching around them. Only the opponent responding counts: a swing
        // into empty air is evidence the fight has NOT started, so it must not reset
        // the count. Mid-technique the count freezes — busy, but nothing landed.
        //
        // Must run before the early return below, for the same reason the input
        // buffer must: the states it exists to measure are the ones that return here.
        let contact =
            selfF.state == .staggered || selfF.state == .down ||
            (snap.map { $0.phase != nil || $0.state == .staggered || $0.state == .down } ?? false)
        if contact { quiet = 0 } else if selfF.isActionable { quiet += 1 }

        // Commitment is real for the AI too. It cannot cancel out of a technique.
        if !selfF.isActionable {
            lastScores = []
            return InputIntent(forward: 0, lateral: 0, verb: nil, held: true, guardHeld: false)
        }
        guard let snap else {
            return InputIntent(forward: 0, lateral: 0, verb: nil, held: true, guardHeld: false)
        }

        let dx = snap.pos.x - selfF.pos.x
        let dz = snap.pos.z - selfF.pos.z
        let dist = hypot(dx, dz)
        let band = bandFor(dist)

        // --- situational reads, computed once ---------------------------------
        let theirPhase = snap.phase
        let theyAreOpen = snap.state == .staggered || snap.state == .down || theirPhase == .recovery
        let theyAreWinding = theirPhase == .startup
        let theirTech: Technique? = snap.techniqueId.map { TechniqueDB.technique($0) }
        let incomingIsCommit = theirTech.map { $0.kind == .Drive || $0.kind == .Displace } ?? false

        // Which of THEIR quadrants is softest, and am I standing where I can reach it?
        let theirWeak = weakest(snap.structure)
        let myBearingToThem = atan2(dz, dx)
        let quadrantIWouldHit = quadrantFromIncoming(defenderFacing: snap.facing,
                                                     toAttacker: myBearingToThem + Double.pi)
        let onTheOpening = quadrantIWouldHit == theirWeak && theirWeak != .fore

        let myWeak = weakest(selfF.structure)
        let myExposure = 1 - selfF.structure[myWeak] / MaxValue.quadrant
        let breathLow = selfF.breath < 28
        let theirBreathLow = snap.breath < 28

        var scored: [ScoredOption] = []
        for o in brainOptions {
            var terms = ScoreTerms()
            var tech: Technique?
            if let v = o.verb {
                guard let t = Grammar.resolve(style: style, verb: v, intent: intentOf(o), band: band) else { continue }
                if let req = t.requiresLineTier, lineTier(selfF.line) < req { continue }
                tech = t
            }

            // 1. RANGE
            terms.range = rangeFit(o, band: band, dist: dist, tech: tech)

            // 2. PUNISH — they are open; take it.
            terms.punish = theyAreOpen && attackIDs.contains(o.id) ? (commitIDs.contains(o.id) ? 3.4 : 2.2) : 0
            if theyAreOpen && defenceIDs.contains(o.id) { terms.punish = -1.6 }

            // 3. THREAT — they are winding up at me; committing now is dangerous.
            if theyAreWinding && dist < 2.0 {
                if o.id == "deflect" { terms.threat = 2.0 + (incomingIsCommit ? 1.0 : 0) }
                else if o.id == "guard" { terms.threat = 1.5 }
                else if o.id == "slip_lead" { terms.threat = 1.8 }
                else if o.id == "slip_back" { terms.threat = incomingIsCommit ? 0.4 : 1.5 }
                else if commitIDs.contains(o.id) { terms.threat = -2.4 }
                else if o.id == "check" { terms.threat = 1.9 }
                else { terms.threat = 0 }
            } else { terms.threat = 0 }

            // 4. OPENING — hunt the quadrant they are not defending.
            terms.opening = 0
            if onTheOpening && attackIDs.contains(o.id) { terms.opening = 1.5 }
            if !onTheOpening && theirWeak != .fore && (o.id == "circle_lead" || o.id == "circle_rear") {
                terms.opening = 1.2
            }
            if theirWeak == .fore && o.id == "through_palm" { terms.opening = 1.1 }

            // 5. EXPOSURE — my own base is going; reset it.
            terms.exposure = 0
            if myExposure > 0.55 {
                if o.id == "retreat" { terms.exposure = 1.4 }
                if o.id == "circle_lead" || o.id == "circle_rear" { terms.exposure = 1.1 }
                if commitIDs.contains(o.id) { terms.exposure = -1.3 }
            }

            // 6. BREATH — gassing out is self-inflicted; don't.
            terms.breath = 0
            if selfF.breath < 12 {
                if o.id == "focus" { terms.breath = 4.2 }
                else if o.id == "retreat" { terms.breath = 2.0 }
                else if attackIDs.contains(o.id) { terms.breath = -1.4 }
            } else if breathLow {
                if o.id == "focus" { terms.breath = 2.6 }
                if o.id == "retreat" { terms.breath = 1.2 }
                if commitIDs.contains(o.id) { terms.breath = -2.0 }
                if o.id == "guard" { terms.breath = -0.8 }
            }
            if theirBreathLow && attackIDs.contains(o.id) { terms.breath += 0.8 }

            // 7. TENDENCY — the Read hook. Weak on purpose; feints already poison it.
            terms.tendency = 0
            if let habit = topTendency(), habit.count > 3, defenceIDs.contains(o.id) {
                terms.tendency = min(0.9, habit.count * 0.06)
            }

            // 8. TEMPERAMENT — authored personality, not difficulty.
            terms.temperament = (attackIDs.contains(o.id) ? aggression : 0)
                + ((o.id == "hold" || o.id == "guard") ? patience * 0.8 : 0)

            // 9. DWELL — stickiness, so the body does not twitch between intentions.
            terms.dwell = o.id == lastChoice ? 0.35 : 0

            // 10. REPETITION — refusing to be a one-move machine. Not adaptation.
            terms.repetition = attackIDs.contains(o.id) ? -min(2.2, recentCount(o.id) * 0.30) : 0

            // 11. URGENCY — nothing has happened for a while, and that is information.
            // Closes distance only; `rangeFit` already knows which techniques arrive,
            // and a bonus big enough to be felt is big enough to override its -2.0.
            terms.urgency = 0
            if quiet > Urgency.graceTicks {
                let u = min(1, Double(quiet - Urgency.graceTicks) / Urgency.rampTicks)
                terms.urgency = u * (
                    o.fwd * Urgency.advance
                    - ((o.id == "hold" || o.id == "guard") ? Urgency.settle : 0)
                )
            }

            scored.append(ScoredOption(id: o.id, score: terms.total, terms: terms, techniqueId: tech?.id))
        }

        if scored.isEmpty {
            return InputIntent(forward: 0, lateral: 0, verb: nil, held: true, guardHeld: false)
        }

        // Stable descending sort: equal scores keep option order (see hazard 2 above).
        let ordered = scored.enumerated().sorted { lhs, rhs in
            if lhs.element.score != rhs.element.score { return lhs.element.score > rhs.element.score }
            return lhs.offset < rhs.offset
        }.map(\.element)

        lastScores = Array(ordered.prefix(6))
        let best = ordered[0]
        lastChoice = best.id

        // Remember what we just committed to, with decay.
        for i in recent.indices { recent[i].count *= 0.992 }
        if attackIDs.contains(best.id) {
            if let i = recent.firstIndex(where: { $0.id == best.id }) { recent[i].count += 1 }
            else { recent.append((best.id, 1)) }
        }

        guard let o = brainOptions.first(where: { $0.id == best.id }) else {
            return InputIntent(forward: 0, lateral: 0, verb: nil, held: true, guardHeld: false)
        }
        return InputIntent(forward: o.fwd, lateral: o.lat, verb: o.verb,
                           held: true, guardHeld: o.guardHeld)
    }

    private func intentOf(_ o: Option) -> Intent {
        let mag = hypot(o.fwd, o.lat)
        if mag < 0.30 { return .neutral }
        if abs(o.lat) > abs(o.fwd) * 1.1 { return .angle }
        return o.fwd > 0 ? .pressure : .retreat
    }

    private func rangeFit(_ o: Option, band: Band, dist: Double, tech: Technique?) -> Double {
        if o.verb == nil {
            if band == .outside { return o.id == "advance" ? 2.2 : 0 }
            if band == .long { return o.id == "advance" ? 1.7 : 0.1 }
            if band == .contact { return o.id == "retreat" ? 0.7 : 0.3 }
            return o.id == "hold" ? 0.4 : 0.5
        }
        // Breathing is something you do because you NEED to, not because of where you
        // stand. Range only says it is permissible; the breath term makes it wanted.
        if o.id == "focus" { return (band == .outside || band == .long) ? 0.15 : -1.8 }
        guard let t = tech else { return 0 }
        if let reach = t.reach {
            let over = dist - reach
            if over > 0.30 { return -2.0 }
            if over > 0.05 { return -0.4 }
            return 1.0 + max(0, 0.4 - abs(over)) * 0.8
        }
        return 0.5
    }
}
