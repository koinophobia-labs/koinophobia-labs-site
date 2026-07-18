"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, HelpCircle, Minimize2, Send, Waves, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CompanionKoiArt from "@/components/companion/CompanionKoiArt";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import type { CompanionPageContext } from "@/lib/companion/page-context";
import { answerSiteQuestion, SITE_HELP_TOPICS, type SiteHelpAnswer } from "@/lib/companion/site-help";

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
  const [surface, setSurface] = useState<"menu" | "help" | "concierge">("menu");
  const [question, setQuestion] = useState("");
  const [siteAnswer, setSiteAnswer] = useState<SiteHelpAnswer | null>(null);
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

  function askSiteQuestion(value: string) {
    const answer = answerSiteQuestion(value);
    setQuestion(value);
    setSiteAnswer(answer);
    trackStudioEvent("koi_site_question_answered", {
      route_category: context.routeKey,
      question_topic: answer.id,
      answer_status: answer.matched ? "matched" : "fallback",
    });
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
              <button className="koi-companion-action koi-companion-action--help" type="button" onClick={() => setSurface("help")}>
                <HelpCircle size={18} aria-hidden="true" />
                <span><strong>Ask a question about the site</strong><small>Services, pricing, timelines, audits, process, or Blake.</small></span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
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
            <p className="koi-companion-panel__boundary">Site answers come from published Koinophobia Labs information. Project recommendations still use the deterministic concierge, and Blake reviews every submitted project.</p>
            <button className="koi-companion-rest" type="button" onClick={onDismiss}><X size={14} aria-hidden="true" /> Let the koi rest for this visit</button>
          </div>
        ) : surface === "help" ? (
          <div className="koi-companion-panel__help">
            <button className="koi-companion-panel__back" type="button" onClick={() => setSurface("menu")}>Back to options</button>
            <div className="koi-companion-panel__help-intro">
              <span>Site guide</span>
              <h2>What would you like to know?</h2>
              <p>Ask about the published services and process. I will point you to the source instead of inventing an answer.</p>
            </div>
            <div className="koi-companion-panel__suggestions" aria-label="Suggested site questions">
              {SITE_HELP_TOPICS.slice(0, 6).map((topic) => <button type="button" key={topic.id} onClick={() => askSiteQuestion(topic.question)}>{topic.question}</button>)}
            </div>
            <form className="koi-companion-panel__ask" onSubmit={(event) => { event.preventDefault(); if (question.trim()) askSiteQuestion(question); }}>
              <label htmlFor="koi-site-question">Ask a basic site question</label>
              <div><input id="koi-site-question" value={question} maxLength={240} onChange={(event) => setQuestion(event.target.value)} placeholder="How much does a website project cost?" /><button type="submit" aria-label="Ask site question"><Send size={17} aria-hidden="true" /></button></div>
            </form>
            {siteAnswer ? (
              <div className="koi-companion-panel__answer" role="status">
                <span>{siteAnswer.matched ? "Answer" : "I need a narrower question"}</span>
                <p>{siteAnswer.answer}</p>
                <Link href={siteAnswer.href} onClick={() => selectLink(`site_answer_${siteAnswer.id}`)}>{siteAnswer.linkLabel} <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            ) : null}
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
