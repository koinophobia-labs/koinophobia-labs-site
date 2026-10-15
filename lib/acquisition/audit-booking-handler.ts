import { NextRequest, NextResponse } from "next/server";
import { AUDIT_SESSION_COOKIE, auditBookingInput, saveAuditBooking, verifyAuditPayment } from "./audit-checkout";
import { sendLeadEmail } from "./intake";

const dependencies = { verify: verifyAuditPayment, save: saveAuditBooking, email: sendLeadEmail };
// Called only after the existing intake origin, rate-limit and honeypot checks.
export async function handleAuditBooking(request: NextRequest, form: FormData, requestId: string, deps = dependencies) {
  const respond = (body: object, status = 200) => NextResponse.json({ ...body, requestId }, { status, headers: { "cache-control": "no-store" } });
  const payment = await deps.verify(request.cookies.get(AUDIT_SESSION_COOKIE)?.value);
  if (!payment) return respond({ ok: false, message: "We couldn't confirm a payment. Open the confirmation in the browser you used to pay, or contact Blake." }, 422);
  const parsed = auditBookingInput(form, payment);
  if (!parsed.input) return respond({ ok: false, message: "Please check your business and preferred times.", errors: parsed.errors }, 422);
  try {
    const saved = await deps.save(payment, parsed.input);
    const delivery = saved.created ? await deps.email(parsed.input, payment.leadId) : { ok: true };
    return respond({ ok: true, emailSent: delivery.ok, message: "Your preferred times are recorded. Blake will confirm your call within one business day." });
  } catch { return respond({ ok: false, message: "We could not safely record your preferred times. Please try again." }, 503); }
}
