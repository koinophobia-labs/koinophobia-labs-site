import UIKit
import MartialGodCore

/// What the game says when a fight ends, which is almost nothing.
///
/// One sentence naming what happened, and — only once the tap will actually work — one
/// line saying you can go again. No score, no rating, no breakdown of the exchange. The
/// milestone's claim is that the fight was legible while it was happening; a post-match
/// report card would be an admission that it was not.
///
/// It does not take touches. Tap-to-restart lives on the view controller, and an
/// overlay that swallowed the tap would make the player press twice for no reason.
public final class OutcomeOverlay: UIView {

    /// How long the body is left alone before any text appears, and how long the text
    /// takes to arrive. The last frame of a fight is the one the whole milestone is
    /// about — a sentence that materialises over it instantly is a sentence that
    /// arrived before the player finished looking.
    private static let holdSeconds: CFTimeInterval = 0.35
    private static let fadeSeconds: CFTimeInterval = 0.50

    private let headline = UILabel()
    private let hint = UILabel()

    public init(frame: CGRect, outcome: Outcome) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        backgroundColor = .clear
        alpha = 0                     // raised by tick(), never by an animation curve

        headline.text = Self.sentence(for: outcome)
        headline.textColor = UIColor(white: 0.93, alpha: 1)
        headline.textAlignment = .center
        headline.numberOfLines = 1
        // The longest sentence is "You held the finish and did not take it." — it fits
        // a phone in landscape, but only just, and it must never wrap or clip.
        headline.adjustsFontSizeToFitWidth = true
        headline.minimumScaleFactor = 0.7
        addSubview(headline)

        hint.text = "touch to fight again"
        hint.textColor = UIColor(white: 0.44, alpha: 1)
        hint.textAlignment = .center
        hint.isHidden = true          // shown when the tap becomes live
        addSubview(hint)
    }

    /// Created in code with an outcome to name; never decoded from a nib. Required
    /// because UIView conforms to NSCoding, not because anything calls it.
    required init?(coder: NSCoder) {
        fatalError("OutcomeOverlay is built in code, never loaded from a nib")
    }

    /// The sentence, and which fighter it is about.
    ///
    /// The choice of SUBJECT is not made here — `Outcome.Reason.subject` makes it, in
    /// the simulation, because who an ending is about is a fact about the ending. This
    /// function only supplies English for it. The reference build conflates the two and
    /// gets it wrong (see the note on `Outcome.Subject`); keeping them apart is what
    /// stops the same bug being retyped into a third implementation.
    static func sentence(for o: Outcome) -> String {
        let playerWon = o.winnerID == "player"
        guard let reason = o.knownReason else {
            // An ending this build has no words for. Say only what is certainly true.
            return playerWon ? "You won." : "He won."
        }
        let you = reason.subject == .winner ? playerWon : !playerWon
        let who = you ? "You" : "He"
        switch reason {
        case .finished:
            return "\(who) finished it."
        case .stopped:
            // The one outcome the whole design is pointed at, and it gets said plainly
            // rather than congratulated.
            return "\(who) held the finish and did not take it."
        case .unconscious:
            return "\(who) could not continue."
        case .yielded:
            return "\(who) stopped."
        }
    }

    /// Driven from the render loop rather than `UIView.animate`.
    ///
    /// The caller already knows exactly how long the fight has been over, so a ramp
    /// computed from that clock keeps the text's arrival locked to the same time base
    /// as the camera and the Inch — including when the app is backgrounded mid-fade,
    /// where a detached animation would finish invisibly and a clock would not.
    ///
    /// - Parameters:
    ///   - t: seconds since the fight ended.
    ///   - restartLive: whether a tap would actually start another fight yet. The hint
    ///     appears only when true, so the game never invites a touch it will ignore.
    public func tick(secondsSinceEnd t: CFTimeInterval, restartLive: Bool) {
        let f = (t - Self.holdSeconds) / Self.fadeSeconds
        alpha = CGFloat(min(1, max(0, f)))
        hint.isHidden = !restartLive
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let w = bounds.width, h = bounds.height
        let inset = max(safeAreaInsets.left, safeAreaInsets.right) + w * 0.06
        let size = min(30, max(19, w * 0.034))
        headline.font = .systemFont(ofSize: size, weight: .semibold)
        hint.font = .monospacedSystemFont(ofSize: max(10, size * 0.42), weight: .regular)

        let lineH = ceil(size * 1.35)
        let hintH = ceil(size * 0.42 * 1.7)
        // Anchored up from the bottom safe area rather than down from the top: the
        // fighters stand on the lower third of the frame, and a home indicator through
        // "touch to fight again" is the sort of thing only a device shows you.
        let baseline = h - safeAreaInsets.bottom - h * 0.09
        hint.frame = CGRect(x: inset, y: baseline - hintH, width: w - inset * 2, height: hintH)
        headline.frame = CGRect(x: inset, y: hint.frame.minY - lineH - 8,
                                width: w - inset * 2, height: lineH)
    }
}
