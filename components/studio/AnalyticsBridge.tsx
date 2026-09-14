"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

/**
 * Sixteen events that change a decision. See the rebuild document, section 12.
 *
 * Declarative markers:
 *   data-analytics="event_name"             fires on click, with {label}
 *   data-analytics-label="..."              the label for either marker
 *   data-analytics-view="event_name"        fires once when 35% visible, with {label}
 *
 * Programmatic: components call `track` directly for events with richer
 * properties (app_store_click, demo_clip_play, inquiry_submit, …).
 *
 * The koi world dispatches "koinophobia:destination" as the visitor reaches
 * each band; this bridge turns that into journey_depth once per band per
 * session, with the motion mode, so cinematic and still visitors can be
 * compared.
 */
export const ANALYTICS_EVENTS = [
  "app_store_click",
  "product_page_view",
  "demo_clip_play",
  "demo_clip_complete",
  "master_link_click",
  "lab_card_click",
  "web_demo_click",
  "testflight_click",
  "log_entry_view",
  "founder_link_click",
  "work_with_me_view",
  "engagement_shape_view",
  "inquiry_start",
  "inquiry_submit",
  "inquiry_fail",
  "journey_depth",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function trackStudioEvent(event: string, detail: Record<string, string> = {}) {
  window.dispatchEvent(new CustomEvent("koinophobia:analytics", { detail: { event, ...detail } }));
  track(event, detail);
}

export default function AnalyticsBridge() {
  const pathname = usePathname();

  useEffect(() => {
    const seen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target)) continue;
          seen.add(entry.target);
          const el = entry.target as HTMLElement;
          const event = el.dataset.analyticsView;
          if (event) trackStudioEvent(event, el.dataset.analyticsLabel ? { label: el.dataset.analyticsLabel } : {});
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll("[data-analytics-view]").forEach((node) => observer.observe(node));

    const onClick = (click: MouseEvent) => {
      const target = click.target as HTMLElement | null;
      const tracked = target?.closest<HTMLElement>("[data-analytics]");
      const event = tracked?.dataset.analytics;
      if (event) trackStudioEvent(event, { label: tracked.dataset.analyticsLabel || tracked.textContent?.trim().slice(0, 60) || "" });
    };
    document.addEventListener("click", onClick);

    const reached = new Set<string>();
    const onDestination = (event: Event) => {
      const { id, motion } = (event as CustomEvent<{ id: string; motion: string }>).detail ?? {};
      if (!id || id === "surface" || reached.has(id)) return;
      reached.add(id);
      trackStudioEvent("journey_depth", { band: id, motion: motion || "unknown" });
    };
    window.addEventListener("koinophobia:destination", onDestination);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick);
      window.removeEventListener("koinophobia:destination", onDestination);
    };
  }, [pathname]);

  return null;
}
