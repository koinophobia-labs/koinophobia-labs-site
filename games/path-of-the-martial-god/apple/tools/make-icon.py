#!/usr/bin/env python3
"""
Generate the app icon.

The icon is the game's own figure, not a mark invented for the store. The skeleton and
the rest stance below are lifted from `reference/view/pose.js` — the same joint heights
and the same square-ish, weight-forward Low River stance the prototype draws every
frame. If the stance ever changes, this should change with it.

ART_DIRECTION.md decides the palette, and the most on-brand decision available is its
strictest rule: "Blood and lacquer are the only saturated reds in most scenes... a
single split lip reads across a wide shot." So the icon is a desaturated ground, a bone
silhouette, and exactly one saturated mark. Violence is chromatically loud even when it
is quiet.

No imaging library is available in the authoring environment, so this writes the PNG
itself. Run:  python3 tools/make-icon.py
"""
import math
import struct
import zlib
from pathlib import Path

SIZE = 1024
SS = 4                      # supersampling factor; 4x is enough for these edges
W = SIZE * SS

GROUND = (0x14, 0x18, 0x1b)     # coal / wet slate
FIGURE = (0xe3, 0xe4, 0xde)     # bone, chalky rather than white
VERMILION = (0xa8, 0x20, 0x1c)  # the one saturated thing in the frame

# ---- the stance, from view/pose.js -------------------------------------------------
H = {"pelvis": 0.95, "chest": 1.32, "head": 1.66, "shoulder": 1.42, "knee": 0.50}
POSE = {
    "pelvis":   (0.00, H["pelvis"], 0.00),
    "chest":    (0.02, H["chest"],  0.00),
    "head":     (0.04, H["head"],   0.00),
    "leadHand": (0.30, 1.17,        0.16),
    "rearHand": (0.15, 1.13,       -0.17),
    "leadFoot": (0.30, 0.00,        0.20),
    "rearFoot": (-0.30, 0.00,      -0.21),
}

# The prototype's rest stance is a standing guard. An icon is seen at 60px on a home
# screen, so it is deepened and widened here: the silhouette has to say "fighter" at a
# glance, and a deep base is the most legible thing this style owns. The proportions
# stay the game's; only the crouch and the stance width are pushed.
STANCE_WIDTH = 1.24
CROUCH = 0.86

def project(p):
    """Three-quarter view: enough rotation that both legs read as two legs."""
    x, y, z = p
    return ((x + z * 0.42) * STANCE_WIDTH, y * CROUCH)

def knee(hip, foot, out):
    """A knee sits between hip and foot, pushed out — a bent leg, not a stick."""
    hx, hy = project(hip)
    fx, fy = project(foot)
    return ((hx + fx) / 2 + out, H["knee"] * CROUCH)

def shoulder(side):
    cx, _ = project(POSE["chest"])
    return (cx + side * 0.17, H["shoulder"] * CROUCH)

def elbow(sh, hand, out):
    return ((sh[0] + hand[0]) / 2 + out, (sh[1] + hand[1]) / 2 - 0.04)

lead_hand = project(POSE["leadHand"])
# The rest pose keeps the rear hand near the centreline, where the torso hides it and
# the arm reads as a stub. Drawn slightly further back and lower so the guard reads for
# what it is: lead hand out, rear hand home. An icon-only adjustment — the simulation's
# stance is untouched.
rear_hand = (-0.30, 1.02 * CROUCH)
sh_lead, sh_rear = shoulder(1), shoulder(-1)

# Everything in metres, y up from the floor. Converted to pixels once, below.
LIMBS = [
    # (a, b, thickness) — rear side first so the near side overlaps it
    (project(POSE["rearFoot"]), knee(POSE["pelvis"], POSE["rearFoot"], -0.10), 0.075),
    (knee(POSE["pelvis"], POSE["rearFoot"], -0.10), project(POSE["pelvis"]), 0.090),
    (sh_rear, elbow(sh_rear, rear_hand, -0.10), 0.062),
    (elbow(sh_rear, rear_hand, -0.10), rear_hand, 0.054),

    (project(POSE["pelvis"]), project(POSE["chest"]), 0.135),   # torso
    (project(POSE["chest"]), (project(POSE["chest"])[0] + 0.02, H["shoulder"] * CROUCH), 0.122),
    (sh_rear, sh_lead, 0.082),                                   # shoulder line
    # neck: without it the head reads as a balloon on a sheet
    ((project(POSE["chest"])[0] + 0.03, H["shoulder"] * CROUCH),
     (project(POSE["head"])[0], project(POSE["head"])[1] - 0.05), 0.055),

    (project(POSE["leadFoot"]), knee(POSE["pelvis"], POSE["leadFoot"], 0.10), 0.078),
    (knee(POSE["pelvis"], POSE["leadFoot"], 0.10), project(POSE["pelvis"]), 0.094),
    (sh_lead, elbow(sh_lead, lead_hand, 0.11), 0.064),
    (elbow(sh_lead, lead_hand, 0.11), lead_hand, 0.056),
]
FEET = [(project(POSE["leadFoot"]), 0.055), (project(POSE["rearFoot"]), 0.050)]
HANDS = [(lead_hand, 0.052), (rear_hand, 0.048)]
HEAD = (project(POSE["head"]), 0.118)

