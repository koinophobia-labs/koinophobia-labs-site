import { intakeServiceFor, serviceLabel } from "@/lib/concierge/questions";
import type { ConciergeAnswers, ServiceRecommendation, ServiceType } from "@/lib/concierge/types";

type RoutableService = Exclude<ServiceType, "manual_review" | "not_a_fit">;
type Scores = Record<RoutableService, number>;

const injectionPatterns = [
  /ignore (all |any )?(previous|prior|system) instructions?/gi,
  /reveal (the |your )?(system prompt|instructions?)/gi,
  /recommend (the )?(most expensive|highest priced)[^.!?]*/gi,
  /change (the )?(service )?prices?[^.!?]*/gi,
  /send (this |the )?lead to [^.!?]*/gi,
  /call (an? )?(arbitrary )?url[^.!?]*/gi,
  /checkout price id[^.!?]*/gi,
];

function scoreText(answers: Partial<ConciergeAnswers>) {
  let value = [answers.primaryProblem, answers.branchContext, answers.impact, answers.currentTools, answers.desiredOutcome]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const pattern of injectionPatterns) value = value.replace(pattern, " ");
  return value;
}

function includesAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

const regulatedPatterns = [
  /patient|medical records?|diagnos(e|is)|healthcare data/,
  /legal advice|court filing|attorney-client/,
  /securities trading|investment advice|banking credentials?/,
  /biometric|facial recognition|covert surveillance/,
];

const harmfulPatterns = [
  /phish(ing)?|steal (passwords?|credentials?)/,
  /fake reviews?|impersonat(e|ion)|deceive customers?/,
  /spam (people|users|leads)|scrape private data/,
  /malware|ransomware|evade (security|detection)/,
];

function deterministicReasons(answers: Partial<ConciergeAnswers>, service: ServiceType, text: string) {
  const reasons: string[] = [];
  if (service === "revenue_leak_audit") {
    reasons.push("The visible symptom does not yet isolate a single root cause.");
    if (/lead|website|booking|follow.?up|customer journey/.test(text)) reasons.push("The friction may span more than one part of the customer path.");
    reasons.push("Diagnosis is safer than prescribing a build before the evidence is clear.");
  } else if (service === "website_rebuild") {
    reasons.push("The website or landing page is the center of the reported problem.");
    if (/mobile|slow|unclear|convert|cta|form|booking/.test(text)) reasons.push("The symptoms affect clarity, usability, or conversion—not just visual polish.");
    reasons.push("The likely scope is larger than one isolated repair.");
  } else if (service === "ai_automation") {
    reasons.push("The breakdown happens in a repeatable operational workflow.");
    if (/manual|copy|spreadsheet|follow.?up|route|schedule|report|quote|crm/.test(text)) reasons.push("Manual handoffs or disconnected tools are creating avoidable delay.");
    reasons.push("A mapped workflow and reliable fallback should come before adding AI features.");
  } else if (service === "custom_product") {
    reasons.push("The request centers on a tool, portal, dashboard, application, or product experience.");
    reasons.push("It requires product architecture beyond a marketing-site repair or simple integration.");
  } else if (service === "quick_fix") {
    reasons.push("The request is narrow enough to define and verify as one contained repair.");
    reasons.push("A full discovery or rebuild would be disproportionate at this stage.");
  } else if (service === "manual_review") {
    reasons.push("The current signals point to more than one plausible service or need specialist review.");
    reasons.push("A person should confirm fit before any implementation recommendation is treated as reliable.");
  } else {
    reasons.push("The requested outcome is outside a safe, realistic paid implementation path right now.");
    reasons.push("A smaller self-service step or a different specialist is more appropriate.");
  }
  if (!answers.currentTools && ["ai_automation", "custom_product"].includes(service)) reasons.push("The current tool stack still needs to be confirmed.");
  return reasons.slice(0, 4);
}

