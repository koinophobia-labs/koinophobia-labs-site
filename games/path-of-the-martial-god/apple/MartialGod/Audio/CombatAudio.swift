import AVFoundation
import MartialGodCore

/// Audio is gameplay communication, not decoration.
///
/// AUDIO_DIRECTION.md: breathing is the main HUD, hit sounds are low and bodily, and
/// master-tier fighters are QUIET. With no stamina bar on screen, the breath channel
/// is the only continuous readout of the game's self-inflicted resource, so it is
/// mixed above everything except impacts.
///
/// Everything is synthesised from generated buffers. No audio assets exist yet and
/// none are needed to prove the channel works.
/// Main-actor isolated. Every cue is driven synchronously from the render loop, and
/// every volume decision reads `SettingsStore`, which is main-actor state. Nothing here
/// runs on an audio callback — `scheduleBuffer` is called with no completion handler —
/// so there is no off-main path into this type to preserve.
@MainActor
public final class CombatAudio {
    private let engine = AVAudioEngine()
    private let mixer = AVAudioMixerNode()
    private var buffers: [String: AVAudioPCMBuffer] = [:]
    private var players: [AVAudioPlayerNode] = []
    private var nextPlayer = 0
    private var breathClock: [String: TimeInterval] = [:]
    private var started = false

    private let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!

    public init() {}

    // MARK: - session and lifecycle

    /// `.ambient` on purpose: this game must never stop someone's music, and it must
    /// never claim the session in a way that complicates review.
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

