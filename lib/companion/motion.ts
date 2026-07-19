// Motion model for the koi companion.
//
// Design rule (audit M1): the koi is an ANCHORED companion, not a cursor
// follower. It drifts inside a small safe region around a route anchor; the
// pointer and scroll only *influence* that drift within hard caps and the koi
// always eases back to its anchor. Nothing here tracks the pointer across the
// viewport. All math is pure and bounded so the "never chases" guarantee is
// unit-testable.

export type CompanionMotionState =
  | "resting" // parked at the anchor, breathing only
  | "drifting" // gentle ambient motion inside the safe region
  | "noticing" // brief reaction to the pointer coming near
  | "inviting" // a proactive invitation is showing
  | "listening" // the panel is open
  | "sleeping" // idle for a long time
  | "avoiding" // moving to a safe anchor because a control is under it
  | "paused"; // tab hidden / motion frozen

// Hard caps — the koi may never leave its anchor by more than MAX_OFFSET.
export const COMPANION_MAX_OFFSET = 40;
/** Ambient drift stays well inside the cap so influence has headroom. */
export const COMPANION_DRIFT_RADIUS = 16;
/** Pointer must be at least this close (px) to the koi to influence it. */
export const COMPANION_PROXIMITY_RADIUS = 150;
/** Max displacement (px) the pointer can add — a shy notice, not pursuit. */
export const COMPANION_PROXIMITY_NUDGE = 22;
/** Max displacement (px) a scroll burst can add before it decays. */
export const COMPANION_SCROLL_NUDGE = 18;

export type Vec2 = { x: number; y: number };

/** Clamp an offset vector to a maximum magnitude (preserves direction). */
export function clampOffset(dx: number, dy: number, max = COMPANION_MAX_OFFSET): Vec2 {
  const magnitude = Math.hypot(dx, dy);
  if (magnitude <= max || magnitude === 0) return { x: dx, y: dy };
  const scale = max / magnitude;
  return { x: dx * scale, y: dy * scale };
}

/**
 * Pointer influence: when the cursor comes within COMPANION_PROXIMITY_RADIUS of
 * the koi's anchor, the koi eases a short distance AWAY from it (a shy notice).
 * Beyond the radius there is zero influence. Displacement is always within
 * COMPANION_PROXIMITY_NUDGE regardless of how far the pointer is — this is what
 * makes "does not chase" true by construction, not by tuning.
 */
export function pointerInfluence(pointer: Vec2, anchor: Vec2): Vec2 & { active: boolean } {
  const dx = anchor.x - pointer.x;
  const dy = anchor.y - pointer.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= COMPANION_PROXIMITY_RADIUS || distance === 0) return { x: 0, y: 0, active: false };
  // Closer pointer → stronger nudge, but never past the cap.
  const strength = (1 - distance / COMPANION_PROXIMITY_RADIUS) * COMPANION_PROXIMITY_NUDGE;
  const scale = strength / distance;
  const nudged = clampOffset(dx * scale, dy * scale, COMPANION_PROXIMITY_NUDGE);
  return { ...nudged, active: true };
}

/**
 * Scroll influence: a scroll burst nudges the koi vertically a little, as
 * though moving through current, then decays. Direction is opposite the scroll
 * (scroll down → koi rises slightly). Bounded and capped.
 */
export function scrollInfluence(velocity: number): number {
  const capped = Math.max(-1, Math.min(1, velocity / 40));
  return -capped * COMPANION_SCROLL_NUDGE;
}

/**
 * Ambient drift: a smooth, deterministic Lissajous path inside the drift
 * radius, driven by a monotonic clock. No randomness — same time, same point —
 * so motion is testable and never jitters.
 */
export function ambientDrift(elapsedMs: number, radius = COMPANION_DRIFT_RADIUS): Vec2 {
  const t = elapsedMs / 1000;
  // Amplitudes chosen so the combined magnitude is provably within `radius`
  // even when both sinusoids peak at once: hypot(0.8, 0.55) ≈ 0.97 < 1.
  return {
    x: Math.sin(t * 0.45) * radius * 0.8,
    y: Math.cos(t * 0.32) * radius * 0.55,
  };
}

export function resolveCompanionMotionState({
  open,
  paused,
  collisionHidden,
  invitationVisible,
  reducedMotion,
  ambientState,
}: {
  open: boolean;
  paused?: boolean;
  collisionHidden?: boolean;
  invitationVisible: boolean;
  reducedMotion: boolean;
  ambientState: CompanionMotionState;
}): CompanionMotionState {
  if (open) return "listening";
  if (paused) return "paused";
  if (invitationVisible) return "inviting";
  if (collisionHidden) return "avoiding";
  if (reducedMotion) return "resting";
  return ambientState;
}
