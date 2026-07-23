// Grounded site-knowledge for the koi assistant.
//
// Everything here is DERIVED from lib/commercial.ts — the same published truth
// the studio pages render. Nothing is hand-typed, so a price or timeline change
// in commercial.ts flows straight into the koi's answers. This is the fix for
// the "shadow website that goes stale" failure mode (audit U1).
//
// Pure and typed on purpose: no React, no DOM — unit-testable in isolation.

import { businessProblems, faqs, processSteps, serviceOffers, studioConfig, workProjects } from "@/lib/commercial";
import { products as universeProducts, publicStatusLabel } from "@/lib/dev/universe";

export type CompanionRouteKey =
  | "home"
  | "services"
  | "work"
  | "work_detail"
  | "products"
  | "process"
  | "about"
  | "audit"
  | "intake"
  | "demo";

/** A single service, flattened from serviceOffers for the assistant surface. */
export type KnownService = {
  slug: string;
  title: string;
  forWhom: string;
  problem: string;
  price: string;
  priceLabel: string;
  timeline: string;
  deliverable: string;
  href: string;
};

export const KNOWN_SERVICES: readonly KnownService[] = serviceOffers.map((offer) => ({
  slug: offer.slug,
  title: offer.title,
  forWhom: offer.forWhom,
  problem: offer.problem,
  price: offer.price,
  priceLabel: offer.priceLabel,
  timeline: offer.timeline,
  deliverable: offer.deliverable,
  href: offer.href,
}));

export const getService = (slug: string): KnownService | undefined =>
  KNOWN_SERVICES.find((service) => service.slug === slug);

// ---------------------------------------------------------------------------
// Service comparison (audit U2)
// ---------------------------------------------------------------------------

export type ServiceComparison = {
  a: KnownService;
  b: KnownService;
  /** Grounded, deterministic "which first" — never invents a price or promise. */
  recommendation: string;
};

/**
 * Compare two published services side by side. The recommendation is a fixed
 * rule, not a model opinion: when uncertainty about the cause is in play, the
 * $250 audit is the lowest-risk starting point (this mirrors the FAQ + audit
 * copy already on the site).
 */
export function compareServices(slugA: string, slugB: string): ServiceComparison | null {
  const a = getService(slugA);
  const b = getService(slugB);
  if (!a || !b || a.slug === b.slug) return null;

  const auditSlug = "audit";
  let recommendation: string;
  if (a.slug === auditSlug || b.slug === auditSlug) {
    const build = a.slug === auditSlug ? b : a;
    recommendation = `If you already know the fix, go straight to the ${build.title}. If the cause of lost inquiries is still unclear, start with the ${studioConfig.auditPrice} Revenue Leak Audit — it delivers a prioritized report you can use here or take elsewhere, and its cost can credit toward a later build.`;
  } else {
    recommendation = `Both are scoped and priced before any development. If you are unsure which fits, the ${studioConfig.auditPrice} Revenue Leak Audit is the lowest-risk way to decide before committing to ${a.title} or ${b.title}.`;
  }

  return { a, b, recommendation };
}

/** The comparison pairs the panel offers as one-tap chips, per route. */
export function suggestedComparisons(routeKey: CompanionRouteKey): Array<[string, string]> {
  if (routeKey === "audit") return [["audit", "website"], ["audit", "quick-fix"]];
  if (routeKey === "services" || routeKey === "home") {
    return [["audit", "website"], ["landing-page", "website"], ["website", "ai-front-office"]];
  }
  return [["audit", "website"], ["quick-fix", "landing-page"]];
}

// ---------------------------------------------------------------------------
// Relevant-work matching (audit U3)
// ---------------------------------------------------------------------------

