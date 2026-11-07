// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that

public typealias AVAudioFrameCount = UInt32
public typealias AVAudioFramePosition = Int64

open class AVAudioFormat {
    public init?(standardFormatWithSampleRate: Double, channels: UInt32) {}
    public var sampleRate: Double { 44100 }
    public var channelCount: UInt32 { 1 }
}

open class AVAudioPCMBuffer {
    public var frameLength: AVAudioFrameCount = 0
    public var frameCapacity: AVAudioFrameCount { 0 }
    public var floatChannelData: UnsafePointer<UnsafeMutablePointer<Float>>? { nil }
    public var format: AVAudioFormat { AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)! }
    public init?(pcmFormat: AVAudioFormat, frameCapacity: AVAudioFrameCount) {}
}

open class AVAudioNode { public init() {} }
open class AVAudioMixerNode: AVAudioNode { public var outputVolume: Float = 1 }

public struct AVAudioPlayerNodeBufferOptions: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let loops = AVAudioPlayerNodeBufferOptions(rawValue: 1)
    public static let interrupts = AVAudioPlayerNodeBufferOptions(rawValue: 2)
    public static let interruptsAtLoop = AVAudioPlayerNodeBufferOptions(rawValue: 4)
}

open class AVAudioPlayerNode: AVAudioNode {
    public var volume: Float = 1
    public var isPlaying: Bool { false }
    open func play() {}
    open func stop() {}
    open func scheduleBuffer(_ buffer: AVAudioPCMBuffer, at when: AVAudioTime?,
                             options: AVAudioPlayerNodeBufferOptions,
                             completionHandler: (() -> Void)?) {}
}

open class AVAudioTime {}

open class AVAudioEngine {
    public var mainMixerNode = AVAudioMixerNode()
    public var outputNode = AVAudioNode()
    public var isRunning: Bool { false }
    open func attach(_ node: AVAudioNode) {}
    open func connect(_ from: AVAudioNode, to: AVAudioNode, format: AVAudioFormat?) {}
    open func start() throws {}
    open func stop() {}
    open func pause() {}
    public init() {}
}

public let AVAudioSessionInterruptionTypeKey = "AVAudioSessionInterruptionTypeKey"
public let AVAudioSessionInterruptionOptionKey = "AVAudioSessionInterruptionOptionKey"

open class AVAudioSession {
    public static func sharedInstance() -> AVAudioSession { AVAudioSession() }
    public struct Category: RawRepresentable, Sendable {
        public let rawValue: String
        public init(rawValue: String) { self.rawValue = rawValue }
        public static let ambient = Category(rawValue: "ambient")
        public static let playback = Category(rawValue: "playback")
        public static let soloAmbient = Category(rawValue: "soloAmbient")
    }
    public struct CategoryOptions: OptionSet, Sendable {
        public let rawValue: UInt
        public init(rawValue: UInt) { self.rawValue = rawValue }
        public static let mixWithOthers = CategoryOptions(rawValue: 1)
    }
    public enum InterruptionType: UInt { case began = 1, ended = 0 }
    public struct InterruptionOptions: OptionSet, Sendable {
        public let rawValue: UInt
        public init(rawValue: UInt) { self.rawValue = rawValue }
        public static let shouldResume = InterruptionOptions(rawValue: 1)
    }
    public static let interruptionNotification = Notification.Name("AVAudioSessionInterruption")
    open func setCategory(_ c: Category, mode: Mode, options: CategoryOptions) throws {}
    open func setCategory(_ c: Category, options: CategoryOptions) throws {}
    public struct SetActiveOptions: OptionSet, Sendable {
        public let rawValue: UInt
        public init(rawValue: UInt) { self.rawValue = rawValue }
        public static let notifyOthersOnDeactivation = SetActiveOptions(rawValue: 1)
    }
    open func setActive(_ active: Bool) throws {}
    open func setActive(_ active: Bool, options: SetActiveOptions) throws {}
    public struct Mode: RawRepresentable, Sendable {
        public let rawValue: String
        public init(rawValue: String) { self.rawValue = rawValue }
        public static let `default` = Mode(rawValue: "default")
    }
}
