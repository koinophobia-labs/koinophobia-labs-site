/**
 * Front-office session persistence.
 *
 * sessionStorage on purpose (same decision the concierge made): tab-scoped,
 * survives refresh, dies with the tab, cannot follow a visitor across
 * unrelated visits or leak between browser profiles. Each host gets its own
 * key so the two assistants can never read each other's state — on top of
 * the fact that in production they live on different origins anyway.
 *
 * Everything read back is validated field-by-field; corrupt or expired state
 * degrades to "fresh visitor", never to a crash and never to someone else's
 * half-finished brief.
 */

import type { AssistantHost, FrontOfficeSession } from "@/lib/front-office/types";

export const FRONT_OFFICE_TTL_MS = 24 * 60 * 60 * 1000;

const STAGES = new Set(["goal", "clarify", "review", "consent", "submitting", "done", "error"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_RAW = 40_000;
const MAX_FIELD = 2200;
const MAX_TOTAL = 14_000;

export function frontOfficeStorageKey(host: AssistantHost) {
  return `koinophobia:front-office:${host}:v1`;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function parseFrontOfficeSession(
  raw: string | null,
  host: AssistantHost,
  now = Date.now(),
): FrontOfficeSession | null {
  if (!raw || raw.length > MAX_RAW) return null;
  try {
    const value = JSON.parse(raw) as Partial<FrontOfficeSession>;
    if (value.version !== 1 || value.host !== host) return null;
    if (typeof value.sessionId !== "string" || !UUID.test(value.sessionId)) return null;
    if (!Number.isFinite(value.savedAt) || Number(value.savedAt) > now + 60_000) return null;
    if (now - Number(value.savedAt) > FRONT_OFFICE_TTL_MS) return null;
    if (!STAGES.has(String(value.stage))) return null;
    if (!value.fields || typeof value.fields !== "object" || Array.isArray(value.fields)) return null;

    const fields: Record<string, string> = {};
    let total = 0;
    for (const [key, item] of Object.entries(value.fields)) {
      if (typeof item !== "string" || item.length > MAX_FIELD || key.length > 60) return null;
      total += item.length;
      fields[key] = item;
    }
    if (total > MAX_TOTAL) return null;

    const stringList = (input: unknown) =>
      Array.isArray(input) ? input.filter((item): item is string => typeof item === "string" && item.length <= 80).slice(0, 40) : [];

    // A session persisted mid-submit has no live request to resume — surface
    // it at review so the visitor confirms and submits again deliberately.
    const stage = value.stage === "submitting" ? "review" : (value.stage as FrontOfficeSession["stage"]);

    return {
      version: 1,
      host,
      sessionId: value.sessionId,
      savedAt: Number(value.savedAt),
      stage,
      intent: typeof value.intent === "string" && value.intent.length <= 60 ? value.intent : undefined,
      fields,
      inferred: stringList(value.inferred),
      asked: stringList(value.asked),
    };
  } catch {
    return null;
  }
}

export function loadFrontOfficeSession(
  storage: StorageLike,
  host: AssistantHost,
  now = Date.now(),
): FrontOfficeSession | null {
  try {
    const key = frontOfficeStorageKey(host);
    const raw = storage.getItem(key);
    const session = parseFrontOfficeSession(raw, host, now);
    if (!session && raw !== null) storage.removeItem(key);
    return session;
  } catch {
    return null;
  }
}

export function saveFrontOfficeSession(storage: StorageLike, session: FrontOfficeSession): boolean {
  try {
    storage.setItem(frontOfficeStorageKey(session.host), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearFrontOfficeSession(storage: StorageLike, host: AssistantHost): void {
  try {
    storage.removeItem(frontOfficeStorageKey(host));
  } catch {
    // Best-effort; an unclearable session simply expires by TTL.
  }
}
