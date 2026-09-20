import Foundation
import MartialGodCore

/// Parity gate runner.
///
///   swift run TraceDump <fixture.json> [out.json]
///
/// Replays the fixture's recorded inputs through the production simulation and writes
/// this implementation's own {frames, events}. Compare with:
///
///   node reference/tools/verify-trace.mjs <fixture.json> <out.json>

let args = CommandLine.arguments

/// `TraceDump --bench` — how long a simulation tick actually costs.
///
/// The number that matters for the frame budget, measured rather than assumed. Whole
/// fights are timed, not quiet ticks, so the cost includes perception, the brain's
/// scoring pass, landing resolution and the Final Inch.
///
/// This is a dev tool and lives outside `Sources/MartialGodCore`, which is why it may
/// use a clock at all: the simulation itself is forbidden one by PortContractTests.
if args.contains("--bench") {
    do {
        try TechniqueDB.loadDefault()
    } catch {
        FileHandle.standardError.write("bench failed to load techniques: \(error)\n".data(using: .utf8)!)
        exit(1)
    }
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
    _ = runFight(2000)                       // warm up
    var total = 0
    let t0 = DispatchTime.now().uptimeNanoseconds
    for _ in 0..<200 { total += runFight(2000) }
    let ns = DispatchTime.now().uptimeNanoseconds - t0
    let perTickUs = Double(ns) / Double(total) / 1000
    let budgetUs = 1_000_000.0 / 60
    print(String(format: "%d ticks in %.1f ms  ->  %.3f us/tick", total, Double(ns) / 1e6, perTickUs))
    print(String(format: "60Hz frame budget %.0f us; the simulation is %.3f%% of it", budgetUs, perTickUs / budgetUs * 100))
    exit(0)
}

guard args.count >= 2 else {
    FileHandle.standardError.write("usage: TraceDump <fixture.json> [out.json]\n       TraceDump --bench\n".data(using: .utf8)!)
    exit(2)
}

do {
    try TechniqueDB.loadDefault()
    let data = try Data(contentsOf: URL(fileURLWithPath: args[1]))
    let fixture = try JSONDecoder().decode(TraceFixture.self, from: data)
    let output = Trace.replay(fixture)

    let encoder = JSONEncoder()
    // Key order does not matter to the verifier, but stable output makes diffs usable.
    encoder.outputFormatting = [.sortedKeys]
    let encoded = try encoder.encode(output)

    if args.count >= 3 {
        try encoded.write(to: URL(fileURLWithPath: args[2]))
        FileHandle.standardError.write(
            "\(fixture.scenario): \(output.frames.count) frames, \(output.events.count) events -> \(args[2])\n"
                .data(using: .utf8)!)
    } else {
        FileHandle.standardOutput.write(encoded)
    }
} catch {
    FileHandle.standardError.write("TraceDump failed: \(error)\n".data(using: .utf8)!)
    exit(1)
}
