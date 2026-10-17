import Foundation

/// Hit resolution — ported from `reference/sim/resolve.js`.
///
/// The load-bearing property here is spatial: GUARD ONLY COVERS THE QUADRANT YOU FACE.
/// Circle to someone's flank and the same blow lands on a base they are not defending.
/// That is what makes footwork mechanically real rather than decorative.
public enum Resolve {

    /// Which quadrant of the defender's base absorbs this blow. Geometry decides.
    /// A strike to a leg attacks the base that leg carries, wherever the attacker
    /// happens to be standing — the one place a technique overrides pure geometry.
    public static func targetQuadrant(defender d: Fighter, attacker a: Fighter, technique t: Technique) -> Quadrant {
        let geo = quadrantFromIncoming(defenderFacing: d.facing, toAttacker: bearingTo(d, a))
        switch t.vitality?.region {
        case .leadLeg: return .leadSide
        case .rearLeg: return .rearSide
        default: return geo
        }
    }

    /// Did the slip move the defender off the line of the attack?
    /// I-frames are conditional: a slip in the correct direction relative to the
    /// incoming vector grants them; a slip in the wrong direction just moves you.
    /// Backing straight off beats a jab and fails against a lunging Drive, which follows.
    public static func evadeWorked(defender d: Fighter, attacker a: Fighter, technique t: Technique) -> Bool {
        guard let dir = d.form.evadeDir else { return false }
        let attackAxis = bearingTo(a, d)          // direction the force travels
        let rel = wrapAngle(dir - attackAxis)
        let perpendicular = abs(sin(rel))         // how far off-line the slip goes
        let withAttack = cos(rel)                 // +1 moving away, -1 into it
        if perpendicular > 0.5 { return true }
        if withAttack > 0.5 && (t.advance ?? 0) < 0.30 { return true }
        return false
    }

    public struct Outcome {
        public let outcome: String
        public let quadrant: Quadrant
        public let broke: Bool
    }

