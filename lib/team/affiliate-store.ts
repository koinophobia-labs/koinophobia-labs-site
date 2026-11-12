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
const appName = (key: string) => affiliateApps.find(a => a.key === key)?.app || key;
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
  const [apps, cash, events, next] = await Promise.all([
    q.query(`select t.app,
      coalesce(sum(c.usd_cents+coalesce(a.delta,0)) filter(where not c.revoked and not t.revoked),0)::bigint earned,
      coalesce(sum(c.usd_cents+coalesce(a.delta,0)) filter(where not c.revoked and not t.revoked and t.purchase_ms >= $2 and t.purchase_ms < $3),0)::bigint this_month
      from appstore_transactions t join appstore_commissions c on c.transaction_id=t.transaction_id and c.affiliate_id=t.affiliate_id
      left join lateral(select sum(usd_cents) delta from appstore_adjustments where transaction_id=t.transaction_id) a on true
      where t.affiliate_id=$1 and t.environment='Production' group by t.app`, [scope, monthStart, monthEnd]),
    q.query(`select
      (select coalesce(sum(p.usd_cents),0) from appstore_payouts p join appstore_commissions c using(transaction_id) where c.affiliate_id=$1 and p.status='done')::bigint paid,
      (select coalesce(sum(r.usd_cents),0) from appstore_reversals r join appstore_commissions c using(transaction_id) where c.affiliate_id=$1 and r.status='done')::bigint reversed`, [scope]),
    q.query(`with owned as (
      select t.transaction_id,t.app,t.product_id,t.purchase_ms,t.verified_at,t.revoked or c.revoked revoked,c.usd_cents
      from appstore_transactions t join appstore_commissions c on c.transaction_id=t.transaction_id and c.affiliate_id=t.affiliate_id
      where t.affiliate_id=$1 and t.environment='Production'
    ), events as (
      select t.app,t.product_id,
        case when t.revoked then coalesce((select max(n.verified_at) from appstore_notifications n where n.transaction_id=t.transaction_id and n.kind in ('REFUND','REVOKE')),t.verified_at) else to_timestamp(t.purchase_ms/1000.0) end date,
        case when t.revoked then -t.usd_cents else t.usd_cents end amount,
        case when t.revoked then 'refunded' when exists(select 1 from appstore_payouts p where p.transaction_id=t.transaction_id and p.status='done' and p.usd_cents>0) then 'paid' else 'earned' end status
      from owned t
      union all
      select t.app,t.product_id,a.created_at,a.usd_cents,'adjusted' from owned t join appstore_adjustments a using(transaction_id)
    ) select app,product_id,date,amount,status from events order by date desc,app,product_id limit 200`, [scope]),
    // Final integration will use the after-Apple ledger's authoritative month helper.
    q.query(`select min(m.fiscal_month) fiscal_month from appstore_financial_matches m
      join appstore_commissions c using(transaction_id)
      where c.affiliate_id=$1 and not c.revoked
      and not exists(select 1 from appstore_payouts p where p.transaction_id=c.transaction_id and p.status='done')`, [scope]),
  ]);
  const earned = apps.rows.reduce((n, r) => n + amount(r.earned), 0);
  const paid = amount(cash.rows[0].paid) - amount(cash.rows[0].reversed);
  const byApp: AffiliateDashboardData["byApp"] = affiliateApps.map(a => ({ app: a.app, amount: amount(apps.rows.find(r => r.app === a.key)?.earned ?? 0) }));
  for (const r of apps.rows) if (!affiliateApps.some(a => a.key === r.app)) byApp.push({ app: appName(r.app), amount: amount(r.earned) });
  return {
    name: String(account.name), earned,
    thisMonth: apps.rows.reduce((n, r) => n + amount(r.this_month), 0),
    owed: Math.max(0, earned - paid), owedBack: Math.max(0, paid - earned),
    nextFiscalMonth: earned > paid ? next.rows[0]?.fiscal_month ?? null : null, byApp,
    sales: events.rows.map(r => ({ app: appName(r.app), product: productName(r.app, r.product_id), date: new Date(r.date).toISOString(), amount: amount(r.amount), status: r.status as AffiliateSale['status'] })),
    links: affiliateLinks(scope), connection: account.ready ? 'ready' : account.connected ? 'incomplete' : 'none', fake: false,
  };
}
