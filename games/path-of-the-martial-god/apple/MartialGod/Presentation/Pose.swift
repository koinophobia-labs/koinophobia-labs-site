import simd
import MartialGodCore

/// The body IS the HUD.
///
/// Ported from the validated `reference/view/pose.js`. Five additive layers driven
/// DIRECTLY from resource values — breathing, fatigue, injury, structure and will.
/// With no meters on screen these are gameplay systems, not polish: they are the only
/// way a player learns that someone is tired, hurt, off-balance or losing their nerve.
///
/// ARCHITECTURE NOTE. This file is the contract between simulation and presentation,
/// and it runs ONE WAY. The simulation decides what happened; this decides how it
/// looks. Nothing here is ever read back into combat, and no animation completion
/// gates a simulation transition. When authored skinned animation replaces procedural
/// posing, it replaces the CONSUMER of this data, not the contract.
public struct Skeleton {
    /// Local frame: +x toward the opponent, +y up, +z to the fighter's lead side.
    public var pelvis = SIMD3<Float>(0, 0.95, 0)
    public var chest = SIMD3<Float>(0.02, 1.32, 0)
    public var neck = SIMD3<Float>(0.03, 1.48, 0)
    public var head = SIMD3<Float>(0.04, 1.66, 0)
    public var leadShoulder = SIMD3<Float>(0.02, 1.41, 0.19)
    public var rearShoulder = SIMD3<Float>(0.02, 1.41, -0.19)
    public var leadElbow = SIMD3<Float>.zero
    public var rearElbow = SIMD3<Float>.zero
    public var leadHand = SIMD3<Float>(0.30, 1.17, 0.16)
    public var rearHand = SIMD3<Float>(0.15, 1.13, -0.17)
    public var leadHip = SIMD3<Float>(0, 0.95, 0.13)
    public var rearHip = SIMD3<Float>(0, 0.95, -0.13)
    public var leadKnee = SIMD3<Float>.zero
    public var rearKnee = SIMD3<Float>.zero
    public var leadFoot = SIMD3<Float>(0.30, 0, 0.20)
    public var rearFoot = SIMD3<Float>(-0.30, 0, -0.21)

    public var lean: Float = 0
    public var crouch: Float = 0
    public var twist: Float = 0
    /// Fraction of weight on the front foot. 0.6 is the Low River stance.
    public var weight: Float = 0.6
    public var isDown = false
}

/// How each technique loads the body during its wind-up. This is the telegraph, and
/// it must be legible before the active frames or the fight cannot be read.
private struct Tell {
    let lean: Float, crouch: Float
    let leadHand: SIMD3<Float>, rearHand: SIMD3<Float>
}

private let tells: [String: Tell] = [
    "lead_load":     Tell(lean: 0.02, crouch: 0.00, leadHand: [0.20, 0.02, 0.06], rearHand: [-0.04, 0, -0.04]),
    "step_in":       Tell(lean: 0.10, crouch: 0.02, leadHand: [0.24, 0.03, 0.05], rearHand: [-0.02, 0, -0.05]),
    "post_out":      Tell(lean: -0.08, crouch: 0.01, leadHand: [0.26, 0.06, 0.02], rearHand: [-0.08, 0, -0.06]),
    "shoulder_turn": Tell(lean: 0.06, crouch: 0.04, leadHand: [0.10, -0.06, 0.20], rearHand: [0.02, 0, -0.10]),
    "rear_load":     Tell(lean: -0.06, crouch: 0.03, leadHand: [0.06, 0, 0.04], rearHand: [-0.22, 0.04, -0.14]),
    "drop_weight":   Tell(lean: 0.14, crouch: 0.10, leadHand: [0.04, -0.04, 0.02], rearHand: [-0.26, -0.02, -0.10]),
    "low_load":      Tell(lean: -0.04, crouch: 0.07, leadHand: [0.10, 0.04, 0.06], rearHand: [-0.10, 0.02, -0.06]),
    "reach_across":  Tell(lean: 0.12, crouch: 0.09, leadHand: [0.28, -0.10, -0.16], rearHand: [0.06, 0.02, 0.14]),
    "settle":        Tell(lean: 0.00, crouch: 0.06, leadHand: [0.12, 0.14, 0.10], rearHand: [0.06, 0.16, -0.08]),
    "shed":          Tell(lean: 0.02, crouch: 0.02, leadHand: [0.22, 0.10, -0.02], rearHand: [0.02, 0.08, -0.06]),
    "slip":          Tell(lean: -0.10, crouch: 0.08, leadHand: [0.08, 0.06, 0.04], rearHand: [0.02, 0.06, -0.04]),
    "breathe":       Tell(lean: -0.02, crouch: -0.02, leadHand: [0.02, -0.10, 0.10], rearHand: [-0.02, -0.10, -0.10]),
]

