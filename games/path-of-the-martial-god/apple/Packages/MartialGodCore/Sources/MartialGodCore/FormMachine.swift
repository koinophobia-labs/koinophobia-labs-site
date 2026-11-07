import Foundation

/// FormMachine — ported from `reference/sim/formMachine.js`.
///
/// Deterministic combat state machine, one per fighter, on a fixed 60Hz tick. Pure
/// function of (state, input, opponent state). No randomness anywhere in the decision
/// path. Windows come from TechniqueDB, never from animation notifies: animation is
/// driven BY this machine, not the reverse.

public struct InputIntent: Sendable {
    public var forward: Double = 0   // -1...1 toward the opponent
    public var lateral: Double = 0   // -1...1 across the line
    public var verb: Verb?
    public var held = false
    public var guardHeld = false
    public init(forward: Double = 0, lateral: Double = 0, verb: Verb? = nil,
                held: Bool = false, guardHeld: Bool = false) {
        self.forward = forward; self.lateral = lateral
        self.verb = verb; self.held = held; self.guardHeld = guardHeld
    }
    public static let neutral = InputIntent()
}

public enum Phase: String, Sendable { case startup, active, recovery }

private let staggerTicksDefault = 34 // referenced by Resolve when staggering
private let downTicks = 78

public enum FormMachine {

    /// The stick supplies INTENT, not a combo selector. This is the whole of
    /// "the inputs never change; the meaning of the inputs changes".
    public static func intentFromMove(_ forward: Double, _ lateral: Double) -> Intent {
        let mag = hypot(forward, lateral)
        if mag < 0.30 { return .neutral }
        if abs(lateral) > abs(forward) * 1.1 { return .angle }
        return forward > 0 ? .pressure : .retreat
    }

    public static func phaseOf(_ f: Fighter) -> Phase? {
        guard f.state == .acting, let id = f.form.techniqueId else { return nil }
        let t = TechniqueDB.technique(id)
        let fr = t.frames()
        let tick = f.form.tick
        if f.form.feint { return tick < fr.startup ? .startup : .recovery }
        if tick < fr.startup { return .startup }
        if tick < fr.startup + fr.active { return .active }
        return .recovery
    }

    /// Total ticks this instance runs for, including any deflect penalty.
    static func instanceLength(_ f: Fighter, _ t: Technique) -> Int {
        let fr = t.frames()
        if f.form.feint {
            return fr.startup + Int(jsCeil(Double(fr.recovery) * 0.45))
        }
        let tier = lineTier(f.line)
        let cut = Int(jsRound(Double(fr.recovery) * LineRule.recoveryCutPerTier * tier))
        return fr.startup + fr.active + max(2, fr.recovery - cut) + f.form.recoveryAdd
    }

    public static func beginTechnique(_ f: Fighter, _ t: Technique) {
        f.state = .acting
        f.form = Form()
        f.form.techniqueId = t.id
        f.stateTicks = 0
        let cost = t.frames().breath
        if cost != 0 { f.breath = max(0, f.breath - cost) }
    }

    /// Dumped off the base in `dir` (world radians).
    public static func stagger(_ f: Fighter, dir: Double, ticks: Int, push: Double) {
        f.state = .staggered
        f.stateTicks = 0
        f.staggerTicks = ticks
        f.line = 0
        f.form.techniqueId = nil
        f.pos.x += cos(dir) * push
        f.pos.z += sin(dir) * push
    }

    public static func knockDown(_ f: Fighter, dir: Double, push: Double) {
        f.state = .down
        f.stateTicks = 0
        f.line = 0
        f.form.techniqueId = nil
        f.pos.x += cos(dir) * push
        f.pos.z += sin(dir) * push
    }

