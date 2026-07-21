"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import KoiGlyph from "./KoiGlyph";
import {
  selectObservation,
  worldForRoute,
  worldTemperament,
  observations,
  type KoiObservation,
  type KoiTrigger,
} from "@/lib/dev-koi/observations";
import { personalKoiHostAllowed } from "@/lib/dev-koi/host";
import {
  emptySession,
  readSession,
  recordShown,
  suppressedIds,
  writeSession,
  type DevKoiSession,
} from "@/lib/dev-koi/session";

/**
 * The personal koi.
 *
 * HOST ISOLATION HAS TWO LOCKS. Structurally, this component is imported only
 * by personal-site surfaces (DevShell, /home, /now, /connect) — the studio pages
 * never pull it in. That covers most routes outright. But /now and /connect are
 * answered by BOTH hosts from this one app, so structure alone would let a
 * personal companion appear on the commercial domain. `personalKoiHostAllowed`
 * is the second lock, and it is the exact inverse of the studio companion's
 * allowlist: the two sets are disjoint, so the two koi can never coexist.
 *
 * WHAT IT IS NOT: a chat bubble, a support widget, a tutorial overlay, a sales
 * funnel. It notices one true thing about the page you're on, offers at most one
 * link, and goes back to resting.
 *
 * MOTION: anchored drift inside a small fixed box. It never chases the cursor —
 * there is no pointer handler at all, which makes "does not chase" true by
 * construction rather than by tuning. The rAF loop self-terminates when settled
 * so an idle page costs nothing.
 */

const DWELL_MS = 9000;
const SCROLL_REST_MS = 1400;
const DRIFT_RADIUS = 14;
/**
 * Below this width an unsolicited note would overlay page controls — at 320px it
 * covered a product's primary button. So on small screens the koi never
 * volunteers; it rests until tapped. Same creature, better manners.
 */
const PROACTIVE_MIN_WIDTH = 480;
const BASE_PERIOD_MS = 9000;

const cooldownFor = (id: string) =>
  observations.find((o) => o.id === id)?.cooldownMs ?? 30 * 60_000;

