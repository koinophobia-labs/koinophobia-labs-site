import Foundation

/// FinalInch — ported from `reference/sim/finalInch.js`.
///
/// "A martial god is someone who can end any fight and chooses how it ends."
/// Mastery buys TERMINAL OPTIONS, not damage. The set of ways you may end a person is
/// a function of competence and their state — never a hardcoded branch.
public struct Terminal: Sendable {
    public let id: String
    public let name: String
    /// The mastery required to execute it cleanly.
    public let difficulty: Double
    public let requiresCustody: Bool
    public let reads: String
}

public enum FinalInch {
    public static let terminals: [Terminal] = [
        Terminal(id: "strike_through", name: "Strike through", difficulty: 0.0,
                 requiresCustody: false,
                 reads: "Ordinary. The default. Fast, clean, forgettable."),
        // The hardest thing in the game. A novice who tries to pull a strike overshoots
        // and connects anyway — the ability to be merciful is gated behind competence.
        Terminal(id: "stop", name: "The Stop", difficulty: 0.55,
                 requiresCustody: false,
                 reads: "They feel the inch. The hardest thing in the game."),
        Terminal(id: "lapse", name: "Let it lapse", difficulty: 0.0,
                 requiresCustody: false,
                 reads: "Indifference. Neither mercy nor cruelty."),
    ]

    /// Is this fighter finished — Structure broken AND they know it?
    /// Not every knockdown is an ending.
    public static func isFinished(_ target: Fighter) -> Bool {
        let broken = target.state == .staggered || target.state == .down
        return broken && target.will < WillRule.inchThreshold
    }

    /// The window widens with mastery: a better fighter has MORE TIME TO DECIDE,
    /// which is exactly right — skill buys deliberation, not speed.
    public static func windowTicks(mastery: Double) -> Int {
        Int(jsRound(InchRule.baseWindowTicks + InchRule.perMasteryTicks * clamp(mastery, 0, 1)))
    }

    public static func offer(actor: Fighter, target: Fighter) -> [Terminal] {
        terminals.filter { t in
            // Terminals needing a grip (Break, Choke, Submit) arrive with CustodyGraph.
            !t.requiresCustody
        }
    }

    public struct Attempt {
        public let id: String
        public let executed: String
        public let clean: Bool
        public let note: String
    }

    /// Execute a chosen terminal.
    ///
    /// The Stop is a SKILL. Below the competence threshold the fighter reaches for it
    /// and fails — the motion overshoots and they connect anyway. Restraint is not a
    /// moral choice available to the weak, and this is the only place that is decided.
    @discardableResult
    public static func attempt(_ id: String, actor: Fighter, target: Fighter) -> Attempt {
        let term = terminals.first { $0.id == id } ?? terminals[2]
        let clean = actor.mastery >= term.difficulty

        if id == "stop" && !clean {
            applyStrikeThrough(target)
            return Attempt(id: id, executed: "strike_through", clean: false,
                           note: "Reached for the Stop and could not hold it. The strike went through.")
        }
        if id == "stop" {
            target.state = .finished
            target.will = max(0, target.will - 6)
            return Attempt(id: id, executed: "stop", clean: true,
                           note: "Held the finish and did not take it.")
        }
        if id == "lapse" {
            // Not acting is acting. They live; it reads as neither mercy nor cruelty.
            target.state = .neutral
            target.stateTicks = 0
            return Attempt(id: id, executed: "lapse", clean: true, note: "Disengaged. They live.")
        }
        applyStrikeThrough(target)
        return Attempt(id: id, executed: "strike_through", clean: true, note: "Finished it.")
    }

    static func applyStrikeThrough(_ target: Fighter) {
        target.state = .finished
        target.will = 0
        for r in Region.allCases { target.vitality[r] = 0 }
    }
}
