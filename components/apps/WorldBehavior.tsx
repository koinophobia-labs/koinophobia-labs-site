"use client";
import { useEffect, useRef } from "react";

// Observe state changes only. No animation loop, timers, or motion at rest.
export function WorldBehavior() {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: no-preference)");
    const root = document.querySelector(".app-home");
    if (!root) return;
    const entries = new IntersectionObserver(items => {
      for (const item of items) if (item.isIntersecting) {
        item.target.classList.add("world-entered");
        entries.unobserve(item.target);
      }
    }, { threshold: .15 });
    if (media.matches) root.querySelectorAll("[data-enter]").forEach(el => entries.observe(el));
    const beats = new IntersectionObserver(items => {
      for (const item of items) item.target.classList.toggle("beat-current", item.isIntersecting);
    }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
    if (media.matches) root.querySelectorAll(".script-beat").forEach(el => beats.observe(el));
    const steps = new IntersectionObserver(items => {
      for (const item of items) if (item.isIntersecting) {
        root.querySelectorAll(".school-stepper a").forEach(link => {
          if (link.getAttribute("href") === `#${item.target.id || "learn"}`) link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
      }
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    root.querySelectorAll("[data-school-step], .schoolhouse").forEach(el => steps.observe(el));
    const change = () => {
      if (!media.matches) { entries.disconnect(); beats.disconnect(); }
    };
    media.addEventListener("change", change);
    return () => { entries.disconnect(); beats.disconnect(); steps.disconnect(); media.removeEventListener("change", change); };
  }, []);
  return null;
}

export function Entrance() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const media = matchMedia("(prefers-reduced-motion: no-preference)");
    const stop = () => { video.pause(); video.hidden = true; };
    if (!media.matches) return;
    let played = false;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { stop(); return; }
      if (!played && media.matches && !document.hidden) {
        played = true; video.hidden = false; video.play().catch(stop);
      }
    });
    const visibility = () => { if (document.hidden) stop(); };
    const preference = () => { if (!media.matches) stop(); };
    io.observe(video.parentElement!);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", preference);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", preference); };
  }, []);
  return <video ref={ref} className="diary-entrance" hidden muted playsInline preload="none" aria-hidden="true" onError={e => { e.currentTarget.hidden = true; }} onEnded={e => { e.currentTarget.hidden = true; }}><source src="/apps/forget-about-it/entrance.mp4" type="video/mp4" /></video>;
}