/// Where the strike ARRIVES during active frames.
private let extend: [String: (hand: Bool, reach: SIMD3<Float>)] = [
    "lead_load":     (true,  [0.62, 0.24, 0.05]),
    "step_in":       (true,  [0.70, 0.22, 0.04]),
    "post_out":      (true,  [0.58, 0.16, 0.02]),
    "shoulder_turn": (true,  [0.52, 0.02, 0.18]),
    "rear_load":     (false, [0.74, 0.26, -0.04]),
    "drop_weight":   (false, [0.72, 0.06, -0.02]),
    "low_load":      (true,  [0.66, -0.62, 0.08]),
    "reach_across":  (true,  [0.60, -0.16, -0.22]),
]

public enum PoseBuilder {

    /// - Parameter terminal: how the fight ended, if it has. `"stop"` and
    ///   `"strike_through"` mean opposite things and must not look alike.
    public static func pose(for f: Fighter, time: Double, terminal: String? = nil) -> Skeleton {
        var p = Skeleton()
        let breathFrac = Float(f.breath / MaxValue.breath)
        let vit = Float(f.vitality.fraction)
        let willFrac = Float(f.will / MaxValue.will)
        let t = Float(time)

        // LAYER 1 — BREATHING. The primary read for Breath: rate and depth both rise
        // as it falls. A gassed fighter heaves.
        let rate = mix(5.2, 1.6, breathFrac)
        let depth = mix(0.055, 0.008, breathFrac)
        let breathPhase = sin(t * rate)
        p.chest.y += breathPhase * depth
        p.head.y += breathPhase * depth * 0.7
        p.chest.x -= breathPhase * depth * 0.4

        // LAYER 2 — FATIGUE. The guard drifts down and the feet get heavy.
        let fatigue = 1 - breathFrac
        let guardDrop = fatigue * 0.22
        p.leadHand.y -= guardDrop
        p.rearHand.y -= guardDrop * 1.1
        p.crouch += fatigue * 0.05
        p.leadFoot.x -= fatigue * 0.04

        // LAYER 3 — INJURY. Asymmetry a stranger can name.
        if f.vitality.leadArm <= 0 { p.leadHand.y -= 0.30; p.leadHand.x -= 0.10 }
        if f.vitality.rearArm <= 0 { p.rearHand.y -= 0.30 }
        if f.vitality.leadLeg <= 0 { p.weight = 0.28; p.leadFoot.x -= 0.07; p.crouch += 0.05 }
        if f.vitality.rearLeg <= 0 { p.weight = 0.82; p.rearFoot.x += 0.07; p.crouch += 0.05 }
        p.crouch += (1 - vit) * 0.06

        // LAYER 4 — STRUCTURE. The base, quadrant by quadrant. Gains are deliberately
        // strong: this is the ONLY readout of the game's primary resource.
        func soft(_ q: Quadrant) -> Float { 1 - Float(f.structure[q] / MaxValue.quadrant) }
        func collapsed(_ q: Quadrant) -> Bool { f.structure.isCollapsed(q) }

        p.lean += soft(.fore) * 0.34 - soft(.rear) * 0.26
        p.twist += soft(.leadSide) * 0.30 - soft(.rearSide) * 0.30
        p.crouch += (soft(.fore) + soft(.rear) + soft(.leadSide) + soft(.rearSide)) * 0.055
        p.leadFoot.x -= soft(.fore) * 0.10
        p.weight -= soft(.fore) * 0.18

        if collapsed(.fore) { p.leadFoot.x -= 0.22; p.lean += 0.26; p.weight = 0.18; p.crouch += 0.06 }
        if collapsed(.rear) { p.rearFoot.x += 0.22; p.lean -= 0.22; p.weight = 0.90; p.crouch += 0.06 }
        if collapsed(.leadSide) { p.leadFoot.z -= 0.18; p.twist += 0.30; p.crouch += 0.05 }
        if collapsed(.rearSide) { p.rearFoot.z += 0.18; p.twist -= 0.30; p.crouch += 0.05 }

        // LAYER 5 — WILL. They stop coming forward.
        if willFrac < 0.6 {
            let d = 0.6 - willFrac
            p.lean -= d * 0.22
            p.head.x -= d * 0.08
        }

        // ---- state overrides ----------------------------------------------------
        switch f.state {
        case .finished:
            // THE LAST IMAGE OF THE FIGHT, and the one that carries the whole thesis.
            //
            // Both terminals set `.finished`, so without this branch a knockout and a
            // Stop rendered identically — and before that, `.finished` fell through to
            // the default case entirely, which left a fighter standing in a normal
            // guard at the moment the game had just ended. The culmination of the
            // design, drawn as though nothing had happened.
            //
            // COMBAT_SYSTEM.md §10 calls the Stop "the hardest thing in the game", and
            // the thesis is that mercy is gated behind competence. If the two choices
            // look the same, the game cannot state its own argument.
            if terminal == "stop" {
                // Let go. Still on their feet, hands down, head down, weight off the
                // front foot — beaten and conscious, and they know what just did not
                // happen to them. Breathing from Layer 1 is deliberately preserved:
                // it is the clearest evidence that this person is still here.
                p.leadHand = [0.16, 0.86, 0.22]
                p.rearHand = [0.02, 0.82, -0.22]
                p.lean -= 0.30
                p.crouch += 0.26
                p.weight = 0.30
                p.head.x -= 0.14
                p.leadFoot.x -= 0.10
                return finish(p)
            }
            // Knocked out. Lower and flatter than a knockdown, and not getting up.
            // Chest and head are overwritten rather than offset, which removes the
            // breathing motion — the difference between the two images is, exactly,
            // whether the body is still moving.
            p.isDown = true
            p.pelvis = [-0.26, 0.15, 0.04]
            p.chest = [-0.50, 0.19, 0.02]
            p.neck = [-0.62, 0.20, 0]
            p.head = [-0.74, 0.20, -0.02]
            p.leadHand = [-0.30, 0.07, 0.34]
            p.rearHand = [-0.62, 0.06, -0.26]
            p.leadFoot = [0.16, 0.05, 0.26]
            p.rearFoot = [-0.02, 0.05, -0.28]
            return finish(p)
        case .down:
            p.isDown = true
            p.pelvis = [-0.2, 0.22, 0]; p.chest = [-0.42, 0.32, 0]
            p.neck = [-0.52, 0.34, 0];  p.head = [-0.62, 0.36, 0]
            p.leadHand = [-0.2, 0.14, 0.28]; p.rearHand = [-0.5, 0.10, -0.24]
            p.leadFoot = [0.22, 0.06, 0.22]; p.rearFoot = [0.06, 0.06, -0.24]
            return finish(p)
        case .staggered:
            let k = min(1, Float(f.stateTicks) / 12)
            p.lean -= 0.34 * (1 - k * 0.4)
            p.crouch += 0.10
            p.leadHand.y -= 0.26; p.rearHand.y -= 0.30
            p.leadHand.z += 0.16; p.rearHand.z -= 0.16
            p.rearFoot.x -= 0.22
            p.weight = 0.15
            return finish(p)
        case .guardState:
            p.leadHand = [0.32, 1.37 - guardDrop, 0.14]
            p.rearHand = [0.21, 1.40 - guardDrop, -0.13]
            p.crouch += 0.05 * min(1, Float(f.guardTicks) / 3)
            p.chest.x -= 0.03
        default:
            break
        }

        // ---- the running technique: load, arrive, be stuck ------------------------
        if f.state == .acting, let id = f.form.techniqueId {
            let tech = TechniqueDB.technique(id)
            let fr = tech.frames()
            let phase = FormMachine.phaseOf(f)
            let tell = tells[tech.tell] ?? tells["settle"]!

            if phase == .startup {
                let k = ease(min(1, Float(f.form.tick) / Float(max(1, fr.startup))))
                apply(tell, k * (f.form.feint ? 0.8 : 1.0), to: &p)
            } else if phase == .active {
                apply(tell, 1, to: &p)
                if let ex = extend[tech.tell] {
                    let target = SIMD3<Float>(ex.reach.x, 1.32 + ex.reach.y, ex.reach.z)
                    if ex.hand { p.leadHand = target } else { p.rearHand = target }
                    p.lean += 0.14
                    p.twist += ex.hand ? 0.10 : -0.16
                    p.chest.x += 0.05
                }
            } else if phase == .recovery {
                // THE MOST IMPORTANT THING ON SCREEN. The body stays out, off its base,
                // unable to act. A stranger must be able to see that he is stuck.
                let done = Float(f.form.tick - fr.startup - fr.active) / Float(max(1, fr.recovery))
                let k = 1 - ease(min(1, done))
                if let ex = extend[tech.tell] {
                    let target = SIMD3<Float>(ex.reach.x, 1.32 + ex.reach.y, ex.reach.z)
                    if ex.hand { p.leadHand = mix(p.leadHand, target, k * 0.85) }
                    else { p.rearHand = mix(p.rearHand, target, k * 0.85) }
                }
                p.lean += 0.30 * k
                p.crouch += 0.08 * k
                p.weight = mix(p.weight, 0.95, k)
                p.rearFoot.x -= 0.20 * k
                p.chest.x += 0.06 * k
            }
        }

        return finish(p)
    }

