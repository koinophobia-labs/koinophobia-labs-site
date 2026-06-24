"use client";

import { useEffect, useMemo, useState } from "react";

export function useIsNarrow(width = 900) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${width}px)`);
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [width]);

  return isNarrow;
}

export function useScrollSpy(ids: string[], offset = 160) {
  const [active, setActive] = useState(ids[0] ?? "");
  const stableIds = useMemo(() => ids.join("|"), [ids]);

  useEffect(() => {
    const sectionIds = stableIds.split("|").filter(Boolean);
    const onScroll = () => {
      let current = sectionIds[0] ?? "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop - offset <= window.scrollY) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset, stableIds]);

  return active;
}

export function useHasScrolled(amount = 24) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > amount);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [amount]);

  return hasScrolled;
}

