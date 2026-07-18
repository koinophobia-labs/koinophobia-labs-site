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
  return Boolean(document.querySelector("dialog[open], [role='dialog'], [aria-modal='true'], [aria-expanded='true'], .koi-companion-invitation"));
}

function triggerOverlapsInteractiveControl(trigger: HTMLElement) {
  const triggerRect = trigger.getBoundingClientRect();
  const controls = document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [role="button"]');
  for (const control of controls) {
    if (control === trigger || control.closest(".koi-companion")) continue;
    const style = window.getComputedStyle(control);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
    const rect = control.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const overlapX = Math.min(triggerRect.right, rect.right) - Math.max(triggerRect.left, rect.left);
    const overlapY = Math.min(triggerRect.bottom, rect.bottom) - Math.max(triggerRect.top, rect.top);
    if (overlapX > 6 && overlapY > 6) return true;
  }
  return false;
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
  const presenceRef = useRef<HTMLDivElement>(null);
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
    if (!hydrated || !hostAllowed || !context.enabled || open || reducedMotion) return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!pointer.matches) return;
    const presence = presenceRef.current;
    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastCollisionCheck = 0;
    let selectionLocked = false;
    let settleTimer = 0;
    const triggerElement = triggerRef.current;

    const render = (timestamp: number) => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      presence?.style.setProperty("transform", `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`);
      if (timestamp - lastCollisionCheck > 120 && triggerRef.current) {
        lastCollisionCheck = timestamp;
        const blocked = triggerOverlapsInteractiveControl(triggerRef.current);
        setCollisionHidden((current) => current === blocked ? current : blocked);
        if (blocked) setInvitationVisible(false);
      }
      if (Math.abs(targetX - currentX) > 0.35 || Math.abs(targetY - currentY) > 0.35) frame = window.requestAnimationFrame(render);
      else frame = 0;
    };

    const follow = (event: PointerEvent) => {
      if (event.pointerType === "touch" || interactionInProgress()) return;
      const trigger = triggerRef.current;
      if (selectionLocked && trigger) {
        const rect = trigger.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        if (distance <= 170) return;
        selectionLocked = false;
        if (presence) presence.dataset.selectable = "false";
      }
      const side = context.preferredSide;
      const anchorX = side === "right" ? window.innerWidth - 53 : 53;
      const anchorY = window.innerHeight - 62;
      const pointerOffsetX = event.clientX < window.innerWidth / 2 ? 52 : -52;
      const desiredCenterX = Math.max(44, Math.min(window.innerWidth - 44, event.clientX + pointerOffsetX));
      const desiredCenterY = Math.max(52, Math.min(window.innerHeight - 50, event.clientY + 42));
      targetX = desiredCenterX - anchorX;
      targetY = desiredCenterY - anchorY;
      if (presence) {
        presence.dataset.bubbleSide = desiredCenterX < window.innerWidth / 2 ? "left" : "right";
        presence.dataset.bubbleVertical = desiredCenterY < 190 ? "below" : "above";
      }
      if (!frame) frame = window.requestAnimationFrame(render);
      setMotionState("noticing");
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setMotionState("resting"), 700);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        selectionLocked = true;
        if (presence) presence.dataset.selectable = "true";
        setMotionState("resting");
      }, 280);
    };

    const lockForSelection = () => {
      selectionLocked = true;
      window.clearTimeout(settleTimer);
      if (presence) presence.dataset.selectable = "true";
      setMotionState("resting");
    };

    window.addEventListener("pointermove", follow, { passive: true });
    triggerElement?.addEventListener("pointerenter", lockForSelection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("pointermove", follow);
      triggerElement?.removeEventListener("pointerenter", lockForSelection);
      presence?.style.removeProperty("transform");
      if (presence) presence.dataset.selectable = "false";
    };
  }, [context.enabled, context.preferredSide, hostAllowed, hydrated, open, reducedMotion]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || open) return;
    let frame = 0;
    const inspect = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const blocked = triggerOverlapsInteractiveControl(trigger);
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
      <div ref={presenceRef} className="koi-companion-presence" data-bubble-side={context.preferredSide} data-bubble-vertical="above" data-selectable="false">
        {invitationVisible && context.invitation ? (
          <div className="koi-companion-invitation" role="status">
            <button className="koi-companion-invitation__message" type="button" onClick={() => openPanel("invitation")}>{context.invitation}<small>Ask me about this site or find the right service.</small></button>
            <button className="koi-companion-invitation__dismiss" type="button" onClick={dismissInvitation} aria-label="Dismiss koi invitation"><X size={14} aria-hidden="true" /></button>
          </div>
        ) : null}
        <button
          ref={triggerRef}
          className="koi-companion-trigger"
          type="button"
          aria-label={hasDraft ? "Open site guide and continue saved project concierge session" : "Open Koinophobia Labs site guide"}
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
      </div>
      {open ? <KoiCompanionPanel context={context} hasDraft={hasDraft} onClose={closePanel} onDismiss={dismissCompanion} /> : null}
    </div>
  );
}
