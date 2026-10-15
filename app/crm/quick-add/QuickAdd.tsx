"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
const stages = ["new", "contacted", "replied", "meeting", "proposal", "won", "lost"];
function tomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export default function QuickAdd() {
 const router = useRouter(); const key = useRef(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
 async function save(form: FormData) {
  if (pending) return;
  setPending(true); setError(""); key.current ||= crypto.randomUUID();
  const fields = Object.fromEntries(form);
  fields.followUpAt = new Date(`${fields.followUpAt}T12:00:00`).toISOString();
  try {
   const response = await fetch("/api/crm/leads", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": key.current }, body: JSON.stringify(fields) });
   const result = await response.json();
   if (!response.ok) { setError(result.errors?.join(" ") || "Could not save. Please retry."); return; }
   router.push(`/crm/leads/${result.id}`); router.refresh();
  } catch { setError("Could not save. Your entries are still here; please retry."); }
  finally { setPending(false); }
 }
 return <form className="panel crm-editor" action={save}>
  <label>Person<input name="name" required maxLength={120} autoComplete="name"/></label>
  <label>Company<input name="businessName" required maxLength={160} autoComplete="organization"/></label>
  <label>Email (or phone)<input name="email" type="email" maxLength={254} autoComplete="email"/></label>
  <label>Phone (or email)<input name="phone" type="tel" maxLength={40} autoComplete="tel"/></label>
  <label className="crm-notes">Problem<input name="biggestProblem" required maxLength={4000}/></label>
  <label className="crm-notes">Next action<input name="nextAction" required maxLength={1000}/></label>
  <label>Follow-up date<input name="followUpAt" type="date" required defaultValue={tomorrow()}/></label>
  <label>Source<input name="source" defaultValue="Chamber" maxLength={160}/></label>
  <label>Stage<select name="status" defaultValue="new">{stages.map(stage => <option key={stage}>{stage}</option>)}</select></label>
  <label className="crm-notes">Notes<textarea name="notes" rows={4} maxLength={4000} placeholder="Event, context, and permission to follow up"/></label>
  <button className="btn btn-cyan" disabled={pending}>{pending ? "Saving…" : "Save lead"}</button>{error ? <p role="alert">{error}</p> : null}
 </form>;
}
