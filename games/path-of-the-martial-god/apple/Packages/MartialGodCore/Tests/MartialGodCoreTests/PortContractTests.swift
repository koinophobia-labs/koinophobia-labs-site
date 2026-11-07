import XCTest
@testable import MartialGodCore

/// The port contract, enforced rather than promised.
///
/// `MartialGodCore` must stay engine-free so that a pivot (see
/// PRODUCTION_ENGINE_DECISION.md §9) costs the presentation layer only. These tests
/// read the package's own source and fail if it starts depending on a platform.
final class PortContractTests: XCTestCase {

    /// Walk up from this file to the package root, then into Sources.
    private func sourceFiles() throws -> [URL] {
        var dir = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()   // MartialGodCoreTests
            .deletingLastPathComponent()   // Tests
            .deletingLastPathComponent()   // MartialGodCore (package root)
        dir.appendPathComponent("Sources/MartialGodCore")
        let fm = FileManager.default
        guard let e = fm.enumerator(at: dir, includingPropertiesForKeys: nil) else { return [] }
        return e.compactMap { $0 as? URL }.filter { $0.pathExtension == "swift" }
    }

    /// Source with comments removed.
    ///
    /// The ban lists below are scanned against the CODE, not the prose. Without this
    /// the suite failed on `Fight.swift` and `FormMachine.swift` for the word
    /// "randomness" — appearing in doc comments that say there is none. A contract
    /// test that fires on a file describing the contract is worse than no test: it
    /// trains whoever sees a red bar to read it as noise.
    ///
    /// Newlines are preserved so a reported line number still means something.
    func strippingComments(_ src: String) -> String {
        var out = ""
        var i = src.startIndex
        var depth = 0          // /* */ nests in Swift
        var inLine = false
        while i < src.endIndex {
            let c = src[i]
            let next = src.index(after: i)
            let two = next < src.endIndex ? String([c, src[next]]) : ""
            if inLine {
                if c == "\n" { inLine = false; out.append(c) }
            } else if depth > 0 {
                if two == "/*" { depth += 1; i = next }
                else if two == "*/" { depth -= 1; i = next }
                else if c == "\n" { out.append(c) }
            } else if two == "//" {
                inLine = true
                i = next
            } else if two == "/*" {
                depth += 1
                i = next
            } else {
                out.append(c)
            }
            i = src.index(after: i)
        }
        return out
    }

    func testSimulationImportsNoPlatformFramework() throws {
        let files = try sourceFiles()
        try XCTSkipIf(files.isEmpty, "sources not reachable from the test bundle")
        let banned = ["import UIKit", "import SwiftUI", "import Metal", "import MetalKit",
                      "import SpriteKit", "import SceneKit", "import AVFoundation",
                      "import CoreHaptics", "import GameController", "import QuartzCore"]
        for f in files {
            let src = strippingComments(try String(contentsOf: f, encoding: .utf8))
            for b in banned {
                XCTAssertFalse(src.contains(b), "\(f.lastPathComponent) imports \(b) — the core must stay engine-free")
            }
        }
    }

    func testSimulationContainsNoRandomnessOrWallClock() throws {
        let files = try sourceFiles()
        try XCTSkipIf(files.isEmpty, "sources not reachable from the test bundle")
        let banned = ["Date()", "DispatchQueue", "Timer(", "CACurrentMediaTime",
                      "random", "arc4random", "Task {", "async "]
        for f in files {
            let src = strippingComments(try String(contentsOf: f, encoding: .utf8))
            for b in banned {
                XCTAssertFalse(src.contains(b), "\(f.lastPathComponent) contains \(b) — determinism forbids it")
            }
        }
    }

    /// The stripper is load-bearing: if it ever strips too much, both bans above pass
    /// vacuously and the port contract stops being enforced at all.
    func testTheCommentStripperKeepsCodeAndDropsProse() {
        let sample = [
            "// random",
            "let a = 1 /* random */ + 2",
            "/* outer /* nested */ still comment */",
            "let b = 3   // random",
        ].joined(separator: "\n")

        let out = strippingComments(sample)
        XCTAssertFalse(out.contains("random"), "prose survived the stripper")
        XCTAssertTrue(out.contains("let a = 1"), "code before a block comment was stripped")
        XCTAssertTrue(out.contains("+ 2"), "code after a block comment was stripped")
        XCTAssertTrue(out.contains("let b = 3"), "code before a line comment was stripped")
        XCTAssertEqual(out.filter { $0 == "\n" }.count, sample.filter { $0 == "\n" }.count,
                       "line numbering must survive, so a failure still points somewhere")
    }

    /// The bans must still be able to fire. A stripper bug that ate everything would
    /// otherwise turn this whole file green and meaningless.
    func testTheBansStillCatchRealCode() {
        let offending = strippingComments("let t = Date()\nlet r = Int.random(in: 0..<3)")
        XCTAssertTrue(offending.contains("Date()"))
        XCTAssertTrue(offending.contains("random"))
    }

    func testTechniqueDataIsShippedAsDataNotCode() throws {
        let url = Bundle.module.url(forResource: "angle-and-strike", withExtension: "json")
        XCTAssertNotNil(url, "fixtures must be bundled with the test target")
        try TechniqueDB.loadDefault()
        XCTAssertFalse(TechniqueDB.all.isEmpty, "technique data must load from the JSON resource")
    }
}