    /// Attempt to land the attacker's currently-active technique on the defender.
    /// Called only during active frames.
    @discardableResult
    public static func attemptLand(_ a: Fighter, _ d: Fighter, emit: (CombatEvent) -> Void) -> Outcome? {
        guard let id = a.form.techniqueId, !a.form.landed, !a.form.feint else { return nil }
        let t = TechniqueDB.technique(id)
        guard t.kind.isOffensive else { return nil }
        guard FormMachine.phaseOf(a) == .active else { return nil }

        let dist = distance(a, d)
        if dist > (t.reach ?? 0) + 0.10 { return nil }
        let off = abs(wrapAngle(bearingTo(a, d) - a.facing))
        if off > Double.pi / 3 { return nil }

        a.form.landed = true   // one landing per technique instance

        let quadrant = targetQuadrant(defender: d, attacker: a, technique: t)
        let pushDir = bearingTo(a, d)
        let tier = lineTier(a.line)
        var force = (t.structure?.force ?? 0) * (1 + LineRule.structureBonusPerTier * tier)
        // A technique used as designed does its full work; off-design it still lands.
        if let want = t.structure?.quadrant, want != quadrant { force *= 0.72 }
        var vit = t.vitality?.amount ?? 0
        let region = t.vitality?.region ?? .torso

        let dTech: Technique? = d.form.techniqueId.map { TechniqueDB.technique($0) }
        let dPhase = FormMachine.phaseOf(d)

        // ---- EVADE ------------------------------------------------------------
        if dTech?.kind == .Evade && dPhase == .active {
            if evadeWorked(defender: d, attacker: a, technique: t) {
                emit(CombatEvent(type: .evaded, who: d.id, by: a.id, technique: t.id, quadrant: quadrant))
                return Outcome(outcome: "evaded", quadrant: quadrant, broke: false)
            }
            // Wrong direction. It just moved them, and they are still hit.
        }

        // ---- DEFLECT ----------------------------------------------------------
        if let dt = dTech, dt.kind == .Redirect {
            if dPhase == .active {
                let ret = dt.deflect?.returnForce ?? 0
                let q = quadrantFromIncoming(defenderFacing: a.facing, toAttacker: bearingTo(a, d))
                applyForce(&a.structure, q, ret)
                a.form.recoveryAdd += dt.deflect?.attackerRecoveryAdd ?? 0
                a.line = 0
                d.will = min(MaxValue.will, d.will + WillRule.answerBonus)
                emit(CombatEvent(type: .deflected, who: d.id, by: a.id, technique: t.id, quadrant: quadrant))
                return Outcome(outcome: "deflected", quadrant: quadrant, broke: false)
            }
            if dPhase == .recovery {
                // Deflected too early. Heavy Breath and Structure on failure.
                d.breath = max(0, d.breath - BreathRate.deflectFailPenalty)
                force *= 1.25
                emit(CombatEvent(type: .deflectFailed, who: d.id, by: a.id))
            }
        }

        // ---- GUARD ------------------------------------------------------------
        var guarded = false
        if d.state == .guardState {
            let settle = TechniqueDB.technique("low_river.settle")
            let raised = d.guardTicks >= settle.frames().startup
            if !raised {
                // Late guard costs Breath and does not protect.
                d.breath = max(0, d.breath - BreathRate.lateGuardPenalty)
                emit(CombatEvent(type: .lateGuard, who: d.id))
            } else if quadrant == .fore {
                guarded = true
                let g = settle.`guard`
                d.breath = max(0, d.breath - force * BreathRate.impactAbsorb)
                force *= 1 - (g?.absorb ?? 0)
                vit *= 1 - (g?.vitalityAbsorb ?? 0)
            } else {
                // Guard is up but pointed the wrong way. This is the spatial payoff.
                emit(CombatEvent(type: .guardBypassed, who: d.id, quadrant: quadrant))
            }
        }

        // ---- apply -------------------------------------------------------------
        if vit > 0 { d.vitality[region] = max(0, d.vitality[region] - vit) }
        let res = applyForce(&d.structure, quadrant, force)

        d.will = max(0, d.will - (guarded ? 0.5 : (region == .head ? WillRule.onHeadHit : WillRule.onCleanHit)))
        a.will = min(MaxValue.will, a.will + WillRule.answerBonus * (guarded ? 0.3 : 1))
        if let lb = t.lineBuild, lb != 0 {
            a.line = min(LineRule.maxTier, a.line + lb * 0.35)
        }

        // A Check that lands during an entry stops it.
        if (t.interrupts ?? false), dPhase == .startup, d.state == .acting, let did = d.form.techniqueId {
            d.form.tick = max(d.form.tick, TechniqueDB.technique(did).frames().startup)
            d.form.feint = true
            emit(CombatEvent(type: .interrupted, who: d.id, by: a.id))
        }

        let outcome = guarded ? "guarded" : "hit"
        emit(CombatEvent(type: guarded ? .guarded : .hit, who: d.id, by: a.id,
                         technique: t.id, quadrant: quadrant, region: region,
                         force: force, broke: res.broke))

        // ---- structure break ----------------------------------------------------
        if res.broke {
            let heavy = (t.displaces ?? false) || d.will < WillRule.yieldThreshold
            d.will = max(0, d.will - WillRule.onStructureBreak)
            if heavy {
                FormMachine.knockDown(d, dir: pushDir, push: 0.40)
            } else {
                FormMachine.stagger(d, dir: pushDir, ticks: 34, push: 0.26)
            }
            emit(CombatEvent(type: .brokeStructure, who: d.id, by: a.id, quadrant: quadrant, down: heavy))
            return Outcome(outcome: outcome, quadrant: quadrant, broke: true)
        }

        return Outcome(outcome: outcome, quadrant: quadrant, broke: false)
    }

    /// Called when active frames end without a landing. A miss is its own information.
    public static func noteWhiff(_ a: Fighter, emit: (CombatEvent) -> Void) {
        if a.form.feint { return }
        emit(CombatEvent(type: .whiff, who: a.id, technique: a.form.techniqueId))
    }
}
