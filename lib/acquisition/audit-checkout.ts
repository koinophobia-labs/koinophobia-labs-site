import type Stripe from "stripe";
import { createOfferCheckout, verifyOfferPayment, type VerifiedOfferPayment } from "./service-checkout";
import { paymentDatabase, type Queryable } from "@/lib/payments";
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

// Compatibility exports keep the audit route and booking flow unchanged.
export const createAuditCheckout = (input: { source: string; email: string }, origin: string, q?: Queryable, client?: Stripe) => createOfferCheckout(AUDIT_OFFER, input, origin, q, client);
export type VerifiedAuditPayment = VerifiedOfferPayment;
export const verifyAuditPayment = (sessionId: string | undefined, q?: Queryable, client?: Stripe) => verifyOfferPayment(AUDIT_OFFER, sessionId, q, client);

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
