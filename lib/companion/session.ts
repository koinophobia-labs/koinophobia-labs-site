export const COMPANION_STORAGE_KEY = "koinophobia:koi-companion:v1";
export const COMPANION_INVITATION_LIMIT = 2;
export const COMPANION_INVITATION_COOLDOWN_MS = 10 * 60 * 1000;
export const COMPANION_DISMISSAL_MS = 30 * 60 * 1000;

export type CompanionSession = {
  version: 1;
  hidden: boolean;
  minimized: boolean;
  invitationCount: number;
  lastInvitationAt: number;
  lastInvitationRoute: string;
  dismissedUntil: number;
};

export const emptyCompanionSession = (): CompanionSession => ({
  version: 1,
  hidden: false,
  minimized: true,
  invitationCount: 0,
  lastInvitationAt: 0,
  lastInvitationRoute: "",
  dismissedUntil: 0,
});

export function parseCompanionSession(raw: string | null): CompanionSession {
  if (!raw || raw.length > 2_000) return emptyCompanionSession();
  try {
    const value = JSON.parse(raw) as Partial<CompanionSession>;
    if (value.version !== 1) return emptyCompanionSession();
    return {
      version: 1,
      hidden: value.hidden === true,
      minimized: value.minimized !== false,
      invitationCount: Number.isInteger(value.invitationCount) && Number(value.invitationCount) >= 0 ? Math.min(Number(value.invitationCount), COMPANION_INVITATION_LIMIT) : 0,
      lastInvitationAt: Number.isFinite(value.lastInvitationAt) && Number(value.lastInvitationAt) > 0 ? Number(value.lastInvitationAt) : 0,
      lastInvitationRoute: typeof value.lastInvitationRoute === "string" ? value.lastInvitationRoute.slice(0, 80) : "",
      dismissedUntil: Number.isFinite(value.dismissedUntil) && Number(value.dismissedUntil) > 0 ? Number(value.dismissedUntil) : 0,
    };
  } catch {
    return emptyCompanionSession();
  }
}

export function canShowCompanionInvitation(session: CompanionSession, routeKey: string, now = Date.now()) {
  if (session.hidden || session.invitationCount >= COMPANION_INVITATION_LIMIT || session.dismissedUntil > now) return false;
  if (session.lastInvitationRoute === routeKey) return false;
  return session.lastInvitationAt === 0 || now - session.lastInvitationAt >= COMPANION_INVITATION_COOLDOWN_MS;
}

export function recordCompanionInvitation(session: CompanionSession, routeKey: string, now = Date.now()): CompanionSession {
  return {
    ...session,
    invitationCount: Math.min(COMPANION_INVITATION_LIMIT, session.invitationCount + 1),
    lastInvitationAt: now,
    lastInvitationRoute: routeKey,
  };
}

export function dismissCompanionInvitation(session: CompanionSession, now = Date.now()): CompanionSession {
  return { ...session, dismissedUntil: now + COMPANION_DISMISSAL_MS };
}