export type WorkMatch = {
  slug: string;
  title: string;
  businessType: string;
  summary: string;
  href: string;
  /** Why this project was surfaced — grounded in its own capabilities/problem. */
  reason: string;
  score: number;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "your", "you", "our", "are", "was",
  "have", "has", "from", "into", "about", "what", "which", "when", "where", "how",
  "can", "could", "would", "should", "need", "want", "looking", "help", "business",
  "site", "website", "project", "build", "make", "get", "a", "an", "of", "to", "in",
  "on", "is", "it", "my", "me", "i",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Rank concept builds by how closely their capabilities / business type /
 * problem match the visitor's stated intent. Deterministic keyword scoring —
 * no AI required. Returns at most `limit`, highest score first, ties broken by
 * declaration order (stable).
 */
export function relevantWork(intent: string, limit = 2): WorkMatch[] {
  const wanted = tokenize(intent);
  const scored = workProjects.map((project, index) => {
    const haystack = [
      project.businessType,
      project.summary,
      project.problem,
      project.solution,
      ...project.capabilities,
      ...(project.intendedImpact || []),
    ]
      .join(" ")
      .toLowerCase();
    const hits = wanted.filter((word) => haystack.includes(word));
    const capabilityHit = project.capabilities.find((cap) =>
      wanted.some((word) => cap.toLowerCase().includes(word)),
    );
    const reason = capabilityHit
      ? `Closest on ${capabilityHit.toLowerCase()} — ${project.summary}`
      : project.summary;
    return {
      slug: project.slug,
      title: project.title,
      businessType: project.businessType,
      summary: project.summary,
      href: `/work/${project.slug}`,
      reason,
      score: hits.length,
      index,
    };
  });

  return scored
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ slug, title, businessType, summary, href, reason, score }) => ({ slug, title, businessType, summary, href, reason, score }));
}

/** One-tap intent seeds for the relevant-work finder, drawn from real business problems. */
export const WORK_INTENT_SEEDS: readonly { label: string; intent: string }[] = businessProblems.map((problem) => ({
  label: problem.title,
  intent: `${problem.title} ${problem.body} ${problem.service}`,
}));

// ---------------------------------------------------------------------------
// Per-page facts + smallest next step (audit U4, C2)
// ---------------------------------------------------------------------------

export type PageBrief = {
  /** One-sentence "what this page is for," grounded in real content. */
  summary: string;
  /** 2–4 supporting facts pulled from published data. */
  facts: string[];
};

const auditService = getService("audit");
const websiteService = getService("website");

/**
 * "What is this page showing me?" answered from real content. `slug` lets the
 * work-detail route name the specific project.
 */
export function pageBrief(routeKey: CompanionRouteKey, slug?: string): PageBrief {
  switch (routeKey) {
    case "home":
      return {
        summary: "The Koinophobia Labs home page — a founder-led studio that builds and repairs commercial websites, AI workflows, and custom products.",
        facts: [
          `${KNOWN_SERVICES.length} published services, from a ${studioConfig.auditPrice} audit up to custom AI work.`,
          "Scope and price are approved before any development starts.",
          "The lowest-risk starting point is the Revenue Leak Audit.",
        ],
      };
    case "services":
      return {
        summary: "Every engagement Koinophobia Labs offers, from the smallest sensible fix to a full build.",
        facts: KNOWN_SERVICES.map((service) => `${service.title} — ${service.priceLabel.toLowerCase()} ${service.price}, ${service.timeline}.`),
      };
    case "work":
      return {
        summary: "Concept builds showing how the studio approaches real business problems — the problem, the approach, and the delivered system.",
        facts: workProjects.map((project) => `${project.title} — ${project.businessType}. ${project.statusLabel}.`),
      };
    case "work_detail": {
      const project = slug ? workProjects.find((entry) => entry.slug === slug) : undefined;
      if (project) {
        return {
          summary: `${project.title}: ${project.summary}`,
          facts: [
            `Business type: ${project.businessType} (${project.statusLabel}).`,
            `Problem: ${project.problem}`,
            `Built with: ${project.capabilities.join(", ")}.`,
          ],
        };
      }
      return {
        summary: "A single concept build — the business problem, the approach, and the delivered system.",
        facts: ["Each project names the problem, the solution, and the capabilities involved."],
      };
    }
    case "products": {
      // XP-04: surface the single-sourced, readiness-gated status from the dated
      // product universe, never a hand-typed marketing string. If a product ever
      // leaves the universe it simply drops out here rather than going stale.
      const studioProducts = ["career-forge", "trendi", "you-know-ball"]
        .map((slug) => universeProducts.find((product) => product.slug === slug))
        .filter((product): product is (typeof universeProducts)[number] => Boolean(product));
      return {
        summary: "Internal products Koinophobia Labs has built — evidence of how the studio thinks, not client work.",
        facts: [
          ...studioProducts.map((product) => `${product.name} — ${publicStatusLabel(product)}.`),
          "Status comes from the dated product universe, not marketing copy, so it stays honest as each build moves.",
        ],
      };
    }
    case "process":
      return {
        summary: "How a Koinophobia Labs engagement runs, end to end.",
        facts: processSteps.map((step) => `${step.number} ${step.title} — ${step.body}`),
      };
    case "about":
      return {
        summary: "Who is behind Koinophobia Labs and how the studio works.",
        facts: [
          "Founder-led from scope to launch, based in Chicago, working remotely elsewhere.",
          "Working prototypes come before large commitments; decisions are documented.",
        ],
      };
    case "audit":
      return {
        summary: auditService ? `${auditService.title}: ${auditService.deliverable}` : "The Revenue Leak Audit — a prioritized diagnosis before you commit to a build.",
        facts: [
          auditService ? `${auditService.priceLabel}: ${auditService.price}, delivered in ${auditService.timeline}.` : `${studioConfig.auditPrice}, ${studioConfig.auditTimeline}.`,
          "A revenue leak can look like mobile visitors missing the next step, contact requests going to the wrong place, or qualified inquiries waiting too long for follow-up.",
          "The audit reviews trust, mobile flow, booking/contact paths, and conversion friction.",
          "You get a scored report you can use here or take elsewhere.",
        ],
      };
    case "intake":
      return {
        summary: "The project intake — describe the business problem and Blake reviews it personally.",
        facts: [
          "You can submit the standard form directly, or let the concierge organize the request first.",
          "Blake replies with the smallest sensible next step — sometimes that is an honest 'not yet.'",
        ],
      };
    case "demo":
      return {
        summary: "A live concept demo — an example of the kind of experience the studio builds.",
        facts: ["Use it to picture the same approach mapped onto your business."],
      };
    default:
      return { summary: "A Koinophobia Labs page.", facts: [] };
  }
}

