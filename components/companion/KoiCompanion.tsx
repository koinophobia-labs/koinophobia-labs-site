"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompanionKoiArt from "@/components/companion/CompanionKoiArt";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import { companionHostAllowed, resolveCompanionPageContext } from "@/lib/companion/page-context";
import { resolveCompanionMotionState, type CompanionMotionState } from "@/lib/companion/motion";
import {
  canShowCompanionInvitation,
  COMPANION_STORAGE_KEY,
  dismissCompanionInvitation,
  emptyCompanionSession,
  parseCompanionSession,
  recordCompanionInvitation,
  type CompanionSession,
} from "@/lib/companion/session";
import { CONCIERGE_STORAGE_KEY, parseConciergeDraft } from "@/lib/concierge/session";

const KoiCompanionPanel = dynamic(() => import("@/components/companion/KoiCompanionPanel"), {
  ssr: false,
  loading: () => <div className="koi-companion-panel-loader" role="status">Opening project concierge…</div>,
});

function interactionInProgress() {
  const active = document.activeElement as HTMLElement | null;
  if (active?.matches("input, textarea, select, [contenteditable='true']")) return true;
  return Boolean(document.querySelector("dialog[open], [role='dialog'], [aria-modal='true'], [aria-expanded='true']"));
}

export default function KoiCompanion() {
  const pathname = usePathname();
  const context = useMemo(() => resolveCompanionPageContext(pathname), [pathname]);
  const [hydrated, setHydrated] = useState(false);
  const [hostAllowed, setHostAllowed] = useState(false);
  const [session, setSession] = useState<CompanionSession>(emptyCompanionSession);
  const [open, setOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [invitationVisible, setInvitationVisible] = useState(false);
  const [motionState, setMotionState] = useState<CompanionMotionState>("resting");
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [collisionHidden, setCollisionHidden] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const persistSession = useCallback((next: CompanionSession) => {
    setSession(next);
    try { window.sessionStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(next)); } catch { /* Interface persistence is optional. */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHostAllowed(companionHostAllowed(window.location.hostname));
      let recovered = emptyCompanionSession();
      try { recovered = parseCompanionSession(window.sessionStorage.getItem(COMPANION_STORAGE_KEY)); } catch { /* Start with safe defaults. */ }
      setSession(recovered);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(false);
      setInvitationVisible(false);
      setMotionState("resting");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return;
    trackStudioEvent("koi_companion_viewed", { route_category: context.routeKey });
  }, [context.enabled, context.routeKey, hostAllowed, hydrated, session.hidden]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || !context.invitation || open || collisionHidden || !canShowCompanionInvitation(session, context.routeKey)) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || interactionInProgress()) return;
      const next = recordCompanionInvitation(session, context.routeKey);
      persistSession(next);
      setInvitationVisible(true);
      setMotionState("inviting");
      trackStudioEvent("koi_companion_invitation_shown", {
        route_category: context.routeKey,
        invitation_number: String(next.invitationCount),
      });
    }, context.invitationDelayMs);
    return () => window.clearTimeout(timer);
  }, [collisionHidden, context, hostAllowed, hydrated, open, persistSession, session]);

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

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || open) return;
    let frame = 0;
    const inspect = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const triggerRect = trigger.getBoundingClientRect();
        const controls = document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [role="button"]');
        let blocked = false;
        for (const control of controls) {
          if (control === trigger || control.closest(".koi-companion")) continue;
          const style = window.getComputedStyle(control);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
          const rect = control.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const overlapX = Math.min(triggerRect.right, rect.right) - Math.max(triggerRect.left, rect.left);
          const overlapY = Math.min(triggerRect.bottom, rect.bottom) - Math.max(triggerRect.top, rect.top);
          if (overlapX > 6 && overlapY > 6) { blocked = true; break; }
        }
        setCollisionHidden((current) => current === blocked ? current : blocked);
        if (blocked) setInvitationVisible(false);
      });
    };
    inspect();
    window.addEventListener("scroll", inspect, { passive: true });
    window.addEventListener("resize", inspect);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", inspect);
      window.removeEventListener("resize", inspect);
    };
  }, [context.enabled, hostAllowed, hydrated, open, pathname]);

  useEffect(() => {
    if (open || invitationVisible || reducedMotion) return;
    let sleepTimer = window.setTimeout(() => setMotionState("sleeping"), 90_000);
    const wake = () => {
      setMotionState("resting");
      window.clearTimeout(sleepTimer);
      sleepTimer = window.setTimeout(() => setMotionState("sleeping"), 90_000);
    };
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(sleepTimer);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [invitationVisible, open, reducedMotion]);

  useEffect(() => () => { if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current); }, []);

  function openPanel(entryAction: "trigger" | "invitation") {
    let draft = null;
    try { draft = parseConciergeDraft(window.localStorage.getItem(CONCIERGE_STORAGE_KEY)); } catch { /* No draft available. */ }
    setHasDraft(Boolean(draft));
    setInvitationVisible(false);
    setOpen(true);
    persistSession({ ...session, minimized: false });
    trackStudioEvent("koi_companion_opened", {
      route_category: context.routeKey,
      entry_action: entryAction,
      session_state: draft ? "resumed" : "new",
      device_class: window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop",
    });
  }

  const closePanel = useCallback(() => {
    setOpen(false);
    persistSession({ ...session, minimized: true });
    trackStudioEvent("koi_companion_minimized", { route_category: context.routeKey });
    window.queueMicrotask(() => triggerRef.current?.focus());
  }, [context.routeKey, persistSession, session]);

  function dismissInvitation() {
    const next = dismissCompanionInvitation(session);
    persistSession(next);
    setInvitationVisible(false);
    setMotionState("resting");
    trackStudioEvent("koi_companion_invitation_dismissed", {
      route_category: context.routeKey,
      invitation_number: String(session.invitationCount),
    });
    triggerRef.current?.focus();
  }

  function dismissCompanion() {
    persistSession({ ...session, hidden: true, minimized: true });
    setOpen(false);
  }

  function notice() {
    if (reducedMotion || open || invitationVisible) return;
    setMotionState("noticing");
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setMotionState("resting"), 1_200);
  }

  if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return null;
  const renderedMotionState = resolveCompanionMotionState({ open, invitationVisible, reducedMotion, ambientState: motionState });

  return (
    <div
      className={`koi-companion koi-companion--${context.preferredSide}${collisionHidden ? " koi-companion--collision" : ""}`}
      data-motion-state={renderedMotionState}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
    >
      {invitationVisible && context.invitation ? (
        <div className="koi-companion-invitation" role="status">
          <button className="koi-companion-invitation__message" type="button" onClick={() => openPanel("invitation")}>{context.invitation}</button>
          <button className="koi-companion-invitation__dismiss" type="button" onClick={dismissInvitation} aria-label="Dismiss koi invitation"><X size={14} aria-hidden="true" /></button>
        </div>
      ) : null}
      <button
        ref={triggerRef}
        className="koi-companion-trigger"
        type="button"
        aria-label={hasDraft ? "Open project concierge and continue saved session" : "Open project concierge"}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-hidden={collisionHidden ? "true" : undefined}
        tabIndex={collisionHidden ? -1 : 0}
        onClick={() => openPanel("trigger")}
        onPointerEnter={notice}
        data-testid="koi-companion-trigger"
      >
        <span className="koi-companion-trigger__water" aria-hidden="true" />
        <CompanionKoiArt id="living-koi-trigger" className="koi-companion-trigger__koi" />
        <span className="koi-companion-trigger__signal" aria-hidden="true" />
      </button>
      {open ? <KoiCompanionPanel context={context} hasDraft={hasDraft} onClose={closePanel} onDismiss={dismissCompanion} /> : null}
    </div>
  );
}
