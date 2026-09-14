import Foundation

/// Fight — the simulation orchestrator, ported from `reference/sim/fight.js`.
///
/// This is the whole of the engine-free contract: no UIKit, no Metal, no timers, no
/// I/O, no randomness. Given the same inputs it produces the same fight every time,
/// which is what gives us replay, regression tests and an honest adaptive-AI story.

public let playerID = "player"
public let opponentID = "opponent"

public struct FightOptions: Sendable {
    public var playerMastery: Double = 0.6
    public var reaction: Int = 16
    public var aggression: Double = 0.55
    public var patience: Double = 0.45
    public init(playerMastery: Double = 0.6, reaction: Int = 16,
                aggression: Double = 0.55, patience: Double = 0.45) {
        self.playerMastery = playerMastery; self.reaction = reaction
        self.aggression = aggression; self.patience = patience
    }
}

public struct InchState: Sendable {
    public var actorID: String
    public var targetID: String
    public var ticksLeft: Int
    public var total: Int
}

public struct Outcome: Sendable {
    public var winnerID: String?
    public var reason: String
    public var terminal: String?
    public var note: String
}

public extension Outcome {

    /// Which fighter an outcome is ABOUT — which is not always the one who won.
    ///
    /// Two of the four endings name something the winner DID. The other two name
    /// something the loser could no longer do. Anything that puts a fight into words
    /// has to know the difference, and the reference build does not: `showOutcome` in
    /// `reference/view/main.js` phrases all four with the winner as subject, so a fight
    /// won by knockout reads "You could not continue."
    ///
    /// This lives in the simulation rather than in a view because it is a fact about
    /// the outcome model, not a choice of words. The words stay in the presentation
    /// layer, where they belong.
    enum Subject: Sendable { case winner, loser }

    /// The endings the simulation can actually reach.
    ///
    /// `Outcome.reason` stays a `String` because the parity trace compares it as one
    /// and the JavaScript oracle emits one; this is the typed reading of it. Being
    /// `CaseIterable` with an exhaustive `subject` switch means a new ending cannot be
    /// added here without deciding who it is about — the compiler asks.
    enum Reason: String, Sendable, CaseIterable {
        /// A terminal option was taken and the fight ended on it.
        case finished
        /// The Final Inch was held open and let go deliberately. The Stop.
        case stopped
        /// Vitality reached zero. Describes the loser.
        case unconscious
        /// Will broke while down. Describes the loser.
        case yielded

        public var subject: Subject {
            switch self {
            case .finished, .stopped:      return .winner
            case .unconscious, .yielded:   return .loser
            }
        }
    }

    /// The typed ending, or `nil` for a reason this build does not know about.
    ///
    /// Deliberately optional rather than defaulted: a caller that guesses a subject for
    /// an unrecognised ending prints a confident sentence about the wrong man, which is
    /// the exact failure this type exists to prevent.
    var knownReason: Reason? { Reason(rawValue: reason) }
}

/// Minimum separation between two standing fighters, metres. Sits just inside the MID
/// band on purpose: Low River's preferred distance is mid, and M1 ships no clinch, so
/// the contact band has almost nothing in its grammar.
private let minSeparation: Double = 1.02

public final class Fight {
    public let a: Fighter
    public let b: Fighter
    public private(set) var tick = 0
    public let brain: Brain
    private let perception: Perception
    private let options: FightOptions

    /// Events from the most recent tick, for presentation and audio.
    public private(set) var events: [CombatEvent] = []
    /// The whole log, for debug and the readability post-mortem.
    public private(set) var log: [CombatEvent] = []
    public private(set) var inch: InchState?
    public private(set) var over: Outcome?

    public init(options: FightOptions = FightOptions()) {
        self.options = options
        a = Fighter(id: playerID, pos: Vec2(x: -1.15, z: 0), facing: 0)
        a.mastery = options.playerMastery
        b = Fighter(id: opponentID, pos: Vec2(x: 1.15, z: 0), facing: Double.pi)
        b.mastery = 0.45
        b.reaction = options.reaction
        brain = Brain(aggression: options.aggression, patience: options.patience)
        perception = Perception(latencyTicks: options.reaction)
    }

    private func fighter(_ id: String) -> Fighter { id == playerID ? a : b }

