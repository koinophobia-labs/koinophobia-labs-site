import {recoverMonthly,queueMonthlyRefunds} from './monthly-recovery';
import type Stripe from 'stripe';
import type { Queryable } from '../payments';

export type MoneyClient = Pick<Stripe,'transfers'|'accounts'>;
const expired=(started: string|Date, now:number)=>now-new Date(started).getTime()>23*3600000;
function insufficient(e:unknown) {
  return !!e && typeof e==='object' && 'code' in e && e.code==='balance_insufficient';
}
// Called ONLY while holding the same session lock as ingestion/reconciliation.
// Persist immutable requests before the network call. After Stripe's retention
// window an ambiguous request needs reconciliation, never a fresh transfer.
export async function drain(q:Queryable, client:MoneyClient, now=Date.now()) {
  for (const op of (await q.query("select * from appstore_payouts where status='pending' order by started_at")).rows) {
    const charge=(await q.query('select revoked from appstore_transactions where transaction_id=$1',[op.transaction_id])).rows[0];
    // A previous request may have reached Stripe even if our process died. A
    // read can recover its receipt; another create could send refunded money.
    if (['attempt_started','transfer_unconfirmed'].includes(op.error_code)) {
      let recovered: Stripe.Transfer | undefined;
      try {
        let after: string | undefined;
        for (let page=0;page<100;page++) {
          const result=await client.transfers.list({destination:op.destination,created:{gte:Math.floor(new Date(op.started_at).getTime()/1000)-60},limit:100,...(after?{starting_after:after}:{})});
          const matches=result.data.filter(t=>t.metadata.appstore_operation===op.operation_key);
          if (matches.length>1 || (recovered && matches.length)) throw Error('AMBIGUOUS_TRANSFER');
          if (matches.length) recovered=matches[0];
          if (!result.has_more) break;
          if (!result.data.length || page===99) throw Error('INCOMPLETE_TRANSFER_HISTORY');
          after=result.data[result.data.length-1].id;
        }
        if (!recovered || recovered.amount!==op.usd_cents || recovered.currency!=='usd' || recovered.destination!==op.destination) throw Error('TRANSFER_REQUIRES_REVIEW');
        await q.query("update appstore_payouts set status='done',stripe_id=$2,completed_at=now(),error_code=null where operation_key=$1",[op.operation_key,recovered.id]);
        continue;
      } catch {
        await q.query("update appstore_payouts set status='review',error_code='ambiguous_transfer_requires_review' where operation_key=$1",[op.operation_key]);
        return;
      }
    }
    if (!charge || charge.revoked) {
      await q.query("update appstore_payouts set status='cancelled',error_code='revoked_before_transfer' where operation_key=$1",[op.operation_key]);
      continue;
    }
    // The monthly owner action is now the only place that can create a transfer.
    await q.query("update appstore_payouts set status='cancelled',error_code='monthly_receipt_required' where operation_key=$1",[op.operation_key]);
  }

  // Recover a monthly attempt before reversing its allocations. Never create here.
  await recoverMonthly(q,client);
  await queueMonthlyRefunds(q);
  // Resolve an in-flight transfer first, even if a refund arrived meanwhile.
  await q.query(`insert into appstore_reversals(transaction_id,payout_key,operation_key,transfer_id,usd_cents,status,basis,sources)
    select c.transaction_id,p.operation_key,'appstore-reverse-'||encode(sha256(convert_to(p.operation_key,'UTF8')),'hex'),p.stripe_id,p.usd_cents,'pending',p.basis,p.sources
    from appstore_commissions c join appstore_payouts p using(transaction_id)
    where c.revoked and p.status='done' and p.usd_cents>0 on conflict do nothing`);
  for (const op of (await q.query("select * from appstore_reversals where status='pending' order by started_at")).rows) {
    if (expired(op.started_at,now)) {
      await q.query("update appstore_reversals set status='review',error_code='idempotency_window_expired' where operation_key=$1",[op.operation_key]);
      return;
    }
    try {
      const r=await client.transfers.createReversal(op.transfer_id,{amount:op.usd_cents,metadata:{appstore_operation:op.operation_key}},{idempotencyKey:op.operation_key});
      if (r.amount!==op.usd_cents) throw Error('REVERSAL_RECEIPT_MISMATCH');
      await q.query("update appstore_reversals set status='done',stripe_id=$2,completed_at=now(),error_code=null where operation_key=$1",[op.operation_key,r.id]);
    } catch(e) {
      await q.query("update appstore_reversals set status=$2,error_code=$3 where operation_key=$1",[op.operation_key,insufficient(e)?'owed_back':'pending',insufficient(e)?'connected_balance_insufficient':'reversal_unconfirmed']);
      if (!insufficient(e)) return;
    }
  }
}
