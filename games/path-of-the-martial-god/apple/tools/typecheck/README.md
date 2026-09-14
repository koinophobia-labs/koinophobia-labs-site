# Type-check harness

**These stubs are not Apple's APIs, and they are not a claim about them.**

They are the minimum declarations needed to make `swiftc -typecheck` accept the eleven
presentation files on a machine with no iOS SDK. Their only job is to check *our* code
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

## Running it

```bash
./typecheck.sh
```

Uses a local Swift toolchain if present, the official image otherwise. Nothing here is
compiled into the app: the stubs live outside the target's `sources` path in
`project.yml`, and `PortContractTests` separately forbids the simulation from importing
any platform framework at all.
