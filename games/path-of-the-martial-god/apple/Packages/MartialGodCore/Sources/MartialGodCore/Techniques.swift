import Foundation

/// TechniqueDB — ported from `reference/sim/techniques.js`.
///
/// Frame windows live in DATA, never on animation notifies. `low-river.json` in this
/// target's resources is a copy of the canonical file the reference oracle loads;
/// `tools/check-technique-parity.mjs` fails if the two ever drift apart.

public enum TechniqueKind: String, Codable, Sendable {
    case Strike, Drive, Check, Redirect, Seize, Displace, Break, Guard, Evade, Focus

    /// Anything that can land on someone.
    public var isOffensive: Bool {
        switch self {
        case .Strike, .Drive, .Check, .Displace, .Break: return true
        default: return false
        }
    }
}

public enum Verb: String, Codable, Sendable, CaseIterable {
    case strike, commit, guardVerb = "guard", deflect, evade, focus
}

public enum Intent: String, Codable, Sendable {
    case neutral, pressure, retreat, angle, any
}

public struct Frames: Codable, Sendable {
    public let startup: Int
    public let active: Int
    public let recovery: Int
    public let breath: Double
    public let cancelFrom: Int
}

public struct GuardSpec: Codable, Sendable {
    public let absorb: Double
    public let vitalityAbsorb: Double
}

public struct DeflectSpec: Codable, Sendable {
    public let returnForce: Double
    public let attackerRecoveryAdd: Int
}

public struct EvadeSpec: Codable, Sendable {
    public let burst: Double
}

public struct StructureSpec: Codable, Sendable {
    public let quadrant: Quadrant?
    public let force: Double
}

public struct VitalitySpec: Codable, Sendable {
    public let region: Region
    public let amount: Double
}

public struct Technique: Codable, Sendable {
    public let id: String
    public let name: String
    public let kind: TechniqueKind
    public let verb: Verb
    public let intent: Intent
    public let band: [Band]
    public let reach: Double?
    public let advance: Double?
    public let lateral: Double?
    public let commitAt: Int?
    public let tell: String
    public let tiers: [String: Frames]
    public let structure: StructureSpec?
    public let vitality: VitalitySpec?
    public let lineBuild: Double?
    public let requiresLineTier: Double?
    public let displaces: Bool?
    public let interrupts: Bool?
    public let holdsLine: Bool?
    public let terminal: String?
    /// `guard` is a Swift keyword; the backticked name still encodes as "guard".
    public let `guard`: GuardSpec?
    public let deflect: DeflectSpec?
    public let evade: EvadeSpec?

    /// Milestone 1 ships the Sound tier only; the map is already plural so Rough and
    /// Silent drop in without touching callers.
    public func frames(tier: String = "sound") -> Frames {
        tiers[tier] ?? tiers["sound"]!
    }

    public func length(tier: String = "sound") -> Int {
        let f = frames(tier: tier)
        return f.startup + f.active + f.recovery
    }
}

private struct StyleFile: Codable {
    let style: String
    let displayName: String
    let techniques: [Technique]
}

/// Every technique the game knows, indexed the three ways the simulation asks for it.
///
/// A value type, immutable once built, and `Sendable` all the way down — which is what
/// lets `TechniqueDB` hand it out from any thread without a lock.
public struct TechniqueTable: Sendable {
    public let all: [Technique]
    let byId: [String: Technique]
    /// (style, verb, intent) -> technique. The style is part of the key, so adding
    /// Standing Water in M2 is another file in this same table, not another global.
    let byGrammar: [String: Technique]

    static let empty = TechniqueTable(all: [], byId: [:], byGrammar: [:])

    init(all: [Technique], byId: [String: Technique], byGrammar: [String: Technique]) {
        self.all = all; self.byId = byId; self.byGrammar = byGrammar
    }
}

public enum TechniqueDB {
    public static var byId: [String: Technique] { table.byId }
    public static var all: [Technique] { table.all }

    static func grammarKey(_ style: String, _ verb: Verb, _ intent: Intent) -> String {
        "\(style)|\(verb.rawValue)|\(intent.rawValue)"
    }

