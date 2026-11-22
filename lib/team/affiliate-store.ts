import {earningRules} from '../appstore/earning-rules';
import { payableBalances } from '../appstore/monthly-balances';
import type { Queryable } from '../payments';
import type { Partner } from './types';
import { Fault } from './domain';
import { affiliateApps, affiliateLinks } from './affiliate-links';
import type { AffiliateDashboardData, AffiliateSale } from './affiliate-view';

const amount = (value: unknown) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw Error('AFFILIATE_AMOUNT_INVALID');
  return n;
};
const ownedApps: Record<string,string>={'saiikhotic-spades':'Saiikhotic Spades','saiikhotic-network':'Saiikhotic Network'};
const appName = (key: string) => ownedApps[key] || affiliateApps.find(a => a.key === key)?.app || key;
const productName = (app: string, product: string) => affiliateApps.find(a => a.key === app)?.product || product;

export async function affiliateSnapshot(q: Queryable, partner: Partner, now = new Date()): Promise<AffiliateDashboardData> {
  if (partner.role !== 'affiliate' || !partner.active) throw new Fault('Not found.', 404);
  // Recheck the active role and link in the database. No browser-supplied ID is used.
  const account = (await q.query(`select a.id,p.name,a.rate_bps,a.commission_basis,
      ca.partner_id is not null connected,coalesce(ca.details_submitted and ca.payouts_enabled,false) ready
    from appstore_affiliates a join team_partners p on p.id=a.partner_id
    left join team_connect_accounts ca on ca.partner_id=p.id
    where p.id=$1 and p.role='affiliate' and p.active`, [partner.id])).rows[0];
  if (!account) throw new Fault('Affiliate account is not linked. Contact Blake.', 409);
  if (Number(account.rate_bps) !== 2500 || account.commission_basis !== 'apple_proceeds')
    throw new Fault('Affiliate commission needs owner review.', 409);
  const scope = String(account.id);
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const [apps, balances, events, next, rules] = await Promise.all([
    q.query(`select t.app,
      coalesce(sum(c.usd_cents+coalesce(a.delta,0)+coalesce((select delta_cents from appstore_effective_rounding where transaction_id=c.transaction_id),0)) filter(where not c.revoked and not t.revoked),0)::bigint earned,
      coalesce(sum(c.usd_cents+coalesce(a.delta,0)+coalesce((select delta_cents from appstore_effective_rounding where transaction_id=c.transaction_id),0)) filter(where not c.revoked and not t.revoked and t.purchase_ms >= $2 and t.purchase_ms < $3),0)::bigint this_month
      from appstore_transactions t join appstore_commissions c on c.transaction_id=t.transaction_id and c.affiliate_id=t.affiliate_id
      left join lateral(select sum(usd_cents) delta from appstore_adjustments where transaction_id=t.transaction_id) a on true
      where t.affiliate_id=$1 and t.environment='Production' group by t.app`, [scope, monthStart, monthEnd]),
    payableBalances(q, scope),
    q.query(`with owned as (
      select t.transaction_id,t.app,t.product_id,t.purchase_ms,t.verified_at,t.revoked or c.revoked revoked,c.usd_cents+coalesce((select delta_cents from appstore_effective_rounding where transaction_id=c.transaction_id),0) usd_cents,
      coalesce(c.calculation->'earningRule'->>'earningType','affiliate_commission') earning_type,coalesce((c.calculation->>'affiliateBasisPoints')::int,2500) rate_bps
      from appstore_transactions t join appstore_commissions c on c.transaction_id=t.transaction_id and c.affiliate_id=t.affiliate_id
      where t.affiliate_id=$1 and t.environment='Production'
    ), events as (
      select t.app,t.product_id,t.earning_type,t.rate_bps,
        case when t.revoked then coalesce((select max(n.verified_at) from appstore_notifications n where n.transaction_id=t.transaction_id and n.kind in ('REFUND','REVOKE')),t.verified_at) else to_timestamp(t.purchase_ms/1000.0) end date,
        case when t.revoked then -(t.usd_cents+coalesce((select sum(a.usd_cents) from appstore_adjustments a where a.transaction_id=t.transaction_id),0)) else t.usd_cents end amount,
        case when t.revoked then 'refunded' when exists(select 1 from appstore_payouts p where p.transaction_id=t.transaction_id and p.status='done' and p.usd_cents+p.withheld_cents>0)
          or exists(select 1 from appstore_monthly_allocations a join appstore_monthly_runs r using(fiscal_month) where a.transaction_id=t.transaction_id and r.status='paid' and a.operation_key=r.operation_key and a.usd_cents+a.withheld_cents>0) then 'paid' else 'earned' end status
      from owned t
      union all
      select t.app,t.product_id,t.earning_type,t.rate_bps,a.created_at,a.usd_cents,'adjusted' from owned t join appstore_adjustments a using(transaction_id)
    ) select app,product_id,earning_type,rate_bps,date,amount,status from events order by date desc,app,product_id limit 200`, [scope]),
    // Apple's financial match supplies the fiscal month; never infer it from purchase date.
    q.query(`select min(m.fiscal_month) fiscal_month from appstore_financial_matches m
      join appstore_commissions c using(transaction_id)
      join appstore_transactions t using(transaction_id)
      left join lateral(select sum(usd_cents) delta from appstore_adjustments where transaction_id=c.transaction_id) a on true
      left join lateral(select sum(usd_cents+withheld_cents) settled from appstore_payouts where transaction_id=c.transaction_id and status='done') p on true
      left join lateral(select sum(x.usd_cents+x.withheld_cents) settled from appstore_monthly_allocations x join appstore_monthly_runs r using(fiscal_month) where x.transaction_id=c.transaction_id and r.status='paid' and x.operation_key=r.operation_key) b on true
      where c.affiliate_id=$1 and not c.revoked and not t.revoked and t.environment='Production'
      and c.usd_cents+coalesce(a.delta,0)+coalesce((select delta_cents from appstore_effective_rounding where transaction_id=c.transaction_id),0)>coalesce(p.settled,0)+coalesce(b.settled,0)`, [scope]),
    earningRules(q),
  ]);
  const earned = apps.rows.reduce((n, r) => n + amount(r.earned), 0);
  const paid = balances.reduce((n, row) => n + amount(row.paid), 0);
  const receiptAuthorized = balances.reduce((n, row) => n + amount(row.earned), 0);
  const byApp: AffiliateDashboardData["byApp"] = affiliateApps.map(a => ({ app: a.app, amount: amount(apps.rows.find(r => r.app === a.key)?.earned ?? 0) }));
  for (const r of apps.rows) if (!affiliateApps.some(a => a.key === r.app)) byApp.push({ app: appName(r.app), amount: amount(r.earned) });
  return {
    name: String(account.name), earned,
    earningRules:rules.filter(r=>r.partner===scope).map(r=>({type:r.earningType,percentage:r.partnerBasisPoints/100,active:r.active,costDeduction:r.costDeduction})),
    thisMonth: apps.rows.reduce((n, r) => n + amount(r.this_month), 0),
    owed: Math.max(0, earned - paid), owedBack: Math.max(0, paid - receiptAuthorized),
    nextFiscalMonth: earned > paid ? next.rows[0]?.fiscal_month ?? null : null, byApp,
    sales: events.rows.map(r => ({ app: appName(r.app), product: productName(r.app, r.product_id), date: new Date(r.date).toISOString(), amount: amount(r.amount), status: r.status as AffiliateSale['status'], earningType:r.earning_type as AffiliateSale['earningType'],percentage:Number(r.rate_bps)/100 })),
    links: affiliateLinks(scope), connection: account.ready ? 'ready' : account.connected ? 'incomplete' : 'none', fake: false,
  };
}
