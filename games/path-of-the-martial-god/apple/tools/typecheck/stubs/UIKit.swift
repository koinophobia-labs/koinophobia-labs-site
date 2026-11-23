// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that
@_exported import QuartzCore   // UIKit's umbrella pulls in CoreAnimation on iOS

// CGFloat, CGPoint, CGSize and CGRect are NOT stubbed: swift-corelibs-foundation
// already provides them on Linux, and the real declarations are more faithful than
// anything written here. Only CGVector is missing, so only CGVector is declared.
public struct CGVector: Sendable {
    public var dx: CGFloat; public var dy: CGFloat
    public init(dx: CGFloat = 0, dy: CGFloat = 0) { self.dx = dx; self.dy = dy }
}

public struct UIRectEdge: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let top = UIRectEdge(rawValue: 1)
    public static let bottom = UIRectEdge(rawValue: 2)
    public static let left = UIRectEdge(rawValue: 4)
    public static let right = UIRectEdge(rawValue: 8)
    public static let all = UIRectEdge(rawValue: 15)
}

public struct UIInterfaceOrientationMask: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let portrait = UIInterfaceOrientationMask(rawValue: 1)
    public static let landscape = UIInterfaceOrientationMask(rawValue: 2)
    public static let all = UIInterfaceOrientationMask(rawValue: 3)
}

public struct UIViewAutoresizing: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let flexibleWidth = UIViewAutoresizing(rawValue: 1)
    public static let flexibleHeight = UIViewAutoresizing(rawValue: 2)
}

public struct UIEdgeInsets: Sendable {
    public var top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat
    public init(top: CGFloat = 0, left: CGFloat = 0, bottom: CGFloat = 0, right: CGFloat = 0) {
        self.top = top; self.left = left; self.bottom = bottom; self.right = right
    }
    public static let zero = UIEdgeInsets()
}

open class UIColor {
    public init(white: CGFloat, alpha: CGFloat) {}
    public static let white = UIColor()
    public static let black = UIColor()
    public static let clear = UIColor()
    public init() {}
}

public enum NSTextAlignment { case left, center, right }

/// Linux Swift has no Objective-C runtime, so `Selector` and `#selector` do not exist.
/// The harness rewrites `#selector(foo)` into `Selector("foo")` in a throwaway copy of
/// the sources; the shipping files are never touched. Consequence, stated plainly: the
/// selector expression itself is NOT type-checked, so a target/action mismatch is one
/// of the things this harness cannot see.
public struct Selector: Sendable { public init(_ name: String) {} }

@MainActor open class UIResponder { public init() {} }

open class UIView: UIResponder {
    public var bounds = CGRect()
    public var frame = CGRect()
    public var backgroundColor: UIColor?
    public var autoresizingMask: UIViewAutoresizing = []
    public var isMultipleTouchEnabled = false
    public var safeAreaInsets = UIEdgeInsets.zero
    public var alpha: CGFloat = 1
    public var isHidden = false
    public var isUserInteractionEnabled = true
    open func addSubview(_ v: UIView) {}
    open func removeFromSuperview() {}
    open func layoutSubviews() {}
    open func addGestureRecognizer(_ g: UIGestureRecognizer) {}
    open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {}
    public override init() { super.init() }
    public init(frame: CGRect) { super.init(); self.frame = frame }

    /// UIView conforms to NSCoding, so this initializer is REQUIRED, and a subclass
    /// that declares a designated initializer of its own must supply it or the Mac
    /// build fails outright:
    ///
    ///     error: 'required' initializer 'init(coder:)' must be provided by
    ///            subclass of 'UIView'
    ///
    /// It is stubbed as `required` for exactly that reason. Nothing in this game is
    /// ever decoded from a nib, so the initializer is dead weight at runtime — but a
    /// stub that leaves it out passes files Xcode will not build, which is the single
    /// failure mode this whole harness exists to prevent.
    public required init?(coder: NSCoder) { super.init() }
}

open class UILabel: UIView {
    public var numberOfLines: Int = 1
    public var text: String?
    public var textColor: UIColor?
    public var textAlignment: NSTextAlignment = .left
    public var font: UIFont!
    public var adjustsFontSizeToFitWidth = false
    public var minimumScaleFactor: CGFloat = 0
}

open class UIFont {
    public struct Weight: Sendable {
        public let rawValue: CGFloat
        public init(rawValue: CGFloat) { self.rawValue = rawValue }
        public static let regular = Weight(rawValue: 0)
        public static let medium = Weight(rawValue: 0.23)
        public static let semibold = Weight(rawValue: 0.3)
        public static let bold = Weight(rawValue: 0.4)
    }
    public static func systemFont(ofSize s: CGFloat) -> UIFont { UIFont() }
    public static func systemFont(ofSize s: CGFloat, weight: Weight) -> UIFont { UIFont() }
    public static func monospacedSystemFont(ofSize s: CGFloat, weight: Weight) -> UIFont { UIFont() }
    public init() {}
}

@MainActor open class UIGestureRecognizer {
    public var cancelsTouchesInView = true
    public var delaysTouchesBegan = false
    public var delaysTouchesEnded = true
    public init(target: Any?, action: Selector?) {}
}
open class UITapGestureRecognizer: UIGestureRecognizer {
    public var numberOfTouchesRequired: Int = 1
    public var numberOfTapsRequired: Int = 1
}

@MainActor open class UITouch: Hashable {
    public var timestamp: TimeInterval = 0
    public var view: UIView? { nil }
    open func location(in view: UIView?) -> CGPoint { CGPoint() }
    public static func == (a: UITouch, b: UITouch) -> Bool { a === b }
    public func hash(into h: inout Hasher) { h.combine(ObjectIdentifier(self)) }
    public init() {}
}

@MainActor open class UIEvent { public init() {} }

open class UIViewController: UIResponder {
    public var view: UIView = UIView()
    public override init() { super.init() }
    /// Required for the same reason as UIView's — see the note there.
    public required init?(coder: NSCoder) { super.init() }
    open func viewDidLoad() {}
    open var supportedInterfaceOrientations: UIInterfaceOrientationMask { .all }
    open var prefersHomeIndicatorAutoHidden: Bool { false }
    open var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { [] }
    open var prefersStatusBarHidden: Bool { false }
    open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {}
    open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {}
}

public enum UIAccessibility {
    /// Main-actor in the real SDK. The notification NAME is not — it is plain data —
    /// so only the query is isolated here.
    @MainActor public static var isReduceMotionEnabled: Bool { false }
    public static let reduceMotionStatusDidChangeNotification =
        Notification.Name("UIAccessibilityReduceMotionStatusDidChangeNotification")
}
