"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";
import { branchPrompt, CONCIERGE_TOTAL_STEPS, intakeServiceFor, problemChoices } from "@/lib/concierge/questions";
import { CONCIERGE_STORAGE_KEY, parseConciergeDraft } from "@/lib/concierge/session";
import {
  conciergeBudgetRanges,
  conciergeTimelines,
  type ConciergeAnswers,
  type ConciergeDraft,
  type ConciergeEvaluationResponse,
} from "@/lib/concierge/types";
import { normalizeWebsiteUrl } from "@/lib/concierge/validation";

type Stage = "intro" | "questions" | "loading" | "result" | "error";

const stepIds = ["problem", "context", "impact", "outcome", "business", "constraints", "contact"] as const;

function saveDraft(draft: ConciergeDraft) {
  try { window.localStorage.setItem(CONCIERGE_STORAGE_KEY, JSON.stringify(draft)); } catch { /* Draft recovery is optional. */ }
}

function resultHref(sessionId: string, evaluation: ConciergeEvaluationResponse) {
  if (evaluation.recommendation.nextAction === "audit") return `/audit?concierge=${encodeURIComponent(sessionId)}#project-intake`;
  const service = encodeURIComponent(intakeServiceFor(evaluation.recommendation.service));
  return `/intake?concierge=${encodeURIComponent(sessionId)}&service=${service}`;
}

function resultAction(evaluation: ConciergeEvaluationResponse) {
  if (evaluation.recommendation.nextAction === "audit") return "Continue to the Revenue Leak Audit";
  if (evaluation.recommendation.nextAction === "human_review") return "Continue to a human scope review";
  if (evaluation.recommendation.nextAction === "self_service") return "Ask Blake to review the details";
  return "Continue with a prefilled intake";
}

