"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import CheckoutButton from "@/components/acquisition/CheckoutButton";
import { serviceInterestOptions, type OfferKey } from "@/lib/acquisition/offers";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; suggestedOffer?: OfferKey }
  | { status: "error"; message: string; mailto: string; requestId?: string };

const timelines = ["This week", "This month", "1-2 months", "Just researching"];
const budgets = ["Under $500", "$500-$1,500", "$1,500-$3,500", "$3,500+", "Not sure yet"];

function IntakeFormInner() {
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service") || "";
  const [state, setState] = useState<SubmitState>({ status: "idle" });

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
        suggestedOffer: payload.suggestedOffer,
      });
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
    <form className="intake-form panel" onSubmit={onSubmit}>
      {state.status === "success" ? (
        <div className="success-state" role="status">
          <strong>Intake received.</strong>
          <p>{state.message}</p>
          <p>Next: Blake reviews fit, scope, and the smallest useful first step. If payment is appropriate, he will confirm the right checkout/deposit path.</p>
          {state.suggestedOffer ? (
            <CheckoutButton offerKey={state.suggestedOffer}>Open matching checkout</CheckoutButton>
          ) : null}
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
          <textarea name="biggestProblem" rows={4} required maxLength={4000} />
        </label>
        <label className="form-span">
          <span>Notes</span>
          <textarea name="notes" rows={4} maxLength={8000} />
        </label>
      </div>
      <button className="btn btn-gold" type="submit" disabled={state.status === "submitting"}>
        {state.status === "submitting" ? "Sending..." : "Submit intake"}
      </button>
      <p className="contact-fallback">
        Private lead data is submitted to the server. In development it is stored locally; in production use
        the configured email provider or email fallback.
      </p>
    </form>
  );
}

export default function IntakeForm() {
  return (
    <Suspense fallback={<div className="panel form-loading">Loading intake...</div>}>
      <IntakeFormInner />
    </Suspense>
  );
}