    /// Validation is a load step. A technique whose windows are incoherent fails
    /// loudly rather than rotting silently.
    public static func validate(_ t: Technique, style: String) -> [String] {
        var e: [String] = []
        let where_ = "\(style):\(t.id)"
        guard let tier = t.tiers["sound"] else {
            return ["\(where_): no 'sound' tier (M1 ships Sound only)"]
        }
        if tier.startup < 0 || tier.active < 0 || tier.recovery < 0 || tier.breath < 0 {
            e.append("\(where_): frame windows must be non-negative")
        }
        let len = tier.startup + tier.active + tier.recovery
        if tier.cancelFrom > len {
            e.append("\(where_): cancelFrom \(tier.cancelFrom) exceeds length \(len)")
        }
        if t.kind.isOffensive {
            if t.reach == nil { e.append("\(where_): offensive technique needs reach") }
            if t.structure == nil { e.append("\(where_): offensive technique needs structure.force") }
            if tier.active <= 0 { e.append("\(where_): offensive technique needs active frames") }
            guard let commitAt = t.commitAt else {
                e.append("\(where_): offensive technique needs commitAt (the Lie boundary)")
                return e
            }
            if commitAt >= tier.startup {
                e.append("\(where_): commitAt \(commitAt) must fall inside startup \(tier.startup)")
            }
        }
        return e
    }

    public enum LoadError: Error, CustomStringConvertible {
        case missingResource
        case invalid([String])
        public var description: String {
            switch self {
            case .missingResource: return "low-river.json not found in MartialGodCore resources"
            case .invalid(let errs): return "TechniqueDB invalid:\n  " + errs.joined(separator: "\n  ")
            }
        }
    }

    /// The loaded table, built exactly once.
    ///
    /// Swift initialises a `static let` lazily under `swift_once`, so this is
    /// thread-safe to create and every read afterwards is a plain load with no lock.
    /// That is the whole reason the table is a value type rather than three mutable
    /// dictionaries: the hot path stays free AND becomes concurrency-correct, which
    /// are usually competing goals and here are the same one, because the data is
    /// genuinely immutable after load.
    ///
    /// Held as a `Result` so a missing or invalid resource still fails loudly at
    /// `loadDefault()`, rather than trapping halfway through a fight.
    private static let loaded: Result<TechniqueTable, Error> = Result {
        guard let url = Bundle.module.url(forResource: "low-river", withExtension: "json") else {
            throw LoadError.missingResource
        }
        return try makeTable(from: Data(contentsOf: url))
    }

    private static let table: TechniqueTable = (try? loaded.get()) ?? .empty

    /// Load from the package resource. Idempotent — and now idempotent by construction
    /// rather than by discipline, since there is nothing left to mutate. Safe to call
    /// from app start, from every test's setUp, and from both at once.
    public static func loadDefault() throws {
        _ = try loaded.get()
    }

    /// Decode and validate a style file into a table. Pure: it touches no global state,
    /// which is what keeps the validation path testable without a loaded game.
    public static func makeTable(from data: Data) throws -> TechniqueTable {
        let file = try JSONDecoder().decode(StyleFile.self, from: data)
        var errors: [String] = []
        for t in file.techniques { errors.append(contentsOf: validate(t, style: file.style)) }
        if !errors.isEmpty { throw LoadError.invalid(errors) }

        var byId: [String: Technique] = [:]
        var byGrammar: [String: Technique] = [:]
        for t in file.techniques {
            byId[t.id] = t
            byGrammar[grammarKey(file.style, t.verb, t.intent)] = t
        }
        return TechniqueTable(all: file.techniques, byId: byId, byGrammar: byGrammar)
    }

    public static func technique(_ id: String) -> Technique {
        guard let t = table.byId[id] else { preconditionFailure("unknown technique: \(id)") }
        return t
    }

    static func grammar(_ style: String, _ verb: Verb, _ intent: Intent) -> Technique? {
        table.byGrammar[grammarKey(style, verb, intent)]
    }
}
