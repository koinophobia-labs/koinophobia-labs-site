"use client";
import { useState, type FormEvent } from "react";
import type { NewServiceOffer } from "@/lib/acquisition/services-config";
export default function ServiceOnboardingForm({ offer }: { offer: NewServiceOffer }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const sessionId = new URL(window.location.href).searchParams.get("session_id");
    if (sessionId) form.set("session_id", sessionId);
    try {
      const response = await fetch("/api/intake", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw Error(result.message || "Please try again.");
      setDone(true); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not save your details. Please try again."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status">{message}</p>;
  return <form className="audit-booking" onSubmit={submit}>
    <input type="hidden" name="offer" value={offer}/><input type="hidden" name="paid" value="true"/>
    <label>{offer === "straight_answer" ? "Project or company name" : "Business name"}<input name="businessName" maxLength={160} required autoComplete="organization"/></label>
    {offer === "straight_answer" ? <><label>PRD or spec link<input name="specLink" type="url" placeholder="https://…" maxLength={2000} required/></label><p>Share a link Blake can open. Don’t include passwords or private access tokens.</p><label>What should Blake know?<textarea name="details" maxLength={3000} rows={4} required/></label></> : <><label>What are we supporting?<textarea name="details" maxLength={3000} rows={4} required/></label><label>Access contacts<textarea name="accessContacts" placeholder="Names, roles, and work emails. No passwords or access tokens." maxLength={2000} rows={3} required/></label></>}
    <button className="btn btn--primary" disabled={busy}>{busy ? "Sending…" : offer === "straight_answer" ? "Send your PRD" : "Send onboarding details"}</button>{message ? <p role="alert">{message}</p> : null}
  </form>;
}
