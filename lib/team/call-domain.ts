import {scheduleLead, callQueue} from "./call-schedule";
import type { TeamLead } from "./store";
import type { Deal } from "./types";
import { money } from "./config";
import { breakFirstScript } from "./scripts";
import {leadHookTier, type HookTier} from "./hook-tier";
import type {DisplayFinding} from "./plain-findings";
export const CALL_OUTCOMES = [
  "No answer",
  "Voicemail",
  "Interested",
  "Saw it",
  "Text OK",
  "Fixed on recheck",
  "Referred to current dev",
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
  hook_tier?: HookTier;
  checked_at?: string | null;
  check_it_yourself?: string | null;
  finding_label?: string | null;
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
  if(deal.services.length!==1||deal.services[0]!=="fix"||deal.price!==29900||deal.monthly)return "";
  return `Hi ${lead.contact || "there"}, it's Jayvon with Koinophobia Labs, as we just talked about. The ${problem} fix for ${lead.business}: ${money(deal.price ?? 0)}${deal.monthly ? "/month" : " flat"}, 48-72h once Blake confirms scope. Screenshot and pay page: ${url}. Reply STOP and we won't text again.`;
}
export function callScript(lead:TeamLead,partner:string,problem:string|null,_hasScreenshot=true,finding?:DisplayFinding) {
  void _hasScreenshot;
  return breakFirstScript(problem?finding:undefined,partner);
}
// Permanent eligibility is shared by the queue and partner visibility. Calling
// hours are deliberately separate: an eligible lead remains visible after 5pm.
export function eligibleToCall(lead: TeamLead) {
  if (
    lead.opted_out ||
    lead.recheck?.status === "re-check failed" ||
    /^(not interested|fixed on recheck|don['’]t call|do not call)$/i.test(lead.call_outcome ?? "") ||
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
  return eligibleToCall(lead) && ['A','B'].includes(leadHookTier(lead,now)) && ["best", "open"].includes(scheduleLead(lead, now, "America/New_York").group);
}
export function callNow(leads: TeamLead[], deals: Deal[], now = new Date()) {
  return callQueue(leads.filter(eligibleToCall), deals, now, "America/New_York").filter(r => ["best", "open"].includes(r.group)).map(r => r.lead);
}
