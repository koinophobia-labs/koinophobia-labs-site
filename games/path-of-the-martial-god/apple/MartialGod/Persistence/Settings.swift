import Foundation
#if canImport(UIKit)
import UIKit
#endif

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
    public var effectsVolume: Double = 0.9
    public var breathVolume: Double = 1.0

    // MARK: accessibility — architected in from the start, not bolted on later
    /// Honours Reduce Motion: damps camera movement and impact shake. Defaults from
    /// the system switch rather than waiting for a settings screen that does not
    /// exist yet, because the people who need it have already set it once.
    public var reduceMotion = false
    /// 0 disables haptics entirely.
    public var hapticIntensity: Double = 1.0
    public var leftHanded = false
    public var controlSensitivity: Double = 1.0

    /// Whether the control card has been shown. Once only — a game that explains
    /// itself every launch is telling you it does not trust its own legibility.
    public var hasSeenControls = false

    /// Settings that are DECLARED AND NOT YET HONOURED.
    ///
    /// They are kept because each represents a real design commitment with work behind
    /// it, and deleting them would lose the intention. They are quarantined here
    /// because this milestone has already shipped one feature that read as implemented,
    /// was documented, had a named constant, and never executed — the input buffer. The
    /// lesson was not "be careful"; it was that a declaration which looks live and is
    /// not will be believed by the next person to read it. So nothing in `Reserved` can
    /// be read without the call site saying `reserved.` out loud, and
    /// `settings-are-wired.test.js` fails if a field outside this struct has no
    /// consumer.
    public struct Reserved: Codable, Equatable {
        /// Widens every timing window. Never changes what decisions exist, only the
        /// bandwidth needed to make them. NOT WIRED: it belongs inside the simulation,
        /// so it has to land in the JavaScript oracle and the Swift port together, with
        /// re-baselined traces. Adding it to the port alone would break the one
        /// guarantee the port has.
        public var timingWindowScale: Double = 1.0
        /// Draws state cues that do not rely on colour alone. NOT WIRED: the renderer
        /// is a scaffold with no cue layer to make colour-independent yet.
        public var colourIndependentCues = false
        /// Captions for combat audio, for players who cannot hear the breathing.
        /// NOT WIRED: nothing in the app draws text.
        public var combatCaptions = false
        public init() {}
    }
    public var reserved = Reserved()

    public init() {}
}

/// Main-actor isolated, because it reads main-actor state.
///
/// `UIAccessibility.isReduceMotionEnabled` is a main-actor query, and this type calls
/// it in two places: once from `init` and once from a notification block. The block
/// already registers on `.main`, but the initializer runs on whatever thread first
/// touches `shared` — a lazy `static let` makes no promise about which — so asserting
/// main-thread-ness there would have been a claim rather than a fact.
///
/// Isolating the store states the requirement instead of assuming it. Everything that
/// reads settings today is already on the main actor: the view controller, the audio
/// setup and the session. The cost is that the small JSON write happens on the main
/// thread, which is what it was doing anyway.
@MainActor
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
            hasStoredSettings = true
        } else {
            settings = GameSettings()
            hasStoredSettings = false
        }
        adoptSystemAccessibilityDefaults()
        observeSystemAccessibility()
    }

    /// Whether the player has ever expressed a preference of their own.
    private var hasStoredSettings: Bool

    /// Take the system's answer when the player has not given one here.
    ///
    /// There is no settings screen in Native M1, so without this the accessibility
    /// switches are unreachable — which would make "accessibility from the beginning"
    /// a data structure rather than a feature. Someone who needs Reduce Motion has
    /// already turned it on once, system-wide; asking them to find an in-app toggle
    /// that does not exist is not accessibility.
    ///
    /// A stored file wins: once a player has chosen, the system stops overriding them.
    private func adoptSystemAccessibilityDefaults() {
        #if canImport(UIKit)
        guard !hasStoredSettings else { return }
        settings.reduceMotion = UIAccessibility.isReduceMotionEnabled
        if UIAccessibility.isReduceMotionEnabled { settings.hapticIntensity = 0.5 }
        #endif
    }

    /// The switch can be flipped while the game is open, and a fight in progress must
    /// respond to it rather than waiting for a relaunch.
    /// Notification tokens, kept so they can be removed.
    ///
    /// `addObserver(forName:...)` hands back a token and registers a block that the
    /// centre retains forever. Discarding the token means the observer can never be
    /// removed and a second registration silently doubles up. These objects happen to
    /// live for the app's lifetime today, so nothing leaks in practice — but "happens
    /// to be a singleton" is not a memory-management strategy, and the compiler was
    /// right to say so.
    private var observers: [NSObjectProtocol] = []

    deinit {
        for o in observers { NotificationCenter.default.removeObserver(o) }
    }

    private func observeSystemAccessibility() {
        #if canImport(UIKit)
        observers.append(NotificationCenter.default.addObserver(
            forName: UIAccessibility.reduceMotionStatusDidChangeNotification,
            object: nil, queue: .main
        ) { [weak self] _ in
            // `@Sendable` block: no inherited isolation, and everything below it —
            // the stored settings and the accessibility query alike — is main-actor.
            // Registered on `.main`, so the assumption is a fact about this call site.
            MainActor.assumeIsolated {
                guard let self, !self.hasStoredSettings else { return }
                self.settings.reduceMotion = UIAccessibility.isReduceMotionEnabled
            }
        })
        #endif
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
        hasStoredSettings = true      // the player has now chosen; stop tracking the system
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
