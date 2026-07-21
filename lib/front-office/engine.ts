/**
 * The front-office conversation engine.
 *
 * A pure reducer over FrontOfficeSession. No React, no I/O, no host
 * knowledge — the policy parameter supplies intents, extraction, questions,
 * and requirements. Everything here is unit-testable with plain objects,
 * which is the point: the conversation's control flow is deterministic and
 * provable, whatever renders it.
 *
 * Invariants the tests hold this to:
 *  - One question at a time, each asked at most once.
 *  - A question is only asked while its field is missing AND it is eligible
 *    for this session (no booking questions about a résumé).
 *  - Nothing already provided is asked again.
 *  - The visitor can always edit any field at review, and always reset.
 *  - The engine cannot submit; it can only reach the consent stage. The UI
 *    owns the network call and may only make it from `consent`.
 */

import type {
  AssistantStage,
  FollowUpQuestion,
  FrontOfficePolicy,
  FrontOfficeSession,
} from "@/lib/front-office/types";

export type EngineEvent =
  | { type: "SELECT_INTENT"; intent: string }
  | { type: "FREE_TEXT"; text: string }
  | { type: "ANSWER"; questionId: string; value: string; secondaryValue?: string; pairValue?: string }
  | { type: "SKIP"; questionId: string }
  | { type: "EDIT_FIELD"; field: string; value: string }
  | { type: "CONFIRM_REVIEW" }
  | { type: "BACK_TO_REVIEW" }
  | { type: "SUBMIT_STARTED" }
  | { type: "SUBMIT_SUCCEEDED" }
  | { type: "SUBMIT_FAILED"; message: string }
  | { type: "RESET"; sessionId: string };

export function emptySession(host: FrontOfficePolicy["host"], sessionId: string, now: number): FrontOfficeSession {
  return { version: 1, host, sessionId, savedAt: now, stage: "goal", fields: {}, inferred: [], asked: [] };
}

const filled = (session: FrontOfficeSession, field: string) =>
  Boolean(session.fields[field]?.trim());

/** Missing required fields, in the policy's declared order. */
export function missingFields(session: FrontOfficeSession, policy: FrontOfficePolicy): string[] {
  return policy.requiredFields(session).filter((field) => !filled(session, field));
}

/**
 * The next question to ask, or null when clarification is complete.
 * First eligible, unasked question whose field is still missing.
 */
export function nextQuestion(session: FrontOfficeSession, policy: FrontOfficePolicy): FollowUpQuestion | null {
  const missing = new Set(missingFields(session, policy));
  return (
    policy.questions.find(
      (question) =>
        missing.has(question.field) &&
        !session.asked.includes(question.id) &&
        question.eligible(session),
    ) ?? null
  );
}

/** Where the session should sit after new information arrived. */
function settle(session: FrontOfficeSession, policy: FrontOfficePolicy): AssistantStage {
  return nextQuestion(session, policy) ? "clarify" : "review";
}

function withFields(
  session: FrontOfficeSession,
  patch: Record<string, string>,
  inferredKeys: string[] = [],
): FrontOfficeSession {
  const fields = { ...session.fields };
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim();
    if (trimmed) fields[key] = trimmed;
  }
  // A visitor-typed value clears the "inferred" flag for that field; an
  // inferred value never overwrites something the visitor typed.
  const inferred = [
    ...session.inferred.filter((key) => !(key in patch) || inferredKeys.includes(key)),
    ...inferredKeys.filter((key) => !session.inferred.includes(key) && fields[key]),
  ];
  return { ...session, fields, inferred };
}

export function reduce(
  session: FrontOfficeSession,
  event: EngineEvent,
  policy: FrontOfficePolicy,
  now: number = session.savedAt,
): FrontOfficeSession {
  const stamped = (next: FrontOfficeSession): FrontOfficeSession => ({ ...next, savedAt: now });

  switch (event.type) {
    case "SELECT_INTENT": {
      if (!policy.intents.some((intent) => intent.id === event.intent)) return session;
      const seeded = withFields({ ...session, intent: event.intent }, policy.applyIntent(event.intent));
      return stamped({ ...seeded, stage: settle(seeded, policy) });
    }

    case "FREE_TEXT": {
      const text = event.text.trim();
      if (!text) return session;
      const extraction = policy.extract(text);
      // Inferred values never overwrite what the visitor already typed.
      const additions = Object.fromEntries(
        Object.entries(extraction.fields).filter(([key]) => !filled(session, key)),
      );
      const intent =
        session.intent ??
        (extraction.intent && policy.intents.some((item) => item.id === extraction.intent)
          ? extraction.intent
          : undefined);
      const next = withFields({ ...session, intent }, additions, extraction.inferred.filter((key) => key in additions));
      return stamped({ ...next, stage: settle(next, policy) });
    }

    case "ANSWER": {
      const question = policy.questions.find((item) => item.id === event.questionId);
      if (!question) return session;
      const patch: Record<string, string> = { [question.field]: event.value };
      if (question.secondaryField && event.secondaryValue) patch[question.secondaryField] = event.secondaryValue;
      if (question.pairField && event.pairValue) patch[question.pairField] = event.pairValue;
      let answered = withFields(
        { ...session, asked: session.asked.includes(question.id) ? session.asked : [...session.asked, question.id] },
        patch,
      );
      if (question.extractOnAnswer) {
        const extraction = policy.extract(event.value);
        const additions = Object.fromEntries(
          Object.entries(extraction.fields).filter(([key]) => !(key in patch) && !filled(answered, key)),
        );
        answered = withFields(answered, additions, extraction.inferred.filter((key) => key in additions));
      }
      return stamped({ ...answered, stage: settle(answered, policy) });
    }

    case "SKIP": {
      if (session.asked.includes(event.questionId)) return session;
      const skipped = { ...session, asked: [...session.asked, event.questionId] };
      return stamped({ ...skipped, stage: settle(skipped, policy) });
    }

    case "EDIT_FIELD": {
      // Review-stage edits; an emptied field sends the session back through
      // clarify only if the field is required and a question exists for it.
      const value = event.value.trim();
      const fields = { ...session.fields };
      if (value) fields[event.field] = value;
      else delete fields[event.field];
      const edited: FrontOfficeSession = {
        ...session,
        fields,
        inferred: session.inferred.filter((key) => key !== event.field),
      };
      return stamped(edited);
    }

    case "CONFIRM_REVIEW": {
      if (session.stage !== "review") return session;
      if (missingFields(session, policy).length > 0) return stamped({ ...session, stage: settle(session, policy) });
      // Hosts that do not collect contact terminate at the recommendation.
      return stamped({ ...session, stage: policy.collectsContact ? "consent" : "done" });
    }

    case "BACK_TO_REVIEW":
      return stamped({ ...session, stage: "review", errorMessage: undefined });

    case "SUBMIT_STARTED":
      return session.stage === "consent" ? stamped({ ...session, stage: "submitting" }) : session;

    case "SUBMIT_SUCCEEDED":
      return stamped({ ...session, stage: "done", errorMessage: undefined });

    case "SUBMIT_FAILED":
      return stamped({ ...session, stage: "error", errorMessage: event.message.slice(0, 300) });

    case "RESET":
      return emptySession(session.host, event.sessionId, now);

    default:
      return session;
  }
}
