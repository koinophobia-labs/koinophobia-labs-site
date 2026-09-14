import Foundation

/// Parity trace capture — the production side of the contract defined in
/// `reference/tools/trace-format.mjs`.
///
/// Key names here MUST match that file exactly. The verifier flattens both sides by
/// key name, so a renamed field reads as a missing field and fails the gate.

public struct TraceFighter: Codable {
    public let state: String
    public let techniqueId: String?
    public let formTick: Int
    public let feint: Bool
    public let landed: Bool
    public let pos: TracePos
    public let facing: Double
    public let structure: TraceStructure
    public let collapse: TraceCollapse
    public let breath: Double
    public let will: Double
    public let line: Double
    public let guardTicks: Int
    public let stateTicks: Int
    public let vitality: TraceVitality
}

public struct TracePos: Codable { public let x: Double; public let z: Double }
public struct TraceStructure: Codable {
    public let fore: Double; public let rear: Double
    public let leadSide: Double; public let rearSide: Double
}
public struct TraceCollapse: Codable {
    public let fore: Int; public let rear: Int
    public let leadSide: Int; public let rearSide: Int
}
public struct TraceVitality: Codable {
    public let head: Double; public let torso: Double
    public let leadArm: Double; public let rearArm: Double
    public let leadLeg: Double; public let rearLeg: Double
}

public struct TraceInch: Codable {
    public let actorId: String
    public let targetId: String
    public let ticksLeft: Int
    public let total: Int
}

public struct TraceOver: Codable {
    public let winnerId: String?
    public let reason: String
    public let terminal: String?
}

public struct TraceFrame: Codable {
    public let tick: Int
    public let a: TraceFighter
    public let b: TraceFighter
    public let inch: TraceInch?
    public let over: TraceOver?
}

public struct TraceEvent: Codable {
    public let tick: Int
    public let type: String
    public let who: String?
    public let by: String?
    public let technique: String?
    public let quadrant: String?
    public let region: String?
    public let actor: String?
    public let target: String?
    public let executed: String?
    public let winnerId: String?
    public let reason: String?
}

/// The per-tick input recorded in a fixture. A port replays these rather than
/// reimplementing any test script.
public struct TraceInput: Codable {
    public let forward: Double
    public let lateral: Double
    public let verb: String?
    public let held: Bool
    public let guardHeld: Bool
    public let terminal: String?

    enum CodingKeys: String, CodingKey {
        case forward, lateral, verb, held, terminal
        case guardHeld = "guard"   // the fixture uses the oracle's key name
    }

    public var intent: InputIntent {
        InputIntent(forward: forward, lateral: lateral,
                    verb: verb.flatMap { Verb(rawValue: $0) },
                    held: held, guardHeld: guardHeld)
    }
}

/// A fixture as written by `reference/tools/trace.mjs`.
public struct TraceFixture: Codable {
    public let formatVersion: Int
    public let scenario: String
    public let note: String?
    public let options: FixtureOptions
    public let tickCount: Int
    public let inputs: [TraceInput]
    public let frames: [TraceFrame]
    public let events: [TraceEvent]
}

public struct FixtureOptions: Codable {
    public let reaction: Int?
    public let playerMastery: Double?
    public let aggression: Double?
    public let patience: Double?

    public var fightOptions: FightOptions {
        var o = FightOptions()
        if let r = reaction { o.reaction = r }
        if let m = playerMastery { o.playerMastery = m }
        if let a = aggression { o.aggression = a }
        if let p = patience { o.patience = p }
        return o
    }
}

/// What a port emits for comparison.
public struct TraceOutput: Codable {
    public let frames: [TraceFrame]
    public let events: [TraceEvent]
}

public enum Trace {
    public static func capture(_ f: Fighter) -> TraceFighter {
        TraceFighter(
            state: f.state.rawValue,
            techniqueId: f.form.techniqueId,
            formTick: f.form.tick,
            feint: f.form.feint,
            landed: f.form.landed,
            pos: TracePos(x: f.pos.x, z: f.pos.z),
            facing: f.facing,
            structure: TraceStructure(fore: f.structure.fore, rear: f.structure.rear,
                                      leadSide: f.structure.leadSide, rearSide: f.structure.rearSide),
            collapse: TraceCollapse(fore: f.structure.collapseFore, rear: f.structure.collapseRear,
                                    leadSide: f.structure.collapseLeadSide, rearSide: f.structure.collapseRearSide),
            breath: f.breath,
            will: f.will,
            line: f.line,
            guardTicks: f.guardTicks,
            stateTicks: f.stateTicks,
            vitality: TraceVitality(head: f.vitality.head, torso: f.vitality.torso,
                                    leadArm: f.vitality.leadArm, rearArm: f.vitality.rearArm,
                                    leadLeg: f.vitality.leadLeg, rearLeg: f.vitality.rearLeg)
        )
    }

    public static func capture(_ fight: Fight) -> TraceFrame {
        TraceFrame(
            tick: fight.tick,
            a: capture(fight.a),
            b: capture(fight.b),
            inch: fight.inch.map { TraceInch(actorId: $0.actorID, targetId: $0.targetID,
                                             ticksLeft: $0.ticksLeft, total: $0.total) },
            over: fight.over.map { TraceOver(winnerId: $0.winnerID, reason: $0.reason, terminal: $0.terminal) }
        )
    }

    public static func capture(_ e: CombatEvent) -> TraceEvent {
        TraceEvent(
            tick: e.tick, type: e.type.rawValue,
            who: e.who, by: e.by, technique: e.technique,
            quadrant: e.quadrant?.rawValue, region: e.region?.rawValue,
            actor: e.actor, target: e.target, executed: e.executed,
            winnerId: e.winnerId, reason: e.reason
        )
    }

    /// Replay a fixture's recorded inputs and produce this implementation's own trace.
    /// This is the exact function the parity gate runs.
    public static func replay(_ fixture: TraceFixture) -> TraceOutput {
        let fight = Fight(options: fixture.options.fightOptions)
        var frames: [TraceFrame] = []
        var events: [TraceEvent] = []

        for input in fixture.inputs {
            if fight.over != nil { break }
            fight.step(input: input.intent, terminal: input.terminal)
            for e in fight.events { events.append(capture(e)) }
            frames.append(capture(fight))
        }
        return TraceOutput(frames: frames, events: events)
    }
}
