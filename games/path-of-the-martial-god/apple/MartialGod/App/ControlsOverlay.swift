import UIKit

/// What a first-time player sees, and the only thing they are told.
///
/// The web prototype showed eight control names on first run and nothing else. That
/// restraint was deliberate and it is the whole measurement: the milestone's exit
/// condition is that a stranger can READ THE FIGHT, and anything explained here is
/// something the fight no longer has to communicate. So there is nothing about the
/// four-quadrant base, structure, frame windows, the opponent's model, the Final Inch,
/// breath thresholds, or what a good strategy would be.
///
/// It exists because the native controls are gestures rather than labelled keys. A
/// keyboard player can find J by looking at the keyboard; nobody can find "hold, then
/// pull back" by looking at a pane of glass. Naming the vocabulary is not the same as
/// explaining the game — the eight verbs were always public, and it is what they MEAN
/// in a given moment that the player has to work out.
public final class ControlsOverlay: UIView {

    /// Gesture, then verb. In the fighter's own terms, never the system's.
    private static let rows: [(zone: String, gesture: String, verb: String)] = [
        ("Left thumb",  "drag toward him",     "pressure"),
        ("",            "drag away",           "give ground"),
        ("",            "drag across",         "angle"),
        ("Right thumb", "tap",                 "strike"),
        ("",            "hold",                "commit"),
        ("",            "hold, then pull back", "feint"),
        ("",            "flick up",            "guard"),
        ("",            "flick toward him",    "deflect"),
        ("",            "flick away",          "slip"),
        ("",            "flick down",          "breathe"),
    ]

    private let title = UILabel()
    private let footer = UILabel()
    private var lines: [(UILabel, UILabel, UILabel)] = []
    private var onDismiss: (() -> Void)?

    public init(frame: CGRect, onDismiss: @escaping () -> Void) {
        self.onDismiss = onDismiss
        super.init(frame: frame)
        backgroundColor = UIColor(white: 0.04, alpha: 0.94)
        isMultipleTouchEnabled = false

        title.text = "Path of the Martial God"
        title.textColor = UIColor(white: 0.91, alpha: 1)
        title.textAlignment = .center
        addSubview(title)

        for row in Self.rows {
            let zone = UILabel(), gesture = UILabel(), verb = UILabel()
            zone.text = row.zone
            zone.textColor = UIColor(white: 0.54, alpha: 1)
            zone.textAlignment = .right
            gesture.text = row.gesture
            gesture.textColor = UIColor(white: 0.86, alpha: 1)
            gesture.textAlignment = .left
            verb.text = row.verb
            verb.textColor = UIColor(white: 0.58, alpha: 1)
            verb.textAlignment = .left
            addSubview(zone); addSubview(gesture); addSubview(verb)
            lines.append((zone, gesture, verb))
        }

        footer.text = "touch to begin"
        footer.textColor = UIColor(white: 0.46, alpha: 1)
        footer.textAlignment = .center
        addSubview(footer)
    }

    /// Created in code with a dismissal to run; never decoded from a nib. Required
    /// because UIView conforms to NSCoding, not because anything calls it.
    required init?(coder: NSCoder) {
        fatalError("ControlsOverlay is built in code, never loaded from a nib")
    }

    /// Laid out by hand rather than with constraints: it is one screen of static text,
    /// and a layout this simple does not need an engine behind it.
    public override func layoutSubviews() {
        super.layoutSubviews()
        let w = bounds.width, h = bounds.height
        // Safe areas matter here as much as in the fight — this is the one screen with
        // text near the edges, and a notch through "hold, then pull back" is the kind
        // of thing nobody notices until a device is in their hand.
        let inset = max(safeAreaInsets.left, safeAreaInsets.right) + w * 0.08
        let rowH = min(26, h * 0.062)
        let block = rowH * CGFloat(lines.count)
        let top = (h - block) / 2 + rowH * 0.4

        let size = min(17, max(12, rowH * 0.62))
        title.font = .systemFont(ofSize: min(26, max(18, w * 0.026)), weight: .semibold)
        footer.font = .monospacedSystemFont(ofSize: size * 0.85, weight: .regular)
        for line in lines {
            line.0.font = .monospacedSystemFont(ofSize: size * 0.85, weight: .regular)
            line.1.font = .systemFont(ofSize: size, weight: .regular)
            line.2.font = .monospacedSystemFont(ofSize: size * 0.9, weight: .regular)
        }

        title.frame = CGRect(x: inset, y: top - rowH * 2.4, width: w - inset * 2, height: rowH)
        let zoneW = (w - inset * 2) * 0.26
        let gestureW = (w - inset * 2) * 0.40
        for (i, line) in lines.enumerated() {
            let y = top + CGFloat(i) * rowH
            line.0.frame = CGRect(x: inset, y: y, width: zoneW, height: rowH)
            line.1.frame = CGRect(x: inset + zoneW + 14, y: y, width: gestureW, height: rowH)
            line.2.frame = CGRect(x: inset + zoneW + gestureW + 26, y: y,
                                  width: w - inset * 2 - zoneW - gestureW - 26, height: rowH)
        }
        footer.frame = CGRect(x: inset, y: top + block + rowH * 1.2,
                              width: w - inset * 2, height: rowH)
    }

    /// Any touch anywhere. There is no button to find and no wrong place to press.
    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        let done = onDismiss
        onDismiss = nil          // a second touch during the fade must not start twice
        removeFromSuperview()
        done?()
    }
}