    /// Advance one fighter by one tick.
    public static func tick(_ f: Fighter, input: InputIntent, opp: Ref, emit: (CombatEvent) -> Void) {
        f.stateTicks += 1

        // ---- input buffer -------------------------------------------------------
        // Must run BEFORE the early returns below, because the states a buffer exists
        // to serve — acting, staggered, down — are exactly the states those returns
        // exit from. This position is load-bearing; see tickBuffer.
        tickBuffer(f, input)

        // ---- face the opponent (soft lock: biases facing, never welds it) --------
        //
        // These rates decide whether ANGLING IS A REAL MECHANIC. Circling at mid range
        // wins roughly 0.022 rad/tick; if re-facing were faster than that in every
        // state, a defender would simply rotate to keep you in front and the
        // four-quadrant base would collapse into a single front-facing bar. So: a
        // committed fighter can barely turn, a GUARDING fighter turns slower than you
        // can circle (guarding is a commitment to a direction, which is what makes
        // walking around a turtle the answer to a turtle), and only a free fighter
        // re-faces comfortably.
        let want = bearingTo(f, opp)
        let turn = wrapAngle(want - f.facing)
        let turnRate: Double
        switch f.state {
        case .acting: turnRate = 0.010
        case .staggered, .down: turnRate = 0.005
        case .guardState: turnRate = 0.016
        default: turnRate = 0.040
        }
        f.facing += max(-turnRate, min(turnRate, turn))

        // ---- recovery from stagger / knockdown ----------------------------------
        if f.state == .staggered {
            // The oracle reads `f.staggerTicks ?? 34`, but the field is seeded to 0 and
            // stagger() always assigns before this state is entered, so the fallback is
            // itself unreachable. Ported as the plain read to match exactly.
            if f.stateTicks >= f.staggerTicks {
                f.state = .neutral; f.stateTicks = 0
            }
            // A stagger IS the act of re-finding the base. Without this a broken
            // fighter comes out with nothing under them and is broken again on the
            // next blow, compounding into a spiral no skill can climb out of.
            recoverStructure(&f.structure, f.isGassed ? .gassed : .settling, lineTier: 0)
            breathe(f, .idle)
            return
        }
        if f.state == .down {
            if f.stateTicks >= downTicks {
                f.state = .neutral; f.stateTicks = 0
                emit(CombatEvent(type: .rise, who: f.id))
            }
            // Getting up re-establishes the base — the one real comeback in the loop.
            recoverStructure(&f.structure, f.isGassed ? .gassed : .advancing, lineTier: 0)
            breathe(f, .idle)
            return
        }
        if f.state == .finished { return }

        // ---- run the active technique ---------------------------------------------
        if f.state == .acting, let id = f.form.techniqueId {
            let t = TechniqueDB.technique(id)

            // The Lie: releasing before the commitment frame turns the technique into
            // a feint. After commitAt, release does nothing — you are committed.
            if !f.form.feint && !input.held && f.form.tick < (t.commitAt ?? 0) && t.kind.isOffensive {
                f.form.feint = true
                emit(CombatEvent(type: .feint, who: f.id, technique: t.id))
            }

            applyTechniqueMotion(f, t, opp)
            f.form.tick += 1

            if f.form.tick >= instanceLength(f, t) {
                f.state = input.guardHeld ? .guardState : .neutral
                f.form.techniqueId = nil
                f.stateTicks = 0
                f.guardTicks = 0
            }
            recoverStructure(&f.structure, .acting, lineTier: lineTier(f.line))
            // Focus IS the deliberate-breathing technique: it must actually recover
            // Breath, or it is a no-op that only costs time.
            breathe(f, t.kind == .Focus ? .focus : .acting)
            decayLine(f)
            return
        }

        // ---- new action -------------------------------------------------------------
        let d = distance(f, opp)
        let band = bandFor(d)

        // Honour a buffered verb. Control only arrives here when the body is free,
        // which is precisely the moment the buffer exists for. A live press always
        // wins over a remembered one: what you are doing now beats what you meant a
        // tenth of a second ago.
        var verb = input.verb
        if verb == nil, let b = f.buffer {
            verb = b.verb
            f.buffer = nil
        }

        if f.isActionable, let v = verb,
           let t = Grammar.resolve(style: f.style, verb: v,
                                   intent: intentFromMove(input.forward, input.lateral), band: band),
           canUse(f, t) {
            if t.verb == .guardVerb {
                if f.state != .guardState {
                    f.state = .guardState; f.guardTicks = 0; f.stateTicks = 0
                }
            } else {
                beginTechnique(f, t)
                if t.kind == .Evade {
                    // Capture the slip direction now, in world space.
                    let mag = hypot(input.forward, input.lateral)
                    let local = mag < 0.2 ? Double.pi : atan2(input.lateral, input.forward)
                    f.form.evadeDir = bearingTo(f, opp) + local
                }
                emit(CombatEvent(type: .begin, who: f.id, technique: t.id, tell: t.tell))
                return
            }
        }

        // ---- guard hold ---------------------------------------------------------------
        if f.state == .guardState {
            if !input.guardHeld {
                f.state = .neutral; f.guardTicks = 0
            } else {
                f.guardTicks += 1
                f.breath = max(0, f.breath - BreathRate.guardDrainPerTick)
            }
        } else if input.guardHeld && f.isActionable {
            f.state = .guardState
            f.guardTicks = 0
        }

        // ---- locomotion ----------------------------------------------------------------
        let mode = move(f, input, opp)
        recoverStructure(&f.structure, f.isGassed ? .gassed : mode, lineTier: lineTier(f.line))
        breathe(f, mode)
        buildLine(f, mode, input)
    }

