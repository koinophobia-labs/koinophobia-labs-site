/**
 * On-device companion state.
 *
 * Stores three things and nothing else: whether the visitor dismissed the koi,
 * whether they minimised it, and which observations they've already been shown
 * (so it doesn't repeat itself). No identifiers, no analytics, no cross-session
 * or cross-device tracking — this never leaves localStorage.
 *
 * Deliberately a DIFFERENT storage key from the studio companion. Sharing one
 * would let a visitor's studio dismissal silence the personal koi, or worse,
 * let the two overwrite each other's state.
 */

export const DEV_KOI_STORAGE_KEY = "koinophobia:dev-koi:v1";

export type DevKoiSession = {
  /** Dismissed entirely for this device. The koi does not render. */
  dismissed: boolean;
  /** Present but resting; no observations surface until re-opened. */
  minimized: boolean;
  /** observation id -> epoch ms it was last shown. */
  shown: Record<string, number>;
};

export const emptySession = (): DevKoiSession => ({
  dismissed: false,
  minimized: false,
  shown: {},
});

export function parseSession(raw: string | null): DevKoiSession {
  if (!raw) return emptySession();
  try {
    const parsed = JSON.parse(raw) as Partial<DevKoiSession>;
    return {
      dismissed: parsed.dismissed === true,
      minimized: parsed.minimized === true,
      shown:
        parsed.shown && typeof parsed.shown === "object"
          ? Object.fromEntries(
              Object.entries(parsed.shown).filter(
                ([, at]) => typeof at === "number" && Number.isFinite(at)
              )
            )
          : {},
    };
  } catch {
    // Corrupt state must degrade to "fresh visitor", never throw at render.
    return emptySession();
  }
}

export function readSession(): DevKoiSession {
  if (typeof window === "undefined") return emptySession();
  try {
    return parseSession(window.localStorage.getItem(DEV_KOI_STORAGE_KEY));
  } catch {
    return emptySession();
  }
}

export function writeSession(session: DevKoiSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEV_KOI_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode, quota, disabled storage — all non-fatal. The koi simply
    // forgets between visits, which is a better failure than a crash.
  }
}

/** Ids still inside their cooldown, so they aren't repeated. */
export function suppressedIds(
  session: DevKoiSession,
  cooldownFor: (id: string) => number,
  now: number
): Set<string> {
  const set = new Set<string>();
  for (const [id, at] of Object.entries(session.shown)) {
    if (now - at < cooldownFor(id)) set.add(id);
  }
  return set;
}

export function recordShown(session: DevKoiSession, id: string, now: number): DevKoiSession {
  return { ...session, shown: { ...session.shown, [id]: now } };
}
