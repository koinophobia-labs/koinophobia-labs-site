import XCTest
@testable import MartialGodCore

/// The input buffer, mirroring `reference/tests/input-buffer.test.js`.
///
/// This feature existed throughout M1 and never once ran, in the oracle or in the
/// first cut of this port: the capture sat inside the new-action block, which control
/// only reaches after `acting`, `staggered`, `down` and `finished` have each already
/// returned, so its `!isActionable` test could never be true. It read as a working
/// feature, it had a named constant and a paragraph of documentation, and it was dead.
///
/// So the first test here does not assert that the buffer behaves. It asserts that it
/// HAPPENS AT ALL during real fights, which is the only assertion that would have
/// caught the original defect.
final class InputBufferTests: XCTestCase {

    override func setUp() {
        super.setUp()
        try? TechniqueDB.loadDefault()
    }

    /// A player and an opponent a stride apart, facing each other. Nothing else moves.
    private func pair() -> (Fighter, Ref) {
        let f = Fighter(id: "player", pos: Vec2(x: -0.6, z: 0), facing: 0)
        let opp = Ref(id: "opponent", pos: Vec2(x: 0.6, z: 0), facing: .pi)
        return (f, opp)
    }

    private func press(_ verb: Verb) -> InputIntent {
        InputIntent(forward: 0, lateral: 0, verb: verb, held: true)
    }

    /// Doing nothing, with the hand still closed. `held` must stay true: releasing
    /// during a wind-up is the Lie, which turns the technique into a feint and
    /// shortens it — a real rule, but not the one under test here.
    private var idle: InputIntent { InputIntent(forward: 0, lateral: 0, verb: nil, held: true) }

    @discardableResult
    private func run(_ f: Fighter, _ opp: Ref, _ n: Int,
                     input: (Int) -> InputIntent) -> [CombatEvent] {
        var events: [CombatEvent] = []
        for i in 0..<n { FormMachine.tick(f, input: input(i), opp: opp) { events.append($0) } }
        return events
    }

    func testTheBufferIsActuallyPopulatedDuringRealFights() {
        // The regression. Any test that only drove the buffer directly would have
        // passed against the broken code.
        var ticksWithBuffer = 0
        for reaction in [12, 16, 20] {
            let fight = Fight(options: FightOptions(reaction: reaction))
            var n = 0
            while fight.over == nil && n < 60 * 40 {
                // A press every 23 ticks, regardless of whether the body is free —
                // which is what a person does.
                let input = InputIntent(forward: 1, lateral: 0,
                                        verb: n % 23 == 0 ? .commit : nil, held: true)
                fight.step(input: input)
                if fight.a.buffer != nil { ticksWithBuffer += 1 }
                n += 1
            }
        }
        XCTAssertGreaterThan(ticksWithBuffer, 0,
            "the input buffer was never populated — it is dead code again")
    }

    func testAVerbPressedWhileCommittedIsRemembered() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.rear_straight"))
        XCTAssertFalse(f.isActionable)

        FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }
        XCTAssertNotNil(f.buffer, "the press was thrown away — this is the original defect")
        XCTAssertEqual(f.buffer?.verb, Verb.strike)
        XCTAssertEqual(f.buffer?.age, 0, "a press made this tick has its whole window ahead of it")
    }

    func testARememberedVerbFiresOnTheFirstTickTheBodyIsFree() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.jab"))  // 9 + 3 + 12
        var firedAt: Int?

        for i in 0..<40 {
            FormMachine.tick(f, input: i == 19 ? press(.strike) : idle, opp: opp) { e in
                if e.type == .begin, firedAt == nil, i > 19 { firedAt = i }
            }
        }
        XCTAssertNotNil(firedAt, "the remembered press never produced a technique")
        XCTAssertNil(f.buffer, "the buffer must be spent, not kept")
        XCTAssertLessThanOrEqual(firedAt ?? 99, 25, "the body was free at 24")
    }

    func testAPressHeldPastTheWindowIsForgotten() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.come_down"))  // 51 ticks
        FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }
        XCTAssertNotNil(f.buffer)

        run(f, opp, inputBufferTicks + 1) { _ in self.idle }
        XCTAssertNil(f.buffer, "a press older than \(inputBufferTicks) ticks must not still be waiting")

        let events = run(f, opp, 60) { _ in self.idle }
        XCTAssertFalse(events.contains { $0.type == .begin },
            "a forgotten press must never fire — the game does not act on its own")
    }

    func testTheWindowIsExactlyInputBufferTicksOnBothSidesOfTheEdge() {
        for (age, shouldSurvive) in [(inputBufferTicks, true), (inputBufferTicks + 1, false)] {
            let (f, opp) = pair()
            FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.come_down"))
            FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }   // captured, age 0
            run(f, opp, age) { _ in self.idle }
            XCTAssertEqual(f.buffer != nil, shouldSurvive,
                "a press \(age) ticks old should \(shouldSurvive ? "still" : "no longer") be held")
        }
    }

    func testALivePressBeatsARememberedOne() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.jab"))
        FormMachine.tick(f, input: press(.commit), opp: opp) { _ in }
        XCTAssertEqual(f.buffer?.verb, Verb.commit)

        var began: CombatEvent?
        for _ in 0..<30 {
            FormMachine.tick(f, input: f.isActionable ? press(.strike) : idle, opp: opp) { e in
                if e.type == .begin, began == nil { began = e }
            }
            if began != nil { break }
        }
        XCTAssertNotNil(began, "nothing came out")
        XCTAssertEqual(TechniqueDB.technique(began!.technique!).verb, Verb.strike,
            "what you are doing now must beat what you meant a tenth of a second ago")
    }

    func testOnePressIsOneAction() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.jab"))
        FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }

        let events = run(f, opp, 200) { _ in self.idle }
        XCTAssertLessThanOrEqual(events.filter { $0.type == .begin }.count, 1,
            "one press produced more than one technique")
    }

    func testAPressWhileStaggeredIsHonouredWhenTheFeetComeBack() {
        let (f, opp) = pair()
        FormMachine.stagger(f, dir: 0, ticks: 34, push: 0.1)
        run(f, opp, 28) { _ in self.idle }
        FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }
        XCTAssertNotNil(f.buffer, "a press during a stagger must be remembered")

        let events = run(f, opp, 12) { _ in self.idle }
        XCTAssertTrue(events.contains { $0.type == .begin },
            "coming out of a stagger must honour the press that was waiting")
    }

    func testYouCannotQueueAnAttackFromTheFloor() {
        let (f, opp) = pair()
        FormMachine.knockDown(f, dir: 0, push: 0.2)      // 78 ticks down
        FormMachine.tick(f, input: press(.commit), opp: opp) { _ in }
        let events = run(f, opp, 120) { _ in self.idle }
        XCTAssertFalse(events.contains { $0.type == .begin },
            "you cannot queue an attack from the floor most of a second in advance")
    }

    func testAFinishedFighterHoldsNothing() {
        let (f, opp) = pair()
        FormMachine.beginTechnique(f, TechniqueDB.technique("low_river.jab"))
        FormMachine.tick(f, input: press(.strike), opp: opp) { _ in }
        XCTAssertNotNil(f.buffer)
        f.state = .finished
        FormMachine.tick(f, input: idle, opp: opp) { _ in }
        XCTAssertNil(f.buffer)
    }

    func testTheOpponentNeverBuffers() {
        // `Brain.decide` returns a nil verb whenever it is not actionable, so it cannot
        // capture. That asymmetry IS the fix: the brain already acts on the exact frame
        // it becomes free, and the buffer gives a pair of hands the same privilege. If
        // the opponent ever starts buffering, the gap this closes has been reopened.
        var opponentBufferTicks = 0
        for reaction in [12, 16, 20] {
            let fight = Fight(options: FightOptions(reaction: reaction))
            var n = 0
            while fight.over == nil && n < 60 * 40 {
                fight.step(input: InputIntent(forward: 1, lateral: 0,
                                              verb: n % 23 == 0 ? .commit : nil, held: true))
                if fight.b.buffer != nil { opponentBufferTicks += 1 }
                n += 1
            }
        }
        XCTAssertEqual(opponentBufferTicks, 0,
            "the opponent buffered an input; the advantage the buffer exists to cancel is back")
    }
}