    /// Input buffer — COMBAT_SYSTEM.md §3.1, tuned by `inputBufferTicks`.
    ///
    /// A verb pressed while the body is busy is remembered and honoured on the first
    /// tick the body is free. Without it the human is strictly disadvantaged: the
    /// brain is consulted every tick and therefore acts on the exact frame it becomes
    /// actionable, while a person pressing during a recovery has the press thrown away.
    ///
    /// Only the human is served by this. `Brain.decide` returns a nil verb whenever it
    /// is not actionable, so the opponent never captures anything — which is the whole
    /// point. It is not a handicap given to the player; it is the player being given
    /// the same frame-accuracy the opponent already had for free.
    ///
    /// THIS WAS DEAD CODE THROUGHOUT M1, in the oracle and in the first cut of this
    /// port. The capture used to live in the new-action block, which control only
    /// reaches once `acting`, `staggered`, `down` and `finished` have each already
    /// returned — so its `!isActionable` test could never be true. Measured across the
    /// seven trace scenarios before the fix: 474 of 1747 presses (27.1%) were thrown
    /// away and the buffer was populated on 0 ticks.
    static func tickBuffer(_ f: Fighter, _ input: InputIntent) {
        if f.state == .finished { f.buffer = nil; return }

        // Capture. A press made this tick has its whole window ahead of it, so it does
        // not also age on the tick it arrives.
        if let v = input.verb, !f.isActionable {
            f.buffer = InputBuffer(verb: v, age: 0)
            return
        }

        // Age. The memory is deliberately short: a press from half a second ago is not
        // what you mean now, and firing it would feel like the game moving on its own.
        if var b = f.buffer {
            b.age += 1
            f.buffer = b.age > inputBufferTicks ? nil : b
        }
    }

    /// Gate on Line requirements and on a base that cannot bear the technique.
    public static func canUse(_ f: Fighter, _ t: Technique) -> Bool {
        if let req = t.requiresLineTier, lineTier(f.line) < req { return false }
        // You cannot drive forward off a fore quadrant that cannot carry you.
        if (t.advance ?? 0) > 0.25 && bearing(f.structure, .fore) <= 0 { return false }
        return true
    }