export default function ConciergeFlow({
  entry = "direct",
  surface = "page",
}: {
  entry?: string;
  surface?: "page" | "companion";
}) {
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [answers, setAnswers] = useState<Partial<ConciergeAnswers>>({ companyWebsite: "" });
  const [evaluation, setEvaluation] = useState<ConciergeEvaluationResponse | null>(null);
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    trackStudioEvent("concierge_viewed", { entry_page: entry });
    const timer = window.setTimeout(() => {
      let recovered: ConciergeDraft | null = null;
      try { recovered = parseConciergeDraft(window.localStorage.getItem(CONCIERGE_STORAGE_KEY)); } catch { /* No recovery available. */ }
    if (!recovered) { try { window.localStorage.removeItem(CONCIERGE_STORAGE_KEY); } catch { /* Draft recovery is optional. */ } return; }
      setSessionId(recovered.sessionId);
      setAnswers(recovered.answers);
      setStep(recovered.step);
      if (recovered.stage === "result" && recovered.evaluation) {
        setEvaluation(recovered.evaluation);
        setStage("result");
      } else setStage("questions");
      trackStudioEvent("concierge_recovered_session", { step_id: stepIds[recovered.step] || "result" });
      if (surface === "companion") trackStudioEvent("koi_concierge_resumed", { route_category: entry.replace(/^koi_/, ""), completion_status: recovered.stage });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [entry, surface]);

  useEffect(() => {
    if (stage === "questions" || stage === "result" || stage === "error") headingRef.current?.focus();
  }, [stage, step]);

  function begin() {
    const id = crypto.randomUUID();
    const initial = { companyWebsite: "" };
    setSessionId(id);
    setAnswers(initial);
    setStep(0);
    setEvaluation(null);
    setMessage("");
    setStage("questions");
    saveDraft({ version: 1, sessionId: id, savedAt: Date.now(), step: 0, stage: "questions", answers: initial });
    trackStudioEvent("concierge_started", { entry_page: entry });
    if (surface === "companion") trackStudioEvent("koi_concierge_started", { route_category: entry.replace(/^koi_/, ""), session_state: "new" });
  }

  function update<K extends keyof ConciergeAnswers>(key: K, value: ConciergeAnswers[K]) {
    setAnswers((current) => {
      const next = { ...current, [key]: value };
      if (sessionId && stage === "questions") saveDraft({ version: 1, sessionId, savedAt: Date.now(), step, stage: "questions", answers: next });
      return next;
    });
    setMessage("");
  }

  function stepError() {
    if (step === 0 && (!answers.problemKind || (answers.primaryProblem || "").trim().length < 10)) return "Choose the closest problem and add at least one useful sentence.";
    if (step === 1 && (answers.branchContext || "").trim().length < 8) return "Add a little more detail about the current situation.";
    if (step === 2 && (answers.impact || "").trim().length < 6) return "Describe the practical impact on time, leads, customers, or revenue.";
    if (step === 3 && (answers.desiredOutcome || "").trim().length < 6) return "Describe what should be easier or measurably better.";
    if (step === 4) {
      if (!(answers.businessName || "").trim() || !(answers.industry || "").trim()) return "Business name and industry are required.";
      if (answers.websiteUrl && !normalizeWebsiteUrl(answers.websiteUrl)) return "Enter a public website address, such as example.com.";
    }
    if (step === 5 && (!answers.budgetRange || !answers.timeline)) return "Choose the closest budget and timing ranges.";
    if (step === 6) {
      if (!(answers.name || "").trim()) return "Your name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((answers.email || "").trim())) return "Enter a valid email address.";
    }
    return "";
  }

  async function next(event: FormEvent) {
    event.preventDefault();
    const error = stepError();
    if (error) { setMessage(error); return; }
    trackStudioEvent("concierge_question_answered", { step_id: stepIds[step] });
    const normalized = step === 4 && answers.websiteUrl ? { ...answers, websiteUrl: normalizeWebsiteUrl(answers.websiteUrl) } : answers;
    setAnswers(normalized);
    if (step < CONCIERGE_TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      saveDraft({ version: 1, sessionId, savedAt: Date.now(), step: nextStep, stage: "questions", answers: normalized });
      return;
    }
    await evaluate(normalized as ConciergeAnswers);
  }

  async function evaluate(finalAnswers: ConciergeAnswers) {
    setStage("loading");
    setMessage("");
    trackStudioEvent("concierge_evaluation_requested", { step_id: "complete" });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/concierge/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ sessionId, answers: finalAnswers, currentStep: "complete", locale: navigator.language }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.evaluation) throw new Error(payload.message || "The recommendation could not be generated.");
      const result = payload.evaluation as ConciergeEvaluationResponse;
      setEvaluation(result);
      setStage("result");
      saveDraft({ version: 1, sessionId, savedAt: Date.now(), step: 6, stage: "result", answers: finalAnswers, evaluation: result });
      trackStudioEvent("concierge_recommendation_generated", { recommendation_source: result.source, confidence_band: result.recommendation.confidenceBand });
      trackStudioEvent("concierge_service_recommended", { recommended_service: result.recommendation.service, confidence_band: result.recommendation.confidenceBand });
      if (surface === "companion") trackStudioEvent("koi_concierge_completed", { route_category: entry.replace(/^koi_/, ""), completion_status: "recommendation", recommendation_source: result.source });
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "AbortError" ? error.message : "The request timed out safely. Retry or continue with the standard form.");
      setStage("error");
      trackStudioEvent("concierge_error", { step_id: "evaluation" });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function back() {
    if (step === 0) { setStage("intro"); return; }
    const previous = step - 1;
    setStep(previous);
    setMessage("");
    saveDraft({ version: 1, sessionId, savedAt: Date.now(), step: previous, stage: "questions", answers });
    trackStudioEvent("concierge_back_used", { step_id: stepIds[step] });
  }

  function editAnswers() {
    setStep(0);
    setStage("questions");
    setMessage("");
    saveDraft({ version: 1, sessionId, savedAt: Date.now(), step: 0, stage: "questions", answers });
  }

  function selectStandardForm() {
    trackStudioEvent("concierge_standard_form_selected", { step_id: stage === "questions" ? stepIds[step] : stage });
    if (surface === "companion") trackStudioEvent("koi_standard_intake_selected", { route_category: entry.replace(/^koi_/, ""), completion_status: stage });
  }

  const standardForm = <Link className="concierge-standard-link" href="/intake" onClick={selectStandardForm}>Prefer the standard form?</Link>;
  const prompt = branchPrompt(answers.problemKind);

  if (stage === "intro") return (
    <section className="concierge-shell concierge-intro" aria-labelledby="concierge-title">
      <div className="concierge-orbit" aria-hidden="true"><span>PROBLEM</span><span>FIT</span><span>NEXT STEP</span></div>
      <div>
        <p className="studio-eyebrow">AI-assisted · Rules-grounded · About 4 minutes</p>
        <h2 id="concierge-title">Get a practical starting recommendation.</h2>
        <p>Answer seven focused questions. The concierge will identify the smallest likely service, explain why, and prepare a structured intake for Blake to review.</p>
        <ul className="concierge-promise"><li><Check size={16} aria-hidden="true" />No binding quote or automatic commitment</li><li><Check size={16} aria-hidden="true" />Works even when the AI provider is unavailable</li><li><Check size={16} aria-hidden="true" />You can change every detail before submitting</li></ul>
        <div className="concierge-actions"><button className="studio-button" type="button" onClick={begin}>Help me figure it out <ArrowRight size={16} aria-hidden="true" /></button>{standardForm}</div>
      </div>
    </section>
  );

  if (stage === "loading") return (
    <section className="concierge-shell concierge-state" aria-live="polite" aria-busy="true">
      <div className="concierge-loader" aria-hidden="true"><span /><span /><span /></div>
      <p className="studio-eyebrow">Checking the signals</p>
      <h2>Building a grounded recommendation…</h2>
      <p>The final service route is calculated with explicit business rules. AI may tighten the summary, but it cannot change prices, links, or the underlying route.</p>
      {standardForm}
    </section>
  );

  if (stage === "error") return (
    <section className="concierge-shell concierge-state" aria-live="assertive">
      <p className="studio-eyebrow">Safe retry</p>
      <h2 ref={headingRef} tabIndex={-1}>The recommendation did not load.</h2>
      <p>{message}</p>
      <div className="concierge-actions"><button className="studio-button" type="button" onClick={() => evaluate(answers as ConciergeAnswers)}>Retry recommendation</button><button className="concierge-link-button" type="button" onClick={editAnswers}>Review answers</button>{standardForm}</div>
    </section>
  );

  if (stage === "result" && evaluation) {
    const result = evaluation.recommendation;
    return (
      <section className="concierge-shell concierge-result" aria-labelledby="recommendation-title">
        <div className="concierge-result__status"><span>Preliminary recommendation</span><b>{Math.round(result.confidence * 100)}% rule confidence · {result.confidenceBand}</b></div>
        <p className="studio-eyebrow">Your best starting point</p>
        <h2 id="recommendation-title" ref={headingRef} tabIndex={-1}>{result.serviceLabel}</h2>
        <p className="concierge-result__rationale">{result.rationale}</p>
        <p className="concierge-source-note">{evaluation.source === "fallback" ? "The AI summary was unavailable, so this result was completed entirely with the deterministic rules fallback." : evaluation.source === "deterministic" ? "This result was completed with the deterministic routing engine; no AI provider was needed." : "AI tightened the qualification summary. The service route and confidence still come from deterministic rules."}</p>
        <div className="concierge-result__grid">
          <article><h3>Main problem identified</h3><p>{evaluation.extracted.primaryProblem}</p></article>
          <article><h3>Expected intervention</h3><p>{result.intervention}</p></article>
        </div>
        <div className="concierge-why"><h3>Why this recommendation</h3><ul>{result.reasons.map((reason) => <li key={reason}><Check size={16} aria-hidden="true" />{reason}</li>)}</ul></div>
        {result.assumption ? <p className="concierge-assumption"><strong>Important assumption:</strong> {result.assumption}</p> : null}
        {result.alternativeLabel ? <p className="concierge-alternative"><strong>Possible alternative:</strong> {result.alternativeLabel}. Blake will confirm which boundary is most useful.</p> : null}
        <div className="concierge-next"><div><p className="studio-eyebrow">Next step</p><h3>{resultAction(evaluation)}</h3></div><Link className="studio-button" href={resultHref(sessionId, evaluation)} onClick={() => {
          if (result.nextAction === "audit") trackStudioEvent("concierge_audit_cta_clicked", { recommended_service: result.service });
          else {
            if (result.requiresHumanReview) trackStudioEvent("concierge_human_review_requested", { recommended_service: result.service });
          }
        }}>{resultAction(evaluation)} <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="concierge-result__controls"><button className="concierge-link-button" type="button" onClick={editAnswers}><RotateCcw size={15} aria-hidden="true" />Correct my answers</button><Link className="concierge-link-button" href={`/intake?concierge=${encodeURIComponent(sessionId)}&service=Not%20sure%20yet`} onClick={() => trackStudioEvent("concierge_human_review_requested", { recommended_service: result.service })}>Choose human review</Link>{standardForm}</div>
        <p className="concierge-disclaimer">This is a preliminary, AI-assisted recommendation—not a quote, final scope, promised timeline, or guarantee. Blake confirms fit, scope, pricing, and timing after human review.</p>
      </section>
    );
  }

  return (
    <section className="concierge-shell" aria-labelledby="concierge-question">
      <div className="concierge-progress"><span>Question {step + 1} of {CONCIERGE_TOTAL_STEPS}</span><div aria-hidden="true"><i style={{ width: `${((step + 1) / CONCIERGE_TOTAL_STEPS) * 100}%` }} /></div></div>
      <form onSubmit={next} noValidate>
        <div className="concierge-question">
          {step === 0 ? <><p className="studio-eyebrow">Start with the friction</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>What is creating the biggest problem right now?</h2><p>Choose the closest starting point, then explain it in your own words.</p><div className="concierge-choice-grid" role="group" aria-label="Primary problem">{problemChoices.map((choice) => <button key={choice.value} type="button" className={answers.problemKind === choice.value ? "is-selected" : ""} aria-pressed={answers.problemKind === choice.value} onClick={() => update("problemKind", choice.value)}><strong>{choice.label}</strong><span>{choice.hint}</span></button>)}</div><label><span>What are you seeing?</span><textarea value={answers.primaryProblem || ""} onChange={(event) => update("primaryProblem", event.target.value)} rows={4} maxLength={1200} placeholder="Describe the problem without worrying about the technical solution." /></label></> : null}
          {step === 1 ? <><p className="studio-eyebrow">Current process</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>{prompt.title}</h2><p>{prompt.description}</p><label><span>Current situation</span><textarea value={answers.branchContext || ""} onChange={(event) => update("branchContext", event.target.value)} rows={6} maxLength={2000} placeholder={prompt.placeholder} /></label><label><span>{prompt.toolsLabel}</span><input value={answers.currentTools || ""} onChange={(event) => update("currentTools", event.target.value)} maxLength={1000} placeholder="For example: Squarespace, Gmail, Calendly, HubSpot" /></label></> : null}
          {step === 2 ? <><p className="studio-eyebrow">Business impact</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>What does this problem cost or slow down?</h2><p>Approximate impact is useful. Exact financial data is not required.</p><label><span>Operational or financial impact</span><textarea value={answers.impact || ""} onChange={(event) => update("impact", event.target.value)} rows={5} maxLength={1200} placeholder="For example: replies take two days, leads disappear, or staff spend six hours a week copying information…" /></label></> : null}
          {step === 3 ? <><p className="studio-eyebrow">Useful outcome</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>What should be easier or measurably better?</h2><p>Describe the practical result, not a guaranteed business outcome.</p><label><span>Desired outcome</span><textarea value={answers.desiredOutcome || ""} onChange={(event) => update("desiredOutcome", event.target.value)} rows={5} maxLength={1200} placeholder="For example: every qualified inquiry reaches the right person with the context needed to reply the same day…" /></label></> : null}
          {step === 4 ? <><p className="studio-eyebrow">Business context</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>Who is this work for?</h2><p>This keeps the recommendation grounded in the actual organization.</p><div className="concierge-fields"><label><span>Business or organization name</span><input value={answers.businessName || ""} onChange={(event) => update("businessName", event.target.value)} maxLength={160} autoComplete="organization" /></label><label><span>Industry or business type</span><input value={answers.industry || ""} onChange={(event) => update("industry", event.target.value)} maxLength={120} placeholder="Tattoo studio, consultant, nonprofit…" /></label><label className="concierge-field-wide"><span>Website URL (optional)</span><input value={answers.websiteUrl || ""} onChange={(event) => update("websiteUrl", event.target.value)} maxLength={500} inputMode="url" autoComplete="url" placeholder="example.com" /></label></div></> : null}
          {step === 5 ? <><p className="studio-eyebrow">Constraints</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>What range and timing are realistic?</h2><p>These ranges qualify the starting point; they are not a quote or promised schedule.</p><div className="concierge-fields"><label><span>Approximate budget</span><select value={answers.budgetRange || ""} onChange={(event) => update("budgetRange", event.target.value as ConciergeAnswers["budgetRange"])}><option value="" disabled>Choose the closest range</option>{conciergeBudgetRanges.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Desired timing</span><select value={answers.timeline || ""} onChange={(event) => update("timeline", event.target.value as ConciergeAnswers["timeline"])}><option value="" disabled>Choose the closest timing</option>{conciergeTimelines.map((value) => <option key={value}>{value}</option>)}</select></label></div></> : null}
          {step === 6 ? <><p className="studio-eyebrow">Your recommendation</p><h2 id="concierge-question" ref={headingRef} tabIndex={-1}>Where should the recommendation go?</h2><p>Your contact details are saved only if you continue and submit the project intake. The optional AI summary does not receive your name or email.</p><div className="concierge-fields"><label><span>Name</span><input value={answers.name || ""} onChange={(event) => update("name", event.target.value)} maxLength={120} autoComplete="name" /></label><label><span>Email</span><input value={answers.email || ""} onChange={(event) => update("email", event.target.value)} maxLength={254} type="email" autoComplete="email" /></label></div><label className="concierge-honeypot" aria-hidden="true"><span>Company website (leave blank)</span><input tabIndex={-1} autoComplete="off" value={answers.companyWebsite || ""} onChange={(event) => update("companyWebsite", event.target.value)} /></label><p className="concierge-privacy">Do not include passwords, card numbers, customer lists, protected health information, or other sensitive data.</p></> : null}
        </div>
        {message ? <p className="concierge-validation" role="alert">{message}</p> : null}
        <div className="concierge-form-actions"><button className="concierge-back" type="button" onClick={back}><ArrowLeft size={16} aria-hidden="true" />Back</button><button className="studio-button" type="submit">{step === 6 ? "Get my recommendation" : "Continue"}<ArrowRight size={16} aria-hidden="true" /></button></div>
        <div className="concierge-form-escape">{standardForm}<span>Your current concierge draft stays on this device for 24 hours.</span></div>
      </form>
    </section>
  );
}
