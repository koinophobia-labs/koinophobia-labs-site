// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that

public final class CHHapticEventParameter {
    public init(parameterID: ID, value: Float) {}
    public struct ID: RawRepresentable, Sendable {
        public let rawValue: String
        public init(rawValue: String) { self.rawValue = rawValue }
        public static let hapticIntensity = ID(rawValue: "HapticIntensity")
        public static let hapticSharpness = ID(rawValue: "HapticSharpness")
    }
}

public final class CHHapticEvent {
    public struct EventType: RawRepresentable, Sendable {
        public let rawValue: String
        public init(rawValue: String) { self.rawValue = rawValue }
        public static let hapticTransient = EventType(rawValue: "HapticTransient")
        public static let hapticContinuous = EventType(rawValue: "HapticContinuous")
    }
    public init(eventType: EventType, parameters: [CHHapticEventParameter], relativeTime: TimeInterval) {}
    public init(eventType: EventType, parameters: [CHHapticEventParameter],
                relativeTime: TimeInterval, duration: TimeInterval) {}
}

public final class CHHapticPattern {
    public init(events: [CHHapticEvent], parameters: [CHHapticEventParameter]) throws {}
}

public protocol CHHapticPatternPlayer: AnyObject {
    func start(atTime: TimeInterval) throws
    func stop(atTime: TimeInterval) throws
}

public final class CHHapticEngine {
    // A class METHOD on Apple, not a property — the call site was right and this
    // stub was wrong the first time round.
    public static func capabilitiesForHardware() -> CHHapticDeviceCapability { CHHapticDeviceCapability() }
    public var resetHandler: (() -> Void)?
    public var stoppedHandler: ((StoppedReason) -> Void)?
    public var playsHapticsOnly = false
    public enum StoppedReason: Int { case audioSessionInterrupt, applicationSuspended, idleTimeout, systemError, notifyWhenFinished, engineDestroyed, gameControllerDisconnect }
    public init() throws {}
    public func start() throws {}
    public func stop(completionHandler: ((Error?) -> Void)? = nil) {}
    public func makePlayer(with pattern: CHHapticPattern) throws -> CHHapticPatternPlayer {
        fatalError("stub")
    }
}

public struct CHHapticDeviceCapability {
    public var supportsHaptics: Bool { false }
}

public let CHHapticTimeImmediate: TimeInterval = 0
