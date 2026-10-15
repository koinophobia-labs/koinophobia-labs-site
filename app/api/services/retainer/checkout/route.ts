import { auditCheckoutHandler } from "@/lib/acquisition/audit-checkout-handler";
import { auditCheckoutAvailable } from "@/lib/acquisition/audit-checkout";
import { createOfferCheckout } from "@/lib/acquisition/service-checkout";
import { consumeAuditRateLimit } from "@/lib/audits";
export const runtime = "nodejs";
export const POST = auditCheckoutHandler({ available: auditCheckoutAvailable, limit: consumeAuditRateLimit, create: (input, origin) => createOfferCheckout("monthly_support", input, origin) }, "monthly_support");
