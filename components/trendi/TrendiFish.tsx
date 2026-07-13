// The Trendi fish, reconstructed as minimal vector paths from the approved
// app-icon reference (coral → magenta → violet, softly emissive glass).
// Drawn pointing toward +x in a 200×120 box centred near (100, 60).

export const FISH_VIEW = { width: 200, height: 120, cx: 104, cy: 60 } as const;

const BODY_D =
  "M178 58c-6-14-26-24-48-25-20-1-38 6-48 17-4 5-5 12-1 17 9 12 26 20 46 20 22 0 44-9 51-23 1-2 1-4 0-6z";

export function TrendiFishDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-body`} x1="30" y1="60" x2="188" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8a5cff" />
        <stop offset="0.42" stopColor="#d94fe0" />
        <stop offset="0.78" stopColor="#ff5f9e" />
        <stop offset="1" stopColor="#ffa07d" />
      </linearGradient>
      <linearGradient id={`${id}-fin`} x1="20" y1="60" x2="120" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8a5cff" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ff5f9e" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id={`${id}-sheen`} cx="0.62" cy="0.3" r="0.55">
        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <clipPath id={`${id}-bodyclip`}>
        <path d={BODY_D} />
      </clipPath>
    </>
  );
}

/**
 * One fish instance. `id` must match the id passed to TrendiFishDefs within
 * the same <svg>. The tail is a separate group so idle CSS can sway it.
 */
export function TrendiFishBody({ id, className }: { id: string; className?: string }) {
  return (
    <g className={className} data-trendi-fish-body="">
      {/* Soft emissive halo behind the whole fish */}
      <g filter={`url(#${id}-soft)`} opacity="0.45" data-trendi-fish-halo="">
        <path
          d="M176 62c-8-16-28-27-52-28-22-1-40 8-50 20-3 4-3 9 0 13 10 12 28 21 50 20 24-1 44-11 52-25z"
          fill={`url(#${id}-body)`}
        />
      </g>

      {/* Tail — flowing twin veil, pivots at its base (right edge of its box) */}
      <g data-trendi-fish-tail="" style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}>
        <path
          d="M80 52C66 36 48 26 24 26c11 10 16 20 17 30-2 2-2 6 0 8-1 10-6 20-17 30 24 0 42-10 56-26 3-4 3-12 0-16z"
          fill={`url(#${id}-fin)`}
          opacity="0.9"
        />
        <path
          d="M80 56C70 48 58 44 44 45c7 5 11 10 13 16 2 5 8 8 14 6 4-2 6-6 9-11z"
          fill={`url(#${id}-body)`}
          opacity="0.45"
        />
      </g>

      {/* Dorsal fin, tucked behind the back line */}
      <path
        d="M92 46c6-16 20-26 38-28-6 9-9 18-9 27z"
        fill={`url(#${id}-fin)`}
        opacity="0.95"
      />
      {/* Pectoral fin, behind the belly line */}
      <path
        d="M124 76c0 9 5 17 13 22-11 2-20-2-26-10 4-5 8-9 13-12z"
        fill={`url(#${id}-fin)`}
        opacity="0.7"
      />

      {/* Body — koi teardrop, blunt rounded head */}
      <path d={BODY_D} fill={`url(#${id}-body)`} />

      {/* Glass sheen, clipped to the body */}
      <g clipPath={`url(#${id}-bodyclip)`}>
        <ellipse
          cx="130"
          cy="48"
          rx="42"
          ry="16"
          fill={`url(#${id}-sheen)`}
          transform="rotate(-6 130 48)"
        />
      </g>

      {/* Eye — small, calm */}
      <circle cx="160" cy="55" r="4.2" fill="#1c0716" />
      <circle cx="161.3" cy="53.7" r="1.3" fill="#ffd9ec" opacity="0.9" />
    </g>
  );
}
