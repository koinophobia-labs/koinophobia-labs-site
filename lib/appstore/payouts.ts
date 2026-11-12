import { createHash } from 'node:crypto';
import type Stripe from 'stripe';
import type { Queryable } from '../payments';
import { totals } from './ledger';

const key=(kind:string,id:string)=>'appstore-'+kind+'-'+createHash('sha256').update(id).digest('hex');
export type MoneyClient = Pick<Stripe,'transfers'|'accounts'>;
const expired=(started: string|Date, now:number)=>now-new Date(started).getTime()>23*3600000;
function insufficient(e:unknown) {
  return !!e && typeof e==='object' && 'code' in e && e.code==='balance_insufficient';
}
// Called ONLY while holding the same session lock as ingestion/reconciliation.
// Persist immutable requests before the network call. After Stripe's retention
// window an ambiguous request needs reconciliation, never a fresh transfer.
export async function drain(q:Queryable, client:MoneyClient, now=Date.now(), verifiedIds?:Set<string>) {
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
    if (!verifiedIds?.has(op.transaction_id)) continue;
    if (expired(op.started_at,now)) {
      await q.query("update appstore_payouts set status='review',error_code='idempotency_window_expired' where operation_key=$1",[op.operation_key]);
      return;
    }
    try {
      await q.query("update appstore_payouts set error_code='attempt_started' where operation_key=$1",[op.operation_key]);
      const t=await client.transfers.create({amount:op.usd_cents,currency:'usd',destination:op.destination,metadata:{appstore_operation:op.operation_key}}, {idempotencyKey:op.operation_key});
      if (t.amount!==op.usd_cents || t.currency!=='usd' || t.destination!==op.destination) throw Error('TRANSFER_RECEIPT_MISMATCH');
      await q.query("update appstore_payouts set status='done',stripe_id=$2,completed_at=now(),error_code=null where operation_key=$1",[op.operation_key,t.id]);
    } catch(e) {
      await q.query("update appstore_payouts set error_code=$2 where operation_key=$1",[op.operation_key,insufficient(e)?'platform_balance_insufficient':'transfer_unconfirmed']);
      return;
    }
  }
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
  const uncertain=(await q.query(`select 1 from appstore_payouts where status in ('pending','review') union all select 1 from appstore_reversals where status in ('pending','review') limit 1`)).rows.length;
  if (uncertain) return;
  const account=(await q.query(`select a.stripe_account_id from appstore_affiliates f join team_partners p on p.id=f.partner_id join team_connect_accounts a on a.partner_id=p.id where f.id='messiah' and p.active and p.role='partner'`)).rows[0];
  let destination:string|undefined;
  if (account) {
    const a=await client.accounts.retrieve(account.stripe_account_id);
    if (!('deleted' in a) && a.details_submitted && a.payouts_enabled && a.capabilities?.transfers==='active') destination=a.id;
  }
  for (const c of (await q.query(`select c.*,c.usd_cents+coalesce(a.delta,0)-coalesce(p.allocated,0) as outstanding,coalesce(a.revision,0) as revision,coalesce(p.allocated,0) as settled,a.final_calculation from appstore_commissions c left join lateral (select sum(usd_cents) delta,max(id) revision,(array_agg(calculation order by id desc))[1] final_calculation from appstore_adjustments where transaction_id=c.transaction_id) a on true left join lateral (select sum(usd_cents) allocated from appstore_payouts where transaction_id=c.transaction_id and status='done') p on true where not c.revoked and c.usd_cents+coalesce(a.delta,0)>coalesce(p.allocated,0) order by c.created_at,c.transaction_id`)).rows) {
    if (verifiedIds && !verifiedIds.has(c.transaction_id)) continue;
    const balance=await totals(q);
    const amount=Math.min(Number(c.outstanding),balance.owed), withheld=Number(c.outstanding)-amount;
    if (!amount || !destination) continue; // Accrue without creating an account.
    await q.query(`insert into appstore_payouts(transaction_id,operation_key,destination,usd_cents,withheld_cents,status,completed_at,basis,sources) values($1,$2,$3,$4,$5,$6,case when $4=0 then now() else null end,$7,$8)`,[c.transaction_id,key('pay',c.transaction_id+':'+c.revision+':'+c.settled),destination??null,amount,withheld,amount?'pending':'done',(c.final_calculation||c.calculation).basis,JSON.stringify((c.final_calculation||c.calculation).sources)]);
    if (amount) {
      // One durable operation at a time; a failure blocks all new transfers.
      await drain(q,client,now,verifiedIds);
      return;
    }
  }
}
