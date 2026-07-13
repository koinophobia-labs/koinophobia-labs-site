"use client";

// The Trendi hero visual: the phone the fish lives in, plus (in the "full"
// variant) the one-time opening swim across the hero and a quiet idle state.
//
// Layering model for the phone-boundary illusion:
//   – the "inner" fish lives inside the phone SVG, clipped to the screen, so
//     it always sits behind the bezel;
//   – the "free" fish is a separate HTML element following a CSS motion path
//     across the hero overlay, so it sits in front of the phone;
//   – the two are crossfaded exactly at the screen plane with a ripple.
//
// Everything decorative is aria-hidden and pointer-events: none. The CTA and
// copy keep their own stacking context above the overlay.

import { animate, useReducedMotion } from "framer-motion";
import type { AnimationPlaybackControls, AnimationSequence } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildPeekPath,
  buildSwimPath,
  canReswim,
  computeReswimDelay,
  hasOpeningPlayed,
  markOpeningPlayed,
  trackTrendiHero,
  type SwimPath,
} from "@/lib/trendiHero";
import {
  FISH_VIEW,
  TrendiFishBody,
  TrendiFishBodyHeadRight,
  TrendiFishDefs,
} from "./TrendiFish";

type Variant = "full" | "ambient";

type Props = {
  /** "full" runs the opening swim (once per session); "ambient" idles only. */
  variant?: Variant;
  /** id of the hero section the overlay should cover (full variant). */
  heroId?: string;
  /** id of the TRENDI wordmark element (full variant). */
  wordmarkId?: string;
  /** id of the primary CTA element (full variant). */
  ctaId?: string;
  className?: string;
};

const PHONE_VIEW = { w: 280, h: 560 } as const;
const SCREEN = { x: 14, y: 14, w: 252, h: 532, r: 38 } as const;
// The koi rests in its native upward pose (like the logo), ~205px tall.
const FISH_SCALE = 0.345;
const FISH_REST = { x: 140, y: 316 } as const;
const SWIM_SECONDS = 3.4;

const rectOf = (el: Element | null) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

const nextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

