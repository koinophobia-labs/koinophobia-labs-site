// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that

// Declared as extension members on NSNotification.Name, which is what lets a call site
// write `.GCControllerDidConnect`. The first version of this stub used top-level lets
// and wrongly reported the call sites as broken.
extension NSNotification.Name {
    public static let GCControllerDidConnect = NSNotification.Name("GCControllerDidConnect")
    public static let GCControllerDidDisconnect = NSNotification.Name("GCControllerDidDisconnect")
}

public final class GCControllerButtonInput {
    public var isPressed: Bool = false
    public var value: Float = 0
}
public final class GCControllerDirectionPad {
    public var xAxis = GCControllerAxisInput()
    public var yAxis = GCControllerAxisInput()
}
public final class GCControllerAxisInput {
    public var value: Float = 0
}
public final class GCExtendedGamepad {
    public var leftThumbstick = GCControllerDirectionPad()
    public var rightThumbstick = GCControllerDirectionPad()
    public var buttonA = GCControllerButtonInput()
    public var buttonB = GCControllerButtonInput()
    public var buttonX = GCControllerButtonInput()
    public var buttonY = GCControllerButtonInput()
    public var leftShoulder = GCControllerButtonInput()
    public var rightShoulder = GCControllerButtonInput()
    public var leftTrigger = GCControllerButtonInput()
    public var rightTrigger = GCControllerButtonInput()
    public var dpad = GCControllerDirectionPad()
}
public final class GCController {
    /// A class METHOD on Apple, not a property.
    public static func controllers() -> [GCController] { [] }
    /// The most recently used controller (iOS 14+).
    public static var current: GCController? { nil }
    public var extendedGamepad: GCExtendedGamepad? { nil }
}
