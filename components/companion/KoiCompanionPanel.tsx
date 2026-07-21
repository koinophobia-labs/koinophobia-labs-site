"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, Compass, HelpCircle, Minimize2, Scale, Search, Send, Sparkles, Waves, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import CompanionKoiArt from "@/components/companion/CompanionKoiArt";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import type { CompanionPageContext, CompanionPanelSurface, CopilotIntent } from "@/lib/companion/page-context";
import { answerSiteQuestion, SITE_HELP_TOPICS, type SiteHelpAnswer } from "@/lib/companion/site-help";
import {
  compareServices,
  getService,
  pageBrief,
  relevantWork,
  smallestNextStep,
  suggestedComparisons,
  WORK_INTENT_SEEDS,
  type ServiceComparison,
  type WorkMatch,
} from "@/lib/companion/site-knowledge";

const ConciergeFlow = dynamic(() => import("@/components/concierge/ConciergeFlow"), {
  loading: () => <div className="koi-companion-panel__loading" role="status">Preparing the project concierge…</div>,
});

const StudioFrontOffice = dynamic(() => import("@/components/front-office/StudioFrontOffice"), {
  loading: () => <div className="koi-companion-panel__loading" role="status">Opening the front office…</div>,
});

const COPILOT_META: Record<Exclude<CopilotIntent, "next_step">, { icon: typeof Compass; title: string; hint: string; surface: CompanionPanelSurface }> = {
  understand: { icon: Compass, title: "Understand this page", hint: "What it shows and what to pay attention to.", surface: "understand" },
  compare: { icon: Scale, title: "Compare two options", hint: "See how services differ, with a grounded suggestion.", surface: "compare" },
  relevant_work: { icon: Search, title: "Find the closest work", hint: "Match a business problem to a real concept build.", surface: "work" },
};

