import {
  conciergeBudgetRanges,
  conciergeTimelines,
  problemKinds,
  type ConciergeAnswers,
  type ConciergeEvaluationRequest,
} from "@/lib/concierge/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limits: Record<keyof ConciergeAnswers, number> = {
  problemKind: 40,
  primaryProblem: 1200,
  branchContext: 2000,
  impact: 1200,
  currentTools: 1000,
  desiredOutcome: 1200,
  businessName: 160,
  industry: 120,
  websiteUrl: 500,
  budgetRange: 80,
  timeline: 80,
  name: 120,
  email: 254,
  companyWebsite: 200,
};

function text(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key].trim() : "";
}
export function validSessionId(value: string) {
  return UUID.test(value);
}

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function validateConciergeAnswers(value: unknown): { answers?: ConciergeAnswers; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return { errors: { answers: "Answers must be an object." } };
  const raw = value as Record<string, unknown>;
  const problemKind = text(raw, "problemKind");
  const answers = {
    problemKind,
    primaryProblem: text(raw, "primaryProblem"),
    branchContext: text(raw, "branchContext"),
    impact: text(raw, "impact"),
    currentTools: text(raw, "currentTools"),
    desiredOutcome: text(raw, "desiredOutcome"),
    businessName: text(raw, "businessName"),
    industry: text(raw, "industry"),
    websiteUrl: text(raw, "websiteUrl"),
    budgetRange: text(raw, "budgetRange"),
    timeline: text(raw, "timeline"),
    name: text(raw, "name"),
    email: text(raw, "email"),
    companyWebsite: text(raw, "companyWebsite"),
  } as ConciergeAnswers;

  if (!problemKinds.includes(problemKind as ConciergeAnswers["problemKind"])) errors.problemKind = "Choose the closest problem.";
  for (const key of ["primaryProblem", "branchContext", "impact", "desiredOutcome"] as const) {
    if (answers[key].length < 6) errors[key] = "Add a little more detail so the recommendation can be grounded.";
  }
  for (const key of ["businessName", "industry", "name"] as const) if (!answers[key]) errors[key] = "This field is required.";
  if (!EMAIL.test(answers.email)) errors.email = "Enter a valid email address.";
  if (!conciergeBudgetRanges.includes(answers.budgetRange as ConciergeAnswers["budgetRange"])) errors.budgetRange = "Choose a budget range.";
  if (!conciergeTimelines.includes(answers.timeline as ConciergeAnswers["timeline"])) errors.timeline = "Choose a timeline.";
  if (answers.websiteUrl) {
    const normalized = normalizeWebsiteUrl(answers.websiteUrl);
    if (!normalized) errors.websiteUrl = "Enter a public http or https website address.";
    else answers.websiteUrl = normalized;
  }
  for (const [key, limit] of Object.entries(limits) as [keyof ConciergeAnswers, number][]) {
    if (String(answers[key] || "").length > limit) errors[key] = `Must be ${limit} characters or fewer.`;
  }
  const total = Object.values(answers).join("").length;
  if (total > 8500) errors.answers = "The combined answers are too long.";
  return Object.keys(errors).length ? { errors } : { answers, errors };
}

export function parseEvaluationRequest(value: unknown): { request?: ConciergeEvaluationRequest; errors: Record<string, string> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { errors: { request: "Request must be an object." } };
  const raw = value as Record<string, unknown>;
  const sessionId = text(raw, "sessionId");
  const currentStep = text(raw, "currentStep");
  const locale = text(raw, "locale");
  const parsed = validateConciergeAnswers(raw.answers);
  const errors = { ...parsed.errors };
  if (!validSessionId(sessionId)) errors.sessionId = "A valid session ID is required.";
  if (!currentStep || currentStep.length > 80) errors.currentStep = "A valid current step is required.";
  if (locale.length > 20) errors.locale = "Locale is too long.";
  if (!parsed.answers || Object.keys(errors).length) return { errors };
  return { request: { sessionId, answers: parsed.answers, currentStep, ...(locale ? { locale } : {}) }, errors };
}
