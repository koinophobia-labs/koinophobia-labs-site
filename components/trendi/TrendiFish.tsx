// The Trendi koi — traced 1:1 from the approved logo artwork
// (creator-command-center-transparent-logo-v1.png, the hand/phone/koi mark),
// so the silhouette is exactly the brand fish. Drawn in its native pose:
// swimming upward (head top-left), in a 307×596 box. Gradient runs
// coral (head) → magenta → violet (tail), matching the approved reference.
// The potrace group transform (translate/scale with y-flip) is part of the
// traced output and must stay with the path.

export const FISH_VIEW = { width: 307, height: 596, cx: 153, cy: 298 } as const;

const KOI_D =
  "M540 5893 c-377 -30 -479 -131 -480 -471 0 -248 77 -475 245 -723 41 -60 75 -112 75 -115 0 -3 -13 -24 -29 -47 -179 -261 -212 -644 -81 -933 45 -101 117 -203 199 -285 106 -106 105 -106 180 -61 164 97 310 296 359 490 10 39 21 74 24 78 8 8 81 -119 134 -231 184 -394 203 -791 53 -1125 -43 -96 -111 -192 -129 -184 -340 149 -683 112 -891 -95 -97 -98 -123 -151 -104 -213 59 -197 241 -373 448 -433 45 -13 57 -20 53 -33 -42 -150 -44 -483 -4 -634 114 -421 435 -737 826 -814 141 -27 337 -13 422 31 l30 15 -84 83 c-98 97 -173 232 -183 330 l-6 55 54 -14 c181 -48 366 -41 580 22 327 97 473 105 685 39 114 -35 108 -39 101 58 -22 349 -343 651 -777 732 -161 30 -235 47 -286 66 -120 45 -194 132 -194 229 0 69 2 71 146 212 193 187 305 338 414 556 315 632 269 1408 -126 2125 -36 66 -64 120 -62 121 2 1 37 10 78 19 173 40 336 151 408 277 40 69 40 88 1 160 -97 182 -319 332 -582 392 -114 27 -368 29 -486 5 l-74 -14 -86 62 c-261 190 -578 290 -851 268z m259 -268 c565 -108 1170 -867 1325 -1662 120 -617 2 -1123 -395 -1691 -183 -261 -245 -449 -210 -634 44 -226 216 -369 521 -433 302 -63 415 -108 528 -210 34 -31 62 -60 62 -64 0 -4 -55 -14 -122 -24 -68 -9 -172 -32 -233 -51 -326 -100 -576 -91 -819 31 -57 29 -56 30 -82 -76 -25 -102 -26 -287 0 -394 10 -43 16 -81 13 -83 -19 -19 -221 95 -308 173 -102 92 -208 272 -251 428 -33 123 -32 363 4 495 51 189 126 315 308 520 229 256 315 408 381 666 93 371 40 767 -156 1161 -126 255 -242 411 -523 706 -333 348 -461 538 -524 782 -32 125 -15 292 35 333 47 39 299 54 446 27z m1111 -286 c165 -20 324 -89 426 -185 54 -49 53 -52 -29 -105 -71 -46 -155 -74 -252 -84 l-70 -7 -45 69 c-25 37 -89 123 -142 190 -95 119 -97 122 -70 126 52 8 98 7 182 -4z m-1312 -981 c15 -18 63 -72 106 -121 88 -99 95 -116 96 -253 0 -147 -59 -314 -146 -411 l-44 -48 -30 35 c-46 53 -119 206 -135 285 -36 171 0 367 92 506 31 47 28 47 61 7z m270 -2263 c58 -18 61 -23 32 -50 -29 -26 -142 -181 -170 -232 -27 -50 -36 -51 -123 -22 -101 34 -192 101 -239 177 l-21 35 24 20 c36 29 112 66 172 82 66 19 250 13 325 -10z M819 5107 c-94 -63 -89 -187 10 -254 117 -79 262 57 203 191 -37 83 -138 113 -213 63z";

export function TrendiFishDefs({
  id,
  colors = ["#ffa07d", "#ff5f9e", "#d94fe0", "#8a5cff"],
}: {
  id: string;
  colors?: readonly [string, string, string, string];
}) {
  return (
    <>
      {/* Inner (pre-transform) coordinates: y 5960 = head, y 0 = tail. */}
      <linearGradient
        id={`${id}-body`}
        x1="1530"
        y1="5960"
        x2="1530"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor={colors[0]} />
        <stop offset="0.34" stopColor={colors[1]} />
        <stop offset="0.72" stopColor={colors[2]} />
        <stop offset="1" stopColor={colors[3]} />
      </linearGradient>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="90" />
      </filter>
    </>
  );
}

/**
 * One koi instance in its native upward-swimming pose (307×596).
 * `id` must match the id passed to TrendiFishDefs within the same <svg>.
 */
export function TrendiFishBody({ id, className }: { id: string; className?: string }) {
  return (
    <g className={className} data-trendi-fish-body="">
      <g transform="translate(0,596) scale(0.1,-0.1)">
        {/* Soft emissive halo behind the line work */}
        <path d={KOI_D} fill={`url(#${id}-body)`} filter={`url(#${id}-soft)`} opacity="0.5" />
        {/* The koi itself */}
        <path d={KOI_D} fill={`url(#${id}-body)`} />
      </g>
    </g>
  );
}

/**
 * The koi rotated to point head-first along +x (for motion paths), in a
 * 596×307 box. offset-rotate: auto then orients it along the swim path.
 */
export function TrendiFishBodyHeadRight({ id, className }: { id: string; className?: string }) {
  return (
    <g transform="rotate(90) translate(0 -596)">
      <TrendiFishBody id={id} className={className} />
    </g>
  );
}
