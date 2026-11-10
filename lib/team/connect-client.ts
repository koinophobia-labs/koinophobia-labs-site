import Stripe from "stripe";
export const connectEnabled = () =>
  process.env.STRIPE_CONNECT_ENABLED === "true";
export function connectMode() {
  const mode = process.env.STRIPE_CONNECT_MODE || "test";
  if (
    mode !== "test" &&
    !(mode === "live" && process.env.VERCEL_ENV === "production")
  )
    throw Error("CONNECT_MODE_REFUSED");
  return mode;
}
export function connectStripe() {
  if (process.env.VERCEL_ENV === "preview")
    throw Error("CONNECT_PREVIEW_DISABLED");
  const key = process.env.STRIPE_SECRET_KEY || "";
  const mode = connectMode();
  // Default is test. Live requires both an explicit owner-set mode and a
  // production runtime; previews are always disabled. No flag is set by builds.
  if (!connectEnabled() || !new RegExp(`^(sk|rk)_${mode}_`).test(key))
    throw Error("CONNECT_TEST_KEY_OR_EXPLICIT_PRODUCTION_MODE_REQUIRED");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}
export function assertConnectMode(object: { livemode: boolean }) {
  if (object.livemode !== (connectMode() === "live"))
    throw Error("CONNECT_LIVE_EVENT_OR_MODE_MISMATCH");
}
export const testEvent = (event: Stripe.Event) => assertConnectMode(event);
