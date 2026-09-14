// INTERNAL. The CRM's founder sales packet still needs an offer catalogue to
// name a recommended engagement, its typical range, and its timeline. This is
// that catalogue, and nothing here is rendered on the public site anymore
// (the public offer is the three engagement shapes in lib/products.ts).
// Retire this file when the packet learns to recommend those shapes instead.

export const studioConfig = {
  auditPrice: "$250",
  quickFixRange: "$149–$499",
  landingPageRange: "$499–$1,200",
  websiteRange: "$1,500–$3,500",
  auditTimeline: "2–3 business days",
  quickFixTimeline: "1–3 business days",
  landingPageTimeline: "3–7 business days",
  websiteTimeline: "1–3 weeks",
  aiWorkflowTimeline: "1–4 weeks",
  auditCreditEnabled: true,
  postLaunchSupportCopy:
    "Every project includes a defined post-launch support period. The exact window and covered issues are included in the approved project scope.",
  revisionCopy:
    "Revision rounds are defined in the project scope. Work outside the approved scope receives a separate estimate; small fixes found during launch testing are part of QA.",
  ownershipCopy:
    "Account access, domain ownership, deployed-project access, third-party costs, and any optional maintenance are documented before launch.",
} as const;

export const serviceOffers = [
  {
    slug: "audit",
    title: "Revenue Leak Audit",
    forWhom: "Owners who know something is underperforming but need a prioritized diagnosis before committing to a build.",
    problem: "Unclear messaging, broken customer paths, mobile friction, and missed booking or inquiry opportunities.",
    includes: ["Website and journey review", "Conversion-friction review", "Automation opportunities", "Prioritized roadmap", "PDF report and walkthrough"],
    price: studioConfig.auditPrice,
    priceLabel: "Flat fee",
    timeline: studioConfig.auditTimeline,
    deliverable: "A scored, prioritized report you can use with Koinophobia Labs or take elsewhere.",
    href: "/audit",
    cta: "Start with an audit",
    featured: true,
  },
  {
    slug: "quick-fix",
    title: "Quick Fix Sprint",
    forWhom: "Businesses with one contained issue that should not become a full redesign.",
    problem: "A broken CTA, weak form, mobile layout issue, analytics gap, or booking-flow snag.",
    includes: ["Focused diagnosis", "Agreed repair", "Cross-device QA", "Launch support"],
    price: studioConfig.quickFixRange,
    priceLabel: "Typical range",
    timeline: studioConfig.quickFixTimeline,
    deliverable: "The agreed repair implemented and tested.",
    href: "/intake?service=Quick%20Fix%20Sprint",
    cta: "Request a sprint",
  },
  {
    slug: "landing-page",
    title: "Landing Page Rebuild",
    forWhom: "Businesses that need one clear offer and a stronger path from visit to inquiry.",
    problem: "The current page is unclear, slow, hard to use on mobile, or missing a focused call to action.",
    includes: ["Messaging structure", "Responsive design and build", "CTA and lead form", "Basic analytics", "Launch support"],
    price: studioConfig.landingPageRange,
    priceLabel: "Typical range",
    timeline: studioConfig.landingPageTimeline,
    deliverable: "A launched, responsive landing page with a working inquiry path.",
    href: "/intake?service=Landing%20Page%20Rebuild",
    cta: "Request a landing page",
  },
  {
    slug: "website",
    title: "Small-Business Website",
    forWhom: "Service businesses that need a credible, useful home base instead of a generic template or social-only presence.",
    problem: "Customers cannot quickly understand the business, services, proof, process, or next step.",
    includes: ["Strategy and copy structure", "Custom responsive build", "Core service pages", "Inquiry flow", "SEO and analytics basics", "Deployment and launch checklist"],
    price: studioConfig.websiteRange,
    priceLabel: "Typical range",
    timeline: studioConfig.websiteTimeline,
    deliverable: "A launched business website with documented access and handoff.",
    href: "/intake?service=Small-Business%20Website",
    cta: "Request a website",
  },
  {
    slug: "ai-front-office",
    title: "AI Workflow or Front Office",
    forWhom: "Businesses losing time to repetitive intake, routing, preparation, or follow-up.",
    problem: "The workflow spans too many tools and depends on staff remembering every step.",
    includes: ["Process mapping", "Structured intake", "Summarization or routing", "Dashboard or tool integration", "Follow-up and handoff logic", "Critical-path testing"],
    price: "Custom after discovery",
    priceLabel: "Scope-dependent",
    timeline: studioConfig.aiWorkflowTimeline,
    deliverable: "An approved workflow or front-office system built around the actual business process.",
    href: "/intake?service=AI%20Workflow%20or%20Front%20Office",
    cta: "Describe the workflow",
  },
];

