import { scoreCategories, type ScoreCategory } from "@/lib/audit-scoring";

export const AUDIT_PRICE_LABEL = "$250";
export const AUDIT_SERVICE_INTEREST = "Website audit";
export const AUDIT_INTAKE_ANCHOR = "audit-intake";
export const AUDIT_PATH = "/audit";

export const auditEmailFallback =
  "mailto:koinophobia999@gmail.com?subject=%24250%20Website%20Revenue%20Leak%20Audit&body=Business%20name%3A%0AWebsite%20URL%3A%0AWhat%20you%20want%20more%20of%3A%20calls%20%2F%20bookings%20%2F%20inquiries%20%2F%20sales%0A";

const categoryLabels: Record<ScoreCategory, string> = {
  security: "Security basics",
  seo: "Search visibility",
  mobile: "Mobile experience",
  accessibility: "Accessibility",
  performance: "Loading speed",
  broken_links: "Broken links",
  conversion: "Booking and inquiry path",
  contact_visibility: "Contact visibility",
  content_clarity: "Content clarity",
};

export const auditMeasuredAreas = scoreCategories.map(
  (category) => categoryLabels[category],
);

export const auditDeliverables = [
  "A scored report covering every area above, delivered as a PDF you can keep.",
  "Each finding shows the evidence, what it likely costs you in lost inquiries, and the specific fix.",
  "Findings are ordered by priority, so you know what to fix first even if you never hire us.",
  "A plain-English walkthrough from Blake — no jargon, no filler.",
];

export const auditSteps: Array<{ title: string; body: string }> = [
  {
    title: "Tell Blake about your shop",
    body: "Use the short form below. It takes about two minutes and nothing is charged on this page.",
  },
  {
    title: "Blake confirms fit by email",
    body: "If the audit is the right move for your site, you get a delivery date and a secure Stripe payment link. Card details go to Stripe, never to this site. If it is not the right move, Blake says so instead of selling you one.",
  },
  {
    title: "You get the report and walkthrough",
    body: "The scored PDF arrives with a walkthrough of what was found, in plain language, ordered by what matters most.",
  },
  {
    title: `The ${AUDIT_PRICE_LABEL} is credited if you hire Koinophobia Labs`,
    body: "If you want the problems fixed, the audit price comes off the build. If you fix them yourself or with someone else, the report is still yours.",
  },
];

export const auditContinuity = {
  kicker: "Got an email from Blake?",
  heading: "The email named one problem he could see from outside.",
  body: "Conflicting hours, a booking form that stops short, five different ways to contact you, artist pages that trail off — whatever it was, that is one visible symptom. The audit checks the whole site, measures what is costing you inquiries, and puts everything in one prioritized report.",
};
