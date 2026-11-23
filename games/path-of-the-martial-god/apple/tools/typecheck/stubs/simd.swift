// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
//
// SIMD2/SIMD3/SIMD4 are NOT declared here: they are Swift standard library types and
// exist on Linux already. Only Apple's `simd` module additions are stubbed, and the
// matrix is given real arithmetic rather than a fatalError so that any dimensional
// mistake in our own camera code still shows up as a type error.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that

public struct simd_float4x4: Equatable, Sendable {
    public var columns: (SIMD4<Float>, SIMD4<Float>, SIMD4<Float>, SIMD4<Float>)

    public init() {
        columns = (SIMD4<Float>(1, 0, 0, 0), SIMD4<Float>(0, 1, 0, 0),
                   SIMD4<Float>(0, 0, 1, 0), SIMD4<Float>(0, 0, 0, 1))
    }
    public init(_ c0: SIMD4<Float>, _ c1: SIMD4<Float>, _ c2: SIMD4<Float>, _ c3: SIMD4<Float>) {
        columns = (c0, c1, c2, c3)
    }
    public init(columns: (SIMD4<Float>, SIMD4<Float>, SIMD4<Float>, SIMD4<Float>)) {
        self.columns = columns
    }
    public init(diagonal: SIMD4<Float>) {
        columns = (SIMD4<Float>(diagonal.x, 0, 0, 0), SIMD4<Float>(0, diagonal.y, 0, 0),
                   SIMD4<Float>(0, 0, diagonal.z, 0), SIMD4<Float>(0, 0, 0, diagonal.w))
    }

    /// Column access, matching Apple's `m[col][row]` convention.
    public subscript(column: Int) -> SIMD4<Float> {
        get {
            switch column {
            case 0: return columns.0
            case 1: return columns.1
            case 2: return columns.2
            default: return columns.3
            }
        }
        set {
            switch column {
            case 0: columns.0 = newValue
            case 1: columns.1 = newValue
            case 2: columns.2 = newValue
            default: columns.3 = newValue
            }
        }
    }

    public static func == (a: simd_float4x4, b: simd_float4x4) -> Bool {
        a.columns.0 == b.columns.0 && a.columns.1 == b.columns.1
            && a.columns.2 == b.columns.2 && a.columns.3 == b.columns.3
    }

    public static func * (m: simd_float4x4, v: SIMD4<Float>) -> SIMD4<Float> {
        m.columns.0 * v.x + m.columns.1 * v.y + m.columns.2 * v.z + m.columns.3 * v.w
    }

    public static func * (a: simd_float4x4, b: simd_float4x4) -> simd_float4x4 {
        simd_float4x4(a * b.columns.0, a * b.columns.1, a * b.columns.2, a * b.columns.3)
    }
}

public typealias float4x4 = simd_float4x4

// Generic across SIMD2/3/4, as the real module is. The first version of this stub
// declared SIMD3-only and wrongly reported a correct SIMD2 call site as a type error.
public func simd_dot<V: SIMD>(_ a: V, _ b: V) -> Float where V.Scalar == Float {
    var sum: Float = 0
    for i in a.indices { sum += a[i] * b[i] }
    return sum
}
public func simd_length<V: SIMD>(_ v: V) -> Float where V.Scalar == Float {
    simd_dot(v, v).squareRoot()
}
public func simd_normalize<V: SIMD>(_ v: V) -> V where V.Scalar == Float {
    let l = simd_length(v)
    guard l != 0 else { return v }
    var out = v
    for i in out.indices { out[i] = out[i] / l }
    return out
}
/// Cross product is three-dimensional only, on Apple as here.
public func simd_cross(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> SIMD3<Float> {
    SIMD3<Float>(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
}
