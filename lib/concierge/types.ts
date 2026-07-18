export const serviceTypes = [
  "revenue_leak_audit",
  "website_rebuild",
  "ai_automation",
  "custom_product",
  "quick_fix",
  "manual_review",
  "not_a_fit",
] as const;

export type ServiceType = (typeof serviceTypes)[number];

export const problemKinds = [
  "website",
  "lead_followup",
  "manual_work",
  "custom_product",
  "small_fix",
  "unsure",
] as const;

export type ProblemKind = (typeof problemKinds)[number];

export const conciergeBudgetRanges = [
  "Under $500",
  "$500-$1,500",
  "$1,500-$3,500",
  "$3,500+",
  "Not sure yet",
] as const;

export const conciergeTimelines = [
  "This week",
  "This month",
  "1-2 months",
  "Just researching",
] as const;

export type ConciergeAnswers = {
  problemKind: ProblemKind;
  primaryProblem: string;
  branchContext: string;
  impact: string;
  currentTools: string;
  desiredOutcome: string;
  businessName: string;
  industry: string;
  websiteUrl: string;
  budgetRange: (typeof conciergeBudgetRanges)[number];
  timeline: (typeof conciergeTimelines)[number];
  name: string;
  email: string;
  companyWebsite?: string;
};
export type NextActionType = "audit" | "intake" | "human_review" | "self_service";

export type ServiceRecommendation = {
  service: ServiceType;
  serviceLabel: string;
  confidence: number;
  confidenceBand: "high" | "medium" | "low";
  rationale: string;
  reasons: string[];
  intervention: string;
  assumption?: string;
  alternative?: ServiceType;
  alternativeLabel?: string;
  requiresHumanReview: boolean;
  nextAction: NextActionType;
};

export type ConciergeExtracted = {
  businessName?: string;
  industry?: string;
  websiteUrl?: string;
  primaryProblem: string;
  impact?: string;
  currentTools?: string[];
  desiredOutcome?: string;
  budgetRange?: string;
  timeline?: string;
  qualificationSummary: string;
};

export type ConciergeEvaluationResponse = {
  extracted: ConciergeExtracted;
  recommendation: ServiceRecommendation;
  missingInformation: string[];
  source: "deterministic" | "ai_assisted" | "fallback";
  evaluationToken?: string;
};

export type ConciergeEvaluationRequest = {
  sessionId: string;
  answers: ConciergeAnswers;
  currentStep: string;
  locale?: string;
};

export type ConciergeLeadData = {
  schemaVersion: 1;
  sessionId: string;
  recommendedService: ServiceType;
  recommendationConfidence: number;
  recommendationReasons: string[];
  recommendationSource: ConciergeEvaluationResponse["source"];
  requiresHumanReview: boolean;
  qualificationSummary: string;
  answers: ConciergeAnswers;
  visitorPrimaryProblem: string;
  currentTools: string[];
  desiredOutcome: string;
  budgetRange: string;
  timeline: string;
  websiteUrl: string;
};

export type ConciergeDraft = {
  version: 1;
  sessionId: string;
  savedAt: number;
  step: number;
  stage: "questions" | "result";
  answers: Partial<ConciergeAnswers>;
  evaluation?: ConciergeEvaluationResponse;
};
