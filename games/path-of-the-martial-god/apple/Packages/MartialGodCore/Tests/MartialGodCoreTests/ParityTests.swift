import XCTest
@testable import MartialGodCore

/// THE PORT GATE.
///
/// The production simulation does not pass because the fight "feels similar". It
/// passes when, replaying the oracle's own recorded inputs, every discrete field
/// matches exactly and every continuous field sits inside the tolerance declared in
/// `reference/tools/trace-format.mjs`.
///
/// Tolerances exist because exact bit equality across languages is not achievable:
/// JavaScript engines implement Math.hypot, atan2, sin and cos in their own code and
/// Swift calls the platform libm. They disagree in the last ulp. The values below are
/// far tighter than anything gameplay could perceive.
final class ParityTests: XCTestCase {

    static let scenarios = [
        "idle-standoff", "guard-under-pressure", "pressure-and-commit",
        "angle-and-strike", "feint-and-slip", "breath-to-empty", "to-the-final-inch",
    ]

    /// Mirrors TOLERANCE in trace-format.mjs. Keep the two in step.
    static let tolerance: [String: Double] = [
        "pos.x": 1e-4, "pos.z": 1e-4, "facing": 1e-4,
        "structure.fore": 1e-3, "structure.rear": 1e-3,
        "structure.leadSide": 1e-3, "structure.rearSide": 1e-3,
        "breath": 1e-3, "will": 1e-3, "line": 1e-4,
        "vitality.head": 1e-3, "vitality.torso": 1e-3,
        "vitality.leadArm": 1e-3, "vitality.rearArm": 1e-3,
        "vitality.leadLeg": 1e-3, "vitality.rearLeg": 1e-3,
    ]

    override func setUp() {
        super.setUp()
        try? TechniqueDB.loadDefault()
    }

    func loadFixture(_ name: String) throws -> TraceFixture {
        guard let url = Bundle.module.url(forResource: name, withExtension: "json") else {
            throw XCTSkip("fixture \(name).json not bundled")
        }
        return try JSONDecoder().decode(TraceFixture.self, from: Data(contentsOf: url))
    }

    func testEveryScenarioMatchesTheOracle() throws {
        for name in Self.scenarios {
            let fixture = try loadFixture(name)
            let actual = Trace.replay(fixture)
            assertParity(name: name, expected: fixture, actual: actual)
        }
    }

    /// A trace with no events or no frames would pass vacuously; make sure the
    /// fixtures actually exercise the mechanics before trusting a green gate.
    func testFixturesAreSubstantial() throws {
        var seen = Set<String>()
        for name in Self.scenarios {
            let f = try loadFixture(name)
            XCTAssertGreaterThan(f.frames.count, 100, "\(name) is too short to be meaningful")
            XCTAssertEqual(f.inputs.count, f.frames.count, "\(name): inputs and frames must be 1:1")
            for e in f.events { seen.insert(e.type) }
        }
        for required in ["hit", "guarded", "whiff", "break", "feint", "gassed", "inch_open", "terminal", "over"] {
            XCTAssertTrue(seen.contains(required), "no fixture exercises \"\(required)\"")
        }
    }

