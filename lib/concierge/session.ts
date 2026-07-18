import { serviceTypes, type ConciergeDraft } from "@/lib/concierge/types";
import { validSessionId } from "@/lib/concierge/validation";

export const CONCIERGE_STORAGE_KEY = "koinophobia:project-concierge:v1";
export const CONCIERGE_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function parseConciergeDraft(raw: string | null, now = Date.now()): ConciergeDraft | null {
  if (!raw || raw.length > 30_000) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConciergeDraft>;
    if (value.version !== 1 || !value.sessionId || !validSessionId(value.sessionId)) return null;
    if (!Number.isFinite(value.savedAt) || Number(value.savedAt) > now + 60_000 || now - Number(value.savedAt) > CONCIERGE_DRAFT_TTL_MS) return null;
    if (!Number.isInteger(value.step) || Number(value.step) < 0 || Number(value.step) > 6) return null;
    if (!['questions', 'result'].includes(String(value.stage)) || !value.answers || typeof value.answers !== "object") return null;
    for (const answer of Object.values(value.answers)) if (typeof answer !== "string" || answer.length > 2200) return null;
    if (value.evaluation && (!value.evaluation.recommendation || !serviceTypes.includes(value.evaluation.recommendation.service))) return null;
    return value as ConciergeDraft;
  } catch {
    return null;
  }
}