export default function PersonalKoi() {
  const pathname = usePathname() ?? "/";
  const world = worldForRoute(pathname);

  const [hydrated, setHydrated] = useState(false);
  const [hostAllowed, setHostAllowed] = useState(false);
  const [session, setSession] = useState<DevKoiSession>(emptySession);
  const [observation, setObservation] = useState<KoiObservation | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  // A note leaves the way it arrived — with a transform, never an unmount snap.
  const [closing, setClosing] = useState(false);

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dwellTimer = useRef<number | null>(null);
  const scrollTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const sessionRef = useRef(session);

  // Mirrored in an effect rather than during render: the timers and listeners
  // below close over sessionRef and must read the latest value without
  // re-subscribing on every state change.
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  /* ---------------------------------------------------------- hydration */

  useEffect(() => {
    // Deferred so server and first client render agree; storage and media
    // queries are read only after mount.
    const id = window.setTimeout(() => {
      setHostAllowed(personalKoiHostAllowed(window.location.hostname));
      setSession(readSession());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /* ------------------------------------------------- environment signals */

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPaused(document.visibilityState !== "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Stop animating while scrolled past. Cheap, and honest about battery.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { rootMargin: "80px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hydrated]);

  /* -------------------------------------------------------------- motion */

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    // Reduced motion, hidden tab, offscreen: the loop never starts.
    if (reducedMotion || paused || offscreen) {
      body.style.removeProperty("transform");
      return;
    }

    const temperament = world ? worldTemperament[world] : undefined;
    const radius = DRIFT_RADIUS * (temperament?.drift ?? 1);
    const period = BASE_PERIOD_MS * (temperament?.period ?? 1);

    let frame = 0;
    const started = performance.now();

    const render = (time: number) => {
      const t = (time - started) / period;
      // Two out-of-phase sines: a slow lateral drift and a smaller vertical
      // one, so the path is a lazy figure rather than a circle.
      const x = Math.sin(t * Math.PI * 2) * radius;
      const y = Math.sin(t * Math.PI * 2 * 0.6 + 1.1) * (radius * 0.55);
      const heading = Math.cos(t * Math.PI * 2) * 7;

      body.style.setProperty("transform", `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`);
      body.style.setProperty("--devkoi-heading", `${heading.toFixed(2)}deg`);
      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      body.style.removeProperty("transform");
    };
    // `hydrated` matters: the component renders null until it flips, so on the
    // first pass bodyRef.current is null and this effect bails. Without it in
    // the deps the loop never restarts once the koi actually mounts, and the
    // fish sits perfectly still forever.
  }, [hydrated, reducedMotion, paused, offscreen, world]);

  /* -------------------------------------------------------- observations */

  const offer = useCallback(
    (trigger: KoiTrigger) => {
      const current = sessionRef.current;
      if (current.dismissed || current.minimized) return;
      if (document.visibilityState !== "visible") return;
      // Narrow viewports: wait to be asked. A note here would cover content.
      if (window.innerWidth < PROACTIVE_MIN_WIDTH) return;

      // Never interrupt someone typing or mid-dialog.
      const active = document.activeElement as HTMLElement | null;
      if (active?.matches("input, textarea, select, [contenteditable='true']")) return;

      const now = Date.now();
      const seen = suppressedIds(current, cooldownFor, now);
      const next = selectObservation(pathname, trigger, seen);
      if (!next) return;

      // A fresh note cancels any exit in flight so it never arrives already leaving.
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      setClosing(false);
      setObservation(next);
      const updated = recordShown(current, next.id, now);
      setSession(updated);
      writeSession(updated);
    },
    [pathname]
  );

  // Route change: clear anything showing, then consider an arrival note.
  useEffect(() => {
    if (!hydrated) return;

    // Clearing is deferred with the arrival timer rather than fired
    // synchronously — a setState during effect commit cascades a second render
    // on every navigation, for a note that is usually already null.
    const clearId = window.setTimeout(() => {
      setClosing(false);
      setObservation(null);
    }, 0);
    const arriveId = window.setTimeout(() => offer("arrive"), 2200);
    dwellTimer.current = window.setTimeout(() => offer("dwell"), DWELL_MS);

    return () => {
      window.clearTimeout(clearId);
      window.clearTimeout(arriveId);
      if (dwellTimer.current) window.clearTimeout(dwellTimer.current);
    };
  }, [pathname, hydrated, offer]);

  // Settling after a scroll is a good moment; mid-scroll never is.
  useEffect(() => {
    if (!hydrated) return;
    const onScroll = () => {
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(() => offer("scroll-rest"), SCROLL_REST_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    };
  }, [hydrated, offer]);

  /* -------------------------------------------------------------- actions */

  const update = (patch: Partial<DevKoiSession>) => {
    const next = { ...sessionRef.current, ...patch };
    setSession(next);
    writeSession(next);
  };

  // Clear the note with a short exit rather than an unmount snap. The unmount is
  // driven by this timeout, never by animationend — so a throttled tab that
  // freezes the CSS mid-exit still removes the note on schedule. Reduced motion
  // skips the movement entirely.
  const dismissNote = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (reducedMotion) {
      setClosing(false);
      setObservation(null);
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setClosing(false);
      setObservation(null);
    }, 200);
  }, [reducedMotion]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const toggle = () => {
    if (observation) {
      dismissNote();
      return;
    }
    if (session.minimized) {
      update({ minimized: false });
      return;
    }
    // A click with nothing pending: look for something worth saying, and if
    // there isn't, stay quiet rather than inventing filler.
    const seen = suppressedIds(sessionRef.current, cooldownFor, Date.now());
    const found =
      selectObservation(pathname, "dwell", seen) ??
      selectObservation(pathname, "arrive", seen) ??
      selectObservation(pathname, "scroll-rest", seen);
    if (found) {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      setClosing(false);
      setObservation(found);
      const updated = recordShown(sessionRef.current, found.id, Date.now());
      setSession(updated);
      writeSession(updated);
    } else {
      update({ minimized: true });
    }
  };

  if (!hydrated || !hostAllowed || session.dismissed) return null;

  const resting = !observation;

  return (
    <div
      ref={rootRef}
      className="devkoi"
      data-world={world}
      data-resting={resting ? "true" : "false"}
      data-minimized={session.minimized ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {observation ? (
        <div className="devkoi__note" role="status" data-closing={closing ? "true" : "false"}>
          <p>{observation.message}</p>
          <div className="devkoi__note-actions">
            {observation.action ? (
              observation.action.external ? (
                <a
                  className="devkoi__note-link"
                  href={observation.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setObservation(null)}
                >
                  {observation.action.label} <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ) : (
                <Link
                  className="devkoi__note-link"
                  href={observation.action.href}
                  onClick={() => setObservation(null)}
                >
                  {observation.action.label} <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              )
            ) : null}
            <button
              type="button"
              className="devkoi__note-dismiss"
              onClick={dismissNote}
            >
              Dismiss
            </button>
          </div>
          <button
            type="button"
            className="devkoi__note-close"
            onClick={() => update({ dismissed: true })}
            aria-label="Hide the koi for this device"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="devkoi__body"
        data-testid="dev-koi"
        onClick={toggle}
        aria-label={
          observation
            ? "Close this note"
            : session.minimized
              ? "Wake the koi"
              : "Ask the koi about this page"
        }
        aria-expanded={observation ? true : false}
      >
        <span ref={bodyRef as React.RefObject<HTMLSpanElement>} className="devkoi__swim">
          <KoiGlyph />
        </span>
      </button>
    </div>
  );
}
