import type {Queryable} from '../payments';
export type MonthlyBalance={transaction_id:string;revoked:boolean;purchase_ms:string;reason:string|null;fiscal_month:string;report_hash:string;earned:string|number;paid:string|number};
export async function payableBalances(q:Queryable, affiliateId = 'messiah') {
  return (await q.query(`select c.transaction_id,c.revoked,t.purchase_ms,t.reason,m.fiscal_month,m.report_hash,
    case when not c.revoked and r.fiscal_month is not null and m.transaction_id is not null
      then least(c.usd_cents+coalesce(a.delta,0),coalesce(auth.cap,0)) else 0 end as earned,
    coalesce(p.paid,0)+coalesce(b.paid,0)-coalesce(v.reversed,0) as paid
    from appstore_commissions c join appstore_transactions t using(transaction_id)
    left join appstore_financial_matches m using(transaction_id)
    left join appstore_monthly_runs r on r.fiscal_month=m.fiscal_month
    left join lateral (select (array_agg(authorized_cents order by confirmed_at desc,report_hash desc))[1] cap from appstore_monthly_authorizations where transaction_id=c.transaction_id) auth on true
    left join lateral (select sum(usd_cents) delta from appstore_adjustments where transaction_id=c.transaction_id) a on true
    left join lateral (select sum(usd_cents) paid from appstore_payouts where transaction_id=c.transaction_id and status='done') p on true
    left join lateral (select sum(x.usd_cents) paid from appstore_monthly_allocations x join appstore_monthly_runs y using(fiscal_month) where x.transaction_id=c.transaction_id and y.status='paid' and x.operation_key=y.operation_key) b on true
    left join lateral (select sum(usd_cents) reversed from appstore_reversals where transaction_id=c.transaction_id and status='done') v on true
    where c.affiliate_id=$1 order by m.fiscal_month,t.purchase_ms,c.transaction_id`,[affiliateId])).rows as MonthlyBalance[];
}
