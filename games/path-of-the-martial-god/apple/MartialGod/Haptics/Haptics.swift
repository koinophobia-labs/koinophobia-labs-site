import CoreHaptics
import UIKit
import MartialGodCore

/// Haptics used deliberately, not constantly.
///
/// Six events earn a tap, and they are the six that change what you should do next.
/// Everything else is silent, because a device that buzzes on every frame teaches
/// nothing. Intensity is scaled by the accessibility setting and can be zeroed.
/// Main-actor isolated: `scale` reads `SettingsStore`, and every call site is the
/// render loop. The two engine handlers below are the exception, and they are the
/// reason this annotation is worth having.
@MainActor
public final class Haptics {
    private var engine: CHHapticEngine?
    private var available: Bool { CHHapticEngine.capabilitiesForHardware().supportsHaptics }

    public init() { prepare() }

    private func prepare() {
        guard available else { return }
        engine = try? CHHapticEngine()
        // The system stops the engine on interruption; restart rather than go silent.
        //
        // These two fire on an ARBITRARY QUEUE — Apple documents the reset handler as
        // called on a background queue — and `restart()` touches `engine`, which is
        // main-actor state. Before this they reached straight into it from whatever
        // thread CoreHaptics happened to use: a data race that would never reproduce
        // on demand, because it needs an audio-session interruption to land in the
        // same instant as a frame. The hop is explicit now.
        // `weak self` is a var, and a var cannot cross into concurrently-executing code;
        // bound to a let first, which is also the only form that reads correctly — the
        // engine either still exists when the hop lands or the work is not worth doing.
        engine?.stoppedHandler = { [weak self] _ in
            guard let me = self else { return }
            Task { @MainActor in me.restart() }
        }
        engine?.resetHandler = { [weak self] in
            guard let me = self else { return }
            Task { @MainActor in me.restart() }
        }
        try? engine?.start()
    }

    private func restart() {
        try? engine?.start()
    }

    public func stop() { engine?.stop() }
    public func start() { try? engine?.start() }

    private var scale: Float { Float(SettingsStore.shared.settings.hapticIntensity) }

    private func transient(intensity: Float, sharpness: Float) {
        guard available, scale > 0, let engine else { return }
        let ev = CHHapticEvent(eventType: .hapticTransient, parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity * scale),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
        ], relativeTime: 0)
        if let pattern = try? CHHapticPattern(events: [ev], parameters: []),
           let player = try? engine.makePlayer(with: pattern) {
            try? player.start(atTime: 0)
        }
    }

    private func rumble(duration: TimeInterval, intensity: Float, sharpness: Float) {
        guard available, scale > 0, let engine else { return }
        let ev = CHHapticEvent(eventType: .hapticContinuous, parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity * scale),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
        ], relativeTime: 0, duration: duration)
        if let pattern = try? CHHapticPattern(events: [ev], parameters: []),
           let player = try? engine.makePlayer(with: pattern) {
            try? player.start(atTime: 0)
        }
    }

    /// Map the simulation's event stream to the six that mean something.
    public func handle(_ e: CombatEvent, playerIsSubject: Bool) {
        switch e.type {
        case .hit:
            // Clean contact. Sharper and stronger when it is you being hit.
            transient(intensity: playerIsSubject ? 0.9 : 0.55, sharpness: 0.7)
        case .guarded:
            transient(intensity: 0.35, sharpness: 0.3)
        case .deflected:
            // You met it. Short and bright: this is the good outcome.
            transient(intensity: 0.6, sharpness: 0.95)
        case .brokeStructure:
            // The floor going out from under someone.
            rumble(duration: 0.22, intensity: 0.85, sharpness: 0.15)
        case .inchOpen:
            // The moment the fight becomes a decision.
            rumble(duration: 0.35, intensity: 0.5, sharpness: 0.05)
        case .terminal:
            transient(intensity: 1.0, sharpness: 0.5)
        default:
            break
        }
    }
}
