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

    func testSimulationImportsNoPlatformFramework() throws {
        let files = try sourceFiles()
        try XCTSkipIf(files.isEmpty, "sources not reachable from the test bundle")
        let banned = ["import UIKit", "import SwiftUI", "import Metal", "import MetalKit",
                      "import SpriteKit", "import SceneKit", "import AVFoundation",
                      "import CoreHaptics", "import GameController", "import QuartzCore"]
        for f in files {
            let src = try String(contentsOf: f, encoding: .utf8)
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
            let src = try String(contentsOf: f, encoding: .utf8)
            for b in banned {
                XCTAssertFalse(src.contains(b), "\(f.lastPathComponent) contains \(b) — determinism forbids it")
            }
        }
    }

    func testTechniqueDataIsShippedAsDataNotCode() throws {
        let url = Bundle.module.url(forResource: "angle-and-strike", withExtension: "json")
        XCTAssertNotNil(url, "fixtures must be bundled with the test target")
        try TechniqueDB.loadDefault()
        XCTAssertFalse(TechniqueDB.all.isEmpty, "technique data must load from the JSON resource")
    }
}
