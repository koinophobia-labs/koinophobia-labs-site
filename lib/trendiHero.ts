// Pure logic for the Trendi hero fish animation.
// Kept free of React/DOM imports so it can be unit tested with node:test,
// mirroring the conventions in lib/youKnowBall.ts.

export const TRENDI_HERO_SESSION_KEY = "trendi_hero_opening_played";

/** Opening sequence timing (seconds). Total must stay under ~7s. */
export const OPENING_TIMING = {
  fadeIn: 0.6,
  wake: 1.0,
  exit: 0.7,
  swim: 3.1,
  reenter: 0.6,
} as const;

export function openingTotalSeconds(): number {
  return (
    OPENING_TIMING.fadeIn +
    OPENING_TIMING.wake +
    OPENING_TIMING.exit +
    OPENING_TIMING.swim +
    OPENING_TIMING.reenter
  );
}

export type TrendiHeroEvent =
  | "hero_animation_started"
  | "hero_animation_completed"
  | "hero_animation_skipped_reduced_motion"
  | "hero_cta_clicked";

export function trackTrendiHero(event: TrendiHeroEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("trendi:analytics", { detail: { event } }));
  const analyticsWindow = window as typeof window & {
    dataLayer?: Array<Record<string, string>>;
  };
  analyticsWindow.dataLayer?.push({ event: `trendi_${event}` });
}

type SessionStore = Pick<Storage, "getItem" | "setItem">;

