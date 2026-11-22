// A failed preparation gets one retry, at least a minute later. Claim before
// awaiting so overlapping polls/actions cannot start duplicate requests.
export class CallPreparation {
  private attempts = new Map<string, { count: number; pending: boolean; retryAt: number; done: boolean }>();

  async run(id: string, prepare: () => Promise<void>, now = () => Date.now()) {
    const previous = this.attempts.get(id);
    if (previous && (previous.pending || previous.done || previous.count >= 2 || now() < previous.retryAt)) return;
    const attempt = { count: (previous?.count ?? 0) + 1, pending: true, retryAt: Infinity, done: false };
    this.attempts.set(id, attempt);
    try {
      await prepare();
      attempt.done = true;
    } finally {
      attempt.pending = false;
      attempt.retryAt = now() + 60_000;
    }
  }
}

export function retrySeconds(response: Response, body: { retryAfter?: number }) {
  const seconds = Number(response.headers.get("Retry-After") ?? body.retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}

export function preparationReason(error: unknown) {
  // Only fixed, reviewed server messages belong beside the generic fallback.
  return typeof error === "string" && [
    "This contact has opted out.",
    "Don’t call — re-check failed. Ask Blake to review a confirmed re-check.",
    "Only an approved, unpaid catalog offer can have a deal page.",
    "Lead not found.",
  ].includes(error) ? error : "";
}