# ---- framing -----------------------------------------------------------------------
# Fit the figure that is actually drawn rather than a guess at its extent: measure the
# bounding box of every stroke, including its thickness, then centre and scale it.
# iOS masks to a rounded rect at roughly 22% radius. The figure is tall and narrow and
# its widest point (the feet) sits where the mask is straight, so 82% fills the tile
# without any part of it reaching a rounded corner.
def _extent():
    xs, ys = [], []
    for a, b, t in LIMBS:
        for (px, py) in (a, b):
            xs += [px - t, px + t]
            ys += [py - t, py + t]
    for c, t in FEET + HANDS + [HEAD]:
        xs += [c[0] - t, c[0] + t]
        ys += [c[1] - t, c[1] + t]
    return min(xs), max(xs), min(ys), max(ys)

_x0, _x1, _y0, _y1 = _extent()
SCALE = W * 0.82 / max(_x1 - _x0, _y1 - _y0)
ORIGIN_X = W * 0.5 - (_x0 + _x1) / 2 * SCALE
ORIGIN_Y = W * 0.5 + (_y0 + _y1) / 2 * SCALE

def to_px(p):
    return (ORIGIN_X + p[0] * SCALE, ORIGIN_Y - p[1] * SCALE)

# ---- rasteriser --------------------------------------------------------------------
buf = bytearray(GROUND * (W * W))

def blend(px, py, colour):
    if 0 <= px < W and 0 <= py < W:
        i = (py * W + px) * 3
        buf[i:i + 3] = bytes(colour)

def capsule(a, b, radius, colour):
    ax, ay = to_px(a)
    bx, by = to_px(b)
    r = radius * SCALE
    dx, dy = bx - ax, by - ay
    length2 = dx * dx + dy * dy
    x0 = max(0, int(min(ax, bx) - r) - 1)
    x1 = min(W - 1, int(max(ax, bx) + r) + 1)
    y0 = max(0, int(min(ay, by) - r) - 1)
    y1 = min(W - 1, int(max(ay, by) + r) + 1)
    for py in range(y0, y1 + 1):
        for px in range(x0, x1 + 1):
            vx, vy = px - ax, py - ay
            t = 0.0 if length2 == 0 else max(0.0, min(1.0, (vx * dx + vy * dy) / length2))
            cx, cy = vx - t * dx, vy - t * dy
            if cx * cx + cy * cy <= r * r:
                blend(px, py, colour)

def disc(c, radius, colour):
    capsule(c, c, radius, colour)

for a, b, t in LIMBS:
    capsule(a, b, t, FIGURE)
for c, t in FEET:
    disc(c, t, FIGURE)
for c, t in HANDS:
    disc(c, t, FIGURE)
disc(HEAD[0], HEAD[1], FIGURE)

# The split lip. One mark, low on the face, on the lead side — the only saturated
# colour in the icon, exactly as the art direction reserves it.
#
# Sized to survive the downscale: a home-screen icon is about 60px, so anything under
# roughly 2% of the canvas disappears into a grey smudge and the rule it embodies is
# lost. This is deliberately larger than anatomy alone would suggest.
#
# Placed on the jaw and angled down, not level across the face. A level mark at nose
# height reads as a moustache, which is a real failure mode of a silhouette this
# simple and not one you notice until you look at the render.
hx, hy = HEAD[0]
r = HEAD[1]
capsule((hx + r * 0.36, hy - r * 0.46), (hx + r * 0.72, hy - r * 0.62), r * 0.20, VERMILION)

# ---- downsample and write ----------------------------------------------------------
out = bytearray()
for y in range(SIZE):
    out.append(0)                                    # PNG filter: none
    row = bytearray()
    for x in range(SIZE):
        r = g = b = 0
        for sy in range(SS):
            base = ((y * SS + sy) * W + x * SS) * 3
            for sx in range(SS):
                i = base + sx * 3
                r += buf[i]; g += buf[i + 1]; b += buf[i + 2]
        n = SS * SS
        row += bytes((r // n, g // n, b // n))
    out += row

def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(bytes(out), 9))
       + chunk(b"IEND", b""))

dest = Path(__file__).resolve().parent.parent / "MartialGod/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
dest.write_bytes(png)
print(f"wrote {dest} ({len(png):,} bytes, {SIZE}x{SIZE})")
