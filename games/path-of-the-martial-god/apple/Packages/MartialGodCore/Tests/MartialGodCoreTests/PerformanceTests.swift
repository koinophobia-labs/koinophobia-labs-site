import XCTest
@testable import MartialGodCore

/// The simulation's frame budget, asserted rather than assumed.
///
/// Measured in a release build: 7.4us per tick on x86_64 Linux, which is 0.045% of the
/// 16,667us a 60Hz frame allows. The ceiling below is deliberately far above that and
/// far above the debug-build cost this suite actually runs at — it is not a tuning
/// target, it is a tripwire for the kind of change that makes a tick cost milliseconds
/// (an accidental O(n^2), a per-tick allocation storm, a JSON decode in the hot path).
///
/// A tight assertion here would fail on a busy CI box and teach everyone to ignore it.
final class PerformanceTests: XCTestCase {

    /// Generous by design: ~10x the debug cost, still 16x inside the frame budget.
    private let ceilingMicroseconds = 1000.0

    override func setUp() {
        super.setUp()
        try? TechniqueDB.loadDefault()
    }

    func testATickFitsInsideTheFrameBudgetWithRoomToSpare() {
        func runFight(_ n: Int) -> Int {
            let f = Fight(options: FightOptions(reaction: 16))
            var ticks = 0
            for i in 0..<n {
                if f.over != nil { break }
                f.step(input: InputIntent(forward: 1, lateral: 0,
                                          verb: i % 23 == 0 ? .commit : nil, held: true))
                ticks += 1
            }
            return ticks
        }

        _ = runFight(2000)   // warm up; the first fight pays for lazy table init

        var total = 0
        let t0 = DispatchTime.now().uptimeNanoseconds
        for _ in 0..<20 { total += runFight(2000) }
        let ns = DispatchTime.now().uptimeNanoseconds - t0
        let perTick = Double(ns) / Double(total) / 1000

        XCTAssertGreaterThan(total, 1000, "the benchmark must actually have simulated something")
        XCTAssertLessThan(perTick, ceilingMicroseconds,
            String(format: "a tick cost %.1fus; something in the loop got expensive", perTick))
        print(String(format: "simulation: %.3f us/tick over %d ticks (debug build)", perTick, total))
    }
}
