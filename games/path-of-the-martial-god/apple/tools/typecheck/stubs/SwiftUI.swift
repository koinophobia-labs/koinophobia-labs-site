// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
//
// This one is the most speculative in the set, because SwiftUI is a DSL rather than a
// flat API: property wrappers, a result builder, and modifier chaining that all have to
// behave structurally before a single line of our app shell will type-check. It was
// excluded from the harness at first for exactly that reason.
//
// It is included now because the file it guards — MartialGodApp.swift — is the app's
// entry point and scene-phase wiring, which is the last thing you want discovering its
// first error on a Mac. `@Observable` is NOT stubbed: the Observation module is part of
// the open-source toolchain and works on Linux, so the real macro runs.
@_exported import Foundation
@_exported import Observation
import UIKit

// MARK: - the view/scene protocols

public protocol View {}
public protocol Scene {}

@resultBuilder
public struct ViewBuilder {
    public static func buildBlock<C: View>(_ c: C) -> C { c }
    public static func buildBlock() -> EmptyView { EmptyView() }
}

public struct EmptyView: View { public init() {} }

/// Modifiers return `Self` so a chain keeps type-checking. Real SwiftUI wraps each one
/// in a new generic type; the difference cannot matter to whether OUR calls are valid.
extension View {
    public func ignoresSafeArea() -> Self { self }
    public func statusBarHidden(_ hidden: Bool = true) -> Self { self }
    public func persistentSystemOverlays(_ v: Visibility) -> Self { self }
    public func onChange<V: Equatable>(of value: V,
                                       initial: Bool = false,
                                       _ action: @escaping (V, V) -> Void) -> Self { self }
}

public enum Visibility: Sendable { case automatic, visible, hidden }

// MARK: - app entry

public protocol App {
    associatedtype Body: Scene
    @SceneBuilder var body: Self.Body { get }
    init()
}
extension App {
    /// What `@main` resolves to.
    public static func main() { _ = Self().body }
}

@resultBuilder
public struct SceneBuilder {
    public static func buildBlock<S: Scene>(_ s: S) -> S { s }
}

public struct WindowGroup<Content: View>: Scene {
    public init(@ViewBuilder content: () -> Content) { _ = content() }
}

// MARK: - state and environment

@propertyWrapper
public struct State<Value> {
    private final class Box { var value: Value; init(_ v: Value) { value = v } }
    private let box: Box
    public init(wrappedValue: Value) { box = Box(wrappedValue) }
    public var wrappedValue: Value {
        get { box.value }
        nonmutating set { box.value = newValue }
    }
    public var projectedValue: Binding<Value> { Binding(get: { box.value }, set: { box.value = $0 }) }
}

public struct Binding<Value> {
    public let get: () -> Value
    public let set: (Value) -> Void
    public init(get: @escaping () -> Value, set: @escaping (Value) -> Void) {
        self.get = get; self.set = set
    }
    public var wrappedValue: Value { get { get() } nonmutating set { set(newValue) } }
}

public enum ScenePhase: Equatable, Sendable { case active, inactive, background }

public struct EnvironmentValues {
    public var scenePhase: ScenePhase = .active
    public init() {}
}

@propertyWrapper
public struct Environment<Value> {
    private let keyPath: KeyPath<EnvironmentValues, Value>
    public init(_ keyPath: KeyPath<EnvironmentValues, Value>) { self.keyPath = keyPath }
    public var wrappedValue: Value { EnvironmentValues()[keyPath: keyPath] }
}

// MARK: - the UIKit bridge

public protocol UIViewControllerRepresentable: View {
    associatedtype UIViewControllerType: UIViewController
    func makeUIViewController(context: Context) -> UIViewControllerType
    func updateUIViewController(_ uiViewController: UIViewControllerType, context: Context)
    typealias Context = UIViewControllerRepresentableContext<Self>
}

public struct UIViewControllerRepresentableContext<Representable> {
    public var coordinator: Void = ()
}
