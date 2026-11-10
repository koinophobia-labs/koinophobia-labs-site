import type { Partner } from "./types";
import {
  earned,
  paid,
  owed,
  debt,
  type ConnectPayment,
  type ConnectSnapshot,
} from "./connect";
export function connectPreview(actor: Partner): ConnectSnapshot {
  const base: ConnectPayment = {
    payment_id: "fake-payment-1",
    partner_id: "demo-a",
    deal_id: "deal-0",
    amount: 29900,
    currency: "usd",
    source_type: "checkout",
    source_id: "fake-checkout",
    charge_id: "fake-charge",
    transfer_id: "fake-transfer",
    transferred: 11960,
    reversed: 2392,
    offset_in: 0,
    offset_out: 0,
    loss: 14950,
    settled: true,
    error: null,
  };
  const rows = [
    base,
    {
      ...base,
      payment_id: "fake-payment-2",
      deal_id: "deal-1",
      amount: 9900,
      source_type: "invoice" as const,
      source_id: "fake-invoice",
      charge_id: "fake-charge-2",
      transfer_id: "fake-transfer-2",
      transferred: 3724,
      reversed: 0,
      offset_in: 236,
      offset_out: 0,
      loss: 0,
    },
    {
      ...base,
      payment_id: "fake-payment-3",
      partner_id: "demo-b",
      deal_id: "deal-3",
      transfer_id: null,
      transferred: 0,
      reversed: 0,
      loss: 0,
      settled: false,
    },
  ];
  rows[0].offset_out = 236;
  const payments = rows
    .filter((p) => actor.role === "owner" || p.partner_id === actor.id)
    .map((p) => ({
      ...p,
      earned: earned(p),
      paid: paid(p),
      owed: owed(p),
      owed_back: debt(p),
    }));
  return {
    accounts:
      actor.role === "owner" || actor.id === "demo-a"
        ? [
            {
              partner_id: "demo-a",
              stripe_account_id: "fake-connected-account",
              details_submitted: true,
              payouts_enabled: true,
              charges_enabled: false,
            },
          ]
        : [],
    payments,
    operations: payments.flatMap((p) =>
      p.transfer_id
        ? [
            {
              id: p.payment_id + "-transfer",
              payment_id: p.payment_id,
              kind: "transfer",
              status: "done",
              stripe_id: p.transfer_id,
              amount: p.transferred,
              created_at: "2026-11-10T12:00:00Z",
            },
            ...(p.reversed
              ? [
                  {
                    id: p.payment_id + "-reversal",
                    payment_id: p.payment_id,
                    kind: "reversal",
                    status: "done",
                    stripe_id: "fake-reversal",
                    amount: p.reversed,
                    created_at: "2026-11-10T13:00:00Z",
                  },
                  {
                    id: p.payment_id + "-failed",
                    payment_id: p.payment_id,
                    kind: "reversal",
                    status: "insufficient",
                    stripe_id: null,
                    amount: 3588,
                    created_at: "2026-11-10T14:00:00Z",
                  },
                ]
              : []),
          ]
        : [],
    ),
  };
}
