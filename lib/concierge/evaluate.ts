import { enhanceWithAI } from "@/lib/concierge/ai";
import { deterministicQualificationSummary, scoreConcierge, splitTools } from "@/lib/concierge/routing";
import type { ConciergeAnswers, ConciergeEvaluationResponse } from "@/lib/concierge/types";

type EvaluationOptions = Parameters<typeof enhanceWithAI>[2];

export async function evaluateConcierge(answers: ConciergeAnswers, options: EvaluationOptions = {}): Promise<ConciergeEvaluationResponse> {
  const recommendation = scoreConcierge(answers);
  const deterministicSummary = deterministicQualificationSummary(answers, recommendation);
  const extracted = {
    businessName: answers.businessName,
    industry: answers.industry,
    ...(answers.websiteUrl ? { websiteUrl: answers.websiteUrl } : {}),
    primaryProblem: answers.primaryProblem,
    impact: answers.impact,
    currentTools: splitTools(answers.currentTools),
    desiredOutcome: answers.desiredOutcome,
    budgetRange: answers.budgetRange,
    timeline: answers.timeline,
    qualificationSummary: deterministicSummary,
  };
  const missingInformation = [
    ...(!answers.websiteUrl && ["website", "small_fix"].includes(answers.problemKind) ? ["Current website URL"] : []),
    ...(!answers.currentTools && ["lead_followup", "manual_work", "custom_product"].includes(answers.problemKind) ? ["Current tools and systems"] : []),
  ];
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return { extracted, recommendation, missingInformation, source: "deterministic" };
  try {
    const enhancement = await enhanceWithAI(answers, recommendation, options);
    return {
      extracted: { ...extracted, ...enhancement },
      recommendation,
      missingInformation,
      source: "ai_assisted",
    };
  } catch {
    return { extracted, recommendation, missingInformation, source: "fallback" };
  }
}
