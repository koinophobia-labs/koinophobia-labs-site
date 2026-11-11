"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { TeamSnapshot } from "@/lib/team/store";
import {
  CALL_OUTCOMES,
  phoneNumber,
  smsLink,
  dealText,
  type CallState,
} from "@/lib/team/call-domain";
import { quotePaymentLink } from "@/lib/team/payment-links";
import { money } from "@/lib/team/config";
type Live = CallState & {
  followups: {
    deal_id: string;
    lead_id: string;
    business: string;
    due_at: string;
  }[];
  alerts: { deal_id: string; business: string; message: string }[];
};
export function CallPanel({
  data,
  compact = false,
  onLeadChange,
}: {
  data: TeamSnapshot;
  compact?: boolean;
  onLeadChange?: (id: string) => void;
}) {
  const [state, setState] = useState<Live | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [stale, setStale] = useState(false);
  const callback = useRef(onLeadChange);
  useEffect(() => {
    callback.current = onLeadChange;
  }, [onLeadChange]);
  const generation = useRef(0);
  async function refresh(signal?: AbortSignal) {
    const version = generation.current;
    const r = await fetch("/team/api/call-state", {
      cache: "no-store",
      signal,
    });
    const v = await r.json();
    if (!r.ok) throw Error(v.error || "Unable to sync.");
    if (version !== generation.current) return;
    setState(v);
    setStale(false);
    if (v.lead) callback.current?.(v.lead.id);
  }
  useEffect(() => {
    if (data.readonly) return;
    let stopped = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        await refresh(controller.signal);
      } catch {
        if (!stopped) setStale(true);
      } finally {
        if (!stopped) timer = setTimeout(poll, 1500);
      }
    }
    void poll();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [data.readonly]);
  async function act(action: string, body: object) {
    generation.current++;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/team/api/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const v = await r.json();
      if (!r.ok) throw Error(v.error);
      await refresh();
      setMessage("Saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const lead = state?.lead,
    deal = state?.deal;
  const paid = deal && ["Client paid", "Delivered"].includes(deal.stage);
  const available = Boolean(
    deal &&
      quotePaymentLink(deal) &&
      state?.page &&
      new Date(state.page.expires_at) > new Date() &&
      !lead?.opted_out,
  );
  const url = available
    ? `https://koinophobialabs.com/go/${state!.page!.code}`
    : "";
  const cell = state?.details?.cell || "";
  const text =
    lead && deal && url
      ? dealText(lead, state!.problem || "the agreed website issue", deal, url)
      : "";
  const ios =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent);
  const sms = smsLink(cell, text, ios),
    tel = lead ? phoneNumber(lead.phone) : null;
  const disabled = busy || data.readonly || stale;
  return (
    <section
      className={"team-card call-panel" + (compact ? " call-companion" : "")}
    >
      <div className="team-card-kicker">
        {compact ? "PHONE COMPANION" : "CALL MODE"}
        <span className="team-tag">
          {stale
            ? "RECONNECTING"
            : data.readonly
              ? "READ-ONLY PREVIEW"
              : "SYNCED TO YOUR ACCOUNT"}
        </span>
      </div>
      <label>
        Current lead
        <select
          aria-label="Current call lead"
          value={lead?.id || ""}
          disabled={disabled}
          onChange={(e) => void act("active-lead", { id: e.target.value })}
        >
          <option value="">Choose a lead</option>
          {data.leads
            .filter((l) => !l.opted_out)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.business}
              </option>
            ))}
        </select>
      </label>
      {data.readonly ? (
        <p>Call sync uses your signed-in account. This preview is read-only.</p>
      ) : !state ? (
        <p role="status">Connecting to your call screen…</p>
      ) : !lead ? (
        <p>Open a lead on your computer, or choose one above.</p>
      ) : (
        <>
          <h2>{lead.business}</h2>
          <p>
            {[lead.city, lead.state].filter(Boolean).join(", ")}
            {lead.time_zone ? ` · ${lead.time_zone}` : ""}
          </p>
          <div
            className={"call-payment-status" + (paid ? " is-paid" : "")}
            role="status"
          >
            {paid
              ? `Paid ✅ — your ${money(state.commission)} is on its way`
              : deal?.stage === "Lost"
                ? "Closed — not interested"
                : state.page && new Date(state.page.expires_at) <= new Date()
                  ? "Link expired"
                  : state.page?.checkout_started_at
                    ? "Checkout started"
                    : state.page?.opened_at
                      ? "Opened"
                      : state.page
                        ? "Ready to share"
                        : "No deal page yet"}
          </div>
          {stale && (
            <p role="alert">
              Connection lost. Payment status may be out of date. Reconnecting…
            </p>
          )}
          {lead.opted_out ? (
            <p role="alert">Do not contact. This lead has opted out.</p>
          ) : (
            <>
              <div className="call-primary-actions">
                {tel && !stale ? (
                  <a className="team-button" href={`tel:${tel}`}>
                    Call
                  </a>
                ) : (
                  <span>No callable business number</span>
                )}
                {sms && url && !stale ? (
                  <a className="team-button" href={sms}>
                    Text link
                  </a>
                ) : (
                  <button disabled>Text link</button>
                )}
              </div>
              <CellEditor
                key={lead.id + cell}
                initial={cell}
                disabled={disabled}
                save={(value) => act("call-cell", { id: lead.id, cell: value })}
              />
              {!cell && (
                <small>
                  Save the client’s cell to enable Text link. The business phone
                  may be a landline.
                </small>
              )}
              {paid ? (
                <p>
                  Payment received. Blake has been alerted to start the work.
                </p>
              ) : deal?.stage === "Lost" ? (
                <p>This deal is closed. Its payment page is unavailable.</p>
              ) : url ? (
                <div className="call-link">
                  <a href={url} target="_blank" rel="noreferrer">
                    {url.replace("https://", "")}
                  </a>
                  <button
                    className="text-button"
                    disabled={stale}
                    onClick={() =>
                      void navigator.clipboard.writeText(url).then(
                        () => setMessage("Link copied."),
                        () => setMessage("Select the link above to copy it."),
                      )
                    }
                  >
                    Copy link
                  </button>
                </div>
              ) : deal && quotePaymentLink(deal) && !state.page ? (
                <ProofReview
                  key={lead.id}
                  leadId={lead.id}
                  disabled={disabled || !state.problem}
                  create={() =>
                    act("deal-page", { id: deal.id, proofReviewed: true })
                  }
                />
              ) : (
                <p>
                  <Link href="/team/quote">Create a quote</Link> and have Blake
                  approve a catalog offer to share a payment page.
                </p>
              )}
              {text && (
                <details>
                  <summary>Text message preview</summary>
                  <p>{text}</p>
                  <small>
                    Messages opens on your phone. You choose when to send.
                  </small>
                </details>
              )}
              <details open={!compact}>
                <summary>Call script · confirmed problem</summary>
                <p className="call-script">{state.script}</p>
              </details>
              <div className="call-outcomes" aria-label="Call outcomes">
                {CALL_OUTCOMES.map((outcome) => (
                  <button
                    className="team-button secondary"
                    key={outcome}
                    disabled={disabled || Boolean(paid)}
                    onClick={() =>
                      void act("call-outcome", { id: lead.id, outcome })
                    }
                  >
                    {outcome}
                  </button>
                ))}
              </div>
              <small>
                {state.details?.outcome
                  ? `Last outcome: ${state.details.outcome}. `
                  : ""}
                {state.details?.follow_up_at
                  ? `Follow up: ${new Date(state.details.follow_up_at).toLocaleString()}`
                  : ""}
              </small>
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
      {!!state?.followups.length && (
        <div className="team-inset">
          <h3>Follow up today</h3>
          {state.followups.map((f) => (
            <p key={f.deal_id}>
              <button
                className="text-button"
                onClick={() => void act("active-lead", { id: f.lead_id })}
              >
                {f.business}
              </button>{" "}
              · Opened or started checkout over two hours ago.
            </p>
          ))}
        </div>
      )}
      {!!state?.alerts.length && (
        <div className="team-inset">
          <h3>New client — start the work</h3>
          {state.alerts.map((a) => (
            <p key={a.deal_id}>
              {a.business} · <Link href="/team/pipeline">View paid deal</Link>
            </p>
          ))}
        </div>
      )}
      {compact ? (
        <Link href="/team/leads">Back to leads</Link>
      ) : (
        <Link href="/team/call">Open the phone companion →</Link>
      )}
    </section>
  );
}
function CellEditor({
  initial,
  disabled,
  save,
}: {
  initial: string;
  disabled: boolean;
  save: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className="call-cell"
      onSubmit={(e) => {
        e.preventDefault();
        void save(value);
      }}
    >
      <label>
        Client’s cell
        <input
          aria-label="Client’s cell"
          type="tel"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="(312) 555-0123"
        />
      </label>
      <button disabled={disabled || value === initial}>Save cell</button>
    </form>
  );
}

function ProofReview({
  leadId,
  disabled,
  create,
}: {
  leadId: string;
  disabled: boolean;
  create: () => Promise<void>;
}) {
  const [reviewed, setReviewed] = useState(false);
  return (
    <div className="call-proof-review">
      <details>
        <summary>Review screenshot proof</summary>
        {!disabled && (
          <Image
            unoptimized
            width={1280}
            height={900}
            className="deal-proof"
            src={"/team/api/call-proof?lead=" + encodeURIComponent(leadId)}
            alt="Screenshot to review before sharing publicly"
          />
        )}
      </details>
      <label className="call-proof-check">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        I reviewed the proof: only the business, website and problem are
        visible, with no personal contact details.
      </label>
      <button disabled={disabled || !reviewed} onClick={() => void create()}>
        Create deal page
      </button>
    </div>
  );
}
