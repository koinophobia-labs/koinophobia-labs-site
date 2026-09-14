import MetalKit
import simd
import MartialGodCore

/// Metal renderer for the duel.
///
/// A production-grade SCAFFOLD, not final art: two readable martial silhouettes on a
/// ground plane, built from the pose contract. It is structured so that the eventual
/// skinned-mesh path replaces the DRAW, not the pose data — `Pose.swift` stays the
/// interface either way.
///
/// The look follows ART_DIRECTION.md by removing things: matte flat colour, one soft
/// directional term, no strike particles, no bloom, no post stack. Impact is weight —
/// frame-holds and a short camera tick — never sparks.
public final class Renderer: NSObject, MTKViewDelegate {

    private struct Vertex {
        var position: SIMD3<Float>
        var normal: SIMD3<Float>
        var colour: SIMD4<Float>
    }

    private struct Uniforms {
        var viewProjection: simd_float4x4
        var lightDirection: SIMD3<Float>
        var ambient: Float
    }

    // Coal, wet slate, lamp-light. Red is RESERVED: blood is the only saturated red.
    private let playerColour = SIMD4<Float>(0.86, 0.87, 0.85, 1)
    private let playerLimb   = SIMD4<Float>(0.55, 0.59, 0.56, 1)
    private let opponentColour = SIMD4<Float>(0.54, 0.57, 0.60, 1)
    private let opponentLimb   = SIMD4<Float>(0.36, 0.39, 0.42, 1)
    private let groundColour = SIMD4<Float>(0.11, 0.13, 0.15, 1)
    private let gridColour   = SIMD4<Float>(0.15, 0.18, 0.20, 1)
    private let shadowColour = SIMD4<Float>(0.05, 0.06, 0.07, 1)
    private let bloodColour  = SIMD4<Float>(0.55, 0.11, 0.12, 1)

    private let device: MTLDevice
    private let queue: MTLCommandQueue
    private var pipeline: MTLRenderPipelineState!
    private var depthState: MTLDepthStencilState!

    /// Triple-buffered so the CPU never writes a buffer the GPU is still reading.
    private var vertexBuffers: [MTLBuffer] = []
    private let inFlight = DispatchSemaphore(value: 3)
    private var frameIndex = 0
    private static let maxVertices = 60_000

    private var scratch: [Vertex] = []
    public var camera = CombatCamera()
    /// Set by the game loop each frame.
    public var fight: Fight?
    public var renderTime: Double = 0
    public private(set) var aspect: Float = 16.0 / 9.0

    public init?(view: MTKView) {
        guard let device = MTLCreateSystemDefaultDevice(),
              let queue = device.makeCommandQueue() else { return nil }
        self.device = device
        self.queue = queue
        super.init()

        view.device = device
        view.colorPixelFormat = .bgra8Unorm
        view.depthStencilPixelFormat = .depth32Float
        view.clearColor = MTLClearColor(red: 0.043, green: 0.055, blue: 0.063, alpha: 1)
        view.sampleCount = 1

        guard buildPipeline(view: view) else { return nil }
        scratch.reserveCapacity(Renderer.maxVertices)
        for _ in 0..<3 {
            guard let b = device.makeBuffer(length: MemoryLayout<Vertex>.stride * Renderer.maxVertices,
                                            options: .storageModeShared) else { return nil }
            vertexBuffers.append(b)
        }
    }

    private func buildPipeline(view: MTKView) -> Bool {
        guard let library = device.makeDefaultLibrary(),
              let vfn = library.makeFunction(name: "combat_vertex"),
              let ffn = library.makeFunction(name: "combat_fragment") else { return false }

        let vd = MTLVertexDescriptor()
        vd.attributes[0].format = .float3
        vd.attributes[0].offset = MemoryLayout<Vertex>.offset(of: \.position)!
        vd.attributes[0].bufferIndex = 0
        vd.attributes[1].format = .float3
        vd.attributes[1].offset = MemoryLayout<Vertex>.offset(of: \.normal)!
        vd.attributes[1].bufferIndex = 0
        vd.attributes[2].format = .float4
        vd.attributes[2].offset = MemoryLayout<Vertex>.offset(of: \.colour)!
        vd.attributes[2].bufferIndex = 0
        vd.layouts[0].stride = MemoryLayout<Vertex>.stride

        let desc = MTLRenderPipelineDescriptor()
        desc.vertexFunction = vfn
        desc.fragmentFunction = ffn
        desc.vertexDescriptor = vd
        desc.colorAttachments[0].pixelFormat = view.colorPixelFormat
        desc.depthAttachmentPixelFormat = view.depthStencilPixelFormat
        pipeline = try? device.makeRenderPipelineState(descriptor: desc)

        let dd = MTLDepthStencilDescriptor()
        dd.depthCompareFunction = .less
        dd.isDepthWriteEnabled = true
        depthState = device.makeDepthStencilState(descriptor: dd)
        return pipeline != nil && depthState != nil
    }

    // MARK: - MTKViewDelegate