    /// Techniques carry their own motion — a Drive walks you in, a Check gives ground.
    static func applyTechniqueMotion(_ f: Fighter, _ t: Technique, _ opp: Ref) {
        let ph = phaseOf(f)

        // A slip is a burst along the direction chosen when it was pressed. Whether
        // that direction was the right one is decided in Resolve, not here.
        if t.kind == .Evade {
            if ph == .active, let dir = f.form.evadeDir {
                let step = t.evade?.burst ?? 0
                f.pos.x += cos(dir) * step
                f.pos.z += sin(dir) * step
                clampToArena(f)
            }
            return
        }

        guard ph == .startup || ph == .active else { return }
        let fr = t.frames()
        let span = Double(max(1, fr.startup + fr.active))
        let adv = (t.advance ?? 0) / span
        let lat = (t.lateral ?? 0) / span
        let fwd = bearingTo(f, opp)
        let scale = f.form.feint ? 0.35 : 1.0
        f.pos.x += (cos(fwd) * adv + cos(fwd + Double.pi / 2) * lat) * scale
        f.pos.z += (sin(fwd) * adv + sin(fwd + Double.pi / 2) * lat) * scale
        clampToArena(f)
    }

    @discardableResult
    static func move(_ f: Fighter, _ input: InputIntent, _ opp: Ref) -> MoveMode {
        let fwd = bearingTo(f, opp)
        var fx = input.forward
        var lx = input.lateral
        let mag = hypot(fx, lx)
        if mag < 0.12 {
            f.moveMode = f.state == .guardState ? .settling : .idle
            f.lastMove = Vec2(x: 0, z: 0)
            return f.moveMode
        }
        if mag > 1 { fx /= mag; lx /= mag }

        // A quadrant that cannot bear weight cannot be moved into. This is the point
        // of the base being spatial: being walked backward has consequences.
        let fwdGate = fx > 0 ? bearing(f.structure, .fore) : bearing(f.structure, .rear)
        let latGate = lx > 0 ? bearing(f.structure, .leadSide) : bearing(f.structure, .rearSide)

        let speedF = (fx > 0 ? Move.advance : Move.retreat) * fwdGate
        let speedL = Move.lateral * latGate
        let gScale = f.state == .guardState ? Move.guardScale : 1.0
        let injuryScale = (f.vitality.leadLeg <= 0 || f.vitality.rearLeg <= 0) ? 0.72 : 1.0
        let gasScale = f.isGassed ? 0.66 : 1.0
        let k = gScale * injuryScale * gasScale

        let dx = (cos(fwd) * fx * speedF + cos(fwd + Double.pi / 2) * lx * speedL) * k
        let dz = (sin(fwd) * fx * speedF + sin(fwd + Double.pi / 2) * lx * speedL) * k
        f.pos.x += dx
        f.pos.z += dz
        f.lastMove = Vec2(x: dx, z: dz)
        clampToArena(f)

        if abs(lx) > abs(fx) * 1.1 { f.moveMode = .lateral }
        else if fx > 0 { f.moveMode = .advancing }
        else { f.moveMode = .retreating }
        return f.moveMode
    }

    public static func clampToArena(_ f: Fighter) {
        f.pos.x = max(-Arena.halfWidth, min(Arena.halfWidth, f.pos.x))
        f.pos.z = max(-Arena.halfDepth, min(Arena.halfDepth, f.pos.z))
    }

    /// Breath is spent by inefficiency and panic, recovered by making distance.
    static func breathe(_ f: Fighter, _ mode: MoveMode) {
        let r: Double
        switch mode {
        case .acting: r = 0
        case .focus: r = BreathRate.recoverFocus
        case .idle: r = BreathRate.recoverIdle
        case .settling: r = BreathRate.recoverIdle * 0.7
        default: r = BreathRate.recoverMoving
        }
        f.breath = max(0, min(MaxValue.breath, f.breath + r))
    }

    /// The Line: built by walking straight in, dropped instantly by retreating.
    static func buildLine(_ f: Fighter, _ mode: MoveMode, _ input: InputIntent) {
        if mode == .advancing && abs(input.lateral) < 0.5 {
            f.line = min(LineRule.maxTier, f.line + LineRule.buildPerAdvanceTick)
        } else if mode == .retreating {
            f.line = 0
        } else {
            decayLine(f)
        }
    }

    static func decayLine(_ f: Fighter) {
        f.line = max(0, f.line - LineRule.decayPerTick)
    }
}
