export type SiteHelpTopic = {
  id: "services" | "pricing" | "timing" | "audit" | "process" | "work" | "contact" | "ai";
  question: string;
  answer: string;
  href: string;
  linkLabel: string;
  keywords: readonly string[];
};

export const SITE_HELP_TOPICS: readonly SiteHelpTopic[] = [
  {
    id: "services",
    question: "What can Koinophobia Labs build?",
    answer: "Koinophobia Labs builds and repairs commercial websites, AI-assisted workflows, internal tools, and custom digital products. The smallest useful engagement is recommended before a larger build.",
    href: "/services",
    linkLabel: "Explore services",
    keywords: ["service", "build", "website", "automation", "workflow", "tool", "app", "product", "offer"],
  },
  {
    id: "pricing",
    question: "How much does a project cost?",
    answer: "Published starting points range from a focused $250 Revenue Leak Audit through larger website, automation, and product engagements. Final scope, price, and timing are confirmed by Blake after review.",
    href: "/services",
    linkLabel: "See prices and engagement options",
    keywords: ["website project cost", "project cost", "how much", "price", "pricing", "cost", "budget", "rate", "rates", "expensive", "charge"],
  },
  {
    id: "timing",
    question: "How long does a project take?",
    answer: "Timing depends on scope. Focused audits and repairs move faster than full websites, automations, or custom products. The services page lists typical delivery windows, and Blake confirms the real schedule after reviewing your project.",
    href: "/services",
    linkLabel: "Review typical timelines",
    keywords: ["time", "timing", "timeline", "long", "fast", "quick", "week", "weeks", "deadline", "schedule"],
  },
  {
    id: "audit",
    question: "What is the Revenue Leak Audit?",
    answer: "The $250 Website Revenue Leak Audit checks trust, mobile flow, booking paths, and contact visibility, then delivers one prioritized report. It is a low-risk starting point when the cause of lost inquiries is unclear.",
    href: "/audit",
    linkLabel: "See the audit",
    keywords: ["audit", "revenue leak", "diagnosis", "diagnostic", "conversion", "converting"],
  },
  {
    id: "process",
    question: "What happens after I reach out?",
    answer: "You share the business problem, Blake reviews fit and the smallest sensible next step, then scope and price are confirmed before implementation starts. The concierge can organize the first handoff without creating an automatic quote.",
    href: "/process",
    linkLabel: "See the process",
    keywords: ["process", "after", "next", "start", "begin", "reach out", "happens", "steps"],
  },
  {
    id: "work",
    question: "Can I see examples of the work?",
    answer: "Yes. The Work section shows commercial examples across websites, service businesses, and structured digital experiences, including the problem, approach, and delivered system.",
    href: "/work",
    linkLabel: "View client work",
    keywords: ["work", "portfolio", "example", "examples", "case study", "case studies", "client", "clients"],
  },
  {
    id: "contact",
    question: "How do I talk to Blake?",
    answer: "Start with the project intake or ask for a human scope review. Blake personally reviews submitted projects and replies through the contact details you provide in the existing intake flow.",
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

export type SiteHelpAnswer = Pick<SiteHelpTopic, "id" | "answer" | "href" | "linkLabel"> & { matched: boolean };

export function answerSiteQuestion(rawQuestion: string): SiteHelpAnswer {
  const question = rawQuestion.toLowerCase().replace(/[^a-z0-9$\s-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  let best: SiteHelpTopic | null = null;
  let bestScore = 0;

  for (const topic of SITE_HELP_TOPICS) {
    const score = topic.keywords.reduce((total, keyword) => total + (question.includes(keyword) ? Math.max(1, keyword.split(" ").length) : 0), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) return { id: best.id, answer: best.answer, href: best.href, linkLabel: best.linkLabel, matched: true };
  return {
    id: "services",
    answer: "I can answer basic questions about services, pricing, timelines, audits, process, past work, AI, or contacting Blake. For a specific business problem, use the project concierge so the deterministic router can recommend a starting point.",
    href: "/concierge",
    linkLabel: "Use the project concierge",
    matched: false,
  };
}
