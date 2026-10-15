import type Stripe from "stripe";
import type { Queryable } from "./payments";

// Runs inside processStripeEvent's pinned transaction. Semantic event keys also
// dedupe different Stripe event IDs for the same invoice or cancellation.
export async function recordSubscriptionEvent(event: Stripe.Event, q: Queryable) {
  if (event.type !== "invoice.paid" && event.type !== "customer.subscription.deleted") return;
  const invoice = event.type === "invoice.paid" ? event.data.object as Stripe.Invoice : null;
  const subscription = event.type === "customer.subscription.deleted" ? event.data.object as Stripe.Subscription : null;
  // Stripe SDK 18 uses parent.subscription_details; accept older webhook versions too.
  const legacy = invoice as (Stripe.Invoice & { subscription_details?: { metadata?: Stripe.Metadata }; subscription?: string | Stripe.Subscription }) | null;
  const details = invoice?.parent?.subscription_details;
  const metadata = subscription?.metadata ?? details?.metadata ?? legacy?.subscription_details?.metadata;
  if (metadata?.offer !== "monthly_support" || !metadata.paymentId) return;
  const reference = subscription?.id ?? details?.subscription ?? legacy?.subscription;
  const subscriptionId = typeof reference === "string" ? reference : reference?.id;
  if (!subscriptionId) throw Error("SUBSCRIPTION_REFERENCE_MISSING");
  const found = await q.query(`select p.* from crm_payments p join crm_leads l on l.id=p.lead_id
    where p.id=$1 and l.service_interest='monthly_support' for update of p`, [metadata.paymentId]);
  const initial = found.rows[0];
  if (!initial || initial.lead_id !== metadata.leadId || initial.proposal_id !== metadata.proposalId || initial.amount !== 50000 || initial.currency !== "usd") throw Error("SUBSCRIPTION_PAYMENT_MISMATCH");
  // Only renewal invoices add money. The initial invoice is represented by the
  // Checkout payment, regardless of which webhook is delivered first.
  if (invoice && invoice.billing_reason !== "subscription_cycle") return;
  if (invoice && (invoice.status !== "paid" || invoice.amount_paid !== 50000 || invoice.currency !== "usd")) throw Error("SUBSCRIPTION_INVOICE_MISMATCH");
  await q.query("select id from crm_leads where id=$1 for update", [initial.lead_id]);
  const key = invoice ? `retainer-invoice:${invoice.id}` : `retainer-cancelled:${subscriptionId}`;
  const reserved = await q.query(`insert into stripe_webhook_events(event_id,event_type) values($1,$2) on conflict do nothing returning event_id`, [key, event.type]);
  if (!reserved.rows[0]) return;
  if (invoice) {
    // Each month has its own invoice-sized proposal; do not overflow the original
    // proposal's amount_paid <= total constraint or re-charge its balance.
    const proposalId = crypto.randomUUID(), paymentId = crypto.randomUUID();
    await q.query(`insert into crm_proposals(id,lead_id,status,version,title,executive_summary,recommended_solution,timeline,pricing_model,subtotal,total,payment_terms,revision_policy,next_steps,internal_notes)
      select $1,$2,'accepted',coalesce(max(version),0)+1,'Monthly support retainer renewal','Monitoring, small fixes and a monthly check-in','Up to 5 hours; unused hours do not roll over','Monthly','retainer',50000,50000,'$500/month; cancel anytime, ends at period end','','', $3 from crm_proposals where lead_id=$2`, [proposalId, initial.lead_id, `Stripe invoice: ${invoice.id}; subscription: ${subscriptionId}`]);
    await q.query(`insert into crm_payments(id,proposal_id,lead_id,kind,amount,status,paid_at) values($1,$2,$3,'balance',50000,'paid',now())`, [paymentId, proposalId, initial.lead_id]);
    await q.query("update crm_proposals set amount_paid=50000,payment_status='paid',updated_at=now() where id=$1", [proposalId]);
    await q.query("update crm_leads set payment_status='paid',updated_at=now() where id=$1", [initial.lead_id]);
  }
  const history = invoice ? `Renewal paid: $500; invoice ${invoice.id}` : "Subscription cancelled (period ended)";
  await q.query("update crm_leads set internal_notes=concat_ws(E'\\n',nullif(internal_notes,''),$1::text),updated_at=now() where id=$2", [`${new Date(event.created * 1000).toISOString()} — ${history}; subscription ${subscriptionId}`, initial.lead_id]);
  await q.query("update stripe_webhook_events set processed_at=now() where event_id=$1", [key]);
}
