"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompanionKoiArt from "@/components/companion/CompanionKoiArt";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import { companionHostAllowed, resolveCompanionPageContext, type CompanionPanelSurface } from "@/lib/companion/page-context";
import {
  ambientDrift,
  clampOffset,
  COMPANION_PROXIMITY_RADIUS,
  pointerInfluence,
  resolveCompanionMotionState,
  scrollInfluence,
  type CompanionMotionState,
} from "@/lib/companion/motion";
import {
  canOfferProjectPlan,
  canShowCompanionInvitation,
  COMPANION_STORAGE_KEY,
  dismissCompanionInvitation,
  emptyCompanionSession,
  parseCompanionSession,
  recordCompanionInvitation,
  recordCompanionRouteEngagement,
  recordCompanionRouteVisit,
  recordProjectPlanInvitation,
  type CompanionSession,
} from "@/lib/companion/session";
import { loadConciergeDraft } from "@/lib/concierge/session";

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
  const [invitationKind, setInvitationKind] = useState<"route" | "plan">("route");
  const [panelSurface, setPanelSurface] = useState<CompanionPanelSurface>("menu");
  const [motionState, setMotionState] = useState<CompanionMotionState>("resting");
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [collisionHidden, setCollisionHidden] = useState(false);
  const presenceRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<CompanionSession>(emptyCompanionSession());

  const persistSession = useCallback((next: CompanionSession) => {
    sessionRef.current = next;
    setSession(next);
    try { window.sessionStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(next)); } catch { /* Interface persistence is optional. */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHostAllowed(companionHostAllowed(window.location.hostname));
      let recovered = emptyCompanionSession();
      try { recovered = parseCompanionSession(window.sessionStorage.getItem(COMPANION_STORAGE_KEY)); } catch { /* Start with safe defaults. */ }
      sessionRef.current = recovered;
      setSession(recovered);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(false);
      setInvitationVisible(false);
      setInvitationKind("route");
      setPanelSurface("menu");
      setMotionState("resting");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return;
    trackStudioEvent("koi_companion_viewed", { route_category: context.routeKey });
  }, [context.enabled, context.routeKey, hostAllowed, hydrated, session.hidden]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return;
    const timer = window.setTimeout(() => {
      const current = sessionRef.current;
      const next = recordCompanionRouteVisit(current, context.routeKey);
      if (next !== current) persistSession(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context.enabled, context.routeKey, hostAllowed, hydrated, persistSession, session.hidden]);

  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return;
    let dwellReached = false;
    let depthReached = false;
    let recorded = false;

    const qualify = () => {
      if (recorded || !dwellReached || !depthReached || interactionInProgress()) return;
      recorded = true;
      const next = recordCompanionRouteEngagement(sessionRef.current, context.routeKey);
      persistSession(next);
      trackStudioEvent("koi_companion_meaningful_route", {
        route_category: context.routeKey,
        engaged_route_count: String(next.engagedRoutes.length),
      });
    };

    const onScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY / scrollable >= 0.3) depthReached = true;
      qualify();
    };

    const timer = window.setTimeout(() => {
      dwellReached = true;
      onScroll();
    }, 8_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [context.enabled, context.routeKey, hostAllowed, hydrated, persistSession, session.hidden]);

  useEffect(() => {
    const planReady = canOfferProjectPlan(session);
    const routeReady = Boolean(context.invitation && canShowCompanionInvitation(session, context.routeKey));
    if (!hydrated || !hostAllowed || !context.enabled || open || collisionHidden || (!planReady && !routeReady)) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || interactionInProgress()) return;
      const kind = canOfferProjectPlan(session) ? "plan" : "route";
      const next = kind === "plan" ? recordProjectPlanInvitation(session) : recordCompanionInvitation(session, context.routeKey);
      persistSession(next);
      setInvitationKind(kind);
      setInvitationVisible(true);
      setMotionState("inviting");
      trackStudioEvent("koi_companion_invitation_shown", {
        route_category: context.routeKey,
        invitation_number: String(next.invitationCount),
        invitation_kind: kind,
      });
      if (kind === "plan") trackStudioEvent("koi_companion_plan_invitation_shown", { route_category: context.routeKey });
    }, planReady ? 5_000 : context.invitationDelayMs);
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

  // Anchored motion controller (audit M1): the koi drifts inside a small safe
  // region around its corner anchor. The pointer and scroll only *influence*
  // that drift within hard caps (see lib/companion/motion.ts) and the koi always
  // eases back to the anchor. It never tracks the cursor across the viewport.
  // rAF runs only while there is motion to resolve — the koi rests otherwise.
  useEffect(() => {
    if (!hydrated || !hostAllowed || !context.enabled || open || reducedMotion) return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const pointerCapable = pointer.matches;
    const presence = presenceRef.current;
    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let headingDegrees = 0;
    let scrollNudgeY = 0;
    let lastScrollY = window.scrollY;
    let lastPointer = { x: -9999, y: -9999 };

    const anchorCenter = () => {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const rect = trigger.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const frozen = () => paused || interactionInProgress();

    const render = (timestamp: number) => {
      scrollNudgeY *= 0.9;
      let targetX = 0;
      let targetY = 0;
      if (!frozen()) {
        const anchor = anchorCenter();
        const influence = pointerCapable && anchor ? pointerInfluence(lastPointer, anchor) : { x: 0, y: 0, active: false };
        const driftActive = influence.active || Math.abs(scrollNudgeY) > 0.5;
        const drift = driftActive ? ambientDrift(timestamp) : { x: 0, y: 0 };
        // Every contribution is bounded; the sum is clamped again to the hard cap.
        const combined = clampOffset(influence.x + drift.x * 0.5, influence.y + scrollNudgeY + drift.y * 0.5);
        targetX = combined.x;
        targetY = combined.y;
      }
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      const remainingX = targetX - currentX;
      const remainingY = targetY - currentY;
      if (Math.hypot(remainingX, remainingY) > 0.4) {
        const desiredHeading = Math.atan2(remainingY, remainingX) * (180 / Math.PI) + 90;
        const shortestTurn = ((desiredHeading - headingDegrees + 540) % 360) - 180;
        headingDegrees += shortestTurn * 0.15;
      } else {
        headingDegrees += (0 - headingDegrees) * 0.06;
      }
      if (presence) {
        presence.style.setProperty("transform", `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`);
        presence.style.setProperty("--koi-heading", `${headingDegrees.toFixed(2)}deg`);
      }
      const settled =
        Math.hypot(remainingX, remainingY) < 0.3 &&
        Math.hypot(targetX, targetY) < 0.3 &&
        Math.abs(scrollNudgeY) < 0.3 &&
        Math.abs(headingDegrees) < 0.3;
      if (settled) {
        frame = 0;
        setMotionState((current) => (current === "sleeping" ? current : "resting"));
      } else {
        frame = window.requestAnimationFrame(render);
      }
    };

    const kick = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || frozen()) return;
      lastPointer = { x: event.clientX, y: event.clientY };
      const anchor = anchorCenter();
      if (!anchor) return;
      const near = Math.hypot(anchor.x - event.clientX, anchor.y - event.clientY) < COMPANION_PROXIMITY_RADIUS;
      if (presence) presence.dataset.bubbleSide = anchor.x < window.innerWidth / 2 ? "left" : "right";
      if (near) {
        setMotionState("noticing");
        if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = window.setTimeout(() => setMotionState("resting"), 900);
        kick();
      }
    };

    const onScroll = () => {
      if (frozen()) return;
      const y = window.scrollY;
      scrollNudgeY = scrollInfluence(y - lastScrollY);
      lastScrollY = y;
      if (Math.abs(scrollNudgeY) > 0.5) {
        setMotionState((current) => (current === "noticing" || current === "inviting" ? current : "drifting"));
        kick();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      presence?.style.removeProperty("transform");
      presence?.style.removeProperty("--koi-heading");
    };
  }, [context.enabled, context.preferredSide, hostAllowed, hydrated, open, paused, reducedMotion]);

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
    const draft = loadConciergeDraft(window.sessionStorage, window.localStorage);
    setHasDraft(Boolean(draft));
    setInvitationVisible(false);
    // A plain tap lands in the conversation, not a launcher — the usability
    // audit found the menu interstitial cost first-time visitors a step.
    // Invitations still open their promised page-specific surface, and the
    // menu remains one tap away ("More options") inside the panel.
    setPanelSurface(entryAction === "invitation" ? invitationKind === "plan" ? "concierge" : context.invitationSurface || "menu" : "front_office");
    setOpen(true);
    persistSession({ ...sessionRef.current, minimized: false });
    trackStudioEvent("koi_companion_opened", {
      route_category: context.routeKey,
      entry_action: entryAction,
      session_state: draft ? "resumed" : "new",
      device_class: window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop",
      invitation_kind: entryAction === "invitation" ? invitationKind : "none",
    });
  }

  const closePanel = useCallback(() => {
    setOpen(false);
    persistSession({ ...sessionRef.current, minimized: true });
    trackStudioEvent("koi_companion_minimized", { route_category: context.routeKey });
    window.queueMicrotask(() => triggerRef.current?.focus());
  }, [context.routeKey, persistSession]);

  function dismissInvitation() {
    const current = sessionRef.current;
    const next = dismissCompanionInvitation(current);
    persistSession(next);
    setInvitationVisible(false);
    setMotionState("resting");
    trackStudioEvent("koi_companion_invitation_dismissed", {
      route_category: context.routeKey,
      invitation_number: String(current.invitationCount),
    });
    triggerRef.current?.focus();
  }

  function dismissCompanion() {
    persistSession({ ...sessionRef.current, hidden: true, minimized: true });
    setOpen(false);
  }

  function notice() {
    if (reducedMotion || open || invitationVisible) return;
    setMotionState("noticing");
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setMotionState("resting"), 1_200);
  }

  if (!hydrated || !hostAllowed || !context.enabled || session.hidden) return null;
  const renderedMotionState = resolveCompanionMotionState({ open, paused, collisionHidden, invitationVisible, reducedMotion, ambientState: motionState });
  const invitationCopy = invitationKind === "plan" ? "Want me to turn what you explored into a recommended project plan?" : context.invitation;

  return (
    <div
      className={`koi-companion koi-companion--${context.preferredSide}${collisionHidden ? " koi-companion--collision" : ""}`}
      data-motion-state={renderedMotionState}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
    >
      <div ref={presenceRef} className="koi-companion-presence" data-bubble-side={context.preferredSide} data-bubble-vertical="above">
        {invitationVisible && invitationCopy ? (
          <div className="koi-companion-invitation" role="status">
            <button className="koi-companion-invitation__message" type="button" onClick={() => openPanel("invitation")}>{invitationCopy}<small>{invitationKind === "plan" ? "Seven focused questions. Your answers stay with you across pages." : "Open one page-relevant next step."}</small></button>
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
          <span className="koi-companion-trigger__steer" aria-hidden="true">
            <span className="koi-companion-trigger__water" />
            <CompanionKoiArt id="living-koi-trigger" className="koi-companion-trigger__koi" />
          </span>
          <span className="koi-companion-trigger__signal" aria-hidden="true" />
        </button>
      </div>
      {open ? <KoiCompanionPanel context={context} hasDraft={hasDraft} initialSurface={panelSurface} onClose={closePanel} onDismiss={dismissCompanion} /> : null}
    </div>
  );
}
