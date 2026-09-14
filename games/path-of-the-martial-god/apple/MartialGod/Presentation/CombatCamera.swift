import simd
import MartialGodCore

/// The production duel camera.
///
/// The design's philosophy is the removal of excess movement, and the camera obeys it:
/// no orbiting, no cinematic drift during ordinary combat, no shake beyond a short
/// impact tick. Its job is to make four things legible and then get out of the way —
/// both fighters, the distance between them, lateral movement, and who is committed.
///
/// It sits slightly OFF the fighters' axis rather than on it, so that angling reads as
/// real ground travelled rather than as two silhouettes overlapping, and it never
/// crosses the line between them.
public struct CombatCamera {
    /// Radians off the duel axis. Small on purpose: most of the separation stays
    /// horizontal, which is what makes distance readable.
    public var offAxis: Float = 0.34
    public var height: Float = 1.45
    public var pitch: Float = 0.16
    /// Metres of pull-back per metre of separation, plus a floor.
    public var distanceBias: Float = 1.35
    public var minDistance: Float = 3.1
    public var maxDistance: Float = 5.4

    private var smoothedCentre = SIMD3<Float>(0, 0, 0)
    private var smoothedAngle: Float = 0
    private var smoothedDistance: Float = 4.0
    private var shake: Float = 0
    private var initialised = false

    public init() {}

    public mutating func impulse(_ amount: Float) {
        // Reduce Motion is honoured at source, not by post-processing it away.
        if SettingsStore.shared.settings.reduceMotion { return }
        shake = min(1.0, shake + amount)
    }

    public mutating func update(a: Fighter, b: Fighter, dt: Float) {
        let pa = SIMD3<Float>(Float(a.pos.x), 0, Float(a.pos.z))
        let pb = SIMD3<Float>(Float(b.pos.x), 0, Float(b.pos.z))
        let centre = (pa + pb) * 0.5
        let axis = atan2(pb.z - pa.z, pb.x - pa.x)
        let separation = simd_length(pb - pa)
        let want = min(maxDistance, max(minDistance, separation * distanceBias + 1.6))

        if !initialised {
            smoothedCentre = centre; smoothedAngle = axis; smoothedDistance = want
            initialised = true
        }

        // Critically damped enough to feel attached, slow enough not to swim.
        let k: Float = SettingsStore.shared.settings.reduceMotion ? 0.06 : 0.10
        smoothedCentre += (centre - smoothedCentre) * k
        smoothedDistance += (want - smoothedDistance) * (k * 0.6)

        // Shortest-path angle interpolation, so the camera never takes the long way
        // round when the fighters swap sides.
        var delta = axis - smoothedAngle
        while delta > .pi { delta -= 2 * .pi }
        while delta < -.pi { delta += 2 * .pi }
        smoothedAngle += delta * (k * 0.5)

        shake = max(0, shake - dt * 3.2)
    }

    public func viewMatrix() -> simd_float4x4 {
        let viewAngle = smoothedAngle - offAxis
        // Sit perpendicular-ish to the duel axis and look at its midpoint.
        let eyeDir = SIMD3<Float>(cos(viewAngle + .pi / 2), 0, sin(viewAngle + .pi / 2))
        var eye = smoothedCentre + eyeDir * smoothedDistance
        eye.y = height + smoothedDistance * pitch

        if shake > 0 {
            let s = shake * 0.045
            eye.x += sin(shake * 91) * s
            eye.y += cos(shake * 77) * s * 0.6
        }

        var target = smoothedCentre
        target.y = 1.05
        return lookAt(eye: eye, target: target, up: SIMD3<Float>(0, 1, 0))
    }

    public func projectionMatrix(aspect: Float) -> simd_float4x4 {
        perspective(fovYRadians: 0.62, aspect: aspect, near: 0.1, far: 60)
    }

    /// Screen-space direction from the player toward the opponent, which the touch
    /// grammar needs so that "toward him" is a real direction.
    public func opponentScreenDirection(a: Fighter, b: Fighter, aspect: Float) -> SIMD2<Float> {
        let vp = projectionMatrix(aspect: aspect) * viewMatrix()
        func project(_ p: SIMD3<Float>) -> SIMD2<Float> {
            let clip = vp * SIMD4<Float>(p.x, p.y, p.z, 1)
            guard clip.w != 0 else { return .zero }
            return SIMD2<Float>(clip.x / clip.w, -clip.y / clip.w) // -y: screen is y-down
        }
        let sa = project(SIMD3<Float>(Float(a.pos.x), 1.0, Float(a.pos.z)))
        let sb = project(SIMD3<Float>(Float(b.pos.x), 1.0, Float(b.pos.z)))
        let d = sb - sa
        let len = simd_length(d)
        return len < 1e-5 ? SIMD2<Float>(1, 0) : d / len
    }
}

// MARK: - matrix helpers

func lookAt(eye: SIMD3<Float>, target: SIMD3<Float>, up: SIMD3<Float>) -> simd_float4x4 {
    let f = simd_normalize(target - eye)
    let s = simd_normalize(simd_cross(f, up))
    let u = simd_cross(s, f)
    return simd_float4x4(
        SIMD4<Float>(s.x, u.x, -f.x, 0),
        SIMD4<Float>(s.y, u.y, -f.y, 0),
        SIMD4<Float>(s.z, u.z, -f.z, 0),
        SIMD4<Float>(-simd_dot(s, eye), -simd_dot(u, eye), simd_dot(f, eye), 1)
    )
}

func perspective(fovYRadians: Float, aspect: Float, near: Float, far: Float) -> simd_float4x4 {
    let y = 1 / tan(fovYRadians * 0.5)
    let x = y / aspect
    let z = far / (near - far)
    return simd_float4x4(
        SIMD4<Float>(x, 0, 0, 0),
        SIMD4<Float>(0, y, 0, 0),
        SIMD4<Float>(0, 0, z, -1),
        SIMD4<Float>(0, 0, z * near, 0)
    )
}
