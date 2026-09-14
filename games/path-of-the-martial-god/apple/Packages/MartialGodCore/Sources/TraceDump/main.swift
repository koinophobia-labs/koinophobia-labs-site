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
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: TraceDump <fixture.json> [out.json]\n".data(using: .utf8)!)
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
