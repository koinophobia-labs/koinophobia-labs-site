"use client";

import { useEffect } from "react";

/**
 * The motion runtime for every page outside the koi world.
 *
 *  - Decides the motion mode once (reduced motion or Save-Data => "still")
 *    and stamps it on the nearest [data-motion-shell]. Server HTML carries no
 *    mode, so nothing is ever hidden before the client claims the page.
 *  - Surfacing: adds .is-in to every .s as it enters the viewport. Anything
 *    already on screen at mount surfaces on the next frame.
 *  - Pointer velocity: writes --vx/--vy to :root for the after-image, zeroed
 *    after 450ms of stillness. Fine pointers only.
 *  - Card tilt: [data-tilt] cards rotate their .device toward the cursor.
 *  - The hero ghost: .ghost-once fires once per session.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const shell = document.querySelector<HTMLElement>("[data-motion-shell]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const saveData = Boolean(connection?.saveData) || /^(slow-2g|2g)$/.test(connection?.effectiveType ?? "");
    const still = reduced || saveData;
    shell?.setAttribute("data-motion", still ? "still" : "cinematic");

    const cleanups: Array<() => void> = [];

    if (!still) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
      );
      const targets = document.querySelectorAll<HTMLElement>(".s");
      targets.forEach((el) => io.observe(el));
      const raf = requestAnimationFrame(() => {
        targets.forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add("is-in");
        });
      });
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        io.disconnect();
      });

      const ghost = document.querySelector<HTMLElement>(".ghost-once");
      if (ghost && !sessionStorage.getItem("koi-ghost")) {
        const t = window.setTimeout(() => {
          ghost.classList.add("is-fired");
          try {
            sessionStorage.setItem("koi-ghost", "1");
          } catch {
            /* private mode */
          }
        }, 380);
        cleanups.push(() => window.clearTimeout(t));
      }
    }

    if (!still && window.matchMedia("(pointer: fine)").matches) {
      let lx = 0;
      let ly = 0;
      let lt = 0;
      let vx = 0;
      let vy = 0;
      let pending = false;
      let settle = 0;
      const clamp = (n: number) => Math.max(-1, Math.min(1, n));
      const onMove = (event: PointerEvent) => {
        const t = performance.now();
        const dt = Math.max(8, t - lt);
        vx = clamp(((event.clientX - lx) / dt) * 0.9);
        vy = clamp(((event.clientY - ly) / dt) * 0.9);
        lx = event.clientX;
        ly = event.clientY;
        lt = t;
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => {
            root.style.setProperty("--vx", vx.toFixed(2));
            root.style.setProperty("--vy", vy.toFixed(2));
            pending = false;
          });
        }
        window.clearTimeout(settle);
        settle = window.setTimeout(() => {
          root.style.setProperty("--vx", "0");
          root.style.setProperty("--vy", "0");
        }, 450);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        window.clearTimeout(settle);
      });

      const tilts = document.querySelectorAll<HTMLElement>("[data-tilt]");
      tilts.forEach((card) => {
        const device = card.querySelector<HTMLElement>(".device");
        if (!device) return;
        const move = (event: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const x = (event.clientX - r.left) / r.width - 0.5;
          device.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
        };
        const leave = () => device.style.setProperty("--ry", "0deg");
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
