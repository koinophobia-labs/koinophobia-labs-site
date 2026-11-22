export const monthlyHold:Record<string,string>={
  financial_report_unavailable:'Awaiting Apple’s final financial report.',
  financial_report_empty:'Apple’s report has no settlement rows.',
  financial_matching_incomplete:'Held: some purchases need financial reconciliation.',
  apple_verification_incomplete:'Held: some purchases need fresh Apple verification.',
  prior_transfer_requires_review:'Held while an earlier transfer is reviewed.',
  connect_not_ready:'Apple payment received; awaiting Messiah’s connected account. Retry here once ready.',
  transfers_unavailable:'Apple payment received; transfers are unavailable. Retry here once ready.',
  platform_balance_insufficient:'Apple payment received; Stripe balance insufficient. Retry this month after funding is available.',
  request_prepared:'Held: the prepared transfer requires review.',
  attempt_started:'Transfer confirmation pending. Do not send a separate payment.',
  transfer_unconfirmed:'Transfer confirmation pending. Do not send a separate payment.',
  ambiguous_transfer_requires_review:'Transfer requires review. No replacement payment will be sent.',
};
export function monthlyStatus(status:string,amount:number,withheld:number,error:string|null) {
  if(status==='paid')return amount>0?'Paid':withheld>0?'Settled by owed-back offset':'Settled — nothing payable';
  return (error&&monthlyHold[error])||'Apple payment received; payout pending.';
}
