#include <metal_stdlib>
using namespace metal;

/// Deliberately plain. ART_DIRECTION.md defines the look largely by what it removes:
/// matte surfacing, no strike particles, restrained everything. Flat vertex colour
/// with a single soft directional term is the whole of it, and it cannot accidentally
/// look like a default engine.

struct VertexIn {
    float3 position [[attribute(0)]];
    float3 normal   [[attribute(1)]];
    float4 colour   [[attribute(2)]];
};

struct VertexOut {
    float4 position [[position]];
    float4 colour;
    float  shade;
};

struct Uniforms {
    float4x4 viewProjection;
    float3   lightDirection;
    float    ambient;
};

vertex VertexOut combat_vertex(VertexIn in [[stage_in]],
                               constant Uniforms &u [[buffer(1)]]) {
    VertexOut out;
    out.position = u.viewProjection * float4(in.position, 1.0);
    out.colour = in.colour;
    float lambert = max(0.0, dot(normalize(in.normal), -normalize(u.lightDirection)));
    // Ramped rather than linear: a reduced, illustrative falloff, not a photoreal one.
    out.shade = u.ambient + (1.0 - u.ambient) * smoothstep(0.0, 0.85, lambert);
    return out;
}

fragment float4 combat_fragment(VertexOut in [[stage_in]]) {
    return float4(in.colour.rgb * in.shade, in.colour.a);
}
