import type { ProblemKind } from "@/lib/concierge/types";

export const CONCIERGE_TOTAL_STEPS = 7;

export const problemChoices: { value: ProblemKind; label: string; hint: string }[] = [
  { value: "website", label: "My website is not converting", hint: "The offer, page, mobile experience, or inquiry path is not working." },
  { value: "lead_followup", label: "Leads are not being followed up", hint: "Inquiries arrive, but the handoff or response is inconsistent." },
  { value: "manual_work", label: "My team repeats manual work", hint: "People copy, route, schedule, quote, or report by hand." },
  { value: "custom_product", label: "I need a custom tool or product", hint: "A portal, dashboard, app, or purpose-built workflow is needed." },
  { value: "small_fix", label: "I have a smaller technical problem", hint: "A focused repair, integration, copy, tracking, or responsive issue." },
  { value: "unsure", label: "I am not sure yet", hint: "Something is leaking time, leads, or revenue, but the cause is unclear." },
];

const branchPrompts: Record<ProblemKind, { title: string; description: string; placeholder: string; toolsLabel?: string }> = {
  website: {
    title: "What happens on the website today?",
    description: "Describe the symptom and the action you want a visitor to take instead.",
    placeholder: "For example: mobile visitors reach the services page, but few complete the booking form…",
    toolsLabel: "Website platform or connected tools (optional)",
  },
  lead_followup: {
    title: "How do inquiries arrive, and what happens next?",
    description: "Name the channels, who responds, and where the handoff tends to break.",
    placeholder: "For example: leads arrive through Instagram and a contact form, then someone copies them into a spreadsheet…",
    toolsLabel: "Forms, inboxes, CRM, calendar, or other tools (optional)",
  },
  manual_work: {
    title: "Which task repeats, and how often?",
    description: "Walk through the current process from trigger to finished work.",
    placeholder: "For example: every new booking is copied from email into the calendar, invoice tool, and weekly report…",
    toolsLabel: "Tools involved in the process (optional)",
  },
  custom_product: {
    title: "Who would use the product, and what must they accomplish?",
    description: "Focus on the users and the essential job—not a feature wishlist.",
    placeholder: "For example: franchise managers need one dashboard to review locations and assign follow-up…",
    toolsLabel: "Existing systems or data sources (optional)",
  },
  small_fix: {
    title: "What is broken, and where does it occur?",
    description: "Keep the boundary concrete so a small fix stays a small fix.",
    placeholder: "For example: the contact form works on desktop but the submit button is hidden on iPhone…",
    toolsLabel: "Platform or integration involved (optional)",
  },
  unsure: {
    title: "Where do time, leads, or revenue seem to leak?",
    description: "Share the pattern you notice, even if the root cause is not clear yet.",
    placeholder: "For example: people ask for information, but fewer than expected book or reply after the first conversation…",
    toolsLabel: "Tools or channels involved (optional)",
  },
};
export function branchPrompt(kind: ProblemKind | undefined) {
  return branchPrompts[kind || "unsure"];
}

export function serviceLabel(service: string) {
  const labels: Record<string, string> = {
    revenue_leak_audit: "Revenue Leak Audit",
    website_rebuild: "Website or Landing Page Rebuild",
    ai_automation: "AI Workflow or Automation",
    custom_product: "Custom Product Development",
    quick_fix: "Quick Fix Sprint",
    manual_review: "Human Scope Review",
    not_a_fit: "A smaller or outside solution",
  };
  return labels[service] || "Human Scope Review";
}

export function intakeServiceFor(service: string) {
  const options: Record<string, string> = {
    revenue_leak_audit: "Website audit",
    website_rebuild: "Small-Business Website",
    ai_automation: "AI Workflow or Front Office",
    custom_product: "Custom Product Development",
    quick_fix: "Quick Fix Sprint",
    manual_review: "Not sure yet",
    not_a_fit: "Other",
  };
  return options[service] || "Not sure yet";
}