    public func configureSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)

        observers.append(NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session, queue: .main) { [weak self] note in
                guard let info = note.userInfo,
                      let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
                switch type {
                case .began:
                    self?.pause()
                case .ended:
                    // Only resume if the system says we may.
                    if let opt = info[AVAudioSessionInterruptionOptionKey] as? UInt,
                       AVAudioSession.InterruptionOptions(rawValue: opt).contains(.shouldResume) {
                        self?.resume()
                    }
                @unknown default:
                    break
                }
            })
    }

    public func start() {
        guard !started else { return }
        engine.attach(mixer)
        engine.connect(mixer, to: engine.mainMixerNode, format: format)
        for _ in 0..<12 {
            let p = AVAudioPlayerNode()
            engine.attach(p)
            engine.connect(p, to: mixer, format: format)
            players.append(p)
        }
        buildBuffers()
        try? engine.start()
        for p in players { p.play() }
        started = true
    }

    public func pause() {
        engine.pause()
    }

    public func resume() {
        guard started else { return }
        try? AVAudioSession.sharedInstance().setActive(true)
        try? engine.start()
    }

    public func stop() {
        engine.stop()
        started = false
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    // MARK: - synthesis

    private func buffer(seconds: Double, _ fill: (Int, Double) -> Float) -> AVAudioPCMBuffer {
        let frames = AVAudioFrameCount(seconds * format.sampleRate)
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!
        buf.frameLength = frames
        let ptr = buf.floatChannelData![0]
        for i in 0..<Int(frames) {
            ptr[i] = fill(i, Double(i) / format.sampleRate)
        }
        return buf
    }

    private func buildBuffers() {
        // A body sound: low, short, cloth-compressed. Never a whoosh.
        buffers["thud"] = buffer(seconds: 0.18) { _, t in
            let env = exp(-t * 26)
            let body = sin(2 * .pi * 88 * t) * 0.8 + sin(2 * .pi * 140 * t) * 0.2
            let cloth = (Double.random(in: -1...1)) * exp(-t * 60) * 0.25
            return Float((body * env + cloth) * 0.5)
        }
        // Head contact: sharper, with bone in it.
        buffers["crack"] = buffer(seconds: 0.12) { _, t in
            let env = exp(-t * 42)
            let body = sin(2 * .pi * 155 * t)
            let snap = (Double.random(in: -1...1)) * exp(-t * 120) * 0.6
            return Float((body * env + snap) * 0.55)
        }
        // Forearms: a flat slap, audibly NOT a hit, so defence reads by ear.
        buffers["block"] = buffer(seconds: 0.10) { _, t in
            let env = exp(-t * 48)
            let n = Double.random(in: -1...1)
            return Float(n * env * 0.38)
        }
        // Deflection: brighter, shorter, and clearly the good outcome.
        buffers["deflect"] = buffer(seconds: 0.13) { _, t in
            let env = exp(-t * 34)
            let n = Double.random(in: -1...1)
            let ring = sin(2 * .pi * 2600 * t) * 0.35
            return Float((n * 0.5 + ring) * env * 0.3)
        }
        // Not an impact at all: the sound of feet losing the floor.
        buffers["scuff"] = buffer(seconds: 0.42) { _, t in
            let env = exp(-t * 7)
            let n = Double.random(in: -1...1)
            return Float(n * env * 0.32)
        }
        buffers["step"] = buffer(seconds: 0.07) { _, t in
            let env = exp(-t * 55)
            let n = Double.random(in: -1...1)
            return Float(n * env * 0.12)
        }
        // Only committed attacks displace enough air to be heard, and only slightly.
        buffers["whiff"] = buffer(seconds: 0.14) { _, t in
            let env = sin(.pi * min(1, t / 0.14))
            let n = Double.random(in: -1...1)
            return Float(n * env * 0.10)
        }
        // Breath: filtered noise, opening up as it gets ragged.
        // Cloth and body motion. Almost subliminal on its own; its job is to stop a
        // committed technique sounding like nothing until it lands.
        buffers["cloth"] = buffer(seconds: 0.16) { _, t in
            let env = sin(.pi * min(1, t / 0.16))
            return Float(Double.random(in: -1...1) * env * 0.035)
        }

        // Exhaustion. A drawn, involuntary pull of air — not a grunt of effort.
        buffers["gasp"] = buffer(seconds: 0.52) { _, t in
            let env = sin(.pi * min(1, t / 0.52))
            let rasp = Double.random(in: -1...1) * 0.22
            return Float((rasp + sin(t * 210) * 0.05) * env * 0.5)
        }

        // The Final Inch opening. Low, sustained, and the only sound in the game with
        // no physical cause — the fight stops being physics and becomes a decision.
        buffers["inch"] = buffer(seconds: 0.85) { _, t in
            let env = min(1, t / 0.12) * max(0, 1 - (t - 0.12) / 0.73)
            return Float((sin(t * 78) * 0.5 + sin(t * 117) * 0.22) * env * 0.30)
        }

        // Resolution. One low settling note under the outcome; the fight is over and
        // the room is quiet again.
        buffers["resolve"] = buffer(seconds: 1.1) { _, t in
            let env = max(0, 1 - t / 1.1)
            return Float((sin(t * 62) * 0.6 + sin(t * 93) * 0.18) * env * env * 0.34)
        }

        // Room tone. Nearly nothing — the sound of a place with two people in it and
        // no music. Long enough to cover the widest Inch window (1.4s at high mastery).
        buffers["room"] = buffer(seconds: 1.6) { _, t in
            let env = min(1, t / 0.10) * max(0, 1 - (t - 0.10) / 1.5)
            return Float(Double.random(in: -1...1) * env * 0.018)
        }

        for (name, bright) in [("breath_easy", 0.25), ("breath_hard", 0.85)] {
            buffers[name] = buffer(seconds: 0.30 + bright * 0.2) { _, t in
                let env = sin(.pi * min(1, t / (0.30 + bright * 0.2)))
                let n = Double.random(in: -1...1)
                return Float(n * env * (0.05 + bright * 0.16))
            }
        }
    }

    private func play(_ name: String, gain: Float) {
        guard started, SettingsStore.shared.settings.soundEnabled,
              let buf = buffers[name] else { return }
        let p = players[nextPlayer]
        nextPlayer = (nextPlayer + 1) % players.count
        p.volume = gain * Float(SettingsStore.shared.settings.effectsVolume)
        p.scheduleBuffer(buf, at: nil, options: .interrupts, completionHandler: nil)
    }

    // MARK: - gameplay hooks

    /// COMBAT_SYSTEM.md §10: "Audio drops to breath and room tone."
    ///
    /// Not a mood choice. The Inch is the one moment the game asks a question, and it
    /// asks it with no prompt and no menu — so the soundtrack has to get out of the way
    /// and leave the two things that still mean something: someone breathing, and the
    /// room they are standing in.
    private var inchOpen = false

    public func setInchOpen(_ open: Bool) {
        guard open != inchOpen else { return }
        inchOpen = open
        if open { play("room", gain: 1.0) }
    }

    /// Everything that goes through here ducks during the Inch. Breath deliberately
    /// does NOT go through here — it is what the duck exists to reveal.
    private func duck(_ gain: Float) -> Float {
        inchOpen ? gain * 0.16 : gain
    }

    public func handle(_ e: CombatEvent) {
        switch e.type {
        case .hit:
            play(e.region == .head ? "crack" : "thud", gain: duck(0.9))
        case .guarded:
            play("block", gain: duck(0.8))
        case .deflected:
            play("deflect", gain: duck(0.8))
        case .whiff:
            play("whiff", gain: duck(0.7))
        case .brokeStructure:
            play("scuff", gain: duck(1.0))
        case .rise:
            play("scuff", gain: duck(0.6))
        case .begin:
            // Cloth on the wind-up, so a commitment is audible before it arrives.
            if let id = e.technique, TechniqueDB.technique(id).kind.isOffensive {
                play("cloth", gain: duck(0.5))
            }
        case .gassed:
            play("gasp", gain: duck(0.85))
        case .inchOpen:
            play("inch", gain: 0.9)
        case .terminal:
            play("resolve", gain: 0.9)
        case .over:
            // Only when no terminal preceded it. `stopped` and `finished` mean a
            // terminal event already rang this note a moment ago; `unconscious` and
            // `yielded` end the fight without one. Ringing it twice inside a second
            // would turn the game's quietest moment into a chime.
            if e.reason == "unconscious" || e.reason == "yielded" {
                play("resolve", gain: 0.8)
            }
        default:
            break
        }
    }

    /// A footstep, triggered by ground actually covered rather than by a timer.
    ///
    /// Distance-driven so the rhythm IS the movement: circling ticks along, a committed
    /// step-in lands one heavy footfall, and a fighter holding their ground is silent.
    public func footstep(weight: Double) {
        play("step", gain: duck(Float(0.22 + weight * 0.30)))
    }

    /// The breathing loop. Rate and volume both track Breath, and a master is quieter
    /// than a novice at the same effort — so the player hears competence as well as
    /// exhaustion.
    public func breath(for f: Fighter, now: TimeInterval, isPlayer: Bool) {
        guard started, SettingsStore.shared.settings.soundEnabled else { return }
        let due = breathClock[f.id] ?? 0
        guard now >= due else { return }
        let frac = f.breath / MaxValue.breath
        let period = 0.22 + frac * 0.95
        breathClock[f.id] = now + period
        let gain = Float((0.055 + (1 - frac) * 0.16) * (1 - f.mastery * 0.30))
            * Float(SettingsStore.shared.settings.breathVolume)
            * (isPlayer ? 1.0 : 0.7)
        play(frac < 0.4 ? "breath_hard" : "breath_easy", gain: gain)
    }
}
