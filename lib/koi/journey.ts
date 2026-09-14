/**
 * The koi journey — the single source of truth for the scroll-state map.
 *
 * The homepage is six destinations. Each destination owns a tall scroll band
 * with a sticky reading stage inside it, so local progress `t` runs 0 -> 1 as
 * the band passes the viewport:
 *
 *   t 0.00 .. ARRIVE_END   the koi decelerates in, copy settles
 *   t ARRIVE_END .. DEPART_START   HOLD. Copy is static and readable.
 *   t DEPART_START .. 1.00 the koi accelerates out, copy recedes
 *
 * Nothing here hijacks scrolling. Everything is a pure function of scroll
 * position, so reverse scrolling, keyboard paging, deep links, refresh at any
 * offset and browser back/forward all behave identically.
 */

export const ARRIVE_END = 0.25;
export const DEPART_START = 0.7;

/**
 * Words must always finish forming. Scroll drives the formation while the
 * visitor is moving, but a destination that is simply *looked at* — reached by
 * a nav jump, a deep link, or a phone's natural reading flow — completes its
 * formation on its own over this many seconds. The resting state of every
 * headline is fully formed, everywhere, on every entry path.
 */
export const FORM_SECONDS = 1.05;

export type KoiClip = {
  /** Basename under /koi/ — `${id}-1280.mp4|webm` and `${id}-854.mp4|webm`. */
  id: string;
  /** Poster/reduced-motion still under /koi/. */
  poster: string;
  /** Seconds. Used for loop-fade timing. */
  duration: number;
  /**
   * Seconds into the loop where the koi is most present — measured from the
   * footage's luminance curve and confirmed by eye. Destinations open their
   * clip here (via a #t media fragment, never a scripted seek), so an arrival
   * can never land on an empty stretch of water. Transition clips omit it:
   * they are motion continuity and begin at their natural start.
   */
  hero?: number;
  /** Human description for the asset manifest and alt text. */
  description: string;
};

export const CLIPS = {
  surface: {
    id: "koi-surface",
    poster: "/koi/poster-surface.webp",
    duration: 10.04,
    hero: 3.0,
    description:
      "H1, the surface loop: the koi sinks away into the dark, circles far below, and rises back to its opening pose beneath the surface. Kling v3.0, matched first and last frame. Generated 2026-09-14.",
  },
  pass: {
    id: "koi-pass",
    poster: "/koi/poster-pass.webp",
    duration: 4.04,
    description:
      "H2, the pass: the koi crosses the lens plane left to right, scales filling the frame for two frames. Seedance 2.5 from the H1 turn frame. Generated 2026-09-14.",
  },
  lattice: {
    id: "koi-lattice",
    poster: "/koi/poster-lattice.webp",
    duration: 10.04,
    hero: 4.0,
    description:
      "H4, the lattice: the koi descends nose-down past faint vertical planes receding into the dark. Seedance 2.5 from the H1 turn frame. Generated 2026-09-14.",
  },
  lead: {
    id: "koi-lead",
    poster: "/koi/poster-lead.webp",
    duration: 15.04,
    hero: 3.2,
    description:
      "Single koi circling in black water, elevated three-quarter view — the navigation master.",
  },
  glass: {
    id: "koi-glass",
    poster: "/koi/poster-glass.webp",
    duration: 8.04,
    description:
      "The koi approaches the lens and passes through frame — the through-the-glass transition.",
  },
  duo: {
    id: "koi-duo",
    poster: "/koi/poster-duo.webp",
    duration: 10.04,
    hero: 7.6,
    description: "Two koi orbiting one another — the product constellation.",
  },
  separate: {
    id: "koi-separate",
    poster: "/koi/poster-separate.webp",
    duration: 6,
    description:
      "The orbit opens, the second koi descends into the dark, one navigation koi remains.",
  },
  systems: {
    id: "koi-systems",
    poster: "/koi/poster-systems.webp",
    duration: 8,
    hero: 3.4,
    description:
      "The koi descends past submerged structure into the systems region.",
  },
  work: {
    id: "koi-work",
    poster: "/koi/poster-work.webp",
    duration: 8,
    hero: 2.8,
    description:
      "Lateral drift past suspended planes of light — the proof corridor.",
  },
  still: {
    id: "koi-still",
    poster: "/koi/poster-still.webp",
    duration: 8,
    hero: 3,
    description: "The koi holds station in a calm pocket under a single shaft of light.",
  },
  open: {
    id: "koi-open",
    poster: "/koi/poster-open.webp",
    duration: 8,
    hero: 5.8,
    description:
      "The koi swims away from camera toward a widening glow — the final destination.",
  },
} as const satisfies Record<string, KoiClip>;