    public func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        aspect = size.height > 0 ? Float(size.width / size.height) : 1
    }

    public func draw(in view: MTKView) {
        guard let fight,
              let drawable = view.currentDrawable,
              let descriptor = view.currentRenderPassDescriptor,
              let commandBuffer = queue.makeCommandBuffer() else { return }

        inFlight.wait()
        commandBuffer.addCompletedHandler { [inFlight] _ in inFlight.signal() }

        let viewMatrix = camera.viewMatrix()
        let projection = camera.projectionMatrix(aspect: aspect)
        let vp = projection * viewMatrix
        // Camera right/up, for billboarded limb quads.
        let right = SIMD3<Float>(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0])

        scratch.removeAll(keepingCapacity: true)
        buildGround()
        let terminal = fight.over?.terminal
        buildFighter(fight.a, isPlayer: true, right: right, terminal: terminal)
        buildFighter(fight.b, isPlayer: false, right: right, terminal: terminal)

        let count = min(scratch.count, Renderer.maxVertices)
        let buffer = vertexBuffers[frameIndex % vertexBuffers.count]
        frameIndex += 1
        // `baseAddress` is nil for an empty Array, and a draw with nothing in it is a
        // Metal validation error rather than a blank frame. Neither should be possible
        // — buildGround always pushes — but "should be impossible" is not a reason to
        // leave a force-unwrap on the one path that runs sixty times a second.
        guard count > 0 else {
            inFlight.signal()
            return
        }
        scratch.withUnsafeBufferPointer { src in
            guard let base = src.baseAddress else { return }
            buffer.contents().copyMemory(from: base,
                                         byteCount: MemoryLayout<Vertex>.stride * count)
        }

        var uniforms = Uniforms(viewProjection: vp,
                                lightDirection: simd_normalize(SIMD3<Float>(-0.35, -0.9, -0.25)),
                                ambient: 0.42)

        guard let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor) else {
            inFlight.signal()
            return
        }
        encoder.setRenderPipelineState(pipeline)
        encoder.setDepthStencilState(depthState)
        encoder.setCullMode(.none)
        encoder.setVertexBuffer(buffer, offset: 0, index: 0)
        encoder.setVertexBytes(&uniforms, length: MemoryLayout<Uniforms>.stride, index: 1)
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: count)
        encoder.endEncoding()

        commandBuffer.present(drawable)
        commandBuffer.commit()
    }

    // MARK: - geometry

    private func push(_ v: Vertex) {
        if scratch.count < Renderer.maxVertices { scratch.append(v) }
    }

    private func quad(_ a: SIMD3<Float>, _ b: SIMD3<Float>, _ c: SIMD3<Float>, _ d: SIMD3<Float>,
                      normalA: SIMD3<Float>, normalB: SIMD3<Float>, colour: SIMD4<Float>) {
        push(Vertex(position: a, normal: normalA, colour: colour))
        push(Vertex(position: b, normal: normalB, colour: colour))
        push(Vertex(position: c, normal: normalB, colour: colour))
        push(Vertex(position: a, normal: normalA, colour: colour))
        push(Vertex(position: c, normal: normalB, colour: colour))
        push(Vertex(position: d, normal: normalA, colour: colour))
    }

    /// A limb as a camera-facing quad whose edge normals point outward, which shades
    /// like a cylinder for the cost of two triangles.
    private func limb(_ from: SIMD3<Float>, _ to: SIMD3<Float>, radius: Float,
                      colour: SIMD4<Float>, right: SIMD3<Float>) {
        let axis = to - from
        let len = simd_length(axis)
        guard len > 1e-5 else { return }
        var side = simd_cross(simd_normalize(axis), right)
        if simd_length(side) < 1e-4 { side = right }
        side = simd_normalize(side) * radius
        let n = simd_normalize(side)
        quad(from - side, from + side, to + side, to - side,
             normalA: -n, normalB: n, colour: colour)
    }

    private func disc(centre: SIMD3<Float>, radiusX: Float, radiusZ: Float,
                      colour: SIMD4<Float>, segments: Int = 16) {
        let up = SIMD3<Float>(0, 1, 0)
        for i in 0..<segments {
            let t0 = Float(i) / Float(segments) * 2 * .pi
            let t1 = Float(i + 1) / Float(segments) * 2 * .pi
            let p0 = centre + SIMD3<Float>(cos(t0) * radiusX, 0, sin(t0) * radiusZ)
            let p1 = centre + SIMD3<Float>(cos(t1) * radiusX, 0, sin(t1) * radiusZ)
            push(Vertex(position: centre, normal: up, colour: colour))
            push(Vertex(position: p0, normal: up, colour: colour))
            push(Vertex(position: p1, normal: up, colour: colour))
        }
    }

    private func buildGround() {
        let up = SIMD3<Float>(0, 1, 0)
        let h: Float = 6.5
        quad(SIMD3(-h, 0, -h), SIMD3(h, 0, -h), SIMD3(h, 0, h), SIMD3(-h, 0, h),
             normalA: up, normalB: up, colour: groundColour)
        // A faint grid: spatial reference without becoming a gameplay readout.
        let step: Float = 1.0
        var x: Float = -5
        while x <= 5 {
            quad(SIMD3(x - 0.012, 0.001, -5), SIMD3(x + 0.012, 0.001, -5),
                 SIMD3(x + 0.012, 0.001, 5), SIMD3(x - 0.012, 0.001, 5),
                 normalA: up, normalB: up, colour: gridColour)
            quad(SIMD3(-5, 0.001, x - 0.012), SIMD3(-5, 0.001, x + 0.012),
                 SIMD3(5, 0.001, x + 0.012), SIMD3(5, 0.001, x - 0.012),
                 normalA: up, normalB: up, colour: gridColour)
            x += step
        }
    }

    private func buildFighter(_ f: Fighter, isPlayer: Bool, right: SIMD3<Float>,
                              terminal: String? = nil) {
        let pose = PoseBuilder.pose(for: f, time: renderTime, terminal: terminal)
        let body = isPlayer ? playerColour : opponentColour
        let limbColour = isPlayer ? playerLimb : opponentLimb

        // Local (forward, up, lateral) -> world, with lean pivoting about the feet.
        let yaw = Float(f.facing) + pose.twist * 0.5
        let c = cos(yaw), s = sin(yaw)
        func world(_ v: SIMD3<Float>) -> SIMD3<Float> {
            let lx = v.x + pose.lean * 0.42 * (v.y / 1.4)
            let ly = max(0, v.y - pose.crouch)
            let lz = v.z
            return SIMD3<Float>(Float(f.pos.x) + lx * c - lz * s,
                                ly,
                                Float(f.pos.z) + lx * s + lz * c)
        }

        // The base: a shadow, and the weight actually distributed between the feet.
        let centre = SIMD3<Float>(Float(f.pos.x), 0.002, Float(f.pos.z))
        disc(centre: centre, radiusX: 0.36, radiusZ: 0.30, colour: shadowColour)
        let lf = world(pose.leadFoot), rf = world(pose.rearFoot)
        disc(centre: SIMD3(lf.x, 0.004, lf.z),
             radiusX: 0.10 + pose.weight * 0.07, radiusZ: 0.07,
             colour: SIMD4(0.20, 0.22, 0.21, 1))
        disc(centre: SIMD3(rf.x, 0.004, rf.z),
             radiusX: 0.10 + (1 - pose.weight) * 0.07, radiusZ: 0.07,
             colour: SIMD4(0.20, 0.22, 0.21, 1))

        let dim: Float = f.state == .down ? 0.7 : 1.0
        func shade(_ c4: SIMD4<Float>) -> SIMD4<Float> {
            SIMD4(c4.x * dim, c4.y * dim, c4.z * dim, c4.w)
        }

        // Rear limbs first so the near side reads on top.
        limb(world(pose.rearHip), world(pose.rearKnee), radius: 0.055, colour: shade(limbColour), right: right)
        limb(world(pose.rearKnee), world(pose.rearFoot), radius: 0.045, colour: shade(limbColour), right: right)
        limb(world(pose.rearShoulder), world(pose.rearElbow), radius: 0.045, colour: shade(limbColour), right: right)
        limb(world(pose.rearElbow), world(pose.rearHand), radius: 0.038, colour: shade(limbColour), right: right)

        limb(world(pose.pelvis), world(pose.chest), radius: 0.095, colour: shade(body), right: right)
        limb(world(pose.rearShoulder), world(pose.leadShoulder), radius: 0.070, colour: shade(body), right: right)
        limb(world(pose.chest), world(pose.neck), radius: 0.045, colour: shade(body), right: right)

        limb(world(pose.leadHip), world(pose.leadKnee), radius: 0.058, colour: shade(body), right: right)
        limb(world(pose.leadKnee), world(pose.leadFoot), radius: 0.046, colour: shade(body), right: right)
        limb(world(pose.leadShoulder), world(pose.leadElbow), radius: 0.048, colour: shade(body), right: right)
        limb(world(pose.leadElbow), world(pose.leadHand), radius: 0.040, colour: shade(body), right: right)

        // Head, and the fists that have to be readable at the end of a strike.
        let head = world(pose.head)
        limb(head - SIMD3(0, 0.07, 0), head + SIMD3(0, 0.07, 0), radius: 0.105,
             colour: shade(body), right: right)
        for hand in [world(pose.leadHand), world(pose.rearHand)] {
            limb(hand - SIMD3(0, 0.03, 0), hand + SIMD3(0, 0.03, 0), radius: 0.052,
                 colour: shade(body), right: right)
        }

        // Blood: accumulative, and the only saturated colour on screen.
        let vit = Float(f.vitality.fraction)
        if vit < 0.72 {
            let a = min(0.85, (0.72 - vit) * 2.4)
            limb(head + SIMD3(0.02, 0.02, 0.05), head + SIMD3(0.02, -0.04, 0.05),
                 radius: 0.030,
                 colour: SIMD4(bloodColour.x, bloodColour.y, bloodColour.z, a), right: right)
        }
    }
}
