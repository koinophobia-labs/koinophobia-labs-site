import UIKit
import MartialGodCore

/// The touch control grammar.
///
/// The design principle is unchanged from the controller: THE INPUTS NEVER CHANGE;
/// THE MEANING OF THE INPUTS CHANGES. So this is not nine buttons on glass. It is two
/// thumbs and one idea each:
///
///   LEFT THUMB  — intent. A free-placement pad. Where you drag is what you want:
///                 toward him is pressure, away is retreat, across is angle. It is
///                 continuous and analogue, exactly like the stick it replaces.
///
///   RIGHT THUMB — the hands. One zone, six meanings, separated by GESTURE rather
///                 than by real estate:
///
///     tap                        strike      a quick hand
///     hold                       commit      you are throwing something heavy
///     hold, then pull back       feint       you threw it and took it back
///     flick up (and hold)        guard       hands up
///     flick toward him           deflect     meet it
///     flick away or across       slip        and the direction you flick IS the
///                                            direction you slip
///     flick down                 breathe     settle
///
/// Two of those mappings are not arbitrary, which is the point:
///
///   * FEINT is release-before-commitment in the simulation, so "throw it and pull it
///     back" is the same act expressed as a gesture rather than a button.
///   * SLIP's i-frames are conditional on direction, so the flick direction feeding
///     the slip direction means the gesture carries the mechanic instead of naming it.
public final class TouchGrammar {

    public struct Tuning {
        /// How far a finger must travel before a press is read as a flick.
        public var flickDistance: CGFloat = 22
        /// How long a press may last and still count as a tap.
        public var tapDuration: TimeInterval = 0.18
        /// How far back a committed hand must be pulled to register a feint.
        public var pullBackDistance: CGFloat = 26
        /// Dead zone on the intent pad, as a fraction of its radius.
        public var intentDeadZone: CGFloat = 0.14
        /// Radius of the intent pad in points; full deflection at this distance.
        public var intentRadius: CGFloat = 76
        /// Multiplies every distance threshold. Accessibility: coarse motor control.
        public var sensitivity: CGFloat = 1.0
        /// Mirrors the two zones for left-handed play.
        public var leftHanded = false
        public init() {}
    }

    public var tuning = Tuning()

    private struct ActiveTouch {
        let start: CGPoint
        let began: TimeInterval
        var current: CGPoint
        var resolved: Bool
        var verbIssued: Verb?
        var pulledBack: Bool
    }

    private var intentTouch: UITouch?
    private var intentOrigin: CGPoint = .zero
    private var actionTouch: UITouch?
    private var action: ActiveTouch?

    /// Set each frame by the renderer: where the opponent is on screen, so "toward
    /// him" is a real direction rather than an assumption about which way he stands.
    public var opponentScreenDirection: CGVector = CGVector(dx: 1, dy: 0)

    private var pendingVerb: Verb?
    private var pendingForward: Double = 0
    private var pendingLateral: Double = 0
    private var guardLatched = false

    public init() {}

    // MARK: - zones

    /// The action zone is the trailing half; intent is the leading half. Both are
    /// inset from the screen edges so they never fight the system's edge gestures.
    private func isActionZone(_ p: CGPoint, in bounds: CGRect) -> Bool {
        let trailing = p.x > bounds.midX
        return tuning.leftHanded ? !trailing : trailing
    }

    // MARK: - touch lifecycle

    public func touchesBegan(_ touches: Set<UITouch>, in view: UIView) {
        for t in touches {
            let p = t.location(in: view)
            if isActionZone(p, in: view.bounds) {
                guard actionTouch == nil else { continue }
                actionTouch = t
                action = ActiveTouch(start: p, began: t.timestamp, current: p,
                                     resolved: false, verbIssued: nil, pulledBack: false)
            } else {
                guard intentTouch == nil else { continue }
                intentTouch = t
                intentOrigin = p   // free placement: the pad appears under the thumb
            }
        }
    }

    public func touchesMoved(_ touches: Set<UITouch>, in view: UIView) {
        for t in touches {
            let p = t.location(in: view)
            if t == intentTouch { continue } // intent is sampled continuously, below
            guard t == actionTouch, var a = action else { continue }
            a.current = p

            if !a.resolved {
                let dx = p.x - a.start.x, dy = p.y - a.start.y
                let travelled = hypot(dx, dy)
                if travelled >= tuning.flickDistance * tuning.sensitivity {
                    resolveFlick(dx: dx, dy: dy, into: &a)
                }
            } else if a.verbIssued == .commit && !a.pulledBack {
                // Throw it and take it back. The simulation turns this into the Lie
                // by seeing `held` go false before the commitment frame.
                let dx = p.x - a.start.x, dy = p.y - a.start.y
                let away = -(dx * opponentScreenDirection.dx + dy * opponentScreenDirection.dy)
                if away >= tuning.pullBackDistance * tuning.sensitivity {
                    a.pulledBack = true
                }
            }
            action = a
        }
    }

