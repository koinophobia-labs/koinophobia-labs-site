// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that

public typealias CFTimeInterval = Double
public func CACurrentMediaTime() -> CFTimeInterval { 0 }
