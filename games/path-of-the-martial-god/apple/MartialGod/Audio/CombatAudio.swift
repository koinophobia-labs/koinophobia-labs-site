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
    public func configureSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)

        NotificationCenter.default.addObserver(
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
            }
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

    public func handle(_ e: CombatEvent) {
        switch e.type {
        case .hit:
            play(e.region == .head ? "crack" : "thud", gain: 0.9)
        case .guarded:
            play("block", gain: 0.8)
        case .deflected:
            play("deflect", gain: 0.8)
        case .whiff:
            play("whiff", gain: 0.7)
        case .brokeStructure:
            play("scuff", gain: 1.0)
        case .rise:
            play("scuff", gain: 0.6)
        default:
            break
        }
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