export default function KoiCompanionPanel({
  context,
  hasDraft,
  initialSurface,
  onClose,
  onDismiss,
}: {
  context: CompanionPageContext;
  hasDraft: boolean;
  initialSurface: CompanionPanelSurface;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const [surface, setSurface] = useState<CompanionPanelSurface>(initialSurface);
  const [question, setQuestion] = useState("");
  const [siteAnswer, setSiteAnswer] = useState<SiteHelpAnswer | null>(null);
  const [comparison, setComparison] = useState<ServiceComparison | null>(null);
  const [workIntent, setWorkIntent] = useState("");
  const [workMatches, setWorkMatches] = useState<WorkMatch[] | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const brief = useMemo(() => (context.routeKey === "suppressed" ? null : pageBrief(context.routeKey, context.slug)), [context.routeKey, context.slug]);
  const nextStep = useMemo(() => (context.routeKey === "suppressed" ? null : smallestNextStep(context.routeKey)), [context.routeKey]);
  const comparePairs = useMemo(() => (context.routeKey === "suppressed" ? [] : suggestedComparisons(context.routeKey)), [context.routeKey]);
  const copilotIntents = context.copilot;

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

  function selectFrontOffice() {
    trackStudioEvent("front_office_opened", { host: "studio", route: context.routeKey });
    setSurface("front_office");
  }

  function selectLink(action: string) {
    trackStudioEvent("koi_companion_action_selected", {
      route_category: context.routeKey,
      entry_action: action,
      session_state: hasDraft ? "resumed" : "new",
    });
    onClose();
  }

  function openCopilot(intent: Exclude<CopilotIntent, "next_step">) {
    setSurface(COPILOT_META[intent].surface);
    if (intent === "understand") {
      trackStudioEvent("koi_companion_page_understood", { route_category: context.routeKey });
    }
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

  function runComparison(slugA: string, slugB: string) {
    const result = compareServices(slugA, slugB);
    setComparison(result);
    if (result) {
      // Categorical only — the pair of published service slugs, never visitor text.
      trackStudioEvent("koi_companion_services_compared", { route_category: context.routeKey, service_pair: `${result.a.slug}__${result.b.slug}` });
    }
  }

  function runWorkMatch(intent: string) {
    const matches = relevantWork(intent);
    setWorkIntent(intent);
    setWorkMatches(matches);
    // Send only the top result slug + count — never the visitor's free-text intent.
    trackStudioEvent("koi_companion_relevant_work_selected", {
      route_category: context.routeKey,
      top_result: matches[0]?.slug || "none",
      result_count: String(matches.length),
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
              <span>Living site guide</span>
              <strong id="koi-companion-panel-title">Find the smallest sensible next step.</strong>
            </div>
          </div>
          <button ref={closeRef} className="koi-companion-icon-button" type="button" onClick={onClose} aria-label="Minimize site guide">
            <Minimize2 size={18} aria-hidden="true" />
          </button>
        </header>

        {surface === "menu" ? (
          <div className="koi-companion-panel__menu">
            <div className="koi-companion-panel__context">
              <span>{context.routeKey.replaceAll("_", " ")}</span>
              <p>{context.invitation || "I can help connect the business problem to a practical starting point."}</p>
            </div>

            {nextStep ? (
              <Link className="koi-companion-next" href={nextStep.href} onClick={() => selectLink("next_step")}>
                <Sparkles size={17} aria-hidden="true" />
                <span><small>Smallest sensible next step</small><strong>{nextStep.label}</strong><em>{nextStep.rationale}</em></span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : null}

            <div className="koi-companion-panel__actions" aria-label="Site guide actions">
              {copilotIntents.filter((intent): intent is Exclude<CopilotIntent, "next_step"> => intent !== "next_step").map((intent) => {
                const meta = COPILOT_META[intent];
                const Icon = meta.icon;
                return (
                  <button className="koi-companion-action" type="button" key={intent} onClick={() => openCopilot(intent)}>
                    <Icon size={18} aria-hidden="true" />
                    <span><strong>{meta.title}</strong><small>{meta.hint}</small></span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </button>
                );
              })}
              <button className="koi-companion-action koi-companion-action--help" type="button" onClick={() => setSurface("help")}>
                <HelpCircle size={18} aria-hidden="true" />
                <span><strong>Ask a question about the site</strong><small>Services, pricing, timelines, audits, process, or Blake.</small></span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              <button className="koi-companion-action koi-companion-action--primary" type="button" onClick={selectFrontOffice}>
                <Waves size={18} aria-hidden="true" />
                <span><strong>Describe the problem — I&apos;ll organize it</strong><small>Plain language in, a structured brief and the smallest next step out.</small></span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              {context.actions.map((action) => action.id === "concierge" ? (
                <button className="koi-companion-action" type="button" key={action.id} onClick={selectConcierge}>
                  <span><strong>{hasDraft ? "Continue my concierge session" : "Prefer structured questions?"}</strong><small>{hasDraft ? "Your saved answers are ready." : "The step-by-step concierge — same routing, fixed steps."}</small></span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              ) : (
                <Link className="koi-companion-action" href={action.href || "/"} key={action.id} onClick={() => selectLink(action.id)}>
                  <span><strong>{action.label}</strong></span><ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="koi-companion-panel__boundary">Answers come from published Koinophobia Labs information. Project recommendations still use the deterministic concierge, and Blake reviews every submitted project.</p>
            <button className="koi-companion-rest" type="button" onClick={onDismiss}><X size={14} aria-hidden="true" /> Let the koi rest for this visit</button>
          </div>
        ) : surface === "understand" && brief ? (
          <div className="koi-companion-panel__surface">
            <button className="koi-companion-panel__back" type="button" onClick={() => setSurface("menu")}>Back to options</button>
            <div className="koi-companion-panel__help-intro">
              <span>What this page shows</span>
              <h2>{brief.summary}</h2>
            </div>
            <ul className="koi-companion-panel__facts">
              {brief.facts.map((fact, index) => <li key={index}>{fact}</li>)}
            </ul>
            {nextStep ? (
              <div className="koi-companion-panel__answer" role="status">
                <span>Suggested next step</span>
                <p>{nextStep.rationale}</p>
                <Link href={nextStep.href} onClick={() => selectLink("next_step_understand")}>{nextStep.label} <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            ) : null}
          </div>
        ) : surface === "compare" ? (
          <div className="koi-companion-panel__surface">
            <button className="koi-companion-panel__back" type="button" onClick={() => { setSurface("menu"); setComparison(null); }}>Back to options</button>
            <div className="koi-companion-panel__help-intro">
              <span>Compare services</span>
              <h2>Which of these fits better?</h2>
              <p>Everything below is scoped and priced before any build. Pick a pair.</p>
            </div>
            <div className="koi-companion-panel__suggestions" aria-label="Suggested comparisons">
              {comparePairs.map(([a, b]) => {
                const left = getService(a);
                const right = getService(b);
                if (!left || !right) return null;
                return <button type="button" key={`${a}-${b}`} onClick={() => runComparison(a, b)}>{left.title} vs {right.title}</button>;
              })}
            </div>
            {comparison ? (
              <div className="koi-companion-compare" role="status">
                <div className="koi-companion-compare__grid">
                  {[comparison.a, comparison.b].map((service) => (
                    <div className="koi-companion-compare__col" key={service.slug}>
                      <h3>{service.title}</h3>
                      <dl>
                        <div><dt>For</dt><dd>{service.forWhom}</dd></div>
                        <div><dt>{service.priceLabel}</dt><dd>{service.price}</dd></div>
                        <div><dt>Timeline</dt><dd>{service.timeline}</dd></div>
                        <div><dt>You get</dt><dd>{service.deliverable}</dd></div>
                      </dl>
                      <Link href={service.href} onClick={() => selectLink(`compare_open_${service.slug}`)}>Open {service.title} <ArrowUpRight size={13} aria-hidden="true" /></Link>
                    </div>
                  ))}
                </div>
                <p className="koi-companion-compare__reco">{comparison.recommendation}</p>
              </div>
            ) : null}
          </div>
        ) : surface === "work" ? (
          <div className="koi-companion-panel__surface">
            <button className="koi-companion-panel__back" type="button" onClick={() => { setSurface("menu"); setWorkMatches(null); }}>Back to options</button>
            <div className="koi-companion-panel__help-intro">
              <span>Closest work</span>
              <h2>What problem are you solving?</h2>
              <p>I will surface the concept build that is closest — grounded in what each one actually demonstrates.</p>
            </div>
            <div className="koi-companion-panel__suggestions" aria-label="Common business problems">
              {WORK_INTENT_SEEDS.map((seed) => <button type="button" key={seed.label} onClick={() => runWorkMatch(seed.intent)}>{seed.label}</button>)}
            </div>
            <form className="koi-companion-panel__ask" onSubmit={(event) => { event.preventDefault(); if (workIntent.trim()) runWorkMatch(workIntent); }}>
              <label htmlFor="koi-work-intent">Describe the problem in a few words</label>
              <div><input id="koi-work-intent" value={workIntent} maxLength={160} onChange={(event) => setWorkIntent(event.target.value)} placeholder="Messy inquiries from social and text" /><button type="submit" aria-label="Find relevant work"><Send size={17} aria-hidden="true" /></button></div>
            </form>
            {workMatches ? (
              <ul className="koi-companion-work" aria-label="Relevant work results">
                {workMatches.map((match) => (
                  <li key={match.slug}>
                    <Link href={match.href} onClick={() => selectLink(`work_open_${match.slug}`)}>
                      <strong>{match.title}</strong>
                      <small>{match.businessType}</small>
                      <em>{match.reason}</em>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
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
                {!siteAnswer.matched && siteAnswer.clarify ? (
                  <div className="koi-companion-panel__suggestions koi-companion-panel__suggestions--inline">
                    {siteAnswer.clarify.map((topic) => <button type="button" key={topic.id} onClick={() => askSiteQuestion(topic.question)}>{topic.question}</button>)}
                  </div>
                ) : null}
                <Link href={siteAnswer.href} onClick={() => selectLink(`site_answer_${siteAnswer.id}`)}>{siteAnswer.linkLabel} <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            ) : null}
          </div>
        ) : surface === "front_office" ? (
          <div className="koi-companion-panel__flow">
            <div className="koi-companion-panel__flow-nav">
              {/* The conversation is now the landing surface; the launcher is
                  the optional place, so the link reads forward, not back. */}
              <button type="button" onClick={() => setSurface("menu")}>More options</button>
            </div>
            <StudioFrontOffice />
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
