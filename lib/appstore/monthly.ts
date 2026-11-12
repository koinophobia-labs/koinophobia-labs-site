import {payableBalances} from './monthly-balances';
import {createHash} from 'node:crypto';
import type {Pool} from 'pg';
import type {Queryable} from '../payments';
import type {Partner} from '../team/types';
import {Fault,owner} from '../team/domain';
import {connectStripe} from '../team/connect-client';
import {atomic,locked} from './ledger';
import {drain,type MoneyClient} from './payouts';
import {fetchFinancialMonth,parseFinancialReport,reconcileFinancial} from './financial-reports';
import {refresh,transfersEnabled} from './service';
import {exchangeRate} from './money';

const safe=(n:unknown)=>{const value=Number(n);if(!Number.isSafeInteger(value))throw Error('MONEY_RANGE');return value;};
export function paymentMonth(input:unknown) {
  if(typeof input!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(input)||input>new Date().toISOString().slice(0,7))throw new Fault('Enter an Apple fiscal month in YYYY-MM format.');
  return input;
}
export async function monthlyOwner(q:Queryable,actor:Partner) {
  owner(actor);
  if(!actor.active||!(await q.query("select 1 from team_partners where id=$1 and role='owner' and active",[actor.id])).rows.length)
    throw new Fault('Only an active owner can confirm Apple payment.',403);
}
// Only receipt-authorized, financially reconciled earnings can fund a payout.
// Future provisional earnings MUST NOT mask an earlier refund debt.

