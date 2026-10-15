import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { consumeAuditRateLimit } from "@/lib/audits";
import { isTrustedMutationRequest } from "@/lib/security/origin";
import { trustedClientKey } from "@/lib/acquisition/intake-abuse";
import { auditCheckoutAvailable, createAuditCheckout, parseAuditCheckout } from "./audit-checkout";

import { serviceSessionCookie, type ServiceOffer } from "./services-config";

const dependencies = { available: auditCheckoutAvailable, create: createAuditCheckout, limit: consumeAuditRateLimit };
export function auditCheckoutHandler(deps = dependencies, offer: ServiceOffer = "revenue_leak_audit") {
  return async (request: NextRequest) => {
    const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status, headers: { "cache-control": "no-store" } });
    if (!isTrustedMutationRequest(request)) return fail("The request origin was rejected.", 403);
    if (!deps.available()) return fail("Payment is temporarily unavailable. Please try again later or ask Blake a question.", 503);
    try {
      // Fail closed if the shared, durable limiter is unavailable.
      const actorKey = `audit-checkout:${createHash("sha256").update(trustedClientKey(request)).digest("hex").slice(0, 32)}`;
      const limit = await deps.limit({ actorKey, limit: 5, windowSeconds: 600 });
      if (!limit.allowed) return fail("Too many attempts. Please wait 10 minutes and try again.", 429);
      if (Number(request.headers.get("content-length") || 0) > 4096) return fail("The request is too large.", 413);
      const body = await request.text();
      if (body.length > 4096) return fail("The request is too large.", 413);
      let raw: unknown;
      try { raw = JSON.parse(body); } catch { return fail("The request format was invalid.", 400); }
      const input = parseAuditCheckout(raw);
      if (!input) return fail("Check the email and source and try again.", 422);
      const payment = await deps.create(input, request.nextUrl.origin);
      if (!payment.checkoutUrl || !payment.stripeCheckoutSessionId) throw Error("CHECKOUT_UNAVAILABLE");
      const response = NextResponse.json({ url: payment.checkoutUrl }, { headers: { "cache-control": "no-store" } });
      response.cookies.set(serviceSessionCookie(offer), payment.stripeCheckoutSessionId, {
        httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    } catch {
      console.error(JSON.stringify({ scope: "audit-checkout", event: "checkout_unavailable" }));
      return fail("We could not open checkout. Please try again later or ask Blake a question.", 503);
    }
  };
}
