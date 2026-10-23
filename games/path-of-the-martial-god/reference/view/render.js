/**
 * Renderer — placeholder geometry, real readability.
 *
 * ART_DIRECTION.md §7: the Duel camera frames a two-shot at a slight angle OFF the
 * fighters' axis, so the distance between the bodies is always legible and lateral
 * movement (the Angle intent) is visible as real ground travelled. The camera never
 * crosses the line between them.
 *
 * §8: impact is weight, not sparks — frame-holds, micro-shake, dust. No particles
 * on strikes, ever. The only time dilation in the game is the Final Inch, so when
 * time bends it always means something.
 */
import { poseFor, reactionFor } from './pose.js';
import { MAX, QUADRANTS } from '../sim/constants.js';
import { bearingTo, distance, vitalityFraction } from '../sim/fighter.js';

// Coal, wet slate, lamp-light. Red is reserved: blood is the only saturated red.
const C = {
  sky: '#12161a',
  ground: '#1d2328',
  groundFar: '#171c21',
  grid: '#252c32',
  player: '#dcdfd8',
  playerLimb: '#8d968f',
  opponent: '#8b9298',
  opponentLimb: '#5b646b',
  limb: '#6f7a80',
  shadow: 'rgba(0,0,0,0.45)',
  blood: '#8d1c1f',
  baseGood: 'rgba(190,200,195,0.16)',
  baseGone: 'rgba(141,28,31,0.30)',
  dust: 'rgba(200,196,180,0.30)',
};

export function makeCamera() {
  return { x: 0, z: 0, scale: 150, tilt: 0.34, shake: 0, shakeDecay: 0.86, push: 0 };
}

/** Project a world point plus a height into screen space. */
function project(cam, wx, wz, h, w, hgt, viewAngle) {
  const rx = wx - cam.x, rz = wz - cam.z;
  const ca = Math.cos(-viewAngle), sa = Math.sin(-viewAngle);
  const x = rx * ca - rz * sa;
  const z = rx * sa + rz * ca;
  const depth = 1 + z * 0.055;                 // gentle perspective on the ground plane
  const s = cam.scale / depth;
  return {
    x: w / 2 + x * s + cam.shakeX,
    y: hgt * 0.72 + z * s * 0.42 - h * s + cam.shakeY,
    s, depth,
  };
}

