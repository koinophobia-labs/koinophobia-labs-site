# Type-check harness

**These stubs are not Apple's APIs, and they are not a claim about them.**

They are the minimum declarations needed to make `swiftc -typecheck` accept the
thirteen presentation files on a machine with no iOS SDK. Their only job is to check *our* code
against *itself*: our types, our optionality, our argument labels, our protocol
conformances, our control flow.

## What this catches

Everything wrong inside our own code — a misspelled property, a `String` passed where a
`Double` is wanted, a missing protocol member, a force-unwrap of a non-optional, an
unreachable branch, a call to a method we never wrote.

## What this CANNOT catch, ever

Whether the Apple API actually looks like the stub. If a stub says
`func makeBuffer(length: Int) -> MTLBuffer?` and the real signature differs, this
harness will happily pass code that Xcode rejects. A stub is only as good as the memory
that wrote it, and no amount of green here substitutes for one real build on a Mac.

**Treat a pass as "no internal contradictions found", never as "this compiles".**

### This has already happened once

`UIView` conforms to `NSCoding`, so `init?(coder:)` is a **required** initializer and
any subclass declaring a designated initializer of its own must supply it. The stub
`UIView` did not declare it, so the harness had nothing to enforce — and passed two
overlays that Xcode would have rejected outright:

```
error: 'required' initializer 'init(coder:)' must be provided by subclass of 'UIView'
```

A green run was reported on files that could not build. The stubs now declare the
initializer on `UIView`, `UIViewController` and `MTKView`, and the harness reproduces
that exact error when it is removed.

The lesson is not "the stubs are now correct". It is that **the failure mode of this
harness is a false pass**, it is silent, and the only thing that finds it is reading a
stub against Apple's actual documentation. When adding a stub, prefer declaring *more*
of the real shape than the code currently needs — required initializers, non-optional
returns, `@MainActor` isolation — because every simplification is a question the
harness stops asking.

## Coverage

All thirteen presentation files, including `MartialGodApp.swift`. That file was excluded
at first because SwiftUI is a DSL rather than a flat API — property wrappers, a result
builder and modifier chaining all have to behave structurally before one line of the app
shell type-checks. It is covered now, because the app's entry point and scene-phase
wiring is the last place you want finding its first error on a Mac.

`@Observable` is **not** stubbed: the Observation module ships with the open-source
toolchain and works on Linux, so the real macro runs.

## What the stubs now model beyond bare shape

Two obligations that a "minimum declarations" stub would leave out, both added because
leaving them out produced a green run on code Xcode rejects:

- **Required initializers.** `UIView`, `UIViewController` and `MTKView` declare
  `required init?(coder:)`, so a subclass with a designated initializer of its own must
  supply one.
- **Main-actor isolation.** `UIResponder` and everything under it, `UIGestureRecognizer`,
  `UITouch`, `UIEvent`, `UIAccessibility.isReduceMotionEnabled`, and SwiftUI's `View`,
  `Scene`, `App`, the two result builders and `UIViewControllerRepresentable`. The app
  target builds in Swift 5.9 mode, where touching main-actor state from a nonisolated
  synchronous context is an error. Modelling this found seven files that would not have
  compiled, one of them a real off-main data race.

`CHHapticEngine`'s `stoppedHandler` and `resetHandler` are typed `@Sendable` for the
same reason: they fire on an arbitrary queue, and a stub that hides that hides a race.

## The one remaining blind spot

`#selector`. Linux Swift has no Objective-C runtime, so the harness rewrites
`#selector(foo)` into `Selector("foo")` in a throwaway copy of the sources. The
shipping files are never touched, and the target/action pairing goes unchecked —
a selector naming a method that does not exist will pass here and crash there.

## Running it

```bash
./typecheck.sh
```

Uses a local Swift toolchain if present, the official image otherwise. Nothing here is
compiled into the app: the stubs live outside the target's `sources` path in
`project.yml`, and `PortContractTests` separately forbids the simulation from importing
any platform framework at all.
