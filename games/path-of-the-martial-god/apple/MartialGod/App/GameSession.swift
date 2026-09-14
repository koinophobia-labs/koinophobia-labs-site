import QuartzCore
import MartialGodCore

/// Owns one fight and drives it at a FIXED timestep, independent of render rate.
///
/// The simulation runs at exactly 60 Hz whatever the display does. On a ProMotion
/// device the renderer may present at 120 Hz; that changes interpolation and nothing
/// else. Timing truth belongs to the simulation, never to the frame.
public final class GameSession {

    public private(set) var fight: Fight
    public let audio = CombatAudio()
    public let haptics = Haptics()
    public var camera = CombatCamera()

    private var accumulator: Double = 0
    private var lastTime: CFTimeInterval = 0
    /// Impact frame-hold, in seconds. The single most effective impact tool there is.
    private var hold: Double = 0
    private var running = false
    private var options = FightOptions()

    // Local diagnostics, mirroring the reference build's playtest instrumentation.
    private var attempted = 0, landed = 0, breaks = 0, bypassAngle = 0
    private var staggeredTicks = 0
    private var bandTicks: [String: Int] = [:]

    public init() {
        try? TechniqueDB.loadDefault()
        fight = Fight(options: options)
    }

    public func start() {
        audio.configureSession()
        audio.start()
        haptics.start()
        running = true
        lastTime = CACurrentMediaTime()
    }

    /// Backgrounding, a phone call, the lock screen: the fight must NOT keep silently
    /// simulating. Time is not accumulated while paused, so resuming never fast-forwards.
    public func pause() {
        running = false
        audio.pause()
        haptics.stop()
    }

    public func resume() {
        guard !running else { return }
        running = true
        accumulator = 0
        lastTime = CACurrentMediaTime()
        audio.resume()
        haptics.start()
    }

    public func restart() {
        fight = Fight(options: options)
        accumulator = 0
        hold = 0
        attempted = 0; landed = 0; breaks = 0; bypassAngle = 0
        staggeredTicks = 0; bandTicks = [:]
        lastTime = CACurrentMediaTime()
    }

    /// Advance by wall-clock time. Returns the render-time used for pose animation.
    @discardableResult
    public func advance(input: () -> InputIntent) -> Double {
        let now = CACurrentMediaTime()
        var dt = now - lastTime
        lastTime = now
        guard running else { return now }

        // A long stall (a breakpoint, a system alert that slipped through) must not
        // produce a burst of catch-up ticks the player never saw coming.
        dt = min(dt, 0.25)

        if hold > 0 {
            hold -= dt
            camera.update(a: fight.a, b: fight.b, dt: Float(dt))
            return now
        }

        // The Final Inch is the only time dilation in the game, so when time bends it
        // always means something. It slows PRESENTATION; the tick rate is untouched.
        let rate = fight.inch != nil ? InchRule.dilation : 1.0
        accumulator += dt * rate

        var steps = 0
        while accumulator >= Sim.tickSeconds && steps < 6 {
            accumulator -= Sim.tickSeconds
            steps += 1
            if fight.over != nil { break }
            fight.step(input: input())
            consume(fight.events)
            sampleDiagnostics()
        }

        camera.update(a: fight.a, b: fight.b, dt: Float(dt))
        audio.breath(for: fight.a, now: now, isPlayer: true)
        audio.breath(for: fight.b, now: now, isPlayer: false)
        return now
    }

    private func consume(_ events: [CombatEvent]) {
        for e in events {
            audio.handle(e)
            haptics.handle(e, playerIsSubject: e.who == playerID)

            switch e.type {
            case .begin:
                if e.who == playerID,
                   let id = e.technique,
                   TechniqueDB.technique(id).kind.isOffensive { attempted += 1 }
            case .hit:
                if e.by == playerID { landed += 1 }
                hold = 0.070
                camera.impulse(0.55)
            case .guarded:
                hold = 0.040
                camera.impulse(0.20)
            case .brokeStructure:
                if e.by == playerID { breaks += 1 }
                hold = 0.140
                camera.impulse(1.0)
            case .guardBypassed:
                // Caused by whoever is not the subject; with two fighters that is the
                // other one. Counted separately from leg-strike bypasses upstream.
                if e.who == opponentID { bypassAngle += 1 }
            case .over:
                recordFight()
            default:
                break
            }
        }
    }

    private func sampleDiagnostics() {
        if fight.a.state == .staggered { staggeredTicks += 1 }
        let band = bandFor(distance(fight.a, fight.b)).rawValue
        bandTicks[band, default: 0] += 1
    }

    private func recordFight() {
        guard let over = fight.over else { return }
        var bands: [String: Double] = [:]
        for (k, v) in bandTicks { bands[k] = Double(v) / 60.0 }
        DiagnosticsStore.shared.append(FightRecord(
            at: Date(),
            durationSeconds: Double(fight.tick) / 60.0,
            winner: over.winnerID,
            reason: over.reason,
            terminal: over.terminal,
            techniquesAttempted: attempted,
            techniquesLanded: landed,
            structureBreaksCaused: breaks,
            guardBypassedByAngle: bypassAngle,
            secondsStaggered: Double(staggeredTicks) / 60.0,
            bandSeconds: bands
        ))
    }
}