export function makeRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const cam = makeCamera();
  /** transient visual effects, none of which are UI */
  const fx = { hits: [], dust: [], hold: 0, flash: 0 };

  function addHit(ev, fight) {
    const victim = ev.who === fight.a.id ? fight.a : fight.b;
    const r = reactionFor(ev.quadrant, ev.force ?? 10, victim.structure);
    fx.hits.push({ at: performance.now(), r, who: ev.who, guarded: ev.type === 'guarded', broke: ev.broke });
    // A frame-hold is the single most effective impact tool there is, and it is free.
    fx.hold = ev.type === 'guarded' ? 40 : r.severity === 'heavy' ? 110 : 70;
    cam.shake = ev.type === 'guarded' ? 2 : r.severity === 'heavy' ? 9 : 5;
    fx.dust.push({ at: performance.now(), x: victim.pos.x, z: victim.pos.z, k: r.amplitude });
  }

  function draw(fight, time) {
    const w = canvas.width, h = canvas.height;
    const { a, b } = fight;

    // ---- camera: frame the two-shot, hold the axis ----------------------------
    const axis = bearingTo(a, b);
    const viewAngle = axis - cam.tilt;
    const d = distance(a, b);
    cam.x += ((a.pos.x + b.pos.x) / 2 - cam.x) * 0.08;
    cam.z += ((a.pos.z + b.pos.z) / 2 - cam.z) * 0.08;
    const wantScale = Math.max(95, Math.min(200, (w * 0.34) / Math.max(1.5, d))) * (1 + cam.push);
    cam.scale += (wantScale - cam.scale) * 0.06;
    cam.shake *= cam.shakeDecay;
    const sa = cam.shake;
    cam.shakeX = sa ? (Math.sin(time * 91) * sa) : 0;
    cam.shakeY = sa ? (Math.cos(time * 77) * sa * 0.6) : 0;

    // ---- ground ---------------------------------------------------------------
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, C.sky); g.addColorStop(0.42, C.groundFar); g.addColorStop(1, C.ground);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    drawGround(ctx, cam, w, h, viewAngle);

    // ---- fighters, far one first ----------------------------------------------
    const order = [a, b].sort((p, q) => {
      const pz = project(cam, p.pos.x, p.pos.z, 0, w, h, viewAngle);
      const qz = project(cam, q.pos.x, q.pos.z, 0, w, h, viewAngle);
      return pz.depth - qz.depth;
    });
    for (const f of order) {
      drawShadowAndBase(ctx, cam, f, w, h, viewAngle);
    }
    for (const f of order) {
      const isPlayer = f.id === a.id;
      drawFighter(ctx, cam, f, w, h, viewAngle, time,
        isPlayer ? C.player : C.opponent, isPlayer ? C.playerLimb : C.opponentLimb);
    }

    // ---- dust (displaced air and grit, not sparks) -----------------------------
    const now = performance.now();
    fx.dust = fx.dust.filter((p) => now - p.at < 520);
    for (const p of fx.dust) {
      const age = (now - p.at) / 520;
      const s = project(cam, p.x, p.z, 0.05 + age * 0.22, w, h, viewAngle);
      ctx.globalAlpha = (1 - age) * 0.4 * Math.min(1, p.k);
      ctx.fillStyle = C.dust;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 16 * age * s.s / 140 * 8, 5 * age * s.s / 140 * 8, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    fx.hits = fx.hits.filter((x) => now - x.at < 400);

    // ---- the Final Inch: the world holds still and you see both faces ----------
    if (fight.inch) drawInch(ctx, fight, w, h, cam);
    if (fight.over) drawOver(ctx, fight, w, h);

    return fx;
  }

  function drawInch(ctx, fight, w, h, cam) {
    const k = fight.inch.ticksLeft / fight.inch.total;
    cam.push = 0.22 * (1 - k);
    ctx.fillStyle = `rgba(8,10,12,${0.34 * (1 - k) + 0.10})`;
    ctx.fillRect(0, 0, w, h);
    // A single reserved-red hairline closing in. Not a meter: a held breath.
    const inset = 26 + 40 * k;
    ctx.strokeStyle = `rgba(141,28,31,${0.55 + 0.3 * (1 - k)})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  }

  function drawOver(ctx, fight, w, h) {
    ctx.fillStyle = 'rgba(8,10,12,0.62)';
    ctx.fillRect(0, 0, w, h);
  }

  return { ctx, cam, fx, draw, addHit, project: (f, x, z, hh, vw, vh, va) => project(cam, x, z, hh, vw, vh, va) };
}

function drawGround(ctx, cam, w, h, viewAngle) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    for (let j = -5; j <= 5; j++) {
      const p = project(cam, i, j, 0, w, h, viewAngle);
      if (j === -5) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let j = -5; j <= 5; j++) {
      const p = project(cam, j, i, 0, w, h, viewAngle);
      if (j === -5) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * The base. Two feet on the ground and the weight between them.
 * This is a STANCE, not a gauge: a collapsed quadrant shows as the footprint giving
 * way on that side, which is what "you cannot bear weight in that direction" looks like.
 */
function drawShadowAndBase(ctx, cam, f, w, h, viewAngle) {
  const p = poseFor(f, 0);
  const c = Math.cos(f.facing), s = Math.sin(f.facing);
  const toWorld = (lx, lz) => ({ x: f.pos.x + lx * c - lz * s, z: f.pos.z + lx * s + lz * c });

  const lf = toWorld(p.leadFoot[0], p.leadFoot[2]);
  const rf = toWorld(p.rearFoot[0], p.rearFoot[2]);
  const a = project(cam, lf.x, lf.z, 0, w, h, viewAngle);
  const b2 = project(cam, rf.x, rf.z, 0, w, h, viewAngle);

  // body shadow
  const mid = project(cam, f.pos.x, f.pos.z, 0, w, h, viewAngle);
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(mid.x, mid.y, 0.34 * mid.s, 0.13 * mid.s, 0, 0, 7);
  ctx.fill();

  // the line of the base between the feet — thins and reddens where it has gone
  const anyCollapsed = QUADRANTS.some((q) => f.structure.collapse[q] > 0);
  const worst = Math.min(...QUADRANTS.map((q) => f.structure[q] / MAX.quadrant));
  ctx.strokeStyle = anyCollapsed ? C.baseGone : C.baseGood;
  ctx.lineWidth = Math.max(1.5, 5 * worst);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();

  for (const [pt, on] of [[a, p.weight], [b2, 1 - p.weight]]) {
    ctx.fillStyle = `rgba(210,214,208,${0.10 + on * 0.24})`;
    ctx.beginPath(); ctx.ellipse(pt.x, pt.y, 0.10 * pt.s * (0.6 + on), 0.045 * pt.s, 0, 0, 7); ctx.fill();
  }
}

function drawFighter(ctx, cam, f, w, h, viewAngle, time, colour, limbColour) {
  const p = poseFor(f, time);
  const lean = p.lean, crouch = p.crouch, twist = p.twist;
  const c = Math.cos(f.facing + twist * 0.5), s = Math.sin(f.facing + twist * 0.5);

  // local (forward, up, lateral) -> world + screen
  const pt = (v) => {
    const lx = v[0] + lean * 0.42 * (v[1] / 1.4);   // lean pivots about the feet
    const ly = Math.max(0, v[1] - crouch);
    const lz = v[2];
    const wx = f.pos.x + lx * c - lz * s;
    const wz = f.pos.z + lx * s + lz * c;
    return project(cam, wx, wz, ly, w, h, viewAngle);
  };

  // Local joint frame first, so knees and elbows bend in the world and not on screen.
  const leadShL = [p.chest[0], p.chest[1] + 0.09, 0.19];
  const rearShL = [p.chest[0], p.chest[1] + 0.09, -0.19];
  const leadHipL = [p.pelvis[0], p.pelvis[1], 0.13];
  const rearHipL = [p.pelvis[0], p.pelvis[1], -0.13];
  const neckL = [p.chest[0] + 0.01, p.chest[1] + 0.16, 0];

  // A fighting stance has bent knees and folded arms. Straight sticks read as stilts,
  // and posture is the only structure readout the player gets.
  const bend = 0.13 + crouch * 0.9;
  const mid = (a2, b2, off) => [
    (a2[0] + b2[0]) / 2 + off[0], (a2[1] + b2[1]) / 2 + off[1], (a2[2] + b2[2]) / 2 + off[2],
  ];
  const leadKneeL = mid(leadHipL, p.leadFoot, [bend, -0.02, 0.03]);
  const rearKneeL = mid(rearHipL, p.rearFoot, [bend * 0.7, -0.02, -0.03]);
  const leadElbowL = mid(leadShL, p.leadHand, [-0.05, -0.11, 0.07]);
  const rearElbowL = mid(rearShL, p.rearHand, [-0.05, -0.11, -0.07]);

  const pelvis = pt(p.pelvis), chest = pt(p.chest), head = pt(p.head), neck = pt(neckL);
  const leadHand = pt(p.leadHand), rearHand = pt(p.rearHand);
  const leadFoot = pt(p.leadFoot), rearFoot = pt(p.rearFoot);
  const leadSh = pt(leadShL), rearSh = pt(rearShL);
  const leadHip = pt(leadHipL), rearHip = pt(rearHipL);
  const leadKnee = pt(leadKneeL), rearKnee = pt(rearKneeL);
  const leadElbow = pt(leadElbowL), rearElbow = pt(rearElbowL);

  const scale = pelvis.s / 150;
  const limb = (from, to, width, col) => {
    ctx.strokeStyle = col ?? limbColour;
    ctx.lineWidth = Math.max(1.6, width * scale);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  };

  const dim = f.state === 'down' ? 0.65 : 1;
  ctx.globalAlpha = dim;
  // Outline pass: overlapping bodies at close range must still read as two people.
  ctx.lineJoin = 'round';
  const outline = (from, to, width) => {
    ctx.strokeStyle = '#0e1214';
    ctx.lineWidth = Math.max(2.4, (width + 4.5) * scale);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  };
  for (const [x1, x2, ww] of [
    [rearHip, rearKnee, 10], [rearKnee, rearFoot, 8], [rearSh, rearElbow, 8], [rearElbow, rearHand, 6.5],
    [pelvis, chest, 16], [rearSh, leadSh, 12], [chest, neck, 8],
    [leadHip, leadKnee, 10], [leadKnee, leadFoot, 8], [leadSh, leadElbow, 8.5], [leadElbow, leadHand, 7],
  ]) outline(x1, x2, ww);
  ctx.fillStyle = '#0e1214';
  ctx.beginPath(); ctx.ellipse(head.x, head.y, 0.135 * head.s, 0.155 * head.s, 0, 0, 7); ctx.fill();

  // rear limbs first so the near side reads on top
  limb(rearHip, rearKnee, 10, limbColour); limb(rearKnee, rearFoot, 8, limbColour);
  limb(rearSh, rearElbow, 8, limbColour);  limb(rearElbow, rearHand, 6.5, limbColour);

  limb(pelvis, chest, 16, colour);
  limb(rearSh, leadSh, 12, colour);
  limb(chest, neck, 8, colour);

  limb(leadHip, leadKnee, 10, colour); limb(leadKnee, leadFoot, 8, colour);
  limb(leadSh, leadElbow, 8.5, colour); limb(leadElbow, leadHand, 7, colour);

  // head — the Inch camera has to be able to show a face
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(head.x, head.y, 0.115 * head.s, 0.135 * head.s, 0, 0, 7); ctx.fill();

  // hands read as fists
  for (const hnd of [leadHand, rearHand]) {
    ctx.fillStyle = colour;
    ctx.beginPath(); ctx.arc(hnd.x, hnd.y, 0.052 * hnd.s, 0, 7); ctx.fill();
  }

  // blood: accumulative, the only saturated colour on screen
  const vit = vitalityFraction(f);
  if (vit < 0.72) {
    ctx.fillStyle = C.blood;
    ctx.globalAlpha = dim * Math.min(0.85, (0.72 - vit) * 2.4);
    ctx.beginPath(); ctx.arc(head.x + 0.03 * head.s, head.y + 0.04 * head.s, 0.035 * head.s, 0, 7); ctx.fill();
    ctx.globalAlpha = dim;
  }
  ctx.globalAlpha = 1;
}
