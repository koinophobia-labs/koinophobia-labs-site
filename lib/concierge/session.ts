import { serviceTypes, type ConciergeDraft } from "@/lib/concierge/types";
import { validSessionId } from "@/lib/concierge/validation";

export const CONCIERGE_STORAGE_KEY = "koinophobia:project-concierge:v1";
export const CONCIERGE_LEGACY_MIGRATION_KEY = "koinophobia:project-concierge:legacy-cleared:v1";
export const CONCIERGE_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type ConciergeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

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

/**
 * Older builds stored drafts in origin-wide localStorage. Those records have
 * no verifiable tab owner, so they are removed instead of being assigned to a
 * later visitor using the same browser profile.
 */
export function clearUnownedLegacyConciergeDraft(legacyStorage: ConciergeStorage): boolean {
  try {
    const removed = legacyStorage.getItem(CONCIERGE_STORAGE_KEY) !== null;
    legacyStorage.removeItem(CONCIERGE_STORAGE_KEY);
    legacyStorage.setItem(CONCIERGE_LEGACY_MIGRATION_KEY, "1");
    return removed;
  } catch {
    return false;
  }
}

export function loadConciergeDraft(
  sessionStorage: ConciergeStorage,
  legacyStorage?: ConciergeStorage,
  now = Date.now(),
): ConciergeDraft | null {
  if (legacyStorage) clearUnownedLegacyConciergeDraft(legacyStorage);
  try {
    const raw = sessionStorage.getItem(CONCIERGE_STORAGE_KEY);
    const draft = parseConciergeDraft(raw, now);
    if (!draft && raw !== null) sessionStorage.removeItem(CONCIERGE_STORAGE_KEY);
    return draft;
  } catch {
    return null;
  }
}

export function loadConciergeDraftForSession(
  sessionStorage: ConciergeStorage,
  requestedSessionId: string,
  legacyStorage?: ConciergeStorage,
  now = Date.now(),
): ConciergeDraft | null {
  const draft = loadConciergeDraft(sessionStorage, legacyStorage, now);
  return draft?.sessionId === requestedSessionId ? draft : null;
}

export function saveConciergeDraft(sessionStorage: ConciergeStorage, draft: ConciergeDraft): boolean {
  try {
    sessionStorage.setItem(CONCIERGE_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearConciergeDraft(sessionStorage: ConciergeStorage): void {
  try {
    sessionStorage.removeItem(CONCIERGE_STORAGE_KEY);
  } catch {
    // Draft cleanup is best-effort when browser storage is unavailable.
  }
}
