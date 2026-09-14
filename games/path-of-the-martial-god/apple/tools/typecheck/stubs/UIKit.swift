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

open class UIColor {
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

open class UIResponder { public init() {} }

open class UIView: UIResponder {
    public var bounds = CGRect()
    public var frame = CGRect()
    public var backgroundColor: UIColor?
    public var autoresizingMask: UIViewAutoresizing = []
    public var isMultipleTouchEnabled = false
    open func addSubview(_ v: UIView) {}
    open func addGestureRecognizer(_ g: UIGestureRecognizer) {}
    public override init() { super.init() }
    public init(frame: CGRect) { super.init(); self.frame = frame }
}

open class UILabel: UIView {
    public var text: String?
    public var textColor: UIColor?
    public var textAlignment: NSTextAlignment = .left
}

open class UIGestureRecognizer {
    public var cancelsTouchesInView = true
    public var delaysTouchesBegan = false
    public var delaysTouchesEnded = true
    public init(target: Any?, action: Selector?) {}
}
open class UITapGestureRecognizer: UIGestureRecognizer {
    public var numberOfTouchesRequired: Int = 1
    public var numberOfTapsRequired: Int = 1
}

open class UITouch: Hashable {
    public var timestamp: TimeInterval = 0
    public var view: UIView? { nil }
    open func location(in view: UIView?) -> CGPoint { CGPoint() }
    public static func == (a: UITouch, b: UITouch) -> Bool { a === b }
    public func hash(into h: inout Hasher) { h.combine(ObjectIdentifier(self)) }
    public init() {}
}

open class UIEvent { public init() {} }

open class UIViewController: UIResponder {
    public var view: UIView = UIView()
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
    public static var isReduceMotionEnabled: Bool { false }
    public static let reduceMotionStatusDidChangeNotification =
        Notification.Name("UIAccessibilityReduceMotionStatusDidChangeNotification")
}
