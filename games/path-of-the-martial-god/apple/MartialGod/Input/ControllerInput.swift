import GameController
import MartialGodCore

/// External controller support via Apple's GameController framework.
///
/// Controllers are supported because the design is controller-first in spirit, but
/// they are explicitly NOT a substitute for a credible touch experience: the touch
/// grammar is the primary scheme and ships whether or not a controller is present.
public final class ControllerInput {
    public private(set) var isConnected = false
    private var pad: GCExtendedGamepad? { GCController.current?.extendedGamepad }

    /// Rising-edge tracking, so holding a button does not machine-gun techniques.
    private var wasPressed: [String: Bool] = [:]

    public init() {
        NotificationCenter.default.addObserver(
            forName: .GCControllerDidConnect, object: nil, queue: .main) { [weak self] _ in
                self?.isConnected = true
            }
        NotificationCenter.default.addObserver(
            forName: .GCControllerDidDisconnect, object: nil, queue: .main) { [weak self] _ in
                self?.isConnected = GCController.controllers().isEmpty == false
            }
        isConnected = !GCController.controllers().isEmpty
    }

    private func edge(_ key: String, _ pressed: Bool) -> Bool {
        let was = wasPressed[key] ?? false
        wasPressed[key] = pressed
        return pressed && !was
    }

    /// Returns nil when no controller is attached, so the caller falls back to touch.
    public func sample(opponentBearing: Double, fighterFacing: Double) -> InputIntent? {
        guard let p = pad else { return nil }

        // The stick is already in the fighter's own frame: up is toward the opponent
        // because the duel camera keeps the axis stable.
        let forward = Double(p.leftThumbstick.yAxis.value)
        let lateral = Double(-p.leftThumbstick.xAxis.value)

        var verb: Verb?
        if edge("strike", p.buttonX.isPressed) { verb = .strike }
        else if edge("commit", p.buttonY.isPressed) { verb = .commit }
        else if edge("evade", p.buttonB.isPressed) { verb = .evade }
        else if edge("deflect", p.rightShoulder.isPressed) { verb = .deflect }
        else if edge("focus", p.buttonA.isPressed) { verb = .focus }

        let guardHeld = p.leftShoulder.isPressed || p.leftTrigger.value > 0.4
        // Held tracks the ACTUAL button, which is what makes release-before-commitment
        // produce a feint on a controller exactly as the pull-back gesture does on glass.
        let held = p.buttonX.isPressed || p.buttonY.isPressed || p.buttonB.isPressed
            || p.rightShoulder.isPressed || p.buttonA.isPressed || verb != nil

        return InputIntent(forward: forward, lateral: lateral, verb: verb,
                           held: held, guardHeld: guardHeld)
    }
}
