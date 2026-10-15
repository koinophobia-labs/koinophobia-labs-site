"use client";
import { useState, type FormEvent } from "react";
export default function AuditBookingForm() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    // Each tab retains its own paid session; the server re-verifies it with Stripe.
    const sessionId = new URL(window.location.href).searchParams.get("session_id");
    if (sessionId) form.set("session_id", sessionId);
    try {
      const response = await fetch("/api/intake", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw Error(result.errors ? Object.values(result.errors).join(" ") : result.message);
      setDone(true); setMessage("Your preferred times are recorded. Blake will email you to confirm a call time.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not record your times. Please try again."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status">{message}</p>;
  return <form className="audit-booking" onSubmit={submit}>
    <input type="hidden" name="offer" value="audit"/><input type="hidden" name="paid" value="true"/>
    <label>Business name<input name="businessName" autoComplete="organization" maxLength={160} required/></label>
    <label>The problem in one line<input name="biggestProblem" maxLength={500} required/></label>
    <p>Suggest 2–3 dates and times for your 45-minute call. Include your time zone.</p>
    <label>Preferred call time 1<input name="preferredTime1" placeholder="e.g. October 22, 10 am Central" maxLength={160} required/></label>
    <label>Preferred call time 2<input name="preferredTime2" maxLength={160} required/></label>
    <label>Preferred call time 3 (optional)<input name="preferredTime3" maxLength={160}/></label>
    <button className="btn btn--primary" disabled={busy}>{busy ? "Sending…" : "Send preferred times"}</button>
    {message ? <p role="alert">{message}</p> : null}
  </form>;
}
