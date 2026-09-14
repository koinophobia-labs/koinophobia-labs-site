"use client";

import { track } from "@vercel/analytics";
import { FormEvent, useEffect, useRef, useState } from "react";

type State =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "sent"; weekday: string }
  | { status: "error"; message: string };

const WHEN = [
  { value: "Not sure yet", label: "Not sure yet" },
  { value: "Soon", label: "Soon" },
  { value: "This quarter", label: "This quarter" },
  { value: "No deadline", label: "No deadline" },
];
const BUDGET = [
  { value: "Under $5k", label: "Under $5k" },
  { value: "$5k–$15k", label: "$5–15k" },
  { value: "$15k–$40k", label: "$15–40k" },
  { value: "Let's talk", label: "Let's talk" },
];

const DRAFT_KEY = "koi-start-draft";

function replyWeekday() {
  const d = new Date();
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added += 1;
  }
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Six fields, no service picker. Posts to the existing /api/intake pipeline
 * (origin check, honeypot, rate limit, redaction, idempotency, lead store,
 * email) as the "start" variant. The draft survives a reload until sent.
 */
export default function StartForm({ entry = "start" }: { entry?: string }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (draft) {
        for (const [name, value] of Object.entries(draft)) {
          const control = form.elements.namedItem(name);
          if (control instanceof HTMLTextAreaElement || control instanceof HTMLInputElement) control.value = String(value);
        }
      }
    } catch {
      /* no draft */
    }
  }, []);

  const saveDraft = () => {
    const form = formRef.current;
    if (!form) return;
    if (!started.current) {
      started.current = true;
      track("inquiry_start", { entry });
    }
    try {
      const data = new FormData(form);
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ idea: data.get("idea"), today: data.get("today"), email: data.get("email"), name: data.get("name") }),
      );
    } catch {
      /* private mode */
    }
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const idea = String(data.get("idea") || "").trim();
    const email = String(data.get("email") || "").trim();
    const next: Record<string, string> = {};
    if (idea.length < 20) next.idea = "A sentence or two is enough, but it needs to be more than a title.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "That doesn't look like an email address.";
    setErrors(next);
    if (Object.keys(next).length) {
      track("inquiry_fail", { reason: "validation" });
      return;
    }
    setState({ status: "submitting" });
    const body = new FormData();
    body.set("variant", "start");
    body.set("name", String(data.get("name") || "").trim() || "Not given");
    body.set("email", email);
    body.set("biggestProblem", idea);
    body.set("desiredOutcome", String(data.get("today") || "").trim());
    body.set("timeline", String(data.get("when") || "Not sure yet"));
    body.set("budgetRange", String(data.get("budget") || "Let's talk"));
    body.set("companyWebsite", String(data.get("companyWebsite") || ""));
    let response: Response;
    try {
      response = await fetch("/api/intake", { method: "POST", body });
    } catch {
      setState({ status: "error", message: "That didn't send. Nothing was lost; try again, or email koinophobia999@gmail.com." });
      track("inquiry_fail", { reason: "server" });
      return;
    }
    if (response.status === 429) {
      setState({ status: "error", message: "Two in a row is plenty. Email if it's urgent: koinophobia999@gmail.com." });
      track("inquiry_fail", { reason: "rate_limit" });
      return;
    }
    if (!response.ok) {
      setState({ status: "error", message: "That didn't send. Nothing was lost; try again, or email koinophobia999@gmail.com." });
      track("inquiry_fail", { reason: "server" });
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    track("inquiry_submit", { budget_band: String(data.get("budget") || ""), timeline_band: String(data.get("when") || "") });
    setState({ status: "sent", weekday: replyWeekday() });
  }

  if (state.status === "sent") {
    return (
      <div className="glass form" role="status">
        <p className="k">
          <b>Sent</b>
        </p>
        <h2>Got it.</h2>
        <p className="lede">
          Blake reads every one of these. You&apos;ll hear back by {state.weekday}, and the reply might be a question.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} className="glass form" onSubmit={onSubmit} onInput={saveDraft} noValidate>
      <div className={`field${errors.idea ? " field--error" : ""}`}>
        <label htmlFor="start-idea">What do you want to exist?</label>
        <textarea id="start-idea" name="idea" required maxLength={4000} placeholder="An app for… a tool that… a thing nobody has built because…" aria-describedby={errors.idea ? "start-idea-err" : undefined} />
        {errors.idea ? (
          <span className="field__err" id="start-idea-err">
            {errors.idea}
          </span>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="start-today">What exists today?</label>
        <textarea id="start-today" name="today" maxLength={2000} placeholder="Nothing yet is a fine answer." />
      </div>
      <div className="field">
        <span className="field__label">When do you need it?</span>
        <div className="chips" role="group" aria-label="Timeline">
          {WHEN.map((option) => (
            <label key={option.value}>
              <input type="radio" name="when" value={option.value} defaultChecked={option.value === "Not sure yet"} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field__label">Budget range</span>
        <div className="chips" role="group" aria-label="Budget">
          {BUDGET.map((option) => (
            <label key={option.value}>
              <input type="radio" name="budget" value={option.value} defaultChecked={option.value === "Let's talk"} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className={`field${errors.email ? " field--error" : ""}`}>
        <label htmlFor="start-email">Email</label>
        <input id="start-email" type="email" name="email" required autoComplete="email" placeholder="you@company.com" aria-describedby={errors.email ? "start-email-err" : undefined} />
        {errors.email ? (
          <span className="field__err" id="start-email-err">
            {errors.email}
          </span>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="start-name">Name</label>
        <input id="start-name" type="text" name="name" autoComplete="name" maxLength={120} />
      </div>
      {/* Honeypot: real people never see this. */}
      <div style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <label htmlFor="start-website">Company website</label>
        <input id="start-website" type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="actions">
        <button className="btn btn--primary ai" type="submit" disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Sending…" : "Send it"}
        </button>
        {state.status === "error" ? (
          <p className="form__status form__status--err" role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