    /// Derive the joints that hang off the others. A fighting stance has bent knees
    /// and folded arms; straight sticks read as stilts, and posture is the only
    /// structure readout the player gets.
    private static func finish(_ input: Skeleton) -> Skeleton {
        var p = input
        let bend = 0.13 + p.crouch * 0.9
        p.leadHip = [p.pelvis.x, p.pelvis.y, 0.13]
        p.rearHip = [p.pelvis.x, p.pelvis.y, -0.13]
        p.leadShoulder = [p.chest.x, p.chest.y + 0.09, 0.19]
        p.rearShoulder = [p.chest.x, p.chest.y + 0.09, -0.19]
        p.neck = [p.chest.x + 0.01, p.chest.y + 0.16, 0]
        p.leadKnee = midpoint(p.leadHip, p.leadFoot) + SIMD3<Float>(bend, -0.02, 0.03)
        p.rearKnee = midpoint(p.rearHip, p.rearFoot) + SIMD3<Float>(bend * 0.7, -0.02, -0.03)
        p.leadElbow = midpoint(p.leadShoulder, p.leadHand) + SIMD3<Float>(-0.05, -0.11, 0.07)
        p.rearElbow = midpoint(p.rearShoulder, p.rearHand) + SIMD3<Float>(-0.05, -0.11, -0.07)
        return p
    }

    private static func apply(_ tell: Tell, _ k: Float, to p: inout Skeleton) {
        p.lean += tell.lean * k
        p.crouch += tell.crouch * k
        p.leadHand += tell.leadHand * k
        p.rearHand += tell.rearHand * k
    }

    private static func midpoint(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> SIMD3<Float> { (a + b) * 0.5 }
    private static func mix(_ a: Float, _ b: Float, _ t: Float) -> Float { a + (b - a) * t }
    private static func mix(_ a: SIMD3<Float>, _ b: SIMD3<Float>, _ t: Float) -> SIMD3<Float> { a + (b - a) * t }
    private static func ease(_ t: Float) -> Float {
        t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
    }
}

private func mix(_ a: Float, _ b: Float, _ t: Float) -> Float { a + (b - a) * t }