export default function TrendiHeroVisual({
  variant = "ambient",
  heroId,
  wordmarkId,
  ctaId,
  className,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const reducedMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const innerFishRef = useRef<SVGGElement>(null);
  const rippleARef = useRef<SVGCircleElement>(null);
  const rippleBRef = useRef<SVGCircleElement>(null);
  const screenGlowRef = useRef<SVGEllipseElement>(null);

  const freeFishRef = useRef<HTMLDivElement>(null);
  const freeFishInnerRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const trailSvgRef = useRef<SVGSVGElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);

  const controlsRef = useRef<AnimationPlaybackControls[]>([]);
  const reswimTimerRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const heroVisibleRef = useRef(true);
  const openingDoneRef = useRef(false);
  const runningRef = useRef(false);

  const [heroEl, setHeroEl] = useState<HTMLElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [swimPath, setSwimPath] = useState<SwimPath | null>(null);
  const [heroSize, setHeroSize] = useState({ w: 0, h: 0 });

  const isFull = variant === "full";

  const stopAll = useCallback(() => {
    controlsRef.current.forEach((c) => c.cancel());
    controlsRef.current = [];
    runningRef.current = false;
  }, []);

  const setPausedAll = useCallback((next: boolean) => {
    setPaused(next);
    controlsRef.current.forEach((c) => (next ? c.pause() : c.play()));
  }, []);

  /** Measures the live layout and produces the swim path for this moment. */
  const measure = useCallback(
    (peek: boolean): SwimPath | null => {
      const hero = heroId ? document.getElementById(heroId) : null;
      const root = rootRef.current;
      if (!hero || !root) return null;
      const heroRect = rectOf(hero);
      if (!heroRect || heroRect.width < 10) return null;

      // The phone screen in page coordinates.
      const phoneBox = root.querySelector("[data-trendi-phone]");
      const phoneRect = rectOf(phoneBox);
      if (!phoneRect) return null;
      const sx = phoneRect.width / PHONE_VIEW.w;
      const sy = phoneRect.height / PHONE_VIEW.h;
      const screen = {
        left: phoneRect.left + SCREEN.x * sx,
        top: phoneRect.top + SCREEN.y * sy,
        width: SCREEN.w * sx,
        height: SCREEN.h * sy,
      };

      setHeroSize({ w: heroRect.width, h: heroRect.height });
      if (peek) return buildPeekPath({ hero: heroRect, screen });

      const compact = window.matchMedia("(max-width: 900px)").matches;
      return buildSwimPath({
        hero: heroRect,
        screen,
        wordmark: rectOf(wordmarkId ? document.getElementById(wordmarkId) : null),
        cta: rectOf(ctaId ? document.getElementById(ctaId) : null),
        compact,
      });
    },
    [heroId, wordmarkId, ctaId]
  );

  /** The swim itself — shared by the opening and the quieter peek loops.
   *  Returns false if the overlay was not ready to animate. */
  const runSwim = useCallback(
    async (path: SwimPath, opts: { peek: boolean; onDone?: () => void }) => {
      // Commit the overlay (portal + trail path) before touching refs.
      setSwimPath(path);
      await nextFrame();
      await nextFrame();
      const innerFish = innerFishRef.current;
      const freeFish = freeFishRef.current;
      const freeInner = freeFishInnerRef.current;
      const trail = trailRef.current;
      const rippleA = rippleARef.current;
      const rippleB = rippleBRef.current;
      const sweep = sweepRef.current;
      const ctaGlow = ctaGlowRef.current;
      if (!innerFish || !freeFish || !trail || !freeInner) return false;

      runningRef.current = true;
      const dur = opts.peek ? 2.3 : SWIM_SECONDS;
      const wake = opts.peek ? 0 : 0.9;
      const exitAt = wake + 0.7;
      const swimAt = exitAt + 0.15;
      const backAt = swimAt + dur - 0.12;

      // The fish element carries the motion path; the timeline drives it.
      freeFish.style.offsetPath = `path("${path.d}")`;
      freeFish.style.offsetRotate = "auto";
      freeFish.style.offsetDistance = "0%";
      trail.style.strokeDasharray = "0.14 1";

      // One timeline. Separate animate() calls with delays would apply their
      // first keyframes immediately (fill-backwards) and wreck the handoff.
      const sequence: AnimationSequence = [];

      if (!opts.peek) {
        // Wake: a small nudge — the tail sway is already running via CSS.
        sequence.push([
          innerFish,
          { x: [0, -7, 0], y: [0, -3, 0], rotate: [0, -2.5, 0] },
          { duration: 0.85, ease: "easeInOut", at: 0 },
        ]);
        if (rippleA)
          sequence.push([
            rippleA,
            { scale: [0.4, 1.5], opacity: [0.45, 0] },
            { duration: 0.9, ease: "easeOut", at: 0.35 },
          ]);
      }

      // Turn from the upward resting pose and glide to the screen edge.
      sequence.push([
        innerFish,
        { x: [0, -(FISH_REST.x - SCREEN.x) - 40], rotate: [0, -78] },
        { duration: 0.7, ease: [0.5, 0, 0.9, 0.6], at: wake },
      ]);
      sequence.push([innerFish, { opacity: [1, 0] }, { duration: 0.16, at: exitAt - 0.06 }]);
      if (rippleB)
        sequence.push([
          rippleB,
          { scale: [0.3, 1.7], opacity: [0.5, 0] },
          { duration: 0.8, ease: "easeOut", at: exitAt - 0.05 },
        ]);
      sequence.push([freeFish, { opacity: [0, 1] }, { duration: 0.16, at: exitAt - 0.02 }]);

      // The swim: eased distance, depth scale, and the banking roll at the
      // turn (scaleY through 0 reads as the fish rolling over, not flipping).
      sequence.push([
        freeFish,
        { offsetDistance: ["0%", "26%", "58%", "100%"] },
        {
          duration: dur,
          times: [0, 0.3, 0.58, 1],
          ease: ["easeOut", "easeInOut", "easeInOut"],
          at: swimAt,
        },
      ]);
      // The koi rolls upright at each change of travel direction: after the
      // rise past the wordmark's first glyph, and again at the CTA turn.
      sequence.push([
        freeInner,
        {
          scaleY: opts.peek
            ? [-1, -1, 1, 1]
            : [-1, -1, 1, 1, -1, -1, 1, 1],
        },
        {
          duration: dur,
          times: opts.peek
            ? [0, 0.45, 0.75, 1]
            : [0, 0.3, 0.42, 0.56, 0.66, 0.76, 0.88, 1],
          ease: "easeInOut",
          at: swimAt,
        },
      ]);
      sequence.push([
        freeInner,
        // Smallest while passing the wordmark, largest on the gutter descent.
        { scale: opts.peek ? [0.92, 0.98, 0.92] : [1, 0.98, 1.14, 1] },
        {
          duration: dur,
          times: opts.peek ? [0, 0.5, 1] : [0, 0.24, 0.66, 1],
          ease: "easeInOut",
          at: swimAt,
        },
      ]);

      // Trail chases the fish along the same path and speed profile.
      sequence.push([
        trail,
        {
          // Dash window ends exactly at the fish: offset = 0.14 - distance.
          strokeDashoffset: [0.14, -0.12, -0.44, -0.86],
          opacity: opts.peek ? [0, 0.22, 0.18, 0] : [0, 0.4, 0.34, 0],
        },
        {
          duration: dur,
          times: [0, 0.3, 0.58, 1],
          ease: ["easeOut", "easeInOut", "easeInOut"],
          at: swimAt,
        },
      ]);

      if (!opts.peek && sweep && path.wordmarkAt > 0) {
        sequence.push([
          sweep,
          { opacity: [0, 0.75, 0], x: [-60, -10, 40] },
          { duration: 1.1, ease: "easeInOut", at: swimAt + dur * (path.wordmarkAt - 0.14) },
        ]);
      }
      if (!opts.peek && ctaGlow && path.ctaAt > 0) {
        sequence.push([
          ctaGlow,
          { opacity: [0, 0.5, 0] },
          { duration: 1.0, ease: "easeInOut", at: swimAt + dur * (path.ctaAt - 0.1) },
        ]);
      }

      // Home: crossfade back through the screen plane, ripple, settle.
      sequence.push([freeFish, { opacity: [1, 0] }, { duration: 0.15, at: backAt }]);
      if (rippleA)
        sequence.push([
          rippleA,
          { scale: [0.3, 1.5], opacity: [0.45, 0] },
          { duration: 0.7, ease: "easeOut", at: backAt },
        ]);
      // The koi glides in travelling rightward (rotate 90 from its upward
      // pose) and swings back upright as it settles home.
      sequence.push([
        innerFish,
        {
          opacity: [0, 1, 1],
          x: [-(FISH_REST.x - SCREEN.x) - 10, -30, 0],
          y: [30, 12, 0],
          rotate: [86, 40, 0],
        },
        {
          duration: 0.85,
          times: [0, 0.42, 1],
          ease: [0.16, 0.8, 0.3, 1],
          at: backAt + 0.04,
        },
      ]);

      const controls = animate(sequence);
      controlsRef.current = [controls];
      controls.then(() => {
        window.setTimeout(() => {
          runningRef.current = false;
          controlsRef.current = [];
          opts.onDone?.();
        }, 900);
      });
      return true;
    },
    []
  );

  /** Schedules the occasional quiet re-swim (self-rescheduling via ref). */
  const scheduleReswimRef = useRef<() => void>(() => {});
  const scheduleReswim = useCallback(() => {
    if (!isFull || reducedMotion) return;
    if (reswimTimerRef.current) window.clearTimeout(reswimTimerRef.current);
    reswimTimerRef.current = window.setTimeout(() => {
      const gate = {
        reducedMotion: Boolean(reducedMotion),
        documentHidden: document.visibilityState === "hidden",
        heroVisible: heroVisibleRef.current,
        msSinceScroll: Date.now() - lastScrollRef.current,
        openingDone: openingDoneRef.current,
      };
      if (!runningRef.current && canReswim(gate)) {
        const path = measure(true);
        if (path) {
          runSwim(path, { peek: true, onDone: () => scheduleReswimRef.current() });
          return;
        }
      }
      scheduleReswimRef.current();
    }, computeReswimDelay());
  }, [isFull, reducedMotion, measure, runSwim]);
  useEffect(() => {
    scheduleReswimRef.current = scheduleReswim;
  }, [scheduleReswim]);

  // ——— Mount: portal target, opening trigger, observers, cleanup. ———
  useEffect(() => {
    if (!isFull) return;
    const hero = heroId ? document.getElementById(heroId) : null;

    if (reducedMotion) {
      trackTrendiHero("hero_animation_skipped_reduced_motion");
      return;
    }

    const onScroll = () => {
      lastScrollRef.current = Date.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => setPausedAll(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);

    let observer: IntersectionObserver | null = null;
    if (hero && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          heroVisibleRef.current = entry.isIntersecting;
          if (document.visibilityState !== "hidden") setPausedAll(!entry.isIntersecting);
        },
        { threshold: 0.12 }
      );
      observer.observe(hero);
    }

    let cancelled = false;
    let releaseVisibilityWait: (() => void) | null = null;
    const begin = async () => {
      setHeroEl(hero);
      if (hasOpeningPlayed(window.sessionStorage)) {
        openingDoneRef.current = true;
        scheduleReswim();
        return;
      }
      // Let fonts settle so the wordmark/CTA rects are final.
      try {
        await Promise.race([
          document.fonts?.ready,
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ]);
      } catch {
        // Fonts API unavailable — measure as-is.
      }
      if (cancelled) return;
      // Don't perform the opening into a void: wait until the phone itself
      // is on screen (on mobile it can start below the fold).
      await new Promise<void>((resolve) => {
        const phone = rootRef.current?.querySelector("[data-trendi-phone]");
        if (!phone || typeof IntersectionObserver === "undefined") return resolve();
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              obs.disconnect();
              releaseVisibilityWait = null;
              resolve();
            }
          },
          { threshold: 0.45 }
        );
        releaseVisibilityWait = () => {
          obs.disconnect();
          resolve();
        };
        obs.observe(phone);
      });
      if (cancelled) return;
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      if (cancelled) return;
      // Give React a beat to commit the portal before measuring/starting.
      await nextFrame();
      const path = measure(false);
      if (!path) {
        openingDoneRef.current = true;
        return;
      }
      const started = await runSwim(path, {
        peek: false,
        onDone: () => {
          openingDoneRef.current = true;
          trackTrendiHero("hero_animation_completed");
          scheduleReswim();
        },
      });
      if (started) {
        markOpeningPlayed(window.sessionStorage);
        trackTrendiHero("hero_animation_started");
      } else {
        openingDoneRef.current = true;
      }
    };
    const raf = window.requestAnimationFrame(() => void begin());

    // Unobtrusive replay hook for QA: window.__replayTrendiHero()
    const w = window as typeof window & { __replayTrendiHero?: () => void };
    w.__replayTrendiHero = () => {
      stopAll();
      openingDoneRef.current = false;
      if (innerFishRef.current) {
        innerFishRef.current.style.opacity = "1";
        innerFishRef.current.style.transform = "none";
      }
      const path = measure(false);
      if (path)
        runSwim(path, {
          peek: false,
          onDone: () => {
            openingDoneRef.current = true;
            scheduleReswim();
          },
        });
    };

    return () => {
      cancelled = true;
      releaseVisibilityWait?.();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      if (reswimTimerRef.current) window.clearTimeout(reswimTimerRef.current);
      delete w.__replayTrendiHero;
      stopAll();
    };
  }, [isFull, reducedMotion, heroId, measure, runSwim, scheduleReswim, setPausedAll, stopAll]);

  // Ambient variant still pauses its CSS idle loops when hidden/offscreen.
  useEffect(() => {
    if (isFull) return;
    const root = rootRef.current;
    const onVisibility = () => setPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    let observer: IntersectionObserver | null = null;
    if (root && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (document.visibilityState !== "hidden") setPaused(!entry.isIntersecting);
        },
        { threshold: 0.05 }
      );
      observer.observe(root);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [isFull]);

  const fishTransform = useMemo(
    () =>
      `translate(${FISH_REST.x - FISH_VIEW.cx * FISH_SCALE} ${
        FISH_REST.y - FISH_VIEW.cy * FISH_SCALE
      }) scale(${FISH_SCALE})`,
    []
  );

  const overlay =
    isFull && heroEl && !reducedMotion
      ? createPortal(
          <div className="trendiHV_overlay" aria-hidden="true">
            <svg
              ref={trailSvgRef}
              className="trendiHV_trailSvg"
              viewBox={`0 0 ${Math.max(heroSize.w, 1)} ${Math.max(heroSize.h, 1)}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`${uid}-trail`}
                  gradientUnits="userSpaceOnUse"
                  x1={heroSize.w}
                  y1="0"
                  x2="0"
                  y2={heroSize.h}
                >
                  <stop offset="0" stopColor="#ff9a77" />
                  <stop offset="0.5" stopColor="#ff5f9e" />
                  <stop offset="1" stopColor="#8a5cff" />
                </linearGradient>
              </defs>
              {swimPath ? (
                <path
                  ref={trailRef}
                  className="trendiHV_trail"
                  d={swimPath.d}
                  pathLength={1}
                  fill="none"
                  stroke={`url(#${uid}-trail)`}
                  strokeWidth="9"
                  strokeLinecap="round"
                  opacity="0"
                />
              ) : null}
            </svg>

            <div ref={freeFishRef} className="trendiHV_freeFish">
              <svg
                ref={freeFishInnerRef}
                viewBox={`0 0 ${FISH_VIEW.height} ${FISH_VIEW.width}`}
                className="trendiHV_freeFishSvg"
              >
                <defs>
                  <TrendiFishDefs id={`${uid}f`} />
                </defs>
                <TrendiFishBodyHeadRight id={`${uid}f`} />
              </svg>
            </div>

            <div ref={sweepRef} className="trendiHV_sweep" style={sweepStyle(heroEl, wordmarkId)} />
            <div ref={ctaGlowRef} className="trendiHV_ctaGlow" style={ctaGlowStyle(heroEl, ctaId)} />
          </div>,
          heroEl
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={["trendiHV", variant === "ambient" ? "trendiHV--ambient" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-paused={paused ? "true" : "false"}
      data-reduced={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="trendiHV_phoneWrap" data-trendi-phone="">
        <svg
          className="trendiHV_phone"
          viewBox={`0 0 ${PHONE_VIEW.w} ${PHONE_VIEW.h}`}
          role="img"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <TrendiFishDefs id={`${uid}p`} />
            <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff76af" stopOpacity="0.75" />
              <stop offset="0.5" stopColor="#8a5cff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ff9a77" stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id={`${uid}-water`} cx="0.5" cy="0.42" r="0.85">
              <stop offset="0" stopColor="#2b1230" />
              <stop offset="0.55" stopColor="#180a1d" />
              <stop offset="1" stopColor="#0c0510" />
            </radialGradient>
            <radialGradient id={`${uid}-caustic`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ff5f9e" stopOpacity="0.32" />
              <stop offset="0.6" stopColor="#a44bff" stopOpacity="0.12" />
              <stop offset="1" stopColor="#a44bff" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${uid}-screen`}>
              <rect
                x={SCREEN.x}
                y={SCREEN.y}
                width={SCREEN.w}
                height={SCREEN.h}
                rx={SCREEN.r}
              />
            </clipPath>
          </defs>

          {/* Phone body */}
          <rect x="1.5" y="1.5" width="277" height="557" rx="47" fill="#0b060d" />
          <rect
            x="1.5"
            y="1.5"
            width="277"
            height="557"
            rx="47"
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="2.5"
          />

          {/* Screen — the water the fish lives in */}
          <g clipPath={`url(#${uid}-screen)`}>
            <rect
              x={SCREEN.x}
              y={SCREEN.y}
              width={SCREEN.w}
              height={SCREEN.h}
              fill={`url(#${uid}-water)`}
            />
            <ellipse
              ref={screenGlowRef}
              className="trendiHV_caustic"
              cx="140"
              cy="310"
              rx="150"
              ry="170"
              fill={`url(#${uid}-caustic)`}
            />

            {/* Mini identity inside the screen */}
            <text x="140" y="120" className="trendiHV_screenMark" textAnchor="middle">
              TRENDI
            </text>
            <text x="140" y="146" className="trendiHV_screenTag" textAnchor="middle">
              Your AI Content Manager.
            </text>

            {/* Ripples at the screen plane */}
            <circle
              ref={rippleARef}
              className="trendiHV_ripple"
              cx={FISH_REST.x}
              cy={FISH_REST.y}
              r="46"
              style={{ opacity: 0 }}
            />
            <circle
              ref={rippleBRef}
              className="trendiHV_ripple"
              cx={SCREEN.x + 10}
              cy={FISH_REST.y}
              r="40"
              style={{ opacity: 0 }}
            />

            {/* An occasional tiny bubble */}
            <circle className="trendiHV_bubble" cx="176" cy="380" r="3" />

            {/* The resident koi, in the logo's upward swimming pose */}
            <g
              ref={innerFishRef}
              className="trendiHV_fishMove"
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              <g className="trendiHV_fishIdle">
                <g transform={fishTransform}>
                  <TrendiFishBody id={`${uid}p`} />
                </g>
              </g>
            </g>
          </g>

          {/* Bezel details drawn above the screen so the fish sits behind them */}
          <rect
            x={SCREEN.x + 1}
            y={SCREEN.y + 1}
            width={SCREEN.w - 2}
            height={SCREEN.h - 2}
            rx={SCREEN.r - 1}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.5"
          />
          <rect x="104" y="30" width="72" height="20" rx="10" fill="#050308" />
        </svg>
      </div>
      {overlay}
    </div>
  );
}

function sweepStyle(hero: HTMLElement, wordmarkId?: string): CSSProperties {
  const mark = wordmarkId ? document.getElementById(wordmarkId) : null;
  if (!mark) return { display: "none" };
  const h = hero.getBoundingClientRect();
  const m = mark.getBoundingClientRect();
  return {
    left: m.left - h.left,
    top: m.bottom - h.top + 10,
    width: m.width,
  };
}

function ctaGlowStyle(hero: HTMLElement, ctaId?: string): CSSProperties {
  const cta = ctaId ? document.getElementById(ctaId) : null;
  if (!cta) return { display: "none" };
  const h = hero.getBoundingClientRect();
  const c = cta.getBoundingClientRect();
  return {
    left: c.left - h.left - 14,
    top: c.top - h.top - 14,
    width: c.width + 28,
    height: c.height + 28,
  };
}
