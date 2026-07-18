import type { ConciergeEvaluationResponse } from "@/lib/concierge/types";

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const evaluations = new Map<string, { expiresAt: number; response: ConciergeEvaluationResponse }>();
export const CONCIERGE_RATE_WINDOW_MS = 10 * 60 * 1000;
export const CONCIERGE_RATE_MAX = 12;
const CACHE_TTL_MS = 10 * 60 * 1000;

export function checkConciergeRateLimit(key: string, now = Date.now()) {
  const existing = rateLimits.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + CONCIERGE_RATE_WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > CONCIERGE_RATE_MAX;
}

export function resetConciergeApiStateForTests() {
  rateLimits.clear();
  evaluations.clear();
}

export function getCachedConciergeEvaluation(key: string, now = Date.now()) {
  const cached = evaluations.get(key);
  return cached && cached.expiresAt > now ? cached.response : undefined;
}

export function cacheConciergeEvaluation(key: string, response: ConciergeEvaluationResponse, now = Date.now()) {
  evaluations.set(key, { expiresAt: now + CACHE_TTL_MS, response });
  if (evaluations.size > 500) {
    for (const [cachedKey, value] of evaluations) if (value.expiresAt <= now) evaluations.delete(cachedKey);
  }
}
