// swift-tools-version: 5.9
import PackageDescription

/// The deterministic combat simulation, ported from the validated JavaScript oracle.
///
/// This package has NO platform dependency by design: no UIKit, no Metal, no SwiftUI,
/// no timers, no I/O, no randomness. It is the same port contract the reference
/// implementation has always been held to, and `PortContractTests` enforces it.
let package = Package(
    name: "MartialGodCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MartialGodCore", targets: ["MartialGodCore"]),
        .executable(name: "TraceDump", targets: ["TraceDump"]),
    ],
    targets: [
        .target(
            name: "MartialGodCore",
            resources: [.process("Resources")]
        ),
        .executableTarget(
            name: "TraceDump",
            dependencies: ["MartialGodCore"]
        ),
        .testTarget(
            name: "MartialGodCoreTests",
            dependencies: ["MartialGodCore"],
            resources: [.process("Fixtures")]
        ),
    ]
)