/** Whether the opening sequence already ran in this browser session. */
export function hasOpeningPlayed(store: SessionStore | null | undefined): boolean {
  try {
    return store?.getItem(TRENDI_HERO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOpeningPlayed(store: SessionStore | null | undefined) {
  try {
    store?.setItem(TRENDI_HERO_SESSION_KEY, "1");
  } catch {
    // Private-mode storage failures fall back to replaying next visit.
  }
}

export type HeroRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SwimPathInput = {
  /** Hero bounds; all other rects are in the same coordinate space (page px). */
  hero: HeroRect;
  /** The phone screen's rect — where the fish exits and re-enters. */
  screen: HeroRect;
  /** TRENDI wordmark rect, when present. */
  wordmark: HeroRect | null;
  /** Primary CTA rect, when present. */
  cta: HeroRect | null;
  /** Compact = single-column layouts (≤900px). Shorter, quieter path. */
  compact: boolean;
};

export type SwimPath = {
  /** SVG path `d`, in hero-local coordinates, from exit point back to entry point. */
  d: string;
  exit: { x: number; y: number };
  entry: { x: number; y: number };
  /** Fraction of the path (0..1) where the fish passes beneath the wordmark. */
  wordmarkAt: number;
  /** Fraction of the path where the fish is nearest the CTA. */
  ctaAt: number;
};

const rel = (r: HeroRect, hero: HeroRect) => ({
  left: r.left - hero.left,
  top: r.top - hero.top,
  right: r.left - hero.left + r.width,
  bottom: r.top - hero.top + r.height,
  cx: r.left - hero.left + r.width / 2,
  cy: r.top - hero.top + r.height / 2,
  width: r.width,
  height: r.height,
});

const clampTo = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const pt = (x: number, y: number) => `${Math.round(x)} ${Math.round(y)}`;

/**
 * Builds one continuous swim path: out of the phone screen, beneath the
 * wordmark (light-sweep moment), arcing near the CTA, then home. All points
 * are clamped inside the hero so the fish can never leave the viewport or
 * cross into other sections.
 */
export function buildSwimPath(input: SwimPathInput): SwimPath {
  const { hero, compact } = input;
  const margin = 24;
  const cx = (x: number) => clampTo(x, margin, hero.width - margin);
  const cy = (y: number) => clampTo(y, margin, hero.height - margin);

  const screen = rel(input.screen, hero);
  const wordmark = input.wordmark ? rel(input.wordmark, hero) : null;
  const cta = input.cta ? rel(input.cta, hero) : null;

  if (compact) {
    // Mobile: the copy is dense, so the fish stays local to the phone — a
    // brief loop around the top-left corner of the hero card, then home.
    // (The CTA still gets its glow pulse; the fish never crosses text.)
    const exit = { x: cx(screen.left + 6), y: cy(screen.top + screen.height * 0.3) };
    const upperX = cx(screen.left - 46);
    const overY = cy(screen.top - 40);
    const entry = { x: cx(screen.left + 6), y: cy(screen.top + screen.height * 0.16) };
    const d = [
      `M ${pt(exit.x, exit.y)}`,
      `C ${pt(exit.x - 44, exit.y - 24)}, ${pt(upperX - 12, cy(exit.y - 90))}, ${pt(upperX, cy(overY + 46))}`,
      `C ${pt(cx(upperX + 12), overY)}, ${pt(cx(screen.cx - 30), cy(overY - 8))}, ${pt(cx(screen.cx + 6), cy(overY + 4))}`,
      `C ${pt(cx(screen.cx - 60), cy(overY + 26))}, ${pt(cx(upperX - 26), cy(entry.y - 44))}, ${pt(entry.x, entry.y)}`,
    ].join(" ");
    return { d, exit, entry, wordmarkAt: -1, ctaAt: 0.82 };
  }

  // Desktop: copy on the left, phone on the right. Exit the left edge of the
  // screen, sweep left beneath the wordmark, dip toward the CTA row, then
  // arc back to the phone on a lower line.
  const exit = { x: cx(screen.left + 6), y: cy(screen.cy - screen.height * 0.08) };
  // Hug the wordmark's baseline: TRENDI has no descenders, so the fish can
  // ride its underline without ever touching the h1 below it.
  const underWordmarkY = wordmark
    ? cy(wordmark.bottom + 8)
    : cy(hero.height * 0.36);
  const wordmarkRightX = wordmark ? cx(wordmark.right + 30) : cx(hero.width * 0.5);
  const wordmarkLeftX = wordmark ? cx(wordmark.left + wordmark.width * 0.12) : cx(hero.width * 0.16);
  const ctaX = cta ? cx(cta.right + 46) : cx(hero.width * 0.3);
  const ctaY = cta ? cy(cta.top - 26) : cy(hero.height * 0.72);
  const entry = { x: cx(screen.left + 6), y: cy(screen.cy + screen.height * 0.16) };
  const returnY = cy(Math.max(ctaY - 8, entry.y + 60));

  const sweepSpan = Math.max(1, wordmarkRightX - wordmarkLeftX);

  const d = [
    `M ${pt(exit.x, exit.y)}`,
    // Glide out and settle beneath the wordmark's right edge.
    `C ${pt(exit.x - 120, exit.y - 30)}, ${pt(wordmarkRightX + 130, underWordmarkY - 44)}, ${pt(wordmarkRightX, underWordmarkY)}`,
    // The light-sweep pass under the wordmark.
    `C ${pt(cx(wordmarkRightX - sweepSpan * 0.4), underWordmarkY + 16)}, ${pt(wordmarkLeftX + 90, underWordmarkY - 10)}, ${pt(wordmarkLeftX, cy(underWordmarkY + 22))}`,
    // Bank down toward the CTA row.
    `C ${pt(cx(wordmarkLeftX - 70), cy(underWordmarkY + 90))}, ${pt(cx(ctaX - 130), cy(ctaY - 60))}, ${pt(ctaX, ctaY)}`,
    // Come home on a relaxed lower arc.
    `C ${pt(cx(ctaX + 170), cy(returnY + 40))}, ${pt(entry.x - 150, entry.y + 46)}, ${pt(entry.x, entry.y)}`,
  ].join(" ");

  return { d, exit, entry, wordmarkAt: 0.38, ctaAt: 0.68 };
}

/**
 * A short, quiet "peek" loop used for occasional idle re-swims: out of the
 * screen, one small arc, straight home. Much smaller than the opening path.
 */
export function buildPeekPath(input: Pick<SwimPathInput, "hero" | "screen">): SwimPath {
  const { hero } = input;
  const margin = 24;
  const cx = (x: number) => clampTo(x, margin, hero.width - margin);
  const cy = (y: number) => clampTo(y, margin, hero.height - margin);
  const screen = rel(input.screen, hero);

  const exit = { x: cx(screen.left + 6), y: cy(screen.cy - screen.height * 0.06) };
  const reachX = cx(screen.left - Math.min(240, screen.width * 1.1));
  const entry = { x: cx(screen.left + 6), y: cy(screen.cy + screen.height * 0.12) };
  const midY = cy(screen.cy - screen.height * 0.2);

  const d = [
    `M ${pt(exit.x, exit.y)}`,
    `C ${pt(exit.x - 90, exit.y - 24)}, ${pt(reachX + 60, midY - 30)}, ${pt(reachX, midY)}`,
    `C ${pt(reachX - 40, cy(midY + 40))}, ${pt(exit.x - 120, entry.y + 40)}, ${pt(entry.x, entry.y)}`,
  ].join(" ");

  return { d, exit, entry, wordmarkAt: -1, ctaAt: -1 };
}

/** Delay before an occasional, quieter re-swim (ms). */
export function computeReswimDelay(random: () => number = Math.random): number {
  return Math.round(15000 + random() * 10000);
}

export type ReswimGate = {
  reducedMotion: boolean;
  documentHidden: boolean;
  heroVisible: boolean;
  /** ms since the user last scrolled. */
  msSinceScroll: number;
  openingDone: boolean;
};

/** A re-swim may only start when it cannot interfere with anything. */
export function canReswim(gate: ReswimGate): boolean {
  return (
    gate.openingDone &&
    !gate.reducedMotion &&
    !gate.documentHidden &&
    gate.heroVisible &&
    gate.msSinceScroll > 1200
  );
}