const copy: Record<ServiceType, { rationale: string; intervention: string; assumption?: string }> = {
  revenue_leak_audit: {
    rationale: "You know there is business friction, but the answers do not yet prove that one specific build will fix it. A Revenue Leak Audit is the practical first move: inspect the customer path, find the highest-cost leaks, and decide what is worth changing.",
    intervention: "A prioritized diagnosis of the website and customer journey, followed by a human-reviewed action plan.",
    assumption: "This assumes the uncertainty spans the public website or the path from interest to inquiry.",
  },
  website_rebuild: {
    rationale: "The primary failure appears to be the website or landing page itself. The likely work is a clearer offer, stronger mobile path, better trust and calls to action, and a reliable inquiry handoff—not an unrelated AI project.",
    intervention: "A scoped website or landing-page rebuild focused on clarity, conversion, mobile use, and lead capture.",
    assumption: "Final scope depends on the current platform, content, and whether the existing foundation can be repaired.",
  },
  ai_automation: {
    rationale: "The reported leak happens after work or inquiries enter the business. Mapping and automating the repeatable handoffs is likely higher leverage than rebuilding the public website first.",
    intervention: "A mapped workflow connecting intake, routing, follow-up, scheduling, reporting, or customer communication with explicit fallback behavior.",
    assumption: "Automation fit depends on tool access, data quality, volume, and the reliability of available integrations.",
  },
  custom_product: {
    rationale: "The need is a purpose-built digital product or internal tool, not a marketing-site repair. Product discovery should confirm the users, essential workflow, data boundaries, and smallest testable release.",
    intervention: "A scoped product-discovery and build path for a portal, dashboard, application, or custom workflow tool.",
    assumption: "A contained first release may be smaller than the full product idea described today.",
  },
  quick_fix: {
    rationale: "The issue is specific and bounded. A focused sprint can repair and test it without turning a small problem into an unnecessary rebuild.",
    intervention: "A contained repair with an agreed boundary, implementation, and critical-path test.",
    assumption: "This assumes investigation does not uncover a broader structural failure.",
  },
  manual_review: {
    rationale: "The answers contain competing signals or requirements that should not be forced into a confident automated recommendation. Blake should review the details and identify the smallest sensible next step.",
    intervention: "A human scope and fit review before a service, price, or timeline is proposed.",
    assumption: "No implementation recommendation is final until the conflicting or higher-risk details are clarified.",
  },
  not_a_fit: {
    rationale: "A paid Koinophobia Labs build is not the responsible first recommendation for the stated request. A smaller self-service step or a specialist outside the studio is more useful than overselling a project.",
    intervention: "A respectful handoff to a safer, smaller, or more appropriate path.",
    assumption: "A human can still review the request if important context was missed.",
  },
};

function finalize(service: ServiceType, confidence: number, reasons: string[], alternative?: ServiceType): ServiceRecommendation {
  const bounded = Math.max(0.05, Math.min(0.98, Number(confidence.toFixed(2))));
  const confidenceBand = bounded >= 0.8 ? "high" : bounded >= 0.6 ? "medium" : "low";
  const details = copy[service];
  return {
    service,
    serviceLabel: serviceLabel(service),
    confidence: bounded,
    confidenceBand,
    rationale: details.rationale,
    reasons,
    intervention: details.intervention,
    assumption: details.assumption,
    ...(alternative ? { alternative, alternativeLabel: serviceLabel(alternative) } : {}),
    requiresHumanReview: service === "manual_review" || service === "not_a_fit" || bounded < 0.65,
    nextAction: service === "revenue_leak_audit" ? "audit" : service === "manual_review" ? "human_review" : service === "not_a_fit" ? "self_service" : "intake",
  };
}