type Dependencies={
  report?:typeof fetchFinancialMonth;
  refresh?:typeof refresh;
  fx?:typeof exchangeRate;
  enabled?:()=>boolean;
  client?:()=>MoneyClient;
};
export async function markApplePaymentReceived(database:Pool,actor:Partner,input:{month:unknown;received:unknown},dependencies:Dependencies={}) {
  owner(actor);
  const month=paymentMonth(input.month);
  if(input.received!==true)throw new Fault('Confirm that Apple’s payment has reached Blake’s bank account.');
  return locked(database,async q=>{
    await monthlyOwner(q,actor);
    let operation='appstore-monthly-'+createHash('sha256').update('messiah:'+month).digest('hex');
    await q.query('insert into appstore_monthly_runs(fiscal_month,received_by,operation_key) values($1,$2,$3) on conflict do nothing',[month,actor.id,operation]);
    const read=async()=>(await q.query('select fiscal_month,status,usd_cents,withheld_cents,error_code from appstore_monthly_runs where fiscal_month=$1',[month])).rows[0];
    const enabled=(dependencies.enabled||transfersEnabled)();
    const client=enabled?(dependencies.client||connectStripe)():undefined;
    if(client)await drain(q,client);
    let run=await read();
    // Only an owner may discard a provably unsent request. Keep its immutable
    // snapshot and allocations; retry gets a new key after fresh reconciliation.
    if(['pending','review'].includes(run.status)&&['request_prepared','platform_balance_insufficient'].includes(run.error_code)) {
      await atomic(q,async()=>{
        await q.query("update appstore_monthly_attempts set disposition='cancelled_unsent' where operation_key=(select operation_key from appstore_monthly_runs where fiscal_month=$1)",[month]);
        const next=(await q.query('select attempt_number+1 as n from appstore_monthly_runs where fiscal_month=$1',[month])).rows[0].n;
        operation='appstore-monthly-'+createHash('sha256').update('messiah:'+month+':'+next).digest('hex');
        await q.query("update appstore_monthly_runs set status='received',operation_key=$2,attempt_number=$3,usd_cents=0,withheld_cents=0,destination=null,started_at=null,error_code=null where fiscal_month=$1",[month,operation,next]);
      });
      run=await read();
    }
    if(['pending','review'].includes(run.status))return run;
    operation=(await q.query('select operation_key from appstore_monthly_runs where fiscal_month=$1',[month])).rows[0].operation_key;
    const hold=async(code:string)=>{await q.query('update appstore_monthly_runs set error_code=$2 where fiscal_month=$1',[month,code]);return read();};
    if((await q.query(`select 1 from appstore_payouts where status in ('pending','review') union all
      select 1 from appstore_reversals where status in ('pending','review') union all
      select 1 from appstore_monthly_runs where status in ('pending','review') limit 1`)).rows.length)return hold('prior_transfer_requires_review');
    let report;
    try{report=await (dependencies.report||fetchFinancialMonth)(month);}catch{return hold('financial_report_unavailable');}
    const rows=parseFinancialReport(report.raw.toString('utf8'));
    const start=rows.map(r=>r.start).sort()[0],end=rows.map(r=>r.end).sort().at(-1);
    if(!start||!end)return hold('financial_report_empty');
    // Refresh every potentially payable transaction, including older adjustments.
    const candidates=(await q.query(`select t.transaction_id from appstore_transactions t
      left join appstore_financial_matches m using(transaction_id)
      left join appstore_monthly_runs r on r.fiscal_month=m.fiscal_month
      where t.affiliate_id='messiah' and t.environment='Production' and not t.revoked and t.price_milliunits>0
        and ((to_timestamp(t.purchase_ms/1000.0) at time zone 'UTC')::date between $1::date and $2::date or r.fiscal_month is not null)`,[start,end])).rows.map(r=>String(r.transaction_id));
    const verified=await (dependencies.refresh||refresh)(q,candidates);
    const result=await reconcileFinancial(q,report.raw,month,report.source,dependencies.fx||exchangeRate);
    if(result.held||result.status==='superseded_report')return hold('financial_matching_incomplete');
    const hash=createHash('sha256').update(report.raw).digest('hex');
    // Include already matched rows in the coverage check: invalid or missing fresh
    // Apple confirmation cannot disappear from the Finance parser's candidate list.
    const current=(await q.query(`select t.transaction_id,t.revoked,t.reason,m.report_hash from appstore_transactions t
      left join appstore_financial_matches m on m.transaction_id=t.transaction_id and m.fiscal_month=$3
      where t.affiliate_id='messiah' and t.environment='Production' and t.price_milliunits>0
      and (to_timestamp(t.purchase_ms/1000.0) at time zone 'UTC')::date between $1::date and $2::date`,[start,end,month])).rows;
    if(current.some(t=>!t.revoked&&(!verified.has(t.transaction_id)||t.reason||t.report_hash!==hash)))return hold('financial_matching_incomplete');
    // Bind this explicit bank-receipt confirmation to the exact report amounts.
    // A cron's later positive correction cannot borrow this authority.
    await q.query(`insert into appstore_monthly_authorizations(fiscal_month,report_hash,transaction_id,authorized_cents,confirmed_by)
      select $1,$2,c.transaction_id,c.usd_cents+coalesce(a.delta,0),$3
      from appstore_commissions c join appstore_financial_matches m using(transaction_id)
      left join lateral (select sum(usd_cents) delta from appstore_adjustments where transaction_id=c.transaction_id) a on true
      where m.fiscal_month=$1 and m.report_hash=$2 and not c.revoked on conflict do nothing`,[month,hash,actor.id]);
    if(run.status==='paid')return read(); // Confirm corrections, but never pay the same month twice.
    const balances=await payableBalances(q);
    if(balances.some(t=>safe(t.earned)>0&&(!verified.has(t.transaction_id)||t.reason)))return hold('apple_verification_incomplete');
    let available=Math.max(0,balances.reduce((n,t)=>n+safe(t.earned)-safe(t.paid),0));safe(available);
    const allocations=balances.filter(t=>safe(t.earned)>safe(t.paid)).map(t=>{
      const outstanding=safe(t.earned)-safe(t.paid),amount=Math.min(outstanding,available);available-=amount;
      return {...t,amount,withheld:outstanding-amount};
    });
    const amount=allocations.reduce((n,t)=>n+t.amount,0),withheld=allocations.reduce((n,t)=>n+t.withheld,0);
    let destination:string|null=null;
    if(amount>0){
      if(!client)return hold('transfers_unavailable');
      const account=(await q.query(`select a.stripe_account_id from appstore_affiliates f join team_partners p on p.id=f.partner_id join team_connect_accounts a on a.partner_id=p.id where f.id='messiah' and p.active and p.role='partner'`)).rows[0];
      if(!account)return hold('connect_not_ready');
      const a=await client.accounts.retrieve(account.stripe_account_id);
      if('deleted' in a||!a.details_submitted||!a.payouts_enabled||a.capabilities?.transfers!=='active')return hold('connect_not_ready');
      destination=a.id;
    }
    // Persist the immutable request and allocation before any network side effect.
    await atomic(q,async()=>{
      await q.query('insert into appstore_monthly_attempts(operation_key,fiscal_month,snapshot) values($1,$2,$3)',[operation,month,JSON.stringify({reportHash:hash,amount,withheld,destination,allocations})]);
      for(const t of allocations)await q.query(`insert into appstore_monthly_allocations(fiscal_month,operation_key,transaction_id,source_month,report_hash,final_cents,usd_cents,withheld_cents) values($1,$2,$3,$4,$5,$6,$7,$8)`,[month,operation,t.transaction_id,t.fiscal_month,t.report_hash,safe(t.earned),t.amount,t.withheld]);
      await q.query(`update appstore_monthly_runs set status=$2,report_hash=$3,usd_cents=$4,withheld_cents=$5,destination=$6,started_at=now(),error_code=$7,completed_at=case when $4::bigint=0 then now() else null end where fiscal_month=$1`,[month,amount?'pending':'paid',hash,amount,withheld,destination,amount?'request_prepared':null]);
    });
    if(!amount)return read();
    await q.query("update appstore_monthly_runs set error_code='attempt_started' where fiscal_month=$1",[month]);
    try{
      const transfer=await client!.transfers.create({amount,currency:'usd',destination:destination!,metadata:{appstore_operation:operation,fiscal_month:month}},{idempotencyKey:operation});
      if(transfer.amount!==amount||transfer.currency!=='usd'||transfer.destination!==destination)throw Error('RECEIPT_MISMATCH');
      await q.query("update appstore_monthly_runs set status='paid',stripe_id=$2,completed_at=now(),error_code=null where fiscal_month=$1",[month,transfer.id]);
    }catch(error){
      if(error&&typeof error==='object'&&'code' in error&&error.code==='balance_insufficient'){
        await q.query("update appstore_monthly_runs set status='review',error_code='platform_balance_insufficient' where fiscal_month=$1",[month]);
        await q.query("update appstore_monthly_attempts set disposition='definitively_rejected' where operation_key=$1",[operation]);
        return read();
      }
      await q.query("update appstore_monthly_runs set error_code='transfer_unconfirmed' where fiscal_month=$1",[month]);
      // No retry-create, even within Stripe's retention window.
      await drain(q,client!);
    }
    run=await read();return run;
  });
}
