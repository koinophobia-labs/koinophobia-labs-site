/**
 * The commercial front office — koinophobialabs.com's host policy.
 *
 * Everything routes through the systems that already exist:
 *  - Recommendation = scoreConcierge (the deterministic router with its
 *    injection stripping and harmful/regulated guards). Nothing here scores.
 *  - Prices, timelines, deliverables = lib/commercial serviceOffers, resolved
 *    at render time. Nothing here hardcodes a dollar amount.
 *  - Submission = the same /api/intake contract IntakeForm uses, carrying the
 *    concierge answers + signed evaluation so the server re-validates and
 *    re-scores exactly as it does today. One lead schema, one pipeline.
 *
 * The conversation's job is only to fill ConciergeAnswers progressively —
 * inferring what a message already said and asking one focused question for
 * each gap — instead of walking every visitor through all seven form steps.
 */

import { serviceOffers, studioConfig } from "@/lib/commercial";
import { branchPrompt, intakeServiceFor, problemChoices } from "@/lib/concierge/questions";
import { deterministicQualificationSummary, scoreConcierge } from "@/lib/concierge/routing";
import {
  conciergeBudgetRanges,
  conciergeTimelines,
  type ConciergeAnswers,
  type ServiceRecommendation,
  type ServiceType,
} from "@/lib/concierge/types";
import { normalizeWebsiteUrl } from "@/lib/concierge/validation";
import { extractStudioFields } from "@/lib/front-office/extract";
import type {
  BriefLine,
  FollowUpQuestion,
  FrontOfficePolicy,
  FrontOfficeSession,
} from "@/lib/front-office/types";

/* ------------------------------------------------------------- intents */

/** Plain-language starting points. Each seeds the routing field the
 *  deterministic router scores on; free text stays available alongside. */
export const studioIntents = [
  { id: "fix_website", label: "Fix or rebuild my website", hint: "It looks outdated, converts poorly, or fails on mobile." },
  { id: "automate", label: "Automate a repetitive process", hint: "Manual routing, copying, scheduling, or follow-up." },
  { id: "build_product", label: "Build a product or prototype", hint: "An app idea, portal, dashboard, or internal tool." },
  { id: "find_leaks", label: "Find where I'm losing revenue", hint: "Something is leaking — the cause isn't obvious yet." },
  { id: "improve_experience", label: "Improve an existing experience", hint: "The foundation works but a part underperforms." },
  { id: "not_sure", label: "I'm not sure yet", hint: "Describe it in your own words — that's enough." },
] as const;

const INTENT_KIND: Record<string, ConciergeAnswers["problemKind"]> = {
  fix_website: "website",
  automate: "manual_work",
  build_product: "custom_product",
  find_leaks: "unsure",
  improve_experience: "website",
  not_sure: "unsure",
};

/* ----------------------------------------------------------- questions */

const kindOf = (session: FrontOfficeSession) =>
  (session.fields.problemKind || "unsure") as ConciergeAnswers["problemKind"];

const websiteKind = (session: FrontOfficeSession) =>
  ["website", "small_fix"].includes(session.fields.problemKind || "");

/**
 * Ordered follow-ups. The engine asks only those whose field is missing, so
 * a visitor whose first message already named the impact never sees the
 * impact question. Branch prompts are the concierge's own — same concrete
 * vocabulary, conversational delivery.
 */
export const studioQuestions: FollowUpQuestion[] = [
  {
    id: "primary",
    field: "primaryProblem",
    kind: "text",
    extractOnAnswer: true,
    prompt: () => "What's going wrong right now, in your own words?",
    hint: () => "Plain language is perfect — no need to name a service or technology.",
    placeholder: () => "For example: people ask about booking on Instagram, but most never finish…",
    eligible: () => true,
  },
  {
    id: "kind",
    field: "problemKind",
    kind: "chips",
    prompt: () => "Which of these is closest?",
    hint: () => "This only sets the starting angle — your description carries the detail.",
    chips: () => problemChoices.map((choice) => ({ value: choice.value, label: choice.label, hint: choice.hint })),
    eligible: () => true,
  },
  {
    id: "branch",
    field: "branchContext",
    secondaryField: "currentTools",
    secondaryLabel: "Tools involved (optional)",
    kind: "text",
    extractOnAnswer: true,
    prompt: (session) => branchPrompt(kindOf(session)).title,
    hint: (session) => branchPrompt(kindOf(session)).description,
    placeholder: (session) => branchPrompt(kindOf(session)).placeholder,
    eligible: () => true,
  },
  {
    id: "impact",
    field: "impact",
    kind: "text",
    prompt: () => "What does this cost or slow down today?",
    hint: () => "Approximate is fine — lost inquiries, staff hours, slow replies, missed bookings.",
    placeholder: () => "For example: two or three inquiries a week never get a reply…",
    eligible: () => true,
  },
  {
    id: "outcome",
    field: "desiredOutcome",
    kind: "text",
    prompt: () => "What result would make this successful?",
    hint: () => "The practical change you want — not a feature list.",
    placeholder: () => "For example: every inquiry gets a same-day reply with the right details…",
    eligible: () => true,
  },
  {
    id: "business",
    field: "businessName",
    kind: "pair",
    pairField: "industry",
    pairLabel: "Business type",
    secondaryField: "websiteUrl",
    secondaryLabel: "Website address (optional)",
    prompt: () => "Who is this for?",
    hint: () => "The business name and what kind of business it is.",
    placeholder: () => "Business or project name",
    eligible: () => true,
  },
  {
    id: "constraints",
    field: "budgetRange",
    kind: "pair",
    pairField: "timeline",
    pairLabel: "Timing",
    prompt: () => "What budget range and timing are you protecting?",
    hint: () => "Ranges qualify the starting point — this is not a quote or a schedule.",
    chips: () => conciergeBudgetRanges.map((value) => ({ value, label: value })),
    pairChips: () => conciergeTimelines.map((value) => ({ value, label: value })),
    eligible: () => true,
  },
];

