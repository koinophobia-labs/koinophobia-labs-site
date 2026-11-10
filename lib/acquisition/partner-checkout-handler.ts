import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { consumeAuditRateLimit } from "@/lib/audits";
import { stripe } from "@/lib/payments";
import { isTrustedMutationRequest } from "@/lib/security/origin";
import { trustedClientKey } from "./intake-abuse";
import { auditCheckoutAvailable } from "./audit-checkout";
import { createOfferCheckout } from "./service-checkout";
import { isPartnerOffer, parsePartnerAttribution } from "./partner-offers";

// Read back Stripe's persisted session; never expose customer details or secrets.
export async function checkoutReadback(id: string) {
  const session = await stripe().checkout.sessions.retrieve(id, { expand: ["line_items"] });
  return {
    id: session.id, livemode: session.livemode, amount_total: session.amount_total,
    currency: session.currency, mode: session.mode, metadata: session.metadata,
    payment_status: session.payment_status, status: session.status,
    recurring: session.line_items?.data[0]?.price?.recurring ?? null,
  };
}
const dependencies = { available: auditCheckoutAvailable, create: createOfferCheckout, limit: consumeAuditRateLimit, readback: checkoutReadback };
export function partnerCheckoutHandler(deps = dependencies) {
  return async (request: NextRequest, context: { params: Promise<{ offer: string }> }) => {
    const headers = { "cache-control": "no-store", "referrer-policy": "no-referrer" };
    const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status, headers });
    const { offer } = await context.params;
    if (!isPartnerOffer(offer)) return fail("Unknown offer.", 404);
    const attribution = parsePartnerAttribution(request.nextUrl.searchParams);
    if (!attribution) return fail("Invalid payment link. Ask your partner for a new link.", 422);
    if (!isTrustedMutationRequest(request)) return fail("The request origin was rejected.", 403);
    if (!deps.available()) return fail("Checkout is temporarily unavailable. Contact blake@koinophobialabs.com.", 503);
    try {
      const actorKey = `partner-checkout:${createHash("sha256").update(trustedClientKey(request)).digest("hex").slice(0, 32)}`;
      if (!(await deps.limit({ actorKey, limit: 5, windowSeconds: 600 })).allowed) return fail("Too many attempts. Please wait 10 minutes.", 429);
      // The request body is intentionally unused: prices and modes are server-owned.
      const payment = await deps.create(offer, { source: "partner-payment", email: "", attribution }, request.nextUrl.origin);
      if (!payment.checkoutUrl || !payment.stripeCheckoutSessionId) throw Error("CHECKOUT_UNAVAILABLE");
      if (request.headers.get("accept")?.includes("application/json")) {
        return NextResponse.json({ url: payment.checkoutUrl, checkout: await deps.readback(payment.stripeCheckoutSessionId) }, { headers });
      }
      return new NextResponse(null, { status: 303, headers: { ...headers, location: payment.checkoutUrl } });
    } catch {
      console.error(JSON.stringify({ scope: "partner-checkout", event: "checkout_unavailable" }));
      return fail("We could not open checkout. Please try again later or contact blake@koinophobialabs.com.", 503);
    }
  };
}
