import type Stripe from 'stripe';
import type {Queryable} from '../payments';
import type {MoneyClient} from './payouts';

// Recovery is read-only at Stripe. An absent receipt is not proof of non-payment.
export async function recoverMonthly(q:Queryable,client:MoneyClient) {
  const runs=(await q.query("select * from appstore_monthly_runs where status in ('pending','review') order by received_at")).rows;
  for(const run of runs) {
    if(!['attempt_started','transfer_unconfirmed','ambiguous_transfer_requires_review'].includes(run.error_code))continue;
    try {
      let receipt:Stripe.Transfer|undefined,after:string|undefined;
      for(let page=0;page<100;page++) {
        const result=await client.transfers.list({destination:run.destination,created:{gte:Math.floor(new Date(run.started_at).getTime()/1000)-60},limit:100,...(after?{starting_after:after}:{})});
        const matches=result.data.filter(t=>t.metadata.appstore_operation===run.operation_key);
        if(matches.length>1||(receipt&&matches.length))throw Error('AMBIGUOUS_RECEIPT');
        if(matches.length)receipt=matches[0];
        if(!result.has_more)break;
        if(!result.data.length||page===99)throw Error('INCOMPLETE_HISTORY');
        after=result.data[result.data.length-1].id;
      }
      if(!receipt||receipt.amount!==Number(run.usd_cents)||receipt.currency!=='usd'||receipt.destination!==run.destination)throw Error('RECEIPT_UNCONFIRMED');
      await q.query("update appstore_monthly_runs set status='paid',stripe_id=$2,error_code=null,completed_at=now() where fiscal_month=$1",[run.fiscal_month,receipt.id]);
    } catch {
      await q.query("update appstore_monthly_runs set status='review',error_code='ambiguous_transfer_requires_review' where fiscal_month=$1",[run.fiscal_month]);
    }
  }
}

export async function queueMonthlyRefunds(q:Queryable) {
  await q.query(`insert into appstore_reversals(transaction_id,operation_key,transfer_id,usd_cents,status,basis,sources)
    select a.transaction_id,'appstore-monthly-reverse-'||encode(sha256(convert_to(a.operation_key||':'||a.transaction_id,'UTF8')),'hex'),
      m.stripe_id,a.usd_cents,'pending','trued_up_financial_report',
      jsonb_build_array(jsonb_build_object('fiscalMonth',a.fiscal_month,'reportHash',a.report_hash))
    from appstore_monthly_allocations a join appstore_monthly_runs m using(fiscal_month)
    join appstore_commissions c using(transaction_id)
    where a.operation_key=m.operation_key and m.status='paid' and m.stripe_id is not null and c.revoked and a.usd_cents>0
    on conflict do nothing`);
}
