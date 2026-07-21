/**
 * The personal koi, as inline SVG.
 *
 * Lifted from public/koi-mark.svg — the same hand-drawn fish that has been the
 * mark on this domain — with the plate background and enclosing ring dropped so
 * only the creature remains. Inline rather than <Image> for three reasons: it
 * carries no network cost, it inherits currentColor so the accent can shift per
 * product world, and individual paths can move (the tail flicks; the raster
 * studio koi fundamentally cannot).
 *
 * The studio's companion uses a two-koi WebP brand lockup. Sharing that artwork
 * would visually equate a sales assistant with a personal one, so this doesn't.
 */
export default function KoiGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`devkoi__glyph ${className}`}
      viewBox="0 0 512 512"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* trailing fin — the part that flicks */}
      <path
        className="devkoi__fin devkoi__fin--tail"
        d="M142 276c-28-5-55-24-78-58 42-1 75 10 98 32"
        fill="currentColor"
        opacity="0.72"
      />
      {/* leading fin */}
      <path
        className="devkoi__fin devkoi__fin--lead"
        d="M370 302c35 15 59 41 76 78-46-9-79-28-100-57"
        fill="currentColor"
        opacity="0.55"
      />
      {/* body */}
      <path
        className="devkoi__body"
        d="M148 272c54-116 180-128 230-48 22 36 9 85-27 112-58 44-152 24-203-64Z"
        fill="currentColor"
      />
      {/* dorsal marking, punched out of the body so the ink shows through */}
      <path
        className="devkoi__marking"
        d="M202 255c34-37 89-42 128-8-29 9-55 29-75 62-24-8-41-25-53-54Z"
        fill="var(--dh-ink, #05060a)"
        opacity="0.82"
      />
      <circle className="devkoi__eye" cx="340" cy="229" r="12" fill="var(--dh-ink, #05060a)" />
    </svg>
  );
}
