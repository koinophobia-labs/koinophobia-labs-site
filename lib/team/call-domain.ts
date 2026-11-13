import {scheduleLead, callQueue} from "./call-schedule";
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
    proof_reviewed_by?: string | null;
    opened_at: string | null;
    checkout_started_at: string | null;
    paid_at: string | null;
    expires_at: string;
  } | null;
  problem: string | null;
  plain_problem?: string | null;
  say_it?: string | null;
  impact?: string | null;
  verify_url?: string | null;
  proof_available: boolean;
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
  return cell.trim() && !phone
    ? null
    : `sms:${phone || ""}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
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
  hasScreenshot = true,
) {
  if (!problem)
    return "Run a site check and confirm the problem before making a specific claim. No confirmed screenshot proof is available yet.";
  return `Hi — is ${lead.contact || "the owner or whoever runs the website"} around?\n\nHi, my name is ${partner}. I’m a partner with Koinophobia Labs — we work remotely with businesses across the US. I’ll be quick, 20 seconds, promise.\n\nI was on ${lead.business}’s website${lead.city ? ` in ${lead.city}` : ""} and noticed: ${problem}\n\nBlake at Koinophobia Labs fixes exactly this kind of thing. The Fix starts at a flat $299, with a 48–72 hour turnaround once Blake confirms the scope.\n\nI can show you ${hasScreenshot ? "the screenshot" : "the confirmed finding"} and the approved scope on one page. What’s the best cell number to text it to?`;
}
// Permanent eligibility is shared by the queue and partner visibility. Calling
// hours are deliberately separate: an eligible lead remains visible after 5pm.
export function eligibleToCall(lead: TeamLead) {
  if (
    lead.opted_out ||
    lead.recheck?.status === "re-check failed" ||
    /^(not interested|don['’]t call|do not call)$/i.test(lead.call_outcome ?? "") ||
    !phoneNumber(lead.phone) ||
    !lead.time_zone
  )
    return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: lead.time_zone });
    return true;
  } catch {
    return false;
  }
}
export function hasTerminalCallDeal(lead: TeamLead, deals: Deal[]) {
  return deals.some(
    (d) => d.lead_id === lead.id && ["Lost", "Client paid", "Delivered"].includes(d.stage),
  );
}
export function callableNow(lead: TeamLead, now = new Date()) {
  return eligibleToCall(lead) && ["best", "open"].includes(scheduleLead(lead, now, "America/New_York").group);
}
export function callNow(leads: TeamLead[], deals: Deal[], now = new Date()) {
  return callQueue(leads.filter(eligibleToCall), deals, now, "America/New_York").filter(r => ["best", "open"].includes(r.group)).map(r => r.lead);
}
