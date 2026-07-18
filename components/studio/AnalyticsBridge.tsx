"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

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
          const event = entry.target.getAttribute("data-analytics-view");
          if (event) trackStudioEvent(event);
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll("[data-analytics-view]").forEach((node) => observer.observe(node));

    const onClick = (click: MouseEvent) => {
      const target = click.target as HTMLElement | null;
      const tracked = target?.closest<HTMLElement>("[data-analytics]");
      const event = tracked?.dataset.analytics;
      if (event) trackStudioEvent(event, { label: tracked.dataset.analyticsLabel || tracked.textContent?.trim() || "" });
    };
    document.addEventListener("click", onClick);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  return null;
}
