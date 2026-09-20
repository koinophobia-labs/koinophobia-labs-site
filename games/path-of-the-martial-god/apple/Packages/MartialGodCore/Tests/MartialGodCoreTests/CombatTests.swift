import XCTest
@testable import MartialGodCore

/// Behavioural tests mirroring the reference suite. The parity gate proves the port
/// reproduces whole fights; these prove the individual rules in isolation, so a
/// failure points at a mechanism rather than at tick 1,482.
final class CombatTests: XCTestCase {

    override func setUp() {
        super.setUp()
        try? TechniqueDB.loadDefault()
    }

    func testTechniqueDataLoadsAndValidates() throws {
        try TechniqueDB.loadDefault()
        XCTAssertEqual(TechniqueDB.all.count, 12, "Milestone 1 ships twelve techniques in one style")
        for t in TechniqueDB.all {
            XCTAssertTrue(TechniqueDB.validate(t, style: "low_river").isEmpty, "\(t.id) failed validation")
        }
    }

    func testSameVerbDifferentIntentGivesDifferentTechniques() {
        let a = Grammar.resolve(style: "low_river", verb: .commit, intent: .neutral, band: .mid)
        let b = Grammar.resolve(style: "low_river", verb: .commit, intent: .pressure, band: .mid)
        let c = Grammar.resolve(style: "low_river", verb: .commit, intent: .angle, band: .mid)
        XCTAssertNotEqual(a?.id, b?.id)
        XCTAssertNotEqual(b?.id, c?.id)
        XCTAssertEqual(b?.id, "low_river.through_palm")
    }

    func testGrammarRefusesSentencesTheBandCannotSay() {
        XCTAssertNil(Grammar.resolve(style: "low_river", verb: .commit, intent: .pressure, band: .long))
        XCTAssertNotNil(Grammar.resolve(style: "low_river", verb: .commit, intent: .pressure, band: .mid))
    }

    func testIntentIsReadFromTheStickNotAButton() {
        XCTAssertEqual(FormMachine.intentFromMove(0, 0), .neutral)
        XCTAssertEqual(FormMachine.intentFromMove(1, 0), .pressure)
        XCTAssertEqual(FormMachine.intentFromMove(-1, 0), .retreat)
        XCTAssertEqual(FormMachine.intentFromMove(0, 1), .angle)
    }

    func testQuadrantIsDecidedByGeometry() {
        XCTAssertEqual(quadrantFromIncoming(defenderFacing: 0, toAttacker: 0), .fore)
        XCTAssertEqual(quadrantFromIncoming(defenderFacing: 0, toAttacker: .pi), .rear)
        XCTAssertEqual(quadrantFromIncoming(defenderFacing: 0, toAttacker: .pi / 2), .leadSide)
        XCTAssertEqual(quadrantFromIncoming(defenderFacing: 0, toAttacker: -.pi / 2), .rearSide)
    }

    func testQuadrantCollapsesThenTheNextForceBreaks() {
        var s = Structure()
        let first = applyForce(&s, .fore, 100)
        XCTAssertFalse(first.broke, "reaching zero is not itself the break")
        XCTAssertTrue(s.isCollapsed(.fore))
        let second = applyForce(&s, .fore, 5)
        XCTAssertTrue(second.broke, "force through a collapsed base is the break")
    }

    func testCollapsedQuadrantBearsNoWeightAndDoesNotRecover() {
        var s = Structure()
        applyForce(&s, .rear, 100)
        XCTAssertEqual(bearing(s, .rear), 0, "you cannot retreat into a broken rear")
        let before = s.rear
        recoverStructure(&s, .settling)
        XCTAssertEqual(s.rear, before, "a collapsed quadrant does not recover")
    }

    func testStructureRecoveryHaltsWhileGassed() {
        var s = Structure()
        s.fore = 40
        recoverStructure(&s, .gassed)
        XCTAssertEqual(s.fore, 40)
    }

    func testLowRiverRecoversBestAdvancingWorstRetreating() {
        var adv = Structure(); adv.fore = 10
        var ret = Structure(); ret.fore = 10
        recoverStructure(&adv, .advancing)
        recoverStructure(&ret, .retreating)
        XCTAssertGreaterThan(adv.fore, ret.fore)
    }

    func testGuardCoversTheQuadrantYouFaceAndNothingElse() {
        // Facing the attack: the blow lands on a guarded fore.
        do {
            let (a, d, events) = duel(defenderFacing: .pi, guarding: true)
            Resolve.attemptLand(a, d) { events.append($0) }
            XCTAssertTrue(events.contains { $0.type == .guarded }, "facing the attack, guard holds")
        }
        // Guarding but turned away: the same guard does not cover the flank.
        do {
            let (a, d, events) = duel(defenderFacing: .pi / 2, guarding: true)
            Resolve.attemptLand(a, d) { events.append($0) }
            XCTAssertTrue(events.contains { $0.type == .guardBypassed }, "a guard pointed the wrong way is bypassed")
            XCTAssertTrue(events.contains { $0.type == .hit }, "and the blow lands clean")
        }
    }

