import type { Queryable } from '../payments';
import type { VerifiedEvent } from './apple';

export type EarningRule = {
  id: string; partner: string; earningType: 'affiliate_commission' | 'revenue_share';
  appIds: number[] | null; attributionType: 'verified_code' | 'all_sales';
  partnerBasisPoints: number; costDeduction: string; active: boolean;
};
export function parseRule(row: Record<string, unknown>): EarningRule {
  const rule: EarningRule = {
    id: String(row.id), partner: String(row.partner),
    earningType: row.earning_type as EarningRule['earningType'],
    appIds: row.app_ids == null ? null : (row.app_ids as unknown[]).map(Number),
    attributionType: row.attribution_type as EarningRule['attributionType'],
    partnerBasisPoints: Number(row.partner_bps), costDeduction: String(row.cost_deduction), active: row.active === true,
  };
  if (!rule.id || !rule.partner || !['affiliate_commission','revenue_share'].includes(rule.earningType) ||
      !Number.isInteger(rule.partnerBasisPoints) || rule.partnerBasisPoints < 0 || rule.partnerBasisPoints > 10000 ||
      !/^\d+(\.\d{1,12})?$/.test(rule.costDeduction) ||
      (rule.appIds !== null && (!rule.appIds.length || rule.appIds.some(n => !Number.isSafeInteger(n) || n <= 0))) ||
      (rule.earningType === 'revenue_share' ? rule.attributionType !== 'all_sales' || !rule.appIds : rule.attributionType !== 'verified_code'))
    throw Error('EARNING_RULE_INVALID');
  return rule;
}
export async function earningRules(q: Queryable) {
  return (await q.query('select * from appstore_earning_rules order by id')).rows.map(parseRule);
}
export function chooseRule(event: VerifiedEvent, rules: EarningRule[]) {
  // App ownership takes precedence, even when a code is present. An inactive
  // app rule must never fall through to a code commission on the same app.
  const owned = rules.filter(r => r.earningType === 'revenue_share' && r.appIds?.includes(event.app.appAppleId));
  const candidates = owned.length ? owned.filter(r => r.active) : rules.filter(r => r.active &&
    r.earningType === 'affiliate_commission' && !!event.attribution && (!r.appIds || r.appIds.includes(event.app.appAppleId)));
  if (candidates.length > 1) throw Error('EARNING_RULE_AMBIGUOUS');
  return candidates[0];
}
export async function resolveEarningRule(q: Queryable, event: VerifiedEvent): Promise<EarningRule | undefined> {
  const t = event.transaction;
  if (!t || event.environment !== 'Production') return;
  const transaction=(await q.query('select earning_rule from appstore_transactions where transaction_id=$1',[t.transactionId])).rows[0];
  if(transaction?.earning_rule)return transaction.earning_rule;
  const saved = (await q.query('select rule from appstore_earning_attributions where app_id=$1 and environment=$2 and original_id=$3',
    [event.app.appAppleId,event.environment,t.originalTransactionId])).rows[0]?.rule as EarningRule | undefined;
  const existing=(await q.query('select calculation from appstore_commissions where transaction_id=$1',[t.transactionId])).rows[0];
  if(existing?.calculation?.earningRule)return existing.calculation.earningRule;
  const rules=await earningRules(q);
  if(saved){
    const current=chooseRule(event,rules);
    return current?.id===saved.id && current.partner===saved.partner && current.earningType===saved.earningType ? current : undefined;
  }
  return chooseRule(event,rules);
}