export type ClipKey = keyof typeof CLIPS;

/** Where the koi sits on screen, in viewport units, at a given moment. */
export type KoiPose = {
  /** -1 = left edge, 0 = centre, 1 = right edge. */
  x: number;
  /** -1 = top, 0 = centre, 1 = bottom. */
  y: number;
  /** 1 = the clip fills the viewport height. Larger = closer to camera. */
  scale: number;
  /** Degrees. Small values only — the koi's own motion does the real turning. */
  rotate: number;
  /** 0 = far background plane, 1 = foreground, passing in front of the copy. */
  depth: number;
  /** Layer opacity before loop and transition fades. */
  opacity: number;
  /** Pixels of blur. Depth cue. */
  blur: number;
};

export type Destination = {
  id: string;
  index: number;
  /** Nav label. */
  label: string;
  /** Two-digit marker shown in the world. */
  marker: string;
  /** Short description used for the aria-label on nav links. */
  hint: string;
  clip: ClipKey;
  /** Clip that plays across the departure into the next destination, if any. */
  transitionClip?: ClipKey;
  /** Scroll band height as a multiple of the viewport, desktop / mobile. */
  band: { desktop: number; mobile: number };
  /** Koi pose at arrival, during the hold, and at departure. */
  pose: { arrive: KoiPose; hold: KoiPose; depart: KoiPose };
  /** Mobile pose overrides — keeps the koi clear of the copy on narrow screens. */
  poseMobile?: Partial<{ arrive: KoiPose; hold: KoiPose; depart: KoiPose }>;
  /** Environment mood for the water shader. */
  water: {
    /** Light direction in normalised screen space. */
    lightX: number;
    lightY: number;
    /** 0 = pitch void, 1 = lifted, structured depth. */
    depth: number;
    /** Suspended particle density multiplier. */
    particles: number;
    /** Caustic band strength. */
    caustics: number;
    /** Cool -> warm tint, -1 .. 1. */
    warmth: number;
  };
};

const pose = (
  x: number,
  y: number,
  scale: number,
  rotate: number,
  depth: number,
  opacity: number,
  blur: number,
): KoiPose => ({ x, y, scale, rotate, depth, opacity, blur });

