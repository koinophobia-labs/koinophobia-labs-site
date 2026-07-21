"use client";

import { ArrowRight, RotateCcw, Send } from "lucide-react";
import { ComponentType, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import { emptySession, missingFields, nextQuestion, reduce, type EngineEvent } from "@/lib/front-office/engine";
import {
  clearFrontOfficeSession,
  loadFrontOfficeSession,
  saveFrontOfficeSession,
} from "@/lib/front-office/storage";
import type { FollowUpQuestion, FrontOfficePolicy, FrontOfficeSession } from "@/lib/front-office/types";

/**
 * The shared front-office conversation surface.
 *
 * Owns the goal and clarify stages — intents, free text, one focused
 * question at a time — and hands every later stage (review, consent,
 * submission, terminal cards) to the host wrapper via `renderOutcome`.
 * That split keeps commercial code out of the personal bundle and vice
 * versa; this component only knows the engine.
 *
 * Analytics here are funnel-categorical only: stage names, intent ids,
 * host, route. Free text, field values, and contact details never leave
 * the browser through this path.
 */

export type FrontOfficeApi = {
  session: FrontOfficeSession;
  dispatch: (event: EngineEvent) => void;
  restart: () => void;
  track: (event: string, props?: Record<string, string>) => void;
};

export default function FrontOfficeChat({
  policy,
  lead,
  privacyNote,
  route,
  Outcome,
}: {
  policy: FrontOfficePolicy;
  /** One sentence over the goal stage — what this assistant is for. */
  lead: string;
  /** Short data-handling line rendered under every input stage. */
  privacyNote: string;
  route: string;
  /** Renders review / consent / submitting / done / error. */
  Outcome: ComponentType<{ api: FrontOfficeApi }>;
}) {
  const [session, setSession] = useState<FrontOfficeSession>(() => emptySession(policy.host, "00000000-0000-4000-8000-000000000000", 0));
  const [hydrated, setHydrated] = useState(false);
  const [text, setText] = useState("");
  const sessionRef = useRef(session);
  const startedRef = useRef(false);
  const clarifyTrackedRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef(session.stage);

  useEffect(() => {
    stageRef.current = session.stage;
  }, [session.stage]);

  // Closing the panel mid-flow is a funnel exit worth counting — but only
  // once the visitor actually engaged. The session itself stays restorable.
  useEffect(
    () => () => {
      if (startedRef.current && ["goal", "clarify", "review", "consent"].includes(stageRef.current)) {
        trackStudioEvent("front_office_abandoned", { host: policy.host, route, stage: stageRef.current });
      }
    },
    [policy.host, route],
  );

  const track = useCallback(
    (event: string, props: Record<string, string> = {}) => {
      trackStudioEvent(event, { host: policy.host, route, ...props });
    },
    [policy.host, route],
  );

  /* ------------------------------------------------------------ restore */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = loadFrontOfficeSession(window.sessionStorage, policy.host);
      if (restored) {
        sessionRef.current = restored;
        setSession(restored);
        startedRef.current = restored.stage !== "goal";
        clarifyTrackedRef.current = true;
        track("front_office_resumed", { stage: restored.stage });
      } else {
        const fresh = emptySession(policy.host, crypto.randomUUID(), Date.now());
        sessionRef.current = fresh;
        setSession(fresh);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [policy.host, track]);

  // Sessions only change through this dispatcher (event handlers), so the
  // reduce + persistence + analytics all happen OUTSIDE React's render phase —
  // a setState updater can re-run during render and must stay pure.
  const dispatch = useCallback(
    (event: EngineEvent) => {
      const current = sessionRef.current;
      const next = reduce(current, event, policy, Date.now());
      if (next === current) return;
      sessionRef.current = next;
      saveFrontOfficeSession(window.sessionStorage, next);
      if (!startedRef.current && (event.type === "SELECT_INTENT" || event.type === "FREE_TEXT")) {
        startedRef.current = true;
        track("front_office_started", {
          intent: event.type === "SELECT_INTENT" ? event.intent : "free_text",
        });
        if (event.type === "SELECT_INTENT") track("front_office_intent_selected", { intent: event.intent });
      }
      if (next.stage === "clarify" && !clarifyTrackedRef.current) {
        clarifyTrackedRef.current = true;
        track("front_office_clarifying");
      }
      if (next.stage === "review" && current.stage !== "review") {
        track("front_office_summary_reviewed");
      }
      setSession(next);
    },
    [policy, track],
  );

  const restart = useCallback(() => {
    clearFrontOfficeSession(window.sessionStorage, policy.host);
    startedRef.current = false;
    clarifyTrackedRef.current = false;
    setText("");
    dispatch({ type: "RESET", sessionId: crypto.randomUUID() });
    track("front_office_restarted");
  }, [dispatch, policy.host, track]);

  const question = useMemo(
    () => (session.stage === "clarify" ? nextQuestion(session, policy) : null),
    [session, policy],
  );

  // Move focus to each new question so keyboard and screen-reader visitors
  // follow the conversation without hunting.
  useEffect(() => {
    if (session.stage === "clarify") questionHeadingRef.current?.focus();
  }, [session.stage, question?.id]);

  if (!hydrated) return <div className="ffo" data-stage="loading" role="status">Waking the assistant…</div>;

  /* --------------------------------------------------------------- goal */

  if (session.stage === "goal") {
    const submitText = (event: FormEvent) => {
      event.preventDefault();
      const value = text.trim();
      if (!value) return;
      dispatch({ type: "FREE_TEXT", text: value });
      setText("");
    };
    return (
      <div className="ffo" data-host={policy.host} data-stage="goal">
        <p className="ffo__lead">{lead}</p>
        <div className="ffo__chips" role="group" aria-label="Starting points">
          {policy.intents.map((intent) => (
            <button key={intent.id} type="button" className="ffo__chip" onClick={() => dispatch({ type: "SELECT_INTENT", intent: intent.id })}>
              <strong>{intent.label}</strong>
              {intent.hint ? <span>{intent.hint}</span> : null}
            </button>
          ))}
        </div>
        <form className="ffo__ask" onSubmit={submitText}>
          <label htmlFor={`ffo-goal-${policy.host}`}>Or say it in your own words</label>
          <div className="ffo__ask-row">
            <textarea
              id={`ffo-goal-${policy.host}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={policy.host === "studio" ? "For example: my website looks fine but nobody books…" : "For example: which of these could I actually use today?"}
            />
            <button type="submit" className="ffo__send" aria-label="Send">
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
        <p className="ffo__privacy">{privacyNote}</p>
      </div>
    );
  }

  /* ------------------------------------------------------------ clarify */

  if (session.stage === "clarify" && question) {
    const remaining = missingFields(session, policy).length;
    return (
      <div className="ffo" data-host={policy.host} data-stage="clarify">
        <p className="ffo__progress" aria-live="polite">
          {remaining === 1 ? "Last detail" : `${remaining} details to go`}
        </p>
        <div className="ffo__question">
          <h3 ref={questionHeadingRef} tabIndex={-1}>{question.prompt(session)}</h3>
          {question.hint ? <p className="ffo__hint">{question.hint(session)}</p> : null}
          <QuestionInput key={question.id} question={question} session={session} onAnswer={(value, secondaryValue, pairValue) => dispatch({ type: "ANSWER", questionId: question.id, value, secondaryValue, pairValue })} />
        </div>
        <div className="ffo__footer">
          <button type="button" className="ffo__restart" onClick={restart}>
            <RotateCcw size={13} aria-hidden="true" /> Start over
          </button>
          <p className="ffo__privacy">{privacyNote}</p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------- review and onwards */

  return (
    <div className="ffo" data-host={policy.host} data-stage={session.stage}>
      <Outcome api={{ session, dispatch, restart, track }} />
    </div>
  );
}

/* ============================================================ inputs */

function QuestionInput({
  question,
  session,
  onAnswer,
}: {
  question: FollowUpQuestion;
  session: FrontOfficeSession;
  onAnswer: (value: string, secondaryValue?: string, pairValue?: string) => void;
}) {
  // Keyed by question.id at the call site, so all of this resets per question.
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [pairValue, setPairValue] = useState("");
  const [pairDraft, setPairDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  /* Chip questions: a tap answers. Free text stays available below. */
  if (question.kind === "chips" && question.chips) {
    return (
      <div className="ffo__chips" role="group" aria-label={question.prompt(session)}>
        {question.chips(session).map((chip) => (
          <button key={chip.value} type="button" className="ffo__chip" onClick={() => onAnswer(chip.value)}>
            <strong>{chip.label}</strong>
            {chip.hint ? <span>{chip.hint}</span> : null}
          </button>
        ))}
      </div>
    );
  }

  /* Pair with chips (budget + timing): choose one from each row. */
  if (question.kind === "pair" && question.chips && question.pairChips) {
    const first = pairDraft.first || "";
    const second = pairDraft.second || "";
    return (
      <div className="ffo__pair">
        <div className="ffo__chip-row" role="group" aria-label="First choice">
          {question.chips(session).map((chip) => (
            <button key={chip.value} type="button" className="ffo__mini-chip" aria-pressed={first === chip.value} onClick={() => setPairDraft({ ...pairDraft, first: chip.value })}>
              {chip.label}
            </button>
          ))}
        </div>
        <p className="ffo__pair-label">{question.pairLabel}</p>
        <div className="ffo__chip-row" role="group" aria-label={question.pairLabel || "Second choice"}>
          {question.pairChips(session).map((chip) => (
            <button key={chip.value} type="button" className="ffo__mini-chip" aria-pressed={second === chip.value} onClick={() => setPairDraft({ ...pairDraft, second: chip.value })}>
              {chip.label}
            </button>
          ))}
        </div>
        {error ? <p className="ffo__error" role="alert">{error}</p> : null}
        <button
          type="button"
          className="ffo__continue"
          onClick={() => {
            if (!first || !second) {
              setError("Choose the closest option from both rows.");
              return;
            }
            onAnswer(first, undefined, second);
          }}
        >
          Continue <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  /* Pair without chips (business name + type + optional website). */
  if (question.kind === "pair") {
    return (
      <form
        className="ffo__pair"
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.trim() || !pairValue.trim()) {
            setError("Both fields are needed to ground the brief.");
            return;
          }
          onAnswer(value, secondary || undefined, pairValue);
        }}
      >
        <label>
          <span>{question.placeholder?.(session) || "Name"}</span>
          <input value={value} maxLength={160} onChange={(event) => setValue(event.target.value)} autoComplete="organization" />
        </label>
        <label>
          <span>{question.pairLabel}</span>
          <input value={pairValue} maxLength={120} onChange={(event) => setPairValue(event.target.value)} placeholder="Tattoo studio, consultant, nonprofit…" />
        </label>
        {question.secondaryField ? (
          <label>
            <span>{question.secondaryLabel}</span>
            <input value={secondary} maxLength={500} inputMode="url" onChange={(event) => setSecondary(event.target.value)} placeholder="example.com" />
          </label>
        ) : null}
        {error ? <p className="ffo__error" role="alert">{error}</p> : null}
        <button type="submit" className="ffo__continue">
          Continue <ArrowRight size={14} aria-hidden="true" />
        </button>
      </form>
    );
  }

  /* Free text. */
  return (
    <form
      className="ffo__ask"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim().length < 6) {
          setError("A sentence of detail keeps the brief useful.");
          return;
        }
        onAnswer(value.trim(), secondary.trim() || undefined);
      }}
    >
      <label className="ffo__sr" htmlFor={`ffo-answer-${question.id}`}>{question.prompt(session)}</label>
      <textarea
        id={`ffo-answer-${question.id}`}
        value={value}
        rows={3}
        maxLength={2000}
        placeholder={question.placeholder?.(session)}
        onChange={(event) => setValue(event.target.value)}
      />
      {question.secondaryField ? (
        <label className="ffo__secondary">
          <span>{question.secondaryLabel}</span>
          <input value={secondary} maxLength={500} onChange={(event) => setSecondary(event.target.value)} placeholder="For example: Squarespace, Gmail, Calendly" />
        </label>
      ) : null}
      {error ? <p className="ffo__error" role="alert">{error}</p> : null}
      <button type="submit" className="ffo__continue">
        Continue <ArrowRight size={14} aria-hidden="true" />
      </button>
    </form>
  );
}
