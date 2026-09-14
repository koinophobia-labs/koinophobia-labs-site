import SwiftUI
import UIKit

/// Application entry point.
///
/// A SwiftUI shell around a UIKit/Metal game view: SwiftUI owns the scene and its
/// lifecycle, UIKit owns the touch stream and the drawable. Menus and settings will be
/// SwiftUI; the fight never will.
@main
struct MartialGodApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @State private var host = GameHost()

    var body: some Scene {
        WindowGroup {
            GameContainer(host: host)
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .onChange(of: scenePhase) { _, phase in
                    switch phase {
                    case .active:     host.controller?.applicationWillEnterForeground()
                    case .inactive:   host.controller?.applicationDidEnterBackground()
                    case .background: host.controller?.applicationDidEnterBackground()
                    @unknown default: break
                    }
                }
        }
    }
}

/// Holds the view controller so the scene-phase observer can reach it.
@Observable
final class GameHost {
    var controller: GameViewController?
}

struct GameContainer: UIViewControllerRepresentable {
    let host: GameHost

    func makeUIViewController(context: Context) -> GameViewController {
        let vc = GameViewController()
        host.controller = vc
        return vc
    }

    func updateUIViewController(_ uiViewController: GameViewController, context: Context) {}
}
