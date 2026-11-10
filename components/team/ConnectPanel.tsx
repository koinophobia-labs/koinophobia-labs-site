"use client";
import type { TeamSnapshot } from "@/lib/team/store";
import { money } from "@/lib/team/config";
export function ConnectPanel({
  data,
  busy,
  act,
}: {
  data: TeamSnapshot;
  busy: boolean;
  act: (action: string, body: object) => Promise<unknown>;
}) {
  const c = data.connect;
  if (!c) return null;
  const owner = data.me.role === "owner";
  const account = c.accounts.find((a) => a.partner_id === data.me.id);
  const disabled = busy || data.readonly;
  const title = (id: string) =>
    data.partners.find((p) => p.id === id)?.name || "Partner";
  return (
    <>
      <section className="team-card">
        <div className="team-section-title">
          <h2>
            {owner ? "Partner Stripe connections" : "Your Stripe connection"}
          </h2>
          <span className="team-tag">STRIPE EXPRESS</span>
        </div>
        {owner ? (
          <>
            {data.partners
              .filter((p) => p.role === "partner")
              .map((p) => {
                const a = c.accounts.find((x) => x.partner_id === p.id);
                return (
                  <p key={p.id}>
                    <strong>{p.name}</strong> ·{" "}
                    {a?.payouts_enabled && a.details_submitted
                      ? "Connected"
                      : a
                        ? "Onboarding incomplete"
                        : "Not connected"}
                  </p>
                );
              })}
            <button
              className="secondary"
              disabled={disabled}
              onClick={() => act("connect-retry", {})}
            >
              Retry owed transfers
            </button>
          </>
        ) : (
          <>
            <p>
              {account?.payouts_enabled && account.details_submitted
                ? "Connected · ready to receive commissions"
                : account
                  ? "Finish onboarding to receive your commissions."
                  : "Connect your Stripe to receive 40% automatically when clients pay."}
            </p>
            <div className="team-actions">
              <button
                disabled={disabled}
                onClick={() => act("connect-onboard", {})}
              >
                {account ? "Continue Stripe onboarding" : "Connect your Stripe"}
              </button>
              {account && (
                <button
                  className="secondary"
                  disabled={disabled}
                  onClick={() => act("connect-dashboard", {})}
                >
                  Open Stripe Express dashboard
                </button>
              )}
              {account && (
                <button
                  className="secondary"
                  disabled={disabled}
                  onClick={() => act("connect-refresh", {})}
                >
                  Refresh connection
                </button>
              )}
            </div>
          </>
        )}
        <p className="team-fine">
          Bank, debit card and tax details go directly to Stripe. A transfer
          credits your Stripe balance; bank arrival depends on availability and
          your payout schedule. Instant Payout is available in Stripe Express
          when eligible, with Stripe fees.
        </p>
        {data.fake && (
          <p className="team-fine">
            Fictional review data. Stripe actions are disabled in this preview.
          </p>
        )}
      </section>
      <div className="team-section-title">
        <h2>Transfers & balances</h2>
        <span className="team-tag">40% AT PAYMENT</span>
      </div>
      <div className="team-ledger">
        {c.payments.map((p) => (
          <section className="team-ledger-row" key={p.payment_id}>
            <div>
              <h3>
                {data.leads.find(
                  (l) =>
                    l.id ===
                    data.deals.find((d) => d.id === p.deal_id)?.lead_id,
                )?.business || "Client payment"}
              </h3>
              <small>
                {owner ? title(p.partner_id) + " · " : ""}
                {p.source_type === "invoice" ? "Care Plan renewal" : "Checkout"}
              </small>
              <p className="team-fine">
                {p.owed_back > 0
                  ? "Owed back"
                  : p.owed > 0
                    ? "Owed"
                    : p.offset_in > 0
                      ? "Settled with balance adjustment"
                      : "Paid out"}
              </p>
              {p.error && <p role="status">{p.error}</p>}
            </div>
            <div>
              <small>Earned after adjustments</small>
              <strong>{money(p.earned)}</strong>
            </div>
            <div>
              <small>Transferred</small>
              <strong>{money(p.transferred)}</strong>
            </div>
            <div>
              <small>Reversed</small>
              <strong>{money(p.reversed)}</strong>
            </div>
            <div>
              <small>{p.owed_back ? "Owed back" : "Owed"}</small>
              <strong>{money(p.owed_back ? -p.owed_back : p.owed)}</strong>
            </div>
            {(p.offset_in > 0 || p.offset_out > 0) && (
              <p className="team-fine" style={{ gridColumn: "1 / -1" }}>
                {money(p.offset_in)} applied to earlier debt ·{" "}
                {money(p.offset_out)} recovered from later earnings
              </p>
            )}
          </section>
        ))}
        {!c.payments.length && (
          <p>
            No automatic transfers yet. Eligible payments appear here after
            payment.
          </p>
        )}
      </div>
      <div className="team-section-title">
        <h2>Transfer & reversal history</h2>
      </div>
      {c.operations.map((o) => (
        <section className="team-ledger-row" key={o.id}>
          <div>
            <strong>
              {o.kind === "transfer" ? "Transfer" : "Reversal"} ·{" "}
              {money(Number(o.amount))}
            </strong>
            <p className="team-fine">
              {o.status === "insufficient"
                ? "Balance unavailable — owed back"
                : o.status === "review"
                  ? "Owner reconciliation required"
                  : o.status === "done"
                    ? "Completed"
                    : "Processing — retry pending"}
            </p>
          </div>
          <small style={{ gridColumn: "1 / -1" }}>
            {owner
              ? title(
                  c.payments.find((p) => p.payment_id === o.payment_id)
                    ?.partner_id || "",
                ) + " · "
              : ""}
            {String(
              o.stripe_id ||
                (o.status === "insufficient"
                  ? "Reversal declined"
                  : "Awaiting confirmation"),
            )}
          </small>
        </section>
      ))}
      <p className="team-fine">
        Refunds and disputes reduce earned commission. If a reversal cannot be
        funded, the owed-back balance reduces the next transfer. Pending or
        uncertain Stripe operations wait for reconciliation before further money
        moves.
      </p>
    </>
  );
}
