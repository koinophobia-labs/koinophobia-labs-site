import type { Pool, PoolClient } from 'pg';
import type { Queryable } from '../payments';
import type { VerifiedEvent } from './apple';
import type { Calculation } from './money';
import { owner } from '../team/domain';
import type { Partner } from '../team/types';

export async function locked<T>(database: Pool, fn: (q:PoolClient)=>Promise<T>) {
  const q=await database.connect();
  try {
    await q.query("select pg_advisory_lock(hashtext('appstore-affiliate-money'))");
    return await fn(q);
  } finally {
    await q.query("select pg_advisory_unlock(hashtext('appstore-affiliate-money'))").catch(()=>{});
    q.release();
  }
}
export async function atomic<T>(q: Queryable, fn:()=>Promise<T>) {
  await q.query('begin');
  try { const result=await fn(); await q.query('commit'); return result; }
  catch(e) { await q.query('rollback'); throw e; }
}
export async function record(q: Queryable, e: VerifiedEvent, reason: string|null, calculation?: Calculation) {
  return atomic(q, async()=>{
    const t=e.transaction;
    const existing=(await q.query('select payload_sha256 from appstore_notifications where uuid=$1',[e.uuid])).rows[0];
    if (existing && existing.payload_sha256 !== e.hash) throw Error('NOTIFICATION_UUID_COLLISION');
    await q.query(`insert into appstore_notifications(uuid,app,environment,kind,payload_sha256,transaction_id) values($1,$2,$3,$4,$5,$6) on conflict do nothing`,[e.uuid,e.app.key,e.environment,e.type,e.hash,t?.transactionId || null]);
    if (!t) return;
    const previous=(await q.query('select * from appstore_transactions where transaction_id=$1',[t.transactionId])).rows[0];
    if (previous && (previous.app!==e.app.key || previous.environment!==e.environment || previous.original_id!==t.originalTransactionId || previous.product_id!==t.productId || Number(previous.purchase_ms)!==t.purchaseDate || previous.currency!==t.currency || (previous.price_milliunits!=null && Number(previous.price_milliunits)!==t.price))) throw Error('TRANSACTION_COLLISION');
    const revoked=['REFUND','REVOKE'].includes(e.type) || t.revocationDate!=null;
    await q.query(`insert into appstore_transactions(transaction_id,original_id,app,environment,product_id,purchase_ms,price_milliunits,currency,affiliate_id,offer_identifier,attribution_transaction_id,revoked,reason)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      on conflict(transaction_id) do update set revoked=appstore_transactions.revoked or excluded.revoked,
      affiliate_id=coalesce(appstore_transactions.affiliate_id,excluded.affiliate_id),offer_identifier=coalesce(appstore_transactions.offer_identifier,excluded.offer_identifier),
      attribution_transaction_id=coalesce(appstore_transactions.attribution_transaction_id,excluded.attribution_transaction_id),reason=excluded.reason,verified_at=now()`,
      [t.transactionId,t.originalTransactionId,e.app.key,e.environment,t.productId,t.purchaseDate,t.price??null,t.currency??null,e.attribution?'messiah':null,e.attribution?.offer??null,e.attribution?.transactionId??null,revoked,reason]);
    // A refund tombstone survives older notifications and an API read that lags.
    if (calculation && !reason && !previous?.revoked && !revoked && e.environment==='Production' && e.attribution) {
      await q.query(`insert into appstore_commissions(transaction_id,affiliate_id,usd_cents,calculation) values($1,'messiah',$2,$3) on conflict do nothing`,[t.transactionId,calculation.cents,JSON.stringify(calculation)]);
    }
    if (revoked) await q.query('update appstore_commissions set revoked=true where transaction_id=$1',[t.transactionId]);
  });
}
export async function totals(q: Queryable) {
  const c=(await q.query(`select coalesce(sum(usd_cents),0)::bigint as gross, coalesce(sum(usd_cents) filter(where not revoked),0)::bigint as earned from appstore_commissions where affiliate_id='messiah'`)).rows[0];
  const p=(await q.query(`select coalesce(sum(usd_cents),0)::bigint as paid from appstore_payouts where status='done'`)).rows[0];
  const r=(await q.query(`select coalesce(sum(usd_cents),0)::bigint as reversed from appstore_reversals where status='done'`)).rows[0];
  const earned=Number(c.earned), paid=Number(p.paid)-Number(r.reversed);
  return {grossCommission:Number(c.gross),commission:earned,paid,owed:Math.max(0,earned-paid),owedBack:Math.max(0,paid-earned),reversed:Number(r.reversed)};
}
export async function ownerSnapshot(q: Queryable, actor: Partner) {
  owner(actor);
  const summary=await totals(q);
  const sales=(await q.query(`select t.app,t.environment,t.product_id,t.purchase_ms,t.price_milliunits,t.currency,t.revoked,t.reason,
    c.usd_cents,c.calculation,p.usd_cents as transferred_cents,p.withheld_cents,p.status as payout_status,p.error_code,
    r.status as reversal_status
    from appstore_transactions t left join appstore_commissions c using(transaction_id)
    left join appstore_payouts p using(transaction_id) left join appstore_reversals r using(transaction_id)
    where t.affiliate_id='messiah' order by t.purchase_ms desc limit 200`)).rows;
  const receipts=(await q.query(`select app,environment,kind,verified_at from appstore_notifications order by verified_at desc limit 20`)).rows;
  const holds=(await q.query(`select count(*)::int as count from appstore_transactions where affiliate_id='messiah' and environment='Production' and not revoked and reason in ('proceeds_unverified','proceeds_mismatch','fx_unavailable')`)).rows[0].count;
  const review=(await q.query(`select count(*)::int as count from appstore_payouts where status in ('pending','review')`)).rows[0].count;
  return {summary,sales,receipts,holds,review};
}