export function scoreConcierge(answers: Partial<ConciergeAnswers>): ServiceRecommendation {
  const text = scoreText(answers);
  const scores: Scores = { revenue_leak_audit: 0.5, website_rebuild: 0.5, ai_automation: 0.5, custom_product: 0.5, quick_fix: 0.5 };

  if (includesAny(text, harmfulPatterns)) return finalize("not_a_fit", 0.96, deterministicReasons(answers, "not_a_fit", text));
  if (answers.problemKind === "custom_product" && answers.budgetRange === "Under $500" && answers.timeline === "This week") {
    return finalize("not_a_fit", 0.9, ["A custom product cannot be responsibly scoped and delivered within the stated budget and timing.", "A no-code prototype or narrower self-service test is the more realistic first step."]);
  }

  const kindWeights: Partial<Record<ConciergeAnswers["problemKind"], Partial<Scores>>> = {
    website: { website_rebuild: 7, revenue_leak_audit: 1 },
    lead_followup: { ai_automation: 7, revenue_leak_audit: 1 },
    manual_work: { ai_automation: 7, custom_product: 1 },
    custom_product: { custom_product: 8 },
    small_fix: { quick_fix: 8 },
    unsure: { revenue_leak_audit: 5 },
  };
  const selected = answers.problemKind ? kindWeights[answers.problemKind] : undefined;
  if (selected) for (const [service, weight] of Object.entries(selected) as [RoutableService, number][]) scores[service] += weight;

  const websiteSignal = /website|landing page|mobile|page speed|conversion|\bcta\b|contact form|booking page/.test(text);
  const customProductSignal = /custom (app|tool|product)|portal|dashboard|platform|customer-facing app|internal app|\bmvp\b/.test(text);
  if (websiteSignal) scores.website_rebuild += 2.5;
  if (/lead|follow.?up|inquir|crm|routing|response time/.test(text)) scores.ai_automation += 2.25;
  if (/repetitive|manual|copy|spreadsheet|schedule|quot(e|ing)|reporting|reminder/.test(text)) scores.ai_automation += 2.75;
  if (customProductSignal) scores.custom_product += 7;
  if (/small fix|isolated|tracking|responsive bug|copy change|one integration|broken button/.test(text)) scores.quick_fix += 2.5;
  if (/not sure|unknown|unclear|multiple parts|customer journey|leak/.test(text)) scores.revenue_leak_audit += 2.25;

  const ranked = (Object.entries(scores) as [RoutableService, number][]).sort((a, b) => b[1] - a[1]);
  const [[topService, topScore], [secondService, secondScore]] = ranked;
  if (answers.problemKind === "website" && websiteSignal && customProductSignal) {
    return finalize("manual_review", 0.44, ["The answers describe both a public website conversion problem and a purpose-built product.", "A person should separate the marketing-site scope from the product scope before recommending one engagement."], topService);
  }
  if (includesAny(text, regulatedPatterns)) {
    return finalize("manual_review", 0.35, ["The request may involve regulated, sensitive, or higher-risk requirements.", "A person should confirm data boundaries, compliance needs, and fit before recommending implementation."], topService);
  }
  if (!answers.problemKind || topScore < 3) return finalize("manual_review", 0.25, deterministicReasons(answers, "manual_review", text), topService);

  const margin = topScore - secondScore;
  if (margin <= 1.5) return finalize("manual_review", 0.42, deterministicReasons(answers, "manual_review", text), topService);

  let confidence = topScore >= 9 && margin >= 5 ? 0.91 : topScore >= 7 && margin >= 3 ? 0.81 : margin >= 2 ? 0.68 : 0.57;
  if (answers.problemKind === "unsure" && topService === "revenue_leak_audit") confidence = Math.min(confidence, 0.72);
  const alternative = confidence < 0.8 ? secondService : undefined;
  return finalize(topService, confidence, deterministicReasons(answers, topService, text), alternative);
}

export function deterministicQualificationSummary(answers: ConciergeAnswers, recommendation: ServiceRecommendation) {
  const organization = answers.businessName || "The business";
  const impact = answers.impact.replace(/\s+/g, " ").trim();
  return `${organization} reports ${answers.primaryProblem.replace(/\s+/g, " ").trim()} The current impact is ${impact} The preliminary starting point is ${recommendation.serviceLabel.toLowerCase()}, subject to human review of scope, fit, pricing, and timing.`.slice(0, 700);
}

export function splitTools(value: string) {
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
}

export { intakeServiceFor };