export type NextStep = {
  label: string;
  href: string;
  /** The smallest sensible action for this page — not always "start a build." */
  rationale: string;
};

/**
 * The smallest sensible next step for a route. Deliberately not always the
 * concierge or a paid build — reading one service or running the audit is a
 * valid outcome (audit C2, mission "smallest sensible next step").
 */
export function smallestNextStep(routeKey: CompanionRouteKey): NextStep {
  switch (routeKey) {
    case "work":
    case "work_detail":
    case "demo":
      return {
        label: "See the service closest to this",
        href: "/services",
        rationale: "You are looking at proof — the natural next step is the matching service, not a form.",
      };
    case "audit":
      return {
        label: `Start the ${studioConfig.auditPrice} audit`,
        href: auditService?.href || "/audit",
        rationale: "When the cause of lost inquiries is unclear, the audit is the lowest-risk first move.",
      };
    case "process":
    case "about":
      return {
        label: "Explore the services",
        href: "/services",
        rationale: "You understand how the studio works — see which engagement fits.",
      };
    case "intake":
      return {
        label: "Let the concierge organize it",
        href: "/concierge?entry=koi",
        rationale: "Seven questions structure the request before it reaches Blake.",
      };
    default:
      return {
        label: "Find the right service",
        href: "/services",
        rationale: websiteService ? "Match the business problem to a scoped, priced engagement." : "See the published engagements.",
      };
  }
}

// ---------------------------------------------------------------------------
// Grounded free-text answers (audit U1, U5) — replaces hand-typed topic prose
// ---------------------------------------------------------------------------

export type SiteHelpTopicId =
  | "services"
  | "pricing"
  | "timing"
  | "audit"
  | "process"
  | "work"
  | "contact"
  | "ai";

export type GroundedTopic = {
  id: SiteHelpTopicId;
  question: string;
  answer: string;
  href: string;
  linkLabel: string;
  keywords: readonly string[];
};

const serviceTitles = KNOWN_SERVICES.map((service) => service.title).join(", ");
const auditFaq = faqs.find((faq) => /audit include/i.test(faq.question));

