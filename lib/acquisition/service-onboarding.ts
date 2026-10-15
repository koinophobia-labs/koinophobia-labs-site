import { NextRequest, NextResponse } from "next/server";
import { verifyOfferPayment } from "./service-checkout";
import { saveAuditBooking } from "./audit-checkout";
import { serviceSessionCookie, type NewServiceOffer } from "./services-config";
import { redactLeadFreeText } from "./leads";
import { sendLeadEmail } from "./intake";
const dependencies = { verify: verifyOfferPayment, save: saveAuditBooking, email: sendLeadEmail };
// Shared intake route has already checked origin, honeypot and rate limit.
export async function handleServiceOnboarding(request: NextRequest, form: FormData, offer: NewServiceOffer, deps = dependencies) {
  const respond = (message: string, status = 200) => NextResponse.json({ ok: status === 200, message }, { status, headers: { "cache-control": "no-store" } });
  const value = (key: string) => String(form.get(key) || "").trim();
  const submitted = form.get("session_id");
  const payment = await deps.verify(offer, typeof submitted === "string" ? submitted : request.cookies.get(serviceSessionCookie(offer))?.value);
  if (!payment) return respond("We couldn't confirm a payment. Open the confirmation from checkout and try again.", 422);
  const businessName = value("businessName"), details = value("details"), specLink = value("specLink"), accessContacts = value("accessContacts");
  if (!businessName || businessName.length > 160 || !details || details.length > 3000) return respond("Enter your business or project name and a short description (up to 3000 characters).", 422);
  if (offer === "straight_answer") {
    try { const url = new URL(specLink); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || specLink.length > 2000) throw Error(); }
    catch { return respond("Enter a valid HTTP or HTTPS link to your PRD or spec.", 422); }
  } else if (!accessContacts || accessContacts.length > 2000) return respond("Add access contacts (up to 2000 characters).", 422);
  const session = payment.session, email = session.customer_details?.email || session.customer_email || "";
  if (!email) return respond("We couldn't retrieve your email from Stripe. Please contact Blake through the contact form.", 422);
  const input = redactLeadFreeText({ name: session.custom_fields?.find(field => field.key === "buyer_name")?.text?.value || session.customer_details?.name || "", email, businessName, biggestProblem: details, websiteOrSocial: specLink, industry: "", timeline: "", serviceInterest: offer, source: payment.source, notes: `Offer: ${offer}\nPaid: true (verified with Stripe)\nCheckout Session: ${session.id}\n${offer === "straight_answer" ? `PRD/spec: ${specLink}` : `Access contacts: ${accessContacts}`}\nDetails: ${details}` });
  try {
    const saved = await deps.save(payment, input);
    if (saved.created) await deps.email(input, payment.leadId);
    return respond("Your details are recorded for Blake.");
  } catch { return respond("We could not safely record your details. Please try again.", 503); }
}
