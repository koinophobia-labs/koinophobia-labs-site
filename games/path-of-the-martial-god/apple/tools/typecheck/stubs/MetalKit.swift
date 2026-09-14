// Stub. See ../README.md — not Apple's API, just enough shape to type-check our code.
// Metal and MetalKit are merged into one module here; on Apple platforms MetalKit
// re-exports Metal, so our code's import list is unchanged.
@_exported import Foundation   // Apple frameworks re-export Foundation; the stubs match that
import UIKit

public struct MTLClearColor {
    public var red: Double, green: Double, blue: Double, alpha: Double
    public init(red: Double, green: Double, blue: Double, alpha: Double) {
        self.red = red; self.green = green; self.blue = blue; self.alpha = alpha
    }
}

public enum MTLPixelFormat { case invalid, bgra8Unorm, depth32Float }
public enum MTLVertexFormat { case float, float2, float3, float4 }
public enum MTLCompareFunction { case never, less, equal, lessEqual, greater, always }
public enum MTLPrimitiveType { case point, line, triangle, triangleStrip }
public enum MTLCullMode { case none, front, back }
public enum MTLLoadAction { case dontCare, load, clear }
public enum MTLStoreAction { case dontCare, store }

public struct MTLResourceOptions: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let storageModeShared = MTLResourceOptions(rawValue: 1)
    public static let storageModePrivate = MTLResourceOptions(rawValue: 2)
}

public protocol MTLBuffer: AnyObject { func contents() -> UnsafeMutableRawPointer }
public protocol MTLDrawable: AnyObject {}
public protocol MTLTexture: AnyObject {}
public protocol MTLFunction: AnyObject {}
public protocol MTLLibrary: AnyObject { func makeFunction(name: String) -> MTLFunction? }
public protocol MTLDepthStencilState: AnyObject {}
public protocol MTLRenderPipelineState: AnyObject {}

public protocol MTLRenderCommandEncoder: AnyObject {
    func setRenderPipelineState(_ s: MTLRenderPipelineState)
    func setDepthStencilState(_ s: MTLDepthStencilState?)
    func setCullMode(_ m: MTLCullMode)
    func setVertexBuffer(_ b: MTLBuffer?, offset: Int, index: Int)
    func setVertexBytes(_ bytes: UnsafeRawPointer, length: Int, index: Int)
    func drawPrimitives(type: MTLPrimitiveType, vertexStart: Int, vertexCount: Int)
    func endEncoding()
}

public protocol MTLCommandBuffer: AnyObject {
    func makeRenderCommandEncoder(descriptor: MTLRenderPassDescriptor) -> MTLRenderCommandEncoder?
    func addCompletedHandler(_ block: @escaping (MTLCommandBuffer) -> Void)
    func present(_ drawable: MTLDrawable)
    func commit()
}

public protocol MTLCommandQueue: AnyObject { func makeCommandBuffer() -> MTLCommandBuffer? }

public protocol MTLDevice: AnyObject {
    func makeCommandQueue() -> MTLCommandQueue?
    func makeDefaultLibrary() -> MTLLibrary?
    func makeBuffer(length: Int, options: MTLResourceOptions) -> MTLBuffer?
    func makeRenderPipelineState(descriptor: MTLRenderPipelineDescriptor) throws -> MTLRenderPipelineState
    func makeDepthStencilState(descriptor: MTLDepthStencilDescriptor) -> MTLDepthStencilState?
}

public func MTLCreateSystemDefaultDevice() -> MTLDevice? { nil }

public final class MTLVertexAttributeDescriptor {
    public var format: MTLVertexFormat = .float
    public var offset: Int = 0
    public var bufferIndex: Int = 0
}
public final class MTLVertexBufferLayoutDescriptor { public var stride: Int = 0 }
public final class MTLVertexAttributeDescriptorArray {
    private var store: [Int: MTLVertexAttributeDescriptor] = [:]
    public subscript(i: Int) -> MTLVertexAttributeDescriptor! {
        get { store[i] ?? { let d = MTLVertexAttributeDescriptor(); store[i] = d; return d }() }
        set { store[i] = newValue }
    }
}
public final class MTLVertexBufferLayoutDescriptorArray {
    private var store: [Int: MTLVertexBufferLayoutDescriptor] = [:]
    public subscript(i: Int) -> MTLVertexBufferLayoutDescriptor! {
        get { store[i] ?? { let d = MTLVertexBufferLayoutDescriptor(); store[i] = d; return d }() }
        set { store[i] = newValue }
    }
}
public final class MTLVertexDescriptor {
    public var attributes = MTLVertexAttributeDescriptorArray()
    public var layouts = MTLVertexBufferLayoutDescriptorArray()
    public init() {}
}

public final class MTLRenderPipelineColorAttachmentDescriptor { public var pixelFormat: MTLPixelFormat = .invalid }
public final class MTLRenderPipelineColorAttachmentDescriptorArray {
    private var store: [Int: MTLRenderPipelineColorAttachmentDescriptor] = [:]
    public subscript(i: Int) -> MTLRenderPipelineColorAttachmentDescriptor! {
        get { store[i] ?? { let d = MTLRenderPipelineColorAttachmentDescriptor(); store[i] = d; return d }() }
        set { store[i] = newValue }
    }
}
public final class MTLRenderPipelineDescriptor {
    public var vertexFunction: MTLFunction?
    public var fragmentFunction: MTLFunction?
    public var vertexDescriptor: MTLVertexDescriptor?
    public var colorAttachments = MTLRenderPipelineColorAttachmentDescriptorArray()
    public var depthAttachmentPixelFormat: MTLPixelFormat = .invalid
    public init() {}
}

public final class MTLDepthStencilDescriptor {
    public var depthCompareFunction: MTLCompareFunction = .always
    public var isDepthWriteEnabled = false
    public init() {}
}

public final class MTLRenderPassDescriptor { public init() {} }

public protocol MTKViewDelegate: AnyObject {
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize)
    func draw(in view: MTKView)
}

open class MTKView: UIView {
    public var device: MTLDevice?
    public weak var delegate: MTKViewDelegate?
    public var colorPixelFormat: MTLPixelFormat = .bgra8Unorm
    public var depthStencilPixelFormat: MTLPixelFormat = .invalid
    public var clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
    public var sampleCount: Int = 1
    public var preferredFramesPerSecond: Int = 60
    public var currentDrawable: MTLDrawable? { nil }
    public var currentRenderPassDescriptor: MTLRenderPassDescriptor? { nil }
    public var drawableSize = CGSize()
    public init(frame: CGRect, device: MTLDevice?) { super.init(frame: frame); self.device = device }
    // MTKView is an Objective-C class, so UIView's init(frame:) is surfaced too.
    public override init(frame: CGRect) { super.init(frame: frame) }
}
