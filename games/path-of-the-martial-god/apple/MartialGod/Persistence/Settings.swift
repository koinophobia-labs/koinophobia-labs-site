import Foundation

/// Minimal production persistence.
///
/// Deliberately small — the Ledger is not being built here — but chosen so it can grow
/// into one: a single `Codable` document written atomically to Application Support,
/// versioned from the first release so a migration path exists before it is needed.
/// `UserDefaults` is used only for genuine preferences, never for game state.
public struct GameSettings: Codable, Equatable {
    public var schemaVersion = 1

    // MARK: presentation
    public var soundEnabled = true
    public var musicVolume: Double = 0.6
    public var effectsVolume: Double = 0.9
    public var breathVolume: Double = 1.0

    // MARK: accessibility — architected in from the start, not bolted on later
    /// Widens every timing window. Never changes what decisions exist, only the
    /// bandwidth needed to make them.
    public var timingWindowScale: Double = 1.0
    /// Honours Reduce Motion: damps camera movement and impact shake.
    public var reduceMotion = false
    /// 0 disables haptics entirely.
    public var hapticIntensity: Double = 1.0
    /// Draws state cues that do not rely on colour alone.
    public var colourIndependentCues = false
    /// Optional captions for combat audio, for players who cannot hear the breathing.
    public var combatCaptions = false
    public var leftHanded = false
    public var controlSensitivity: Double = 1.0

    // MARK: diagnostics
    /// The debug overlay is OFF by default and must stay that way: the milestone's
    /// whole claim is that the fight reads without meters.
    public var debugOverlay = false

    public init() {}
}

public final class SettingsStore {
    public static let shared = SettingsStore()

    private let fileURL: URL
    public private(set) var settings: GameSettings

    private init() {
        let fm = FileManager.default
        let dir = (try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask,
                               appropriateFor: nil, create: true))
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        fileURL = dir.appendingPathComponent("settings.json")
        if let data = try? Data(contentsOf: fileURL),
           let decoded = try? JSONDecoder().decode(GameSettings.self, from: data) {
            settings = SettingsStore.migrate(decoded)
        } else {
            settings = GameSettings()
        }
    }

    /// Migration exists from version 1 so that adding a field later is routine rather
    /// than a compatibility incident.
    private static func migrate(_ s: GameSettings) -> GameSettings {
        var out = s
        if out.schemaVersion < 1 { out.schemaVersion = 1 }
        return out
    }

    public func update(_ mutate: (inout GameSettings) -> Void) {
        mutate(&settings)
        save()
    }

    public func save() {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        // Atomic: a crash mid-write must not leave an unreadable settings file.
        try? data.write(to: fileURL, options: .atomic)
    }
}

/// Local playtest diagnostics, kept on device. No network, no backend, no analytics
/// SDK — which also keeps the App Store privacy disclosure honest and empty.
public struct FightRecord: Codable {
    public var at: Date
    public var durationSeconds: Double
    public var winner: String?
    public var reason: String?
    public var terminal: String?
    public var techniquesAttempted: Int
    public var techniquesLanded: Int
    public var structureBreaksCaused: Int
    public var guardBypassedByAngle: Int
    public var secondsStaggered: Double
    public var bandSeconds: [String: Double]
}

public final class DiagnosticsStore {
    public static let shared = DiagnosticsStore()
    private let fileURL: URL
    public private(set) var records: [FightRecord] = []

    private init() {
        let fm = FileManager.default
        let dir = (try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask,
                               appropriateFor: nil, create: true))
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        fileURL = dir.appendingPathComponent("playtest.json")
        if let data = try? Data(contentsOf: fileURL),
           let decoded = try? JSONDecoder().decode([FightRecord].self, from: data) {
            records = decoded
        }
    }

    public func append(_ r: FightRecord) {
        records.append(r)
        if records.count > 200 { records.removeFirst(records.count - 200) }
        if let data = try? JSONEncoder().encode(records) {
            try? data.write(to: fileURL, options: .atomic)
        }
    }
}
