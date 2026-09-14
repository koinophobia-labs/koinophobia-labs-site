import UIKit
import MetalKit
import MartialGodCore

/// Hosts the duel.
///
/// Landscape-locked (see NATIVE_M1_REPORT.md for the orientation decision), safe-area
/// aware, and deferring the system's bottom edge gesture so a thumb resting low on the
/// glass does not summon the home indicator mid-exchange.
public final class GameViewController: UIViewController {

    private var metalView: MTKView!
    private var renderer: Renderer!
    private let session = GameSession()
    private let touch = TouchGrammar()
    private let controller = ControllerInput()

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        metalView = MTKView(frame: view.bounds)
        metalView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        metalView.isMultipleTouchEnabled = true
        metalView.preferredFramesPerSecond = 120   // capped by the device; sim is fixed
        view.addSubview(metalView)

        guard let r = Renderer(view: metalView) else {
            presentUnsupportedDevice()
            return
        }
        renderer = r
        renderer.fight = session.fight
        metalView.delegate = self
        touch.tuning.sensitivity = CGFloat(SettingsStore.shared.settings.controlSensitivity)
        touch.tuning.leftHanded = SettingsStore.shared.settings.leftHanded
        installRestartGesture()
        session.start()
    }

    private func presentUnsupportedDevice() {
        let label = UILabel(frame: view.bounds)
        label.text = "This device does not support Metal."
        label.textAlignment = .center
        label.textColor = .white
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }

    // MARK: - orientation and system gestures

    public override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    public override var prefersHomeIndicatorAutoHidden: Bool { true }
    public override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { [.bottom, .left, .right] }
    public override var prefersStatusBarHidden: Bool { true }

    // MARK: - lifecycle

    public func applicationDidEnterBackground() { session.pause() }
    public func applicationWillEnterForeground() { session.resume() }

    // MARK: - touch

    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Once the fight is over and the outcome has stood, a touch anywhere starts
        // another one. No menu, no button, nothing to read — the same contract the
        // rest of the interface keeps.
        if acceptsTapToFightAgain {
            handleRestart()
            return
        }
        touch.touchesBegan(touches, in: metalView)
    }
    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        touch.touchesMoved(touches, in: metalView)
    }
    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        touch.touchesEnded(touches, in: metalView)
    }
    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        touch.touchesCancelled(touches, in: metalView)
    }

    // MARK: - starting again

    /// How long the outcome is allowed to stand before a tap means "again".
    ///
    /// The last blow of a fight is usually thrown with a finger already moving, so an
    /// immediate tap-to-restart would wipe the screen at the exact moment the whole
    /// milestone is about: seeing what just happened to a body.
    private static let restartGraceSeconds: CFTimeInterval = 1.6

    /// Three fingers, because two is the playing position.
    ///
    /// The original comment here promised a two-finger tap and nothing installed it.
    /// That was the luckier failure: two thumbs on the glass IS how this game is held,
    /// so a two-finger tap would have restarted live fights by accident — a quick tap
    /// on the intent pad and a quick tap for a strike is a two-finger tap. Three
    /// fingers cannot happen while playing, which is the entire requirement for a
    /// control whose only job is to throw a fight away.
    private func installRestartGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleRestart))
        tap.numberOfTouchesRequired = 3
        tap.cancelsTouchesInView = false      // combat input must still reach touchesBegan
        tap.delaysTouchesBegan = false
        tap.delaysTouchesEnded = false
        view.addGestureRecognizer(tap)
    }

    /// True once the fight is over and the outcome has had time to land.
    private var acceptsTapToFightAgain: Bool {
        guard session.fight.over != nil, let ended = session.endedAt else { return false }
        return CACurrentMediaTime() - ended >= Self.restartGraceSeconds
    }

    @objc private func handleRestart() {
        session.restart()
        renderer.fight = session.fight
        touch.reset()
    }
}

extension GameViewController: MTKViewDelegate {
    public func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        renderer.mtkView(view, drawableSizeWillChange: size)
    }

    public func draw(in view: MTKView) {
        // Keep the touch grammar's idea of "toward him" honest every frame.
        let dir = session.camera.opponentScreenDirection(a: session.fight.a,
                                                         b: session.fight.b,
                                                         aspect: renderer.aspect)
        touch.opponentScreenDirection = CGVector(dx: CGFloat(dir.x), dy: CGFloat(dir.y))

        let now = session.advance { [weak self] in
            guard let self else { return InputIntent.neutral }
            // A controller, when present, supersedes glass for that frame — but touch
            // is never removed, so a player can put the controller down mid-fight.
            if let pad = self.controller.sample(opponentBearing: 0, fighterFacing: 0) {
                return pad
            }
            return self.touch.sample(in: self.metalView)
        }

        renderer.fight = session.fight
        renderer.camera = session.camera
        renderer.renderTime = now
        renderer.draw(in: view)
    }
}
