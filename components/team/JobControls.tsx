"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export function Countdown({ deadline }: { deadline: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  if (!deadline) return <span>Quote deadline needed</span>;
  const hours =
    now === null ? null : Math.ceil((Date.parse(deadline) - now) / 3600000);
  return (
    <span>
      {new Date(deadline).toLocaleString()}{" "}
      {hours === null
        ? ""
        : hours > 0
          ? `· ${hours}h remaining`
          : `· ${Math.abs(hours)}h overdue`}
    </span>
  );
}
export function JobControls({
  id,
  stage,
  notes,
  refundDraft,
  refundEligible,
  custom,
}: {
  id: string;
  stage: string;
  notes: string;
  refundDraft: boolean;
  refundEligible: boolean;
  custom: boolean;
}) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (stage !== "Fix ready") return;
    const i = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(i);
  }, [router, stage]);
  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/team/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage(
        action === "refund-confirm"
          ? "Closed. Refund authorized as a draft only; Blake must issue it in Stripe."
          : "Saved.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  if (["Delivered", "Closed"].includes(stage)) return null;
  return (
    <>
      <div className="job-actions">
        <button disabled={busy} onClick={() => act("attach-proof")}>
          Attach confirmed Site Check if missing
        </button>
        {["New", "Waiting on client access"].includes(stage) && (
          <button disabled={busy} onClick={() => act("access")}>
            I confirmed contributor access
          </button>
        )}
        {["In progress", "Fix ready", "Verified"].includes(stage) && (
          <button disabled={busy} onClick={() => act("fix-ready")}>
            {stage === "In progress"
              ? "Fix ready — run auditor"
              : "Re-run auditor"}
          </button>
        )}
        {stage === "Verified" && (
          <button disabled={busy} onClick={() => act("deliver")}>
            Deliver with before / after
          </button>
        )}
        <button disabled={busy} onClick={() => act("scope")}>
          Flag out of scope
        </button>
        {refundEligible && (
          <button disabled={busy} onClick={() => act("refund-draft")}>
            Close and refund — draft
          </button>
        )}
        <button disabled={busy} onClick={() => act("renew")}>
          Renew onboarding link
        </button>
      </div>
      {refundDraft && (
        <section className="job-card">
          <h2>Refund draft — Blake’s decision</h2>
          <p>
            No refund has been issued. Confirming closes the job and records
            your authorization. Issue the actual refund separately in Stripe.
          </p>
          <label>
            <span>
              <input
                style={{ width: "auto" }}
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />{" "}
              I am Blake and confirm closing this job for a refund.
            </span>
          </label>
          <button
            disabled={!confirm || busy}
            onClick={() => act("refund-confirm", { confirm: true })}
          >
            Confirm close and refund draft
          </button>
        </section>
      )}
      {custom && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget).get("deadline");
            if (d)
              act("deadline", { deadline: new Date(String(d)).toISOString() });
          }}
        >
          <label>
            Deadline agreed in quote
            <input type="datetime-local" name="deadline" required />
          </label>
          <button disabled={busy}>Save quoted deadline</button>
        </form>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          act("notes", { notes: new FormData(e.currentTarget).get("notes") });
        }}
      >
        <label>
          Owner notes — never paste passwords
          <textarea name="notes" defaultValue={notes} maxLength={4000} />
        </label>
        <button disabled={busy}>Save notes</button>
      </form>
      <p role="status">{busy ? "Working…" : message}</p>
    </>
  );
}
