/**
 * The koi front office — shared domain model.
 *
 * One deterministic engine, two host policies. The engine knows stages,
 * questions, and fields; it knows nothing about services, products, prices,
 * or hosts. Policies (studio-policy.ts, personal-policy.ts) supply the
 * vocabulary and the recommendation logic, each grounded in its own canonical
 * data source. The engine never performs I/O and never touches React.
 *
 * Deliberately NOT stored anywhere in this model: a message transcript.
 * The structured fields ARE the conversation record. That is the product
 * thesis (a brief beats a chat log) and the privacy stance (nothing to leak).
 */

export type AssistantHost = "studio" | "personal";

/**
 * Engine stages. The UI shell adds resting/opening/minimized around these —
 * those are surface states, not conversation states.
 *
 *   goal       what brought you here (intent chips + free text)
 *   clarify    one focused question at a time, only for missing info
 *   review     the structured brief + recommendation, every field editable
 *   consent    contact details + explicit confirmation (studio only)
 *   submitting network in flight (studio only)
 *   done       honest terminal state (submitted / handed off / answered)
 *   error      recoverable failure with a deterministic fallback path
 */
export type AssistantStage =
  | "goal"
  | "clarify"
  | "review"
  | "consent"
  | "submitting"
  | "done"
  | "error";

export type AssistantIntent = {
  id: string;
  label: string;
  hint?: string;
};

/** A quick answer: `value` is stored, `label` is shown. */
export type QuickChoice = {
  value: string;
  label: string;
  hint?: string;
};

/**
 * A follow-up question the engine may ask. Questions are asked at most once
 * per session, only while their field is missing, and only when eligible for
 * the current session (a booking question is never asked about a résumé).
 */
export type FollowUpQuestion = {
  id: string;
  /** The field this question fills. */
  field: string;
  /** Optional secondary field collected on the same step (e.g. tools). */
  secondaryField?: string;
  secondaryLabel?: string;
  kind: "text" | "chips" | "pair";
  /** Concrete, short, answerable. Computed so it can reference known fields. */
  prompt: (session: FrontOfficeSession) => string;
  hint?: (session: FrontOfficeSession) => string;
  placeholder?: (session: FrontOfficeSession) => string;
  /** Quick answers; free text stays available alongside. */
  chips?: (session: FrontOfficeSession) => QuickChoice[];
  /** Second input for kind "pair" (e.g. budget + timeline, name + industry). */
  pairField?: string;
  pairLabel?: string;
  pairChips?: (session: FrontOfficeSession) => QuickChoice[];
  /** Run the policy extractor over the answer too — used for open-ended
   *  answers that carry classifiable signals (never overwrites typed fields). */
  extractOnAnswer?: boolean;
  eligible: (session: FrontOfficeSession) => boolean;
};

export type FrontOfficeSession = {
  version: 1;
  host: AssistantHost;
  /** UUID. On the studio host this doubles as the concierge sessionId so the
   *  existing idempotency key (`concierge:<sessionId>`) keeps working. */
  sessionId: string;
  savedAt: number;
  stage: AssistantStage;
  intent?: string;
  /** Collected field values, visitor-typed or inferred. Always strings. */
  fields: Record<string, string>;
  /** Field keys that were inferred from free text rather than typed in
   *  answer to a direct question — surfaced as "check this" at review. */
  inferred: string[];
  /** Questions already asked, never repeated. */
  asked: string[];
  /** Error message when stage === "error". Never a raw provider error. */
  errorMessage?: string;
};

export type ExtractionResult = {
  fields: Record<string, string>;
  inferred: string[];
  /** An intent the text clearly implies (e.g. hiring language on the
   *  personal host). Applied only when the visitor has not chosen one. */
  intent?: string;
};

/**
 * What a host policy must provide. Pure data + pure functions; the engine
 * composes them. Policies never trigger I/O — submission and navigation are
 * owned by the UI layer, gated behind the consent stage.
 */
export type FrontOfficePolicy = {
  host: AssistantHost;
  intents: AssistantIntent[];
  /** Fields to seed when an intent chip is chosen. */
  applyIntent: (intentId: string) => Record<string, string>;
  /** Deterministic extraction from the visitor's free text. */
  extract: (text: string) => ExtractionResult;
  questions: FollowUpQuestion[];
  /** Required before the session may leave clarify. Computed per session so
   *  requirements can depend on the chosen intent. */
  requiredFields: (session: FrontOfficeSession) => string[];
  /** Whether this host collects contact + submits (studio) or terminates at
   *  a recommendation/handoff (personal). */
  collectsContact: boolean;
};

/** The studio brief rendered at review — labels for collected fields. */
export type BriefLine = {
  field: string;
  label: string;
  value: string;
  inferred: boolean;
  /** Editable in the review UI. Non-editable lines are derived. */
  editable: boolean;
};

/** A personal-host product recommendation, every fact from lib/dev/universe. */
export type ProductMatch = {
  slug: string;
  name: string;
  /** The product's own tagline — who/what it is, in its own words. */
  who: string;
  /** The lived problem it addresses (first sentence of the canonical field). */
  addresses: string;
  /** stageLabel · reachLabel, verbatim from canonical vocabulary. */
  availability: string;
  /** notYet[0] — the honesty block's first line, verbatim. */
  limitation: string;
  /** The product's own primary action. Null when nothing is offered. */
  destination: { label: string; href: string; external: boolean } | null;
  /** Categorical why-this-fits sentence (template + goal category). */
  whyFit: string;
  /** Set when the visitor asked for something that does not exist (e.g. a
   *  TestFlight link). Contains the canonical status verbatim. */
  truthNote?: string;
};

export type StudioHandoff = {
  /** What will be carried, shown to the visitor before they follow it. */
  carried: string;
  href: string;
};
