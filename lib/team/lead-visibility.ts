import { eligibleToCall, hasTerminalCallDeal } from "./call-domain";
import type { TeamLead } from "./store";
import type { Deal, Payment } from "./types";

export function partnerLeadVisible(lead: TeamLead, deals: Deal[], payments: Pick<Payment, "deal_id">[]) {
  // Keep open quotes/conversations and paid history, including payments on a
  // subsequently lost deal. Visibility never makes stale proof callable again.
  if (deals.some(d => d.lead_id === lead.id &&
    (d.stage !== "Lost" || payments.some(p => p.deal_id === d.id)))) return true;
  return eligibleToCall(lead) && !hasTerminalCallDeal(lead, deals);
}