    func testEvadeIFramesAreConditionalOnDirection() {
        let a = Fighter(id: "a", pos: Vec2(x: 0, z: 0), facing: 0)
        let d = Fighter(id: "d", pos: Vec2(x: 1.2, z: 0), facing: .pi)
        let jab = TechniqueDB.technique("low_river.jab")
        let drive = TechniqueDB.technique("low_river.through_palm")

        d.form.evadeDir = .pi / 2
        XCTAssertTrue(Resolve.evadeWorked(defender: d, attacker: a, technique: drive), "a real angle beats even a lunge")

        d.form.evadeDir = 0
        XCTAssertTrue(Resolve.evadeWorked(defender: d, attacker: a, technique: jab), "backing off beats a non-lunging strike")
        XCTAssertFalse(Resolve.evadeWorked(defender: d, attacker: a, technique: drive), "backing off does not beat a lunge that follows")

        d.form.evadeDir = .pi
        XCTAssertFalse(Resolve.evadeWorked(defender: d, attacker: a, technique: jab), "slipping the wrong way just moves you")
    }

    func testTheStopIsGatedOnCompetenceNotIntent() {
        let novice = Fighter(id: "n", pos: Vec2(x: 0, z: 0), facing: 0); novice.mastery = 0.1
        let master = Fighter(id: "m", pos: Vec2(x: 0, z: 0), facing: 0); master.mastery = 0.9

        let t1 = Fighter(id: "t", pos: Vec2(x: 1, z: 0), facing: .pi)
        let r1 = FinalInch.attempt("stop", actor: novice, target: t1)
        XCTAssertFalse(r1.clean)
        XCTAssertEqual(r1.executed, "strike_through", "reaching for mercy without control connects anyway")

        let t2 = Fighter(id: "t", pos: Vec2(x: 1, z: 0), facing: .pi)
        let r2 = FinalInch.attempt("stop", actor: master, target: t2)
        XCTAssertTrue(r2.clean)
        XCTAssertEqual(r2.executed, "stop")
    }

    func testTheInchWindowWidensWithMastery() {
        XCTAssertGreaterThan(FinalInch.windowTicks(mastery: 1.0), FinalInch.windowTicks(mastery: 0.0))
    }

    func testABreakOnlyFinishesSomeoneWhoseWillIsGone() {
        let f = Fighter(id: "x", pos: Vec2(x: 0, z: 0), facing: 0)
        f.state = .staggered
        f.will = 90
        XCTAssertFalse(FinalInch.isFinished(f), "high Will scrambles and resets")
        f.will = 10
        XCTAssertTrue(FinalInch.isFinished(f), "low Will is finished")
    }

    func testJSRoundMatchesJavaScriptOnNegativeHalves() {
        // Swift's .rounded() would give -1 here; JavaScript's Math.round gives -0.
        XCTAssertEqual(jsRound(-0.5), 0)
        XCTAssertEqual(jsRound(0.5), 1)
        XCTAssertEqual(jsRound(2.5), 3)
        XCTAssertEqual(jsRound(-2.5), -2)
    }

    func testAPassiveGuardLoses() {
        try? TechniqueDB.loadDefault()
        let fight = Fight(options: FightOptions())
        var n = 0
        let guardInput = InputIntent(forward: 0, lateral: 0, verb: .guardVerb, held: true, guardHeld: true)
        while fight.over == nil && n < 60 * 150 {
            fight.step(input: guardInput)
            n += 1
        }
        XCTAssertNotNil(fight.over, "the fight must actually end")
        XCTAssertEqual(fight.over?.winnerID, "opponent", "guarding postpones; it does not save")
    }

    // MARK: - helpers

    private func duel(defenderFacing: Double, guarding: Bool,
                      techniqueId: String = "low_river.rear_straight") -> (Fighter, Fighter, NSMutableArray) {
        let a = Fighter(id: "a", pos: Vec2(x: 0, z: 0), facing: 0)
        let d = Fighter(id: "d", pos: Vec2(x: 1.2, z: 0), facing: defenderFacing)
        if guarding { d.state = .guardState; d.guardTicks = 60 }
        let t = TechniqueDB.technique(techniqueId)
        a.state = .acting
        a.form = Form()
        a.form.techniqueId = techniqueId
        a.form.tick = t.frames().startup
        return (a, d, NSMutableArray())
    }
}

/// Small shim so the helper can hand back a mutable event sink.
private extension NSMutableArray {
    func append(_ e: CombatEvent) { self.add(e) }
    func contains(_ predicate: (CombatEvent) -> Bool) -> Bool {
        for case let e as CombatEvent in self where predicate(e) { return true }
        return false
    }
}
