// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that
import UIKit

public protocol View {}
public protocol App { init() }
public protocol Scene {}

public protocol UIViewControllerRepresentable {
    associatedtype UIViewControllerType: UIViewController
    func makeUIViewController(context: Context) -> UIViewControllerType
    func updateUIViewController(_ c: UIViewControllerType, context: Context)
    typealias Context = UIViewControllerRepresentableContext<Self>
}
public struct UIViewControllerRepresentableContext<R> {}

public struct WindowGroup<Content>: Scene {
    public init(@ViewBuilderShim content: () -> Content) {}
}

@resultBuilder
public struct ViewBuilderShim {
    public static func buildBlock<C>(_ c: C) -> C { c }
}
