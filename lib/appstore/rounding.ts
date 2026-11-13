import type { Queryable } from '../payments';
import { roundMonthlyAmounts, type Calculation } from './money';

export async function reconcileMonthlyRounding(q: Queryable, month: string, reportHash: string) {
  // Reconcile exact entitlements across the fiscal month, including corrections
  // to paid earnings. Original commissions and paid allocation snapshots never change.
  const rows = (await q.query(`select c.transaction_id,c.usd_cents+coalesce(a.delta,0) base_cents,
      coalesce(a.calculation,c.calculation) calculation
    from appstore_commissions c join appstore_transactions t using(transaction_id)
    join appstore_financial_matches m using(transaction_id)
    left join lateral(select sum(usd_cents) delta,(array_agg(calculation order by id desc))[1] calculation
      from appstore_adjustments where transaction_id=c.transaction_id) a on true
    where m.fiscal_month=$1 and m.report_hash=$2 and not c.revoked and not t.revoked
      and coalesce(a.calculation,c.calculation)->>'precisionVersion'='1'
    order by c.transaction_id`, [month, reportHash])).rows;
  const amounts = roundMonthlyAmounts(rows.map(r => ({ id: String(r.transaction_id), exactCents: (r.calculation as Calculation).exactCents })));
  for (const r of rows) {
    await q.query(`insert into appstore_monthly_rounding(transaction_id,fiscal_month,report_hash,delta_cents,exact_usd)
      values($1,$2,$3,$4,$5) on conflict(transaction_id) do update set fiscal_month=excluded.fiscal_month,
      report_hash=excluded.report_hash,delta_cents=excluded.delta_cents,exact_usd=excluded.exact_usd,updated_at=now()`,
    [r.transaction_id,month,reportHash,amounts.get(String(r.transaction_id))! - Number(r.base_cents),(r.calculation as Calculation).exactUsd]);
  }
}