/** Topics assembled from live commercial data — prices/timelines are references, not literals. */
export const GROUNDED_TOPICS: readonly GroundedTopic[] = [
  {
    id: "services",
    question: "What can Koinophobia Labs build?",
    answer: `Koinophobia Labs offers ${KNOWN_SERVICES.length} engagements: ${serviceTitles}. The smallest useful one is recommended before a larger build.`,
    href: "/services",
    linkLabel: "Explore services",
    keywords: ["service", "services", "build", "website", "automation", "workflow", "tool", "app", "product", "offer"],
  },
  {
    id: "pricing",
    question: "How much does a project cost?",
    answer: `Published starting points: the Revenue Leak Audit is ${studioConfig.auditPrice}, a Quick Fix Sprint ${studioConfig.quickFixRange}, a Landing Page Rebuild ${studioConfig.landingPageRange}, and a Small-Business Website ${studioConfig.websiteRange}. AI work is scoped after discovery. Final scope, price, and timing are confirmed by Blake after review.`,
    href: "/services",
    linkLabel: "See prices and engagement options",
    keywords: ["website project cost", "project cost", "how much", "price", "pricing", "cost", "budget", "rate", "rates", "expensive", "charge"],
  },
  {
    id: "timing",
    question: "How long does a project take?",
    answer: `Quick fixes typically take ${studioConfig.quickFixTimeline}, landing pages ${studioConfig.landingPageTimeline}, websites ${studioConfig.websiteTimeline}, and AI workflows ${studioConfig.aiWorkflowTimeline}. The approved scope carries the real schedule, confirmed by Blake.`,
    href: "/services",
    linkLabel: "Review typical timelines",
    keywords: ["time", "timing", "timeline", "long", "fast", "quick", "week", "weeks", "deadline", "schedule"],
  },
  {
    id: "audit",
    question: "What is the Revenue Leak Audit?",
    answer: auditFaq
      ? auditFaq.answer
      : `The ${studioConfig.auditPrice} Website Revenue Leak Audit checks trust, mobile flow, booking paths, and contact visibility, then delivers one prioritized report. It is a low-risk starting point when the cause of lost inquiries is unclear.`,
    href: "/audit",
    linkLabel: "See the audit",
    keywords: ["audit", "revenue leak", "diagnosis", "diagnostic", "conversion", "converting"],
  },
  {
    id: "process",
    question: "What happens after I reach out?",
    answer: `${processSteps[0].title.toLowerCase() === "diagnose" ? "You share the business problem" : "You start"}, Blake reviews fit and the smallest sensible next step, then scope and price are confirmed before implementation. The concierge can organize the first handoff without creating an automatic quote.`,
    href: "/process",
    linkLabel: "See the process",
    keywords: ["process", "after", "next", "start", "begin", "reach out", "happens", "steps"],
  },
  {
    id: "work",
    question: "Can I see examples of the work?",
    answer: `Yes — ${workProjects.length} concept builds (${workProjects.map((project) => project.title).join(", ")}), each showing the business problem, the approach, and the delivered system.`,
    href: "/work",
    linkLabel: "View the work",
    keywords: ["work", "portfolio", "example", "examples", "case study", "case studies", "client", "clients", "proof"],
  },
  {
    id: "contact",
    question: "How do I talk to Blake?",
    answer: "Start with the project intake or ask for a human scope review. Blake personally reviews submitted projects and replies through the contact details you provide in the intake flow.",
    href: "/intake",
    linkLabel: "Start a project",
    keywords: ["contact", "email", "call", "talk", "blake", "human", "reach", "reply"],
  },
  {
    id: "ai",
    question: "Does the concierge use AI?",
    answer: "The recommendation is controlled by deterministic business rules. AI may improve interpretation when available, but it cannot select services, set prices, or change the next action. The concierge still works when AI is unavailable.",
    href: "/concierge",
    linkLabel: "Open the full concierge",
    keywords: ["ai", "artificial intelligence", "openai", "concierge", "recommendation", "deterministic"],
  },
] as const;

export type GroundedAnswer = Pick<GroundedTopic, "id" | "answer" | "href" | "linkLabel"> & {
  matched: boolean;
  /** When confidence is low, a small set of topics to disambiguate (audit U5). */
  clarify?: Array<{ id: SiteHelpTopicId; question: string }>;
};

export function answerGroundedQuestion(rawQuestion: string): GroundedAnswer {
  const question = rawQuestion
    .toLowerCase()
    .replace(/[^a-z0-9$\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  let best: GroundedTopic | null = null;
  let bestScore = 0;
  for (const topic of GROUNDED_TOPICS) {
    const score = topic.keywords.reduce(
      (total, keyword) => total + (question.includes(keyword) ? Math.max(1, keyword.split(" ").length) : 0),
      0,
    );
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) {
    return { id: best.id, answer: best.answer, href: best.href, linkLabel: best.linkLabel, matched: true };
  }

  return {
    id: "services",
    answer: "I can answer published questions about services, pricing, timelines, the audit, process, past work, AI, or contacting Blake — or the project concierge can turn a specific business problem into a rules-grounded recommendation.",
    href: "/concierge",
    linkLabel: "Use the project concierge",
    matched: false,
    clarify: [
      { id: "pricing", question: "How much does a project cost?" },
      { id: "audit", question: "What is the Revenue Leak Audit?" },
      { id: "services", question: "What can Koinophobia Labs build?" },
    ],
  };
}