/* -------------------------------------------------------------- policy */

export const studioPolicy: FrontOfficePolicy = {
  host: "studio",
  intents: studioIntents.map(({ id, label, hint }) => ({ id, label, hint })),
  applyIntent: (intentId): Record<string, string> =>
    INTENT_KIND[intentId] ? { problemKind: INTENT_KIND[intentId] } : {},
  extract: extractStudioFields,
  questions: studioQuestions,
  requiredFields: () => [
    "primaryProblem",
    "problemKind",
    "branchContext",
    "impact",
    "desiredOutcome",
    "businessName",
    "industry",
    "budgetRange",
    "timeline",
  ],
  collectsContact: true,
};

/* ------------------------------------------------------ recommendation */

/** ServiceType → published offer slug. Only services with a published offer
 *  get a price/timeline card; the rest are honest about needing discovery. */
const OFFER_SLUG: Partial<Record<ServiceType, string>> = {
  revenue_leak_audit: "audit",
  website_rebuild: "website",
  ai_automation: "ai-front-office",
  quick_fix: "quick-fix",
};

export type StudioRecommendation = {
  recommendation: ServiceRecommendation;
  /** Canonical offer details, present only when the service is published. */
  offer?: (typeof serviceOffers)[number];
  /** What is still uncertain — rendered verbatim in the review card. */
  uncertain: string[];
  /** A budget/scope mismatch worth naming NOW, respectfully — never buried
   *  in the uncertainty list. The hard refusal for urgent timelines lives in
   *  the router; this covers the longer runways. */
  mismatch?: string;
  summary: string;
};

export function draftAnswers(session: FrontOfficeSession, contact?: { name: string; email: string; websiteOrSocial?: string }): ConciergeAnswers {
  const field = (key: string) => (session.fields[key] || "").trim();
  return {
    problemKind: kindOf(session),
    primaryProblem: field("primaryProblem"),
    branchContext: field("branchContext"),
    impact: field("impact"),
    currentTools: field("currentTools"),
    desiredOutcome: field("desiredOutcome"),
    businessName: field("businessName"),
    industry: field("industry"),
    websiteUrl: normalizeWebsiteUrl(contact?.websiteOrSocial || field("websiteUrl")) || "",
    budgetRange: (field("budgetRange") || "Not sure yet") as ConciergeAnswers["budgetRange"],
    timeline: (field("timeline") || "Just researching") as ConciergeAnswers["timeline"],
    name: contact?.name || "",
    email: contact?.email || "",
    companyWebsite: "",
  };
}

export function studioRecommendation(session: FrontOfficeSession): StudioRecommendation {
  const answers = draftAnswers(session);
  const recommendation = scoreConcierge(answers);
  const offerSlug = OFFER_SLUG[recommendation.service];
  const offer = offerSlug ? serviceOffers.find((item) => item.slug === offerSlug) : undefined;

  const uncertain: string[] = [];
  if (!answers.websiteUrl && websiteKind(session)) uncertain.push("The current website address");
  if (!answers.currentTools && ["lead_followup", "manual_work", "custom_product"].includes(answers.problemKind)) {
    uncertain.push("The tools and systems currently involved");
  }
  for (const key of session.inferred) {
    const label = BRIEF_LABELS[key];
    if (label && session.fields[key]) uncertain.push(`${label} was read from your message — worth a check`);
  }

  // The boundary string comes from the canonical range the visitor picked —
  // never a second copy of a number in this file.
  const mismatch =
    answers.budgetRange === conciergeBudgetRanges[0] &&
    ["custom_product", "website_rebuild"].includes(recommendation.service)
      ? `Worth saying now: ${recommendation.service === "custom_product" ? "a custom build" : "a full rebuild"} doesn't realistically fit a budget ${answers.budgetRange.toLowerCase()}. Blake will recommend the smallest useful step for that budget rather than stretch the scope — no pressure either way.`
      : undefined;

  return {
    recommendation,
    offer,
    uncertain,
    ...(mismatch ? { mismatch } : {}),
    summary: deterministicQualificationSummary(answers, recommendation),
  };
}

