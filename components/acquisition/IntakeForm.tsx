"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import {
  intakeBudgets as budgets,
  intakeServiceOptions as serviceInterestOptions,
  intakeTimelines as timelines,
} from "@/lib/acquisition/intake-options";
import { trackStudioEvent } from "@/components/studio/AnalyticsBridge";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; mailto: string; requestId?: string };

function IntakeFormInner({ defaultService = "" }: { defaultService?: string }) {
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service") || defaultService;
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [started, setStarted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "submitting" });
    let response: Response;
    try { response = await fetch("/api/intake", { method: "POST", body: formData }); }
    catch { setState({ status:"error", message:"The network request failed. Check your connection and try again.", mailto:"mailto:koinophobia999@gmail.com" }); return; }
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.ok) {
      form.reset();
      setState({
        status: "success",
        message: payload.message || "Intake received. Blake will review and reply with the practical next step.",
      });
      trackStudioEvent("intake_form_completion");
      return;
    }
    setState({
      status: "error",
      message: payload.message || "The intake could not be saved. Use the email fallback below.",
      mailto: payload.mailto || "mailto:koinophobia999@gmail.com",
      requestId: payload.requestId,
    });
  }

  return (
    <form className="intake-form panel" onSubmit={onSubmit} onFocus={() => { if (!started) { setStarted(true); trackStudioEvent("intake_form_start"); } }}>
      {state.status === "success" ? (
        <div className="success-state" role="status">
          <strong>Intake received.</strong>
          <p>{state.message}</p>
          <p>Next: Blake reviews fit, scope, and the smallest useful first step. If payment is appropriate, he will confirm the right checkout/deposit path.</p>
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="error-state" role="alert">
          <strong>Fallback needed.</strong>
          <p>{state.message}</p>
          {state.requestId ? <p className="microcopy">Support reference: {state.requestId}</p> : null}
          <a className="btn btn-cyan" href={state.mailto}>Open email fallback</a>
        </div>
      ) : null}
      <div className="form-grid">
        <label hidden aria-hidden="true">
          <span>Company website (leave blank)</span>
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          <span>Name</span>
          <input name="name" required maxLength={120} />
        </label>
        <label>
          <span>Business name</span>
          <input name="businessName" required maxLength={160} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          <span>Phone optional</span>
          <input name="phone" type="tel" maxLength={40} />
        </label>
        <label>
          <span>Website or social link</span>
          <input name="websiteOrSocial" required maxLength={500} placeholder="https://..." />
        </label>
        <label>
          <span>Industry</span>
          <input name="industry" required maxLength={120} />
        </label>
        <label>
          <span>Service interest</span>
          <select name="serviceInterest" defaultValue={requestedService} required>
            <option value="" disabled>Select a service</option>
            {serviceInterestOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Budget range optional</span>
          <select name="budgetRange" defaultValue="">
            <option value="">Prefer not to say yet</option>
            {budgets.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Timeline</span>
          <select name="timeline" defaultValue="" required>
            <option value="" disabled>Select a timeline</option>
            {timelines.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="form-span">
          <span>Biggest problem</span>
          <textarea name="biggestProblem" rows={4} required maxLength={4000} placeholder="Where are customers, time, or follow-up falling through?" />
        </label>
        <label className="form-span">
          <span>Desired outcome</span>
          <textarea name="desiredOutcome" rows={3} required maxLength={2000} placeholder="What should be easier or measurably better when this is done?" />
        </label>
        <label className="form-span">
          <span>Current tools optional</span>
          <textarea name="currentTools" rows={3} maxLength={2000} placeholder="Website platform, calendar, payment tool, CRM, email, forms, or spreadsheets" />
        </label>
        <label className="form-span">
          <span>Anything else optional</span>
          <textarea name="notes" rows={3} maxLength={4000} />
        </label>
      </div>
      <button className="btn btn-gold" type="submit" disabled={state.status === "submitting"}>
        {state.status === "submitting" ? "Sending..." : "Submit intake"}
      </button>
      <p className="contact-fallback">Your contact and business details are used to review this request and reply. Do not include passwords, card numbers, or customer data.</p>
    </form>
  );
}

export default function IntakeForm({ defaultService }: { defaultService?: string }) {
  return (
    <Suspense fallback={<div className="panel form-loading">Loading intake...</div>}>
      <IntakeFormInner defaultService={defaultService} />
    </Suspense>
  );
}
