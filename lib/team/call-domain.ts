import type { TeamLead } from "./store";
import type { Deal } from "./types";
import { money, SERVICES } from "./config";
export const CALL_OUTCOMES = [
  "No answer",
  "Voicemail",
  "Interested",
  "Closed",
  "Not interested",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export interface CallDetails {
  cell: string;
  outcome: string | null;
  follow_up_at: string | null;
}
export interface CallState {
  lead: TeamLead | null;
  details: CallDetails | null;
  deal: Deal | null;
  page: {
    code: string;
    opened_at: string | null;
    checkout_started_at: string | null;
    paid_at: string | null;
    expires_at: string;
  } | null;
  problem: string | null;
  script: string;
  commission: number;
}
export function phoneNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return /^1?\d{10}$/.test(digits)
    ? "+" + (digits.length === 10 ? "1" : "") + digits
    : null;
}
export function smsLink(cell: string, body: string, ios = true) {
  const phone = phoneNumber(cell);
  return phone
    ? `sms:${phone}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`
    : null;
}
export function dealText(
  lead: TeamLead,
  problem: string,
  deal: Deal,
  url: string,
) {
  const service = SERVICES.find((s) => s.id === deal.services[0]);
  return `Hi ${lead.contact || "there"}, here's the page for ${lead.business}: ${problem}. ${money(deal.price ?? 0)}${deal.monthly ? "/month" : ""}. ${service?.turnaround || "Blake confirms the timeline"}: ${url}`;
}
export function callScript(
  lead: TeamLead,
  partner: string,
  problem: string | null,
) {
  if (!problem)
    return "Run a site check and confirm the problem before making a specific claim. No confirmed screenshot proof is available yet.";
  return `Hi — is ${lead.contact || "the owner or whoever runs the website"} around?\n\nHi, my name is ${partner}. I’m a partner with Koinophobia Labs — we work remotely with businesses across the US. I’ll be quick, 20 seconds, promise.\n\nI was on ${lead.business}’s website${lead.city ? ` in ${lead.city}` : ""} and noticed: ${problem}\n\nBlake at Koinophobia Labs fixes exactly this kind of thing. The Fix starts at a flat $299, with a 48–72 hour turnaround once Blake confirms the scope.\n\nI can show you the screenshot and the approved scope on one page. What’s the best cell number to text it to?`;
}
export function callableNow(lead: TeamLead, now = new Date()) {
  if (
    lead.opted_out ||
    lead.call_outcome === "Not interested" ||
    !phoneNumber(lead.phone) ||
    !lead.time_zone
  )
    return false;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: lead.time_zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const minute =
      Number(parts.find((p) => p.type === "hour")!.value) * 60 +
      Number(parts.find((p) => p.type === "minute")!.value);
    return (
      minute >= 540 &&
      minute < 1020 &&
      !(lead.vertical === "restaurant" && minute >= 690 && minute < 810)
    );
  } catch {
    return false;
  }
}
export function callNow(leads: TeamLead[], deals: Deal[], now = new Date()) {
  return leads
    .filter(
      (l) =>
        callableNow(l, now) &&
        !deals.some(
          (d) =>
            d.lead_id === l.id &&
            ["Lost", "Client paid", "Delivered"].includes(d.stage),
        ),
    )
    .sort(
      (a, b) =>
        (b.fit_score ?? 0) - (a.fit_score ?? 0) ||
        a.business.localeCompare(b.business) ||
        a.id.localeCompare(b.id),
    );
}
