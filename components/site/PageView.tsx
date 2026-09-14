"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/**
 * A page-level view event with the section the visitor came from, derived
 * from the referrer path (a same-site referrer keeps its pathname; anything
 * else is "external"; nothing is "direct").
 */
export default function PageView({ event }: { event: "work_with_me_view" }) {
  useEffect(() => {
    let referrer = "direct";
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref) referrer = ref.origin === window.location.origin ? ref.pathname || "/" : "external";
    } catch {
      /* ignore */
    }
    track(event, { referrer_section: referrer });
  }, [event]);
  return null;
}