/* --------------------------------------------------------------- brief */

const BRIEF_LABELS: Record<string, string> = {
  businessName: "Business",
  industry: "Business type",
  websiteUrl: "Website",
  primaryProblem: "The problem",
  branchContext: "Current situation",
  impact: "What it costs",
  desiredOutcome: "Desired outcome",
  currentTools: "Tools involved",
  budgetRange: "Budget range",
  timeline: "Timing",
};

const BRIEF_ORDER = [
  "businessName",
  "industry",
  "websiteUrl",
  "primaryProblem",
  "branchContext",
  "impact",
  "desiredOutcome",
  "currentTools",
  "budgetRange",
  "timeline",
];

export function studioBrief(session: FrontOfficeSession): BriefLine[] {
  return BRIEF_ORDER.filter((field) => session.fields[field]).map((field) => ({
    field,
    label: BRIEF_LABELS[field],
    value: session.fields[field],
    inferred: session.inferred.includes(field),
    editable: true,
  }));
}

/* ---------------------------------------------------------- submission */

export type StudioContact = { name: string; email: string; websiteOrSocial: string };

export function validateStudioContact(contact: StudioContact): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!contact.name.trim()) errors.name = "Your name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors.email = "Enter a valid email address.";
  if (!normalizeWebsiteUrl(contact.websiteOrSocial)) errors.websiteOrSocial = "Enter a public website or social link — any active profile works.";
  return errors;
}

/** Origin metadata carried in notes: host, path, and campaign parameters that
 *  already exist on the URL. Never the conversation itself. */
export function originNote(location: { host: string; pathname: string; search: string }): string {
  const params = new URLSearchParams(location.search);
  const campaign = ["utm_source", "utm_medium", "utm_campaign", "ref"]
    .map((key) => (params.get(key) ? `${key}=${String(params.get(key)).slice(0, 60)}` : ""))
    .filter(Boolean)
    .join(" ");
  return `Organized by the koi front office · ${location.host}${location.pathname}${campaign ? ` · ${campaign}` : ""}`.slice(0, 300);
}

/**
 * The exact FormData contract /api/intake already validates — same field
 * names as the standard form, same honeypot, same concierge envelope. The
 * server re-validates and re-scores; the client is never authoritative.
 */
export function buildIntakeFormData(
  session: FrontOfficeSession,
  contact: StudioContact,
  options: { evaluationToken?: string; origin?: string } = {},
): FormData {
  const answers = draftAnswers(session, contact);
  const recommendation = scoreConcierge(answers);
  const form = new FormData();
  form.set("companyWebsite", "");
  form.set("name", contact.name.trim());
  form.set("businessName", answers.businessName);
  form.set("email", contact.email.trim());
  form.set("phone", "");
  form.set("websiteOrSocial", normalizeWebsiteUrl(contact.websiteOrSocial) || contact.websiteOrSocial.trim());
  form.set("industry", answers.industry);
  form.set("serviceInterest", intakeServiceFor(recommendation.service));
  form.set("budgetRange", answers.budgetRange === "Not sure yet" ? "" : answers.budgetRange);
  form.set("timeline", answers.timeline);
  form.set("biggestProblem", answers.primaryProblem);
  form.set("desiredOutcome", answers.desiredOutcome);
  form.set("currentTools", answers.currentTools);
  form.set(
    "notes",
    [
      answers.branchContext ? `Current situation: ${answers.branchContext}` : "",
      answers.impact ? `Impact: ${answers.impact}` : "",
      options.origin || "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 4000),
  );
  form.set("conciergeSessionId", session.sessionId);
  form.set("conciergeAnswers", JSON.stringify(answers));
  form.set("conciergeEvaluationToken", options.evaluationToken || "");
  return form;
}

/** The concierge credit line, from canonical config — never hardcoded. */
export function auditCreditLine(): string {
  return studioConfig.auditCreditEnabled
    ? `The ${studioConfig.auditPrice} audit fee is credited toward an eligible implementation project.`
    : "";
}
