import type Stripe from "stripe";
import { createCheckout, paymentDatabase, stripe, type Queryable } from "@/lib/payments";
import { redactLeadFreeText, type LeadInput } from "@/lib/acquisition/leads";

export const AUDIT_AMOUNT = 25000;
export const AUDIT_OFFER = "revenue_leak_audit";
export const AUDIT_SESSION_COOKIE = "audit_checkout_session";
export const auditCheckoutAvailable = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.DATABASE_URL);

export function parseAuditCheckout(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if ((raw.src !== undefined && typeof raw.src !== "string") || (raw.email !== undefined && typeof raw.email !== "string")) return null;
  const source = (raw.src as string | undefined)?.trim() || "audit";
  const email = (raw.email as string | undefined)?.trim().toLowerCase() || "";
  if (source.length > 160 || /[\r\n\x00-\x1f]/.test(source) || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return null;
  return { source, email };
}

export async function createAuditCheckout(input: { source: string; email: string }, origin: string, q: Queryable = paymentDatabase(), client = stripe()) {
  const leadId = crypto.randomUUID(), proposalId = crypto.randomUUID();
  // One statement creates both records atomically. Only columns from migrations
  // 001, 002 and 006 are used; no dependency on unapplied migration 009.
  // Empty required text fields mean not supplied, never invented buyer data.
  await q.query(`with lead as (
    insert into crm_leads (id,dedupe_key,source,name,business_name,email,website_or_social,industry,service_interest,timeline,biggest_problem)
    values ($1,$2,$3,'','',$4,'','',$5,'','') returning id
  ) insert into crm_proposals (id,lead_id,status,version,title,executive_summary,recommended_solution,timeline,subtotal,total,payment_terms,revision_policy,next_steps)
    select $6,id,'accepted',1,'Revenue Leak Audit','Revenue Leak Audit','Revenue Leak Audit','Written plan within 7 days of the call',25000,25000,'$250 upfront','','Submit preferred call times after payment' from lead`,
  [leadId, `audit-checkout:${leadId}`, input.source, input.email, AUDIT_OFFER, proposalId]);
  return createCheckout(proposalId, { kind: "balance" }, origin, q, client, {
    productName: "Revenue Leak Audit", collectName: true, offer: AUDIT_OFFER,
    successPath: "/audit/paid?session_id={CHECKOUT_SESSION_ID}",
    cancelPath: `/audit?${new URLSearchParams({ src: input.source })}`,
  });
}

export type VerifiedAuditPayment = { session: Stripe.Checkout.Session; leadId: string; source: string };
export async function verifyAuditPayment(sessionId: string | undefined, q?: Queryable, client?: Stripe): Promise<VerifiedAuditPayment | null> {
  if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId)) return null;
  try {
    const session = await (client ?? stripe()).checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.mode !== "payment" || session.amount_total !== AUDIT_AMOUNT || session.currency !== "usd" || session.metadata?.offer !== AUDIT_OFFER || !session.metadata.paymentId) return null;
    const result = await (q ?? paymentDatabase()).query(`select p.lead_id,l.source from crm_payments p join crm_leads l on l.id=p.lead_id
      where p.id=$1 and p.stripe_checkout_session_id=$2 and p.amount=25000 and p.currency='usd' and p.status<>'refunded' and l.service_interest=$3`,
    [session.metadata.paymentId, session.id, AUDIT_OFFER]);
    const row = result.rows[0];
    if (!row) return null;
    return { session, leadId: row.lead_id, source: row.source };
  } catch { return null; }
}

export function auditBookingInput(form: FormData, payment: VerifiedAuditPayment): { input?: LeadInput; errors?: Record<string, string> } {
  const value = (key: string) => String(form.get(key) || "").trim();
  const businessName = value("businessName"), biggestProblem = value("biggestProblem");
  const times = [value("preferredTime1"), value("preferredTime2"), value("preferredTime3")];
  const errors: Record<string, string> = {};
  if (!businessName || businessName.length > 160) errors.businessName = "Enter a business name (up to 160 characters).";
  if (!biggestProblem || biggestProblem.length > 500) errors.biggestProblem = "Describe the problem in one line (up to 500 characters).";
  if (!times[0] || !times[1] || times.some(time => time.length > 160)) errors.preferredTimes = "Give 2–3 preferred dates and times, including your time zone.";
  if (Object.keys(errors).length) return { errors };
  const session = payment.session;
  const name = session.custom_fields?.find(field => field.key === "buyer_name")?.text?.value || session.customer_details?.name || "";
  const email = session.customer_details?.email || session.customer_email || "";
  if (!email) return { errors: { payment: "We could not retrieve your contact email from Stripe. Please contact Blake." } };
  return { input: redactLeadFreeText({ name, email, businessName, biggestProblem,
    websiteOrSocial: "", industry: "", serviceInterest: AUDIT_OFFER, timeline: times.filter(Boolean).join("\n"), source: payment.source,
    notes: `Offer: audit\nPaid: true (verified with Stripe)\nCheckout Session: ${session.id}\nPreferred call times:\n${times.filter(Boolean).join("\n")}`,
  }) };
}

export async function saveAuditBooking(payment: VerifiedAuditPayment, input: LeadInput, q: Queryable = paymentDatabase()) {
  // Keep the session in crm_payments and the verified handoff in existing notes.
  // First submission wins: a retry cannot overwrite a buyer's booking or resend mail.
  const result = await q.query(`update crm_leads set name=$1,email=$2,business_name=$3,biggest_problem=$4,timeline=$5,notes=$6,updated_at=now()
    where id=$7 and notes='' returning id`,
  [input.name, input.email, input.businessName, input.biggestProblem, input.timeline, input.notes, payment.leadId]);
  return { created: Boolean(result.rows[0]) };
}