export const DESTINATIONS: Destination[] = [
  {
    id: "surface",
    index: 0,
    label: "Surface",
    marker: "00",
    hint: "What Koinophobia Labs is and what it has shipped",
    clip: "surface",
    transitionClip: "pass",
    band: { desktop: 2.4, mobile: 1.45 },
    pose: {
      arrive: pose(0.24, -0.1, 1.3, -2, 0.32, 0.94, 1.8),
      hold: pose(0.18, -0.04, 1.18, 0, 0.28, 1, 0.4),
      depart: pose(-0.04, 0.12, 1.8, 5, 0.78, 1, 0),
    },
    poseMobile: {
      arrive: pose(0.14, -0.4, 1.2, -2, 0.28, 0.9, 1.8),
      hold: pose(0.12, -0.34, 1.14, 0, 0.24, 1, 0.5),
      depart: pose(0.04, -0.2, 1.5, 4, 0.66, 1, 0),
    },
    water: { lightX: -0.42, lightY: -0.7, depth: 0.42, particles: 0.7, caustics: 0.55, warmth: -0.15 },
  },
  {
    id: "shipped",
    index: 1,
    label: "Shipped",
    marker: "01",
    hint: "Three apps on the App Store, built by one person",
    clip: "duo",
    transitionClip: "separate",
    band: { desktop: 2.75, mobile: 1.3 },
    pose: {
      arrive: pose(-0.4, 0.2, 1.24, 2, 0.24, 0.9, 1.6),
      hold: pose(-0.36, 0.14, 1.12, 0, 0.2, 1, 0.5),
      depart: pose(-0.2, -0.1, 1.3, -3, 0.5, 1, 0.2),
    },
    poseMobile: {
      arrive: pose(0, -0.56, 1.1, 0, 0.2, 0.9, 1.6),
      hold: pose(0, -0.54, 1.02, 0, 0.16, 1, 0.5),
      depart: pose(0, -0.6, 1.1, 0, 0.3, 1, 0.3),
    },
    water: { lightX: 0.35, lightY: -0.5, depth: 0.55, particles: 0.9, caustics: 0.7, warmth: -0.1 },
  },
  {
    id: "lab",
    index: 2,
    label: "Lab",
    marker: "02",
    hint: "Experiments at their real stage, with receipts",
    clip: "lattice",
    band: { desktop: 2.6, mobile: 1.3 },
    pose: {
      arrive: pose(0.42, -0.3, 1.3, -4, 0.3, 0.9, 1.8),
      hold: pose(0.4, 0.02, 1.18, -3, 0.24, 1, 0.5),
      depart: pose(0.36, 0.34, 1.26, -2, 0.4, 0.96, 0.6),
    },
    poseMobile: {
      arrive: pose(0.1, -0.56, 1.14, -3, 0.24, 0.9, 1.6),
      hold: pose(0.1, -0.52, 1.06, -2, 0.2, 1, 0.5),
      depart: pose(0.1, -0.5, 1.1, 0, 0.3, 0.96, 0.6),
    },
    water: { lightX: 0.6, lightY: -0.8, depth: 0.7, particles: 1.2, caustics: 0.45, warmth: -0.25 },
  },
  {
    id: "blake",
    index: 3,
    label: "Blake",
    marker: "03",
    hint: "The builder behind the studio",
    clip: "still",
    band: { desktop: 2.3, mobile: 1.3 },
    pose: {
      arrive: pose(-0.46, -0.1, 1.18, 0, 0.2, 0.9, 1.6),
      hold: pose(-0.44, -0.06, 1.1, 0, 0.16, 1, 0.5),
      depart: pose(-0.4, 0.1, 1.16, 1, 0.3, 0.96, 0.7),
    },
    poseMobile: {
      arrive: pose(0, -0.58, 1.1, 0, 0.2, 0.9, 1.6),
      hold: pose(0, -0.56, 1.04, 0, 0.16, 1, 0.5),
      depart: pose(0, -0.6, 1.08, 0, 0.26, 0.96, 0.7),
    },
    water: { lightX: -0.2, lightY: -0.9, depth: 0.6, particles: 0.5, caustics: 0.3, warmth: 0.05 },
  },
  {
    id: "work",
    index: 4,
    label: "Work with me",
    marker: "04",
    hint: "Three ways to hire the studio",
    clip: "work",
    band: { desktop: 2.6, mobile: 1.3 },
    pose: {
      arrive: pose(0.3, 0.3, 1.26, 3, 0.36, 0.9, 1.8),
      hold: pose(0.06, 0.22, 1.18, 0, 0.3, 1, 0.5),
      depart: pose(-0.2, 0.18, 1.24, -2, 0.44, 0.96, 0.6),
    },
    poseMobile: {
      arrive: pose(0.06, -0.54, 1.16, 2, 0.24, 0.9, 1.6),
      hold: pose(0, -0.54, 1.08, 0, 0.2, 1, 0.5),
      depart: pose(-0.06, -0.56, 1.12, -2, 0.3, 0.96, 0.6),
    },
    water: { lightX: 0.1, lightY: 0.6, depth: 0.8, particles: 1, caustics: 0.75, warmth: 0 },
  },
  {
    id: "start",
    index: 5,
    label: "Start",
    marker: "05",
    hint: "Start a project or email Blake",
    clip: "open",
    band: { desktop: 2.4, mobile: 1.35 },
    pose: {
      arrive: pose(0.12, -0.34, 1.3, 0, 0.2, 0.92, 1.9),
      hold: pose(0.08, -0.4, 1.2, 0, 0.16, 1, 0.5),
      depart: pose(0.02, -0.44, 1.12, 0, 0.12, 0.94, 0.9),
    },
    poseMobile: {
      arrive: pose(0, -0.52, 1.2, 0, 0.2, 0.9, 1.8),
      hold: pose(0, -0.5, 1.14, 0, 0.16, 1, 0.5),
      depart: pose(0, -0.66, 0.9, 0, 0.12, 0.94, 0.9),
    },
    water: { lightX: 0, lightY: -0.2, depth: 0.95, particles: 1.1, caustics: 0.85, warmth: 0.1 },
  },
];

export const DESTINATION_IDS = DESTINATIONS.map((d) => d.id);

/** Every clip the journey can reach, in first-needed order. */
export const CLIP_ORDER: ClipKey[] = (() => {
  const seen = new Set<ClipKey>();
  const order: ClipKey[] = [];
  for (const destination of DESTINATIONS) {
    for (const key of [destination.clip, destination.transitionClip]) {
      if (key && !seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
  }
  return order;
})();
