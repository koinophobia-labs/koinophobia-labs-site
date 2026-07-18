"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, Minimize2, Waves, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CompanionKoiArt from "@/components/companion/CompanionKoiArt";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import type { CompanionPageContext } from "@/lib/companion/page-context";

const ConciergeFlow = dynamic(() => import("@/components/concierge/ConciergeFlow"), {
  loading: () => <div className="koi-companion-panel__loading" role="status">Preparing the project concierge…</div>,
});

export default function KoiCompanionPanel({
  context,
  hasDraft,
  onClose,
  onDismiss,
}: {
  context: CompanionPageContext;
  hasDraft: boolean;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const [surface, setSurface] = useState<"menu" | "concierge">("menu");
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function selectConcierge() {
    trackStudioEvent("koi_companion_action_selected", {
      route_category: context.routeKey,
      entry_action: hasDraft ? "resume_concierge" : "start_concierge",
      session_state: hasDraft ? "resumed" : "new",
    });
    setSurface("concierge");
  }

  function selectLink(action: string) {
    trackStudioEvent("koi_companion_action_selected", {
      route_category: context.routeKey,
      entry_action: action,
      session_state: hasDraft ? "resumed" : "new",
    });
    onClose();
  }

  return (
    <div
      className="koi-companion-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <aside
        ref={panelRef}
        className="koi-companion-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="koi-companion-panel-title"
        data-surface={surface}
      >
        <header className="koi-companion-panel__header">
          <div className="koi-companion-panel__identity">
            <CompanionKoiArt id="living-koi-panel" className="koi-companion-panel__koi" />
            <div>
              <span>Living project concierge</span>
              <strong id="koi-companion-panel-title">Find the smallest sensible next step.</strong>
            </div>
          </div>
          <button ref={closeRef} className="koi-companion-icon-button" type="button" onClick={onClose} aria-label="Minimize project concierge">
            <Minimize2 size={18} aria-hidden="true" />
          </button>
        </header>

        {surface === "menu" ? (
          <div className="koi-companion-panel__menu">
            <div className="koi-companion-panel__context">
              <span>{context.routeKey.replaceAll("_", " ")}</span>
              <p>{context.invitation || "I can help connect the business problem to a practical starting point."}</p>
            </div>
            <div className="koi-companion-panel__actions" aria-label="Project concierge actions">
              {context.actions.map((action) => action.id === "concierge" ? (
                <button className="koi-companion-action koi-companion-action--primary" type="button" key={action.id} onClick={selectConcierge}>
                  <Waves size={18} aria-hidden="true" />
                  <span><strong>{hasDraft ? "Continue my concierge session" : action.label}</strong><small>{hasDraft ? "Your saved answers are ready." : "Seven focused questions · deterministic routing"}</small></span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              ) : (
                <Link className="koi-companion-action" href={action.href || "/"} key={action.id} onClick={() => selectLink(action.id)}>
                  <span><strong>{action.label}</strong></span><ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="koi-companion-panel__boundary">No empty chat box. No automatic quote. Blake reviews every submitted project.</p>
            <button className="koi-companion-rest" type="button" onClick={onDismiss}><X size={14} aria-hidden="true" /> Let the koi rest for this visit</button>
          </div>
        ) : (
          <div className="koi-companion-panel__flow">
            <div className="koi-companion-panel__flow-nav">
              <button type="button" onClick={() => setSurface("menu")}>Back to options</button>
              <Link href="/concierge?entry=koi" onClick={() => selectLink("continue_full_page")}>Continue on the full page <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </div>
            <ConciergeFlow entry={`koi_${context.routeKey}`} surface="companion" />
          </div>
        )}
      </aside>
    </div>
  );
}