    /// Advance the whole fight by exactly one simulation tick.
    @discardableResult
    public func step(input playerInput: InputIntent, terminal choice: String? = nil) -> Fight {
        events.removeAll(keepingCapacity: true)
        func emit(_ e: CombatEvent) {
            var ev = e
            ev.tick = tick
            events.append(ev)
            log.append(ev)
        }

        if over != nil { return self }

        // ---- the Final Inch holds the world still while someone decides ----------
        if inch != nil {
            stepInch(playerInput: playerInput, choice: choice, emit: emit)
            tick += 1
            return self
        }

        // ---- perception: the brain only ever sees a delayed, filtered snapshot ----
        perception.observe(a, tick: tick)
        let snap = perception.perceived()
        let aiInput = brain.decide(for: b, snap: snap)

        // ---- advance both fighters against the SAME view of the world -------------
        //
        // Both read a positional snapshot taken before either moves. Ticking one
        // against the other's already-updated position hands the second mover a
        // permanent aiming advantage: with identical brains on both sides it produced
        // a 4-0 record for whichever fighter ticked second.
        let aRef = a.ref
        let bRef = b.ref
        FormMachine.tick(a, input: playerInput, opp: bRef, emit: emit)
        FormMachine.tick(b, input: aiInput, opp: aRef, emit: emit)

        // ---- two bodies cannot occupy the same ground ----------------------------
        separate(a, b)

        // ---- resolve landings, alternating who resolves first ---------------------
        // Resolving one side first every tick means their hit can stagger the other
        // out of active frames before it is ever tested. Alternating by tick parity
        // keeps that fair across a fight and stays perfectly deterministic.
        if tick % 2 == 0 {
            Resolve.attemptLand(a, b, emit: emit)
            Resolve.attemptLand(b, a, emit: emit)
        } else {
            Resolve.attemptLand(b, a, emit: emit)
            Resolve.attemptLand(a, b, emit: emit)
        }

        // ---- a miss is its own information ----------------------------------------
        for f in [a, b] {
            if f.state == .acting, let id = f.form.techniqueId,
               TechniqueDB.technique(id).kind.isOffensive,
               !f.form.landed, !f.form.whiffed,
               FormMachine.phaseOf(f) == .recovery {
                f.form.whiffed = true
                Resolve.noteWhiff(f, emit: emit)
            }
        }

        // ---- gassing out is a state the world can hear -----------------------------
        for f in [a, b] {
            if f.breath <= 0.001 {
                f.will = max(0, f.will - WillRule.onGassed)
                if !f.gassedNoted {
                    f.gassedNoted = true
                    emit(CombatEvent(type: .gassed, who: f.id))
                }
            } else if f.breath > 14 {
                f.gassedNoted = false
            }
            f.will = min(MaxValue.will, f.will + WillRule.regenPerTick)
        }

        checkTermination(emit: emit)
        tick += 1
        return self
    }

    /// Open the Final Inch if a break has left someone genuinely finished.
    private func checkTermination(emit: (CombatEvent) -> Void) {
        for (actor, target) in [(a, b), (b, a)] {
            if inch != nil || over != nil { return }

            if target.vitality.fraction <= 0 {
                over = Outcome(winnerID: actor.id, reason: "unconscious",
                               terminal: nil, note: "Could not continue.")
                emit(CombatEvent(type: .over, winnerId: actor.id, reason: "unconscious"))
                return
            }

            if FinalInch.isFinished(target), distance(actor, target) < 2.0,
               actor.state != .staggered, actor.state != .down {
                let total = FinalInch.windowTicks(mastery: actor.mastery)
                inch = InchState(actorID: actor.id, targetID: target.id,
                                 ticksLeft: total, total: total)
                emit(CombatEvent(type: .inchOpen, actor: actor.id, target: target.id, ticks: total))
                return
            }

            if target.will <= WillRule.yieldThreshold, target.state == .down {
                over = Outcome(winnerID: actor.id, reason: "yielded",
                               terminal: nil, note: "They stopped.")
                emit(CombatEvent(type: .over, winnerId: actor.id, reason: "yielded"))
                return
            }
        }
    }

    /// The Inch. No prompt tells you what the options mean; the inputs you already
    /// know are the options. Letting the window lapse is itself a choice.
    private func stepInch(playerInput: InputIntent, choice: String?, emit: (CombatEvent) -> Void) {
        guard var i = inch else { return }
        let actor = fighter(i.actorID)
        let target = fighter(i.targetID)

        var picked: String?
        if i.actorID == playerID {
            if let c = choice { picked = c }
            else if playerInput.verb == .commit || playerInput.verb == .strike { picked = "strike_through" }
            else if playerInput.verb == .guardVerb || playerInput.verb == .deflect { picked = "stop" }
        } else {
            // The opponent's temperament decides, and decides DELIBERATELY — part-way
            // through the window, not on the last possible tick. A fighter who lets
            // every finish lapse is not merciful, it is broken.
            if i.ticksLeft <= Int(jsRound(Double(i.total) * 0.45)) {
                picked = brain.patience > 0.66 ? "stop" : "strike_through"
            }
        }

        i.ticksLeft -= 1
        inch = i

        if picked == nil && i.ticksLeft <= 0 { picked = "lapse" }
        guard let chosen = picked else { return }

        let result = FinalInch.attempt(chosen, actor: actor, target: target)
        emit(CombatEvent(type: .terminal, actor: actor.id, target: target.id,
                         executed: result.executed, clean: result.clean, note: result.note))
        inch = nil

        if target.state == .finished {
            let reason = result.executed == "stop" ? "stopped" : "finished"
            over = Outcome(winnerID: actor.id, reason: reason,
                           terminal: result.executed, note: result.note)
            emit(CombatEvent(type: .over, winnerId: actor.id, reason: reason))
        } else {
            // Lapsed. They live, and the fight continues — which is also an answer.
            target.will = max(target.will, WillRule.inchThreshold + 8)
        }
    }

    /// Push overlapping fighters apart, symmetrically and deterministically.
    private func separate(_ a: Fighter, _ b: Fighter) {
        if a.state == .down || b.state == .down { return }
        let dx = b.pos.x - a.pos.x
        let dz = b.pos.z - a.pos.z
        let d = hypot(dx, dz)
        if d >= minSeparation { return }
        if d < 1e-5 { b.pos.x += minSeparation; return }
        let push = (minSeparation - d) / 2
        let ux = dx / d, uz = dz / d
        a.pos.x -= ux * push; a.pos.z -= uz * push
        b.pos.x += ux * push; b.pos.z += uz * push
        FormMachine.clampToArena(a)
        FormMachine.clampToArena(b)
    }
}
