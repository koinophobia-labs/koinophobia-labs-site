import type Stripe from "stripe";
import type { Queryable } from "../../lib/payments";

/** Shared CRM/Stripe fixture for the proposal and public audit checkout flows. */
export function paymentFixture(total = 100000) {
  const now = new Date();
  const state = {
    leadId: "l1", proposalId: "p1", source: "audit", email: "client@example.com", title: "Website build", total,
    payment: undefined as Record<string, unknown> | undefined,
    sessionInput: undefined as Stripe.Checkout.SessionCreateParams | undefined,
    options: undefined as Stripe.RequestOptions | undefined,
    queries: [] as { sql: string; values: unknown[] }[], events: new Set<string>(), processed: new Set<string>(),
  };
  const q: Queryable = { query: async (sql, values = []) => {
    state.queries.push({ sql, values });
    if (sql.startsWith("with lead")) {
      [state.leadId, , state.source, state.email, , state.proposalId] = values as string[];
      state.title = String(values[6]); state.total = Number(values[8]);
    }
    if (sql.startsWith("select p.id")) return { rows: [{ proposal_id: state.proposalId, lead_id: state.leadId, proposal_status: "accepted", proposal_title: state.title, total: state.total, amount_paid: 0, business_name: "", email: state.email }] };
    if (sql.startsWith("insert into crm_payments")) state.payment = { id: values[0], proposal_id: values[1], lead_id: values[2], kind: values[3], amount: values[4], currency: "usd", status: "pending", created_at: now, updated_at: now };
    if (sql.startsWith("update crm_payments set stripe")) { Object.assign(state.payment!, { stripe_checkout_session_id: values[0], checkout_url: values[1] }); return { rows: [state.payment!] }; }
    if (sql.startsWith("select * from crm_payments")) return { rows: sql.includes("where id=$1") && state.payment ? [state.payment] : [] };
    if (sql.startsWith("select coalesce")) return { rows: [{ paid: state.payment?.status === "paid" ? state.payment.amount : 0, pending: state.payment?.status === "pending", balance_pending: state.payment?.kind === "balance" && state.payment.status === "pending", refunded: false }] };
    if (sql.startsWith("select total")) return { rows: [{ total: state.total }] };
    if (sql.startsWith("select processed_at")) return { rows: [{ processed_at: state.processed.has(String(values[0])) ? now : null }] };
    if (sql.startsWith("update stripe_webhook_events set processed_at=now()")) state.processed.add(String(values[0]));
    if (sql.startsWith("insert into stripe_webhook_events")) {
      const id = String(values[0]); if (state.events.has(id)) return { rows: [] };
      state.events.add(id); return { rows: [{ event_id: id }] };
    }
    if (sql.startsWith("update crm_payments set status='paid'")) { state.payment!.status = "paid"; return { rows: [{ id: state.payment!.id }] }; }
    if (sql.startsWith("select p.lead_id")) return { rows: state.payment && state.payment.id === values[0] && state.payment.stripe_checkout_session_id === values[1] ? [{ lead_id: state.leadId, source: state.source }] : [] };
    return { rows: [] };
  } };
  const client = { checkout: { sessions: { create: async (input: Stripe.Checkout.SessionCreateParams, options: Stripe.RequestOptions) => {
    state.sessionInput = input; state.options = options;
    return { id: "cs_test_fixture12345678", url: "https://checkout.stripe.com/c/pay/cs_test_fixture12345678" };
  } } } } as unknown as Stripe;
  return { state, q, client };
}
