import type Stripe from "stripe";
import { createCheckout, paymentDatabase, stripe, type Queryable } from "@/lib/payments";
import { offers, type ServiceOffer } from "./services-config";

export async function createOfferCheckout(offer: ServiceOffer, input: { source: string; email: string }, origin: string, q: Queryable = paymentDatabase(), client = stripe()) {
  const config = offers[offer];
  const leadId = crypto.randomUUID(), proposalId = crypto.randomUUID();
  // One statement creates both records atomically. Only columns from migrations
  // 001, 002 and 006 are used; no dependency on unapplied migration 009.
  // Empty required text fields mean not supplied, never invented buyer data.
  await q.query(`with lead as (
    insert into crm_leads (id,dedupe_key,source,name,business_name,email,website_or_social,industry,service_interest,timeline,biggest_problem)
    values ($1,$2,$3,'','',$4,'','',$5,'','') returning id
  ) insert into crm_proposals (id,lead_id,status,version,title,executive_summary,recommended_solution,timeline,subtotal,total,payment_terms,revision_policy,next_steps)
    select $6,id,'accepted',1,$7,$7,$7,$8,$9,$9,$10,'',$11 from lead`,
  [leadId, `${offer === "revenue_leak_audit" ? "audit" : offer}-checkout:${leadId}`, input.source, input.email, offer, proposalId, config.name, config.timeline, config.amount, config.terms, config.next]);
  return createCheckout(proposalId, { kind: "balance" }, origin, q, client, {
    productName: config.name, collectName: true, offer, mode: config.mode,
    successPath: `${config.path}/paid?session_id={CHECKOUT_SESSION_ID}`,
    cancelPath: `${offer === "revenue_leak_audit" ? "/audit" : "/services"}?${new URLSearchParams({ src: input.source })}`,
  });
}

export type VerifiedOfferPayment = { session: Stripe.Checkout.Session; leadId: string; source: string };
export async function verifyOfferPayment(offer: ServiceOffer, sessionId: string | undefined, q?: Queryable, client?: Stripe): Promise<VerifiedOfferPayment | null> {
  const config = offers[offer];
  if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId)) return null;
  try {
    const session = await (client ?? stripe()).checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.mode !== config.mode || session.amount_total !== config.amount || session.currency !== "usd" || session.metadata?.offer !== offer || !session.metadata.paymentId) return null;
    const result = await (q ?? paymentDatabase()).query(`select p.lead_id,l.source from crm_payments p join crm_leads l on l.id=p.lead_id
      where p.id=$1 and p.stripe_checkout_session_id=$2 and p.amount=$4 and p.currency='usd' and p.status<>'refunded' and l.service_interest=$3`,
    [session.metadata.paymentId, session.id, offer, config.amount]);
    const row = result.rows[0];
    if (!row) return null;
    return { session, leadId: row.lead_id, source: row.source };
  } catch { return null; }
}