    public func touchesEnded(_ touches: Set<UITouch>, in view: UIView) {
        for t in touches {
            if t == intentTouch {
                intentTouch = nil
                pendingForward = 0
                pendingLateral = 0
            }
            if t == actionTouch, var a = action {
                if !a.resolved {
                    // No travel and released quickly: a tap. A quick hand.
                    let held = t.timestamp - a.began
                    if held <= tuning.tapDuration {
                        pendingVerb = .strike
                        a.verbIssued = .strike
                    } else {
                        pendingVerb = .commit
                        a.verbIssued = .commit
                    }
                    a.resolved = true
                }
                guardLatched = false
                actionTouch = nil
                action = nil
            }
        }
    }

    public func touchesCancelled(_ touches: Set<UITouch>, in view: UIView) {
        touchesEnded(touches, in: view)
    }

    /// Drop every piece of in-flight touch state.
    ///
    /// A restart replaces the fight under whatever fingers are on the glass. Without
    /// this, a latched guard or a half-resolved flick from the fight that just ended
    /// carries into the first frames of the next one, and the new fight opens with an
    /// input the player never made.
    public func reset() {
        intentTouch = nil
        intentOrigin = .zero
        actionTouch = nil
        action = nil
        pendingVerb = nil
        pendingForward = 0
        pendingLateral = 0
        guardLatched = false
    }

    private func resolveFlick(dx: CGFloat, dy: CGFloat, into a: inout ActiveTouch) {
        a.resolved = true
        // Screen coordinates: -y is up.
        let towardHim = dx * opponentScreenDirection.dx + dy * opponentScreenDirection.dy
        let vertical = -dy

        if vertical > abs(dx) {
            pendingVerb = .guardVerb          // hands up
            a.verbIssued = .guardVerb
            guardLatched = true
        } else if -vertical > abs(dx) {
            pendingVerb = .focus              // settle and breathe
            a.verbIssued = .focus
        } else if towardHim > 0 {
            pendingVerb = .deflect            // meet it
            a.verbIssued = .deflect
        } else {
            pendingVerb = .evade              // and the flick direction is the slip
            a.verbIssued = .evade
            let mag = max(1, hypot(dx, dy))
            let nx = dx / mag, ny = dy / mag
            // Project the flick onto the duel axis so "away" and "across" mean what
            // they mean in the simulation rather than what they mean on glass.
            pendingForward = Double(nx * opponentScreenDirection.dx + ny * opponentScreenDirection.dy)
            pendingLateral = Double(nx * -opponentScreenDirection.dy + ny * opponentScreenDirection.dx)
        }
    }

    // MARK: - per-tick sampling

    /// Build the InputIntent for one simulation tick. Called at the fixed rate, not
    /// per touch event, so input is sampled rather than event-driven — the
    /// simulation's timing truth is never at the mercy of UIKit delivery.
    public func sample(in view: UIView) -> InputIntent {
        var forward = 0.0, lateral = 0.0

        if let t = intentTouch {
            let p = t.location(in: view)
            let dx = p.x - intentOrigin.x
            let dy = p.y - intentOrigin.y
            let r = tuning.intentRadius * tuning.sensitivity
            var nx = dx / r, ny = dy / r
            let mag = hypot(nx, ny)
            if mag < tuning.intentDeadZone {
                nx = 0; ny = 0
            } else if mag > 1 {
                nx /= mag; ny /= mag
            }
            // Screen vector -> duel-axis intent.
            forward = Double(nx * opponentScreenDirection.dx + ny * opponentScreenDirection.dy)
            lateral = Double(nx * -opponentScreenDirection.dy + ny * opponentScreenDirection.dx)
        }

        // A slip's own direction overrides the pad for the tick it is issued.
        if pendingVerb == .evade {
            forward = pendingForward
            lateral = pendingLateral
        }

        let verb = pendingVerb
        pendingVerb = nil

        // `held` is simply whether the hand is still out there. Letting go before the
        // commitment frame is what the simulation reads as a feint, so the pull-back
        // gesture reports the hand as no longer committed.
        let stillHeld: Bool = {
            guard let a = action else { return false }
            if a.pulledBack { return false }
            return true
        }()

        return InputIntent(forward: forward, lateral: lateral, verb: verb,
                           held: stillHeld || verb != nil,
                           guardHeld: guardLatched && actionTouch != nil)
    }

    /// Where the intent pad currently is, for drawing it. Nil when no thumb is down.
    public var intentPad: (origin: CGPoint, current: CGPoint)? {
        guard let t = intentTouch else { return nil }
        return (intentOrigin, t.location(in: t.view ?? UIView()))
    }
}