    private func assertParity(name: String, expected: TraceFixture, actual: TraceOutput) {
        XCTAssertEqual(actual.frames.count, expected.frames.count,
                       "\(name): frame count differs — a discrete branch diverged, so everything after is meaningless")

        let n = min(actual.frames.count, expected.frames.count)
        for i in 0..<n {
            let e = expected.frames[i], g = actual.frames[i]
            XCTAssertEqual(g.tick, e.tick, "\(name) tick \(i): tick")
            compareFighter(name: name, tick: i, side: "a", e: e.a, g: g.a)
            compareFighter(name: name, tick: i, side: "b", e: e.b, g: g.b)

            XCTAssertEqual(g.inch?.actorId, e.inch?.actorId, "\(name) tick \(i): inch.actorId")
            XCTAssertEqual(g.inch?.ticksLeft, e.inch?.ticksLeft, "\(name) tick \(i): inch.ticksLeft")
            XCTAssertEqual(g.over?.winnerId, e.over?.winnerId, "\(name) tick \(i): over.winnerId")
            XCTAssertEqual(g.over?.reason, e.over?.reason, "\(name) tick \(i): over.reason")
            XCTAssertEqual(g.over?.terminal, e.over?.terminal, "\(name) tick \(i): over.terminal")
        }

        XCTAssertEqual(actual.events.count, expected.events.count, "\(name): event count")
        let m = min(actual.events.count, expected.events.count)
        for i in 0..<m {
            let e = expected.events[i], g = actual.events[i]
            XCTAssertEqual(g.type, e.type, "\(name) event #\(i): type")
            XCTAssertEqual(g.tick, e.tick, "\(name) event #\(i) (\(e.type)): tick")
            XCTAssertEqual(g.who, e.who, "\(name) event #\(i) (\(e.type)): who")
            XCTAssertEqual(g.by, e.by, "\(name) event #\(i) (\(e.type)): by")
            XCTAssertEqual(g.technique, e.technique, "\(name) event #\(i) (\(e.type)): technique")
            XCTAssertEqual(g.quadrant, e.quadrant, "\(name) event #\(i) (\(e.type)): quadrant")
            XCTAssertEqual(g.executed, e.executed, "\(name) event #\(i) (\(e.type)): executed")
        }
    }

    private func compareFighter(name: String, tick: Int, side: String, e: TraceFighter, g: TraceFighter) {
        let at = "\(name) tick \(tick) \(side)"
        // DISCRETE — any difference means the branches diverged.
        XCTAssertEqual(g.state, e.state, "\(at).state")
        XCTAssertEqual(g.techniqueId, e.techniqueId, "\(at).techniqueId")
        XCTAssertEqual(g.formTick, e.formTick, "\(at).formTick")
        XCTAssertEqual(g.feint, e.feint, "\(at).feint")
        XCTAssertEqual(g.landed, e.landed, "\(at).landed")
        XCTAssertEqual(g.guardTicks, e.guardTicks, "\(at).guardTicks")
        XCTAssertEqual(g.stateTicks, e.stateTicks, "\(at).stateTicks")
        XCTAssertEqual(g.collapse.fore, e.collapse.fore, "\(at).collapse.fore")
        XCTAssertEqual(g.collapse.rear, e.collapse.rear, "\(at).collapse.rear")
        XCTAssertEqual(g.collapse.leadSide, e.collapse.leadSide, "\(at).collapse.leadSide")
        XCTAssertEqual(g.collapse.rearSide, e.collapse.rearSide, "\(at).collapse.rearSide")

        // CONTINUOUS — within declared tolerance.
        near(g.pos.x, e.pos.x, "pos.x", at)
        near(g.pos.z, e.pos.z, "pos.z", at)
        near(g.facing, e.facing, "facing", at)
        near(g.structure.fore, e.structure.fore, "structure.fore", at)
        near(g.structure.rear, e.structure.rear, "structure.rear", at)
        near(g.structure.leadSide, e.structure.leadSide, "structure.leadSide", at)
        near(g.structure.rearSide, e.structure.rearSide, "structure.rearSide", at)
        near(g.breath, e.breath, "breath", at)
        near(g.will, e.will, "will", at)
        near(g.line, e.line, "line", at)
        near(g.vitality.head, e.vitality.head, "vitality.head", at)
        near(g.vitality.torso, e.vitality.torso, "vitality.torso", at)
        near(g.vitality.leadArm, e.vitality.leadArm, "vitality.leadArm", at)
        near(g.vitality.rearArm, e.vitality.rearArm, "vitality.rearArm", at)
        near(g.vitality.leadLeg, e.vitality.leadLeg, "vitality.leadLeg", at)
        near(g.vitality.rearLeg, e.vitality.rearLeg, "vitality.rearLeg", at)
    }

    private func near(_ got: Double, _ expected: Double, _ field: String, _ at: String) {
        let tol = Self.tolerance[field] ?? 1e-6
        XCTAssertEqual(got, expected, accuracy: tol, "\(at).\(field)")
    }
}
