"use client";

import Link from "next/link";
import { ArrowRight, Check, Pencil, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FrontOfficeChat, { type FrontOfficeApi } from "@/components/front-office/FrontOfficeChat";
import {
  buildIntakeFormData,
  draftAnswers,
  originNote,
  studioBrief,
  studioPolicy,
  studioRecommendation,
  validateStudioContact,
  type StudioContact,
} from "@/lib/front-office/studio-policy";

/**
 * The commercial front office, mounted inside the studio companion panel.
 *
 * Consent model, in order:
 *   1. Everything before "Send the brief" lives in this tab's sessionStorage.
 *   2. The review screen shows the whole brief; every line is editable.
 *   3. Contact details are asked LAST, next to an explicit submit button.
 *   4. Submit calls the same two endpoints the concierge + intake form use —
 *      /api/concierge/evaluate (optional AI summary, signed) then /api/intake
 *      (server-side re-validation, re-scoring, storeLead, Resend). If the
 *      evaluate call fails or no provider is configured, the submit proceeds
 *      deterministically — the server re-scores either way.
 */

const REQUEST_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function StudioFrontOffice() {
  return (
    <FrontOfficeChat
      policy={studioPolicy}
      route={typeof window === "undefined" ? "" : window.location.pathname}
      lead="Describe the business problem in your own words. I'll organize it, recommend the smallest sensible starting point, and prepare a brief Blake can act on."
      privacyNote="Nothing is sent anywhere until you review the brief and press send. Please don't include passwords, card numbers, or customer data."
      Outcome={StudioOutcome}
    />
  );
}

function StudioOutcome({ api }: { api: FrontOfficeApi }) {
  const { session, dispatch, restart, track } = api;
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contact, setContact] = useState<StudioContact>({ name: "", email: "", websiteOrSocial: session.fields.websiteUrl || "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [mailtoFallback, setMailtoFallback] = useState("");
  const recommendationTracked = useRef(false);

  // Fire once when the review/recommendation first renders — in an effect,
  // because analytics is a side effect and render must stay pure.
  useEffect(() => {
    if (session.stage !== "review" || recommendationTracked.current) return;
    recommendationTracked.current = true;
    track("front_office_recommendation_shown", {
      recommendation: studioRecommendation(session).recommendation.service,
    });
  }, [session, track]);

  /* ------------------------------------------------------------- review */

  if (session.stage === "review") {
    const brief = studioBrief(session);
    const { recommendation, offer, uncertain } = studioRecommendation(session);
    return (
      <div className="ffo__outcome">
        <p className="ffo__eyebrow">What I heard</p>
        <dl className="ffo__brief">
          {brief.map((line) => (
            <div key={line.field} className="ffo__brief-line" data-inferred={line.inferred ? "true" : "false"}>
              <dt>
                {line.label}
                {line.inferred ? <em title="Read from your message — check it">inferred</em> : null}
              </dt>
              {editing === line.field ? (
                <dd>
                  <form
                    className="ffo__edit"
                    onSubmit={(event) => {
                      event.preventDefault();
                      dispatch({ type: "EDIT_FIELD", field: line.field, value: editValue });
                      setEditing(null);
                    }}
                  >
                    <label className="ffo__sr" htmlFor={`ffo-edit-${line.field}`}>{line.label}</label>
                    <textarea id={`ffo-edit-${line.field}`} value={editValue} rows={2} maxLength={2000} onChange={(event) => setEditValue(event.target.value)} />
                    <button type="submit" className="ffo__continue">Save</button>
                  </form>
                </dd>
              ) : (
                <dd>
                  {line.value}
                  <button type="button" className="ffo__edit-toggle" aria-label={`Edit ${line.label}`} onClick={() => { setEditing(line.field); setEditValue(line.value); }}>
                    <Pencil size={12} aria-hidden="true" />
                  </button>
                </dd>
              )}
            </div>
          ))}
        </dl>

        <div className="ffo__reco" role="status">
          <p className="ffo__eyebrow">Recommended next step</p>
          <h3>{recommendation.serviceLabel}</h3>
          <p className="ffo__reco-rationale">{recommendation.rationale}</p>
          <ul className="ffo__reasons">
            {recommendation.reasons.slice(0, 3).map((reason) => (
              <li key={reason}><Check size={13} aria-hidden="true" />{reason}</li>
            ))}
          </ul>
          {offer ? (
            <dl className="ffo__offer">
              <div><dt>{offer.priceLabel}</dt><dd>{offer.price}</dd></div>
              <div><dt>Timeline</dt><dd>{offer.timeline}</dd></div>
              <div><dt>You get</dt><dd>{offer.deliverable}</dd></div>
            </dl>
          ) : (
            <p className="ffo__no-offer">Scope and pricing for this path are confirmed after Blake reviews the brief — no number is invented here.</p>
          )}
          {uncertain.length ? (
            <div className="ffo__uncertain">
              <p>Still uncertain:</p>
              <ul>{uncertain.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
          {recommendation.assumption ? <p className="ffo__assumption">{recommendation.assumption}</p> : null}
        </div>

        <button type="button" className="ffo__primary" onClick={() => dispatch({ type: "CONFIRM_REVIEW" })}>
          This is right — send it to Blake <ArrowRight size={15} aria-hidden="true" />
        </button>
        <div className="ffo__footer">
          <button type="button" className="ffo__restart" onClick={restart}><RotateCcw size={13} aria-hidden="true" /> Start over</button>
          <Link className="ffo__alt-link" href="/intake">Prefer the standard form?</Link>
        </div>
        <p className="ffo__disclaimer">Preliminary and rules-based — not a quote, promised timeline, or commitment. Blake confirms fit, scope, and pricing after review.</p>
      </div>
    );
  }

  /* ------------------------------------------------------------ consent */

  if (session.stage === "consent" || session.stage === "submitting") {
    const submitting = session.stage === "submitting";
    const submit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (submitting) return;
      const errors = validateStudioContact(contact);
      setContactErrors(errors);
      if (Object.keys(errors).length) return;
      dispatch({ type: "SUBMIT_STARTED" });
      track("front_office_submit_started");

      // Optional AI-tightened summary; deterministic on any failure.
      let evaluationToken = "";
      try {
        const answers = draftAnswers(session, contact);
        const response = await fetchWithTimeout("/api/concierge/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.sessionId, answers, currentStep: "front_office" }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.ok && payload.evaluation?.evaluationToken) evaluationToken = payload.evaluation.evaluationToken;
      } catch {
        // The server re-scores deterministically; the brief still submits.
      }

      try {
        const form = buildIntakeFormData(session, contact, {
          evaluationToken,
          origin: originNote({ host: window.location.host, pathname: window.location.pathname, search: window.location.search }),
        });
        const response = await fetchWithTimeout("/api/intake", {
          method: "POST",
          body: form,
          headers: { "idempotency-key": `concierge:${session.sessionId}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.ok) {
          setSuccessMessage(String(payload.message || "Intake received. Blake will review and reply with the practical next step."));
          dispatch({ type: "SUBMIT_SUCCEEDED" });
          track("front_office_submit_succeeded");
        } else {
          setMailtoFallback(typeof payload.mailto === "string" ? payload.mailto : "");
          dispatch({ type: "SUBMIT_FAILED", message: String(payload.message || "The brief could not be saved right now.") });
          track("front_office_submit_failed");
        }
      } catch {
        dispatch({ type: "SUBMIT_FAILED", message: "The network request failed. Your brief is still here — retry when you're back online." });
        track("front_office_submit_failed");
      }
    };

    return (
      <form className="ffo__outcome" onSubmit={submit}>
        <p className="ffo__eyebrow">Where should the reply go?</p>
        <div className="ffo__contact">
          <label>
            <span>Name</span>
            <input value={contact.name} maxLength={120} autoComplete="name" onChange={(event) => setContact({ ...contact, name: event.target.value })} />
            {contactErrors.name ? <em role="alert">{contactErrors.name}</em> : null}
          </label>
          <label>
            <span>Email</span>
            <input value={contact.email} type="email" maxLength={254} autoComplete="email" onChange={(event) => setContact({ ...contact, email: event.target.value })} />
            {contactErrors.email ? <em role="alert">{contactErrors.email}</em> : null}
          </label>
          <label>
            <span>Website or social link</span>
            <input value={contact.websiteOrSocial} maxLength={500} inputMode="url" placeholder="Any active profile works" onChange={(event) => setContact({ ...contact, websiteOrSocial: event.target.value })} />
            {contactErrors.websiteOrSocial ? <em role="alert">{contactErrors.websiteOrSocial}</em> : null}
          </label>
        </div>
        <p className="ffo__consent">Sending shares this brief — and nothing else — with Blake&apos;s CRM and inbox so he can reply. Nothing was saved before this point, and there&apos;s no automatic commitment.</p>
        <button type="submit" className="ffo__primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send the brief to Blake"} <ArrowRight size={15} aria-hidden="true" />
        </button>
        <div className="ffo__footer">
          <button type="button" className="ffo__restart" onClick={() => dispatch({ type: "BACK_TO_REVIEW" })}>Back to the brief</button>
        </div>
      </form>
    );
  }

  /* --------------------------------------------------------------- done */

  if (session.stage === "done") {
    return (
      <div className="ffo__outcome" role="status">
        <p className="ffo__eyebrow">Sent</p>
        <h3>The brief is with Blake.</h3>
        <p>{successMessage || "Intake received. Blake reviews fit, scope, and the smallest useful first step, then replies by email."}</p>
        <div className="ffo__footer">
          <button type="button" className="ffo__restart" onClick={restart}><RotateCcw size={13} aria-hidden="true" /> Start another brief</button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- error */

  return (
    <div className="ffo__outcome" role="alert">
      <p className="ffo__eyebrow">Safe retry</p>
      <h3>That didn&apos;t send.</h3>
      <p>{session.errorMessage || "The brief could not be saved right now."}</p>
      <button type="button" className="ffo__primary" onClick={() => dispatch({ type: "BACK_TO_REVIEW" })}>
        Back to the brief
      </button>
      {mailtoFallback ? <a className="ffo__alt-link" href={mailtoFallback}>Open the email fallback instead</a> : null}
    </div>
  );
}
