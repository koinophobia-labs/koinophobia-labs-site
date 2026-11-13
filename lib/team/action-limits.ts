import type { Queryable } from "../payments";
import { rateLimit } from "./auth";
import { Fault } from "./domain";

const actions = new Set([
  "time-zone", "password", "password-prompt-dismiss", "connect-onboard", "connect-dashboard",
  "connect-retry", "connect-refresh", "check", "recheck-import", "prepare-call",
  "call-offer", "active-lead", "call-cell", "call-outcome", "deal-page", "invite",
  "import", "optout", "quote", "deal", "payout", "settings", "deactivate",
]);

export function actionBucket(action: string) {
  if (action === "prepare-call") return { prefix: "prepare-call:", limit: 300 };
  // A different action exhausting its allowance must not strand a caller.
  if (action === "active-lead" || action === "call-outcome")
    return { prefix: action + ":", limit: 600 };
  return { prefix: "action:", limit: 600 };
}

export async function actionRateLimit(q: Queryable, partnerId: string, action: string) {
  // Old tabs can keep requesting a removed endpoint after a rollback. A 404
  // must not consume the caller's allowance for supported actions.
  if (!actions.has(action)) throw new Fault("Not found.", 404);
  const bucket = actionBucket(action);
  await rateLimit(q, bucket.prefix + partnerId, bucket.limit);
}
