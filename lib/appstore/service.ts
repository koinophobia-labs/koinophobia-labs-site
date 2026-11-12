import type { Pool } from 'pg';
import { Environment } from '@apple/app-store-server-library';
import { verifyEvent, services, assertTransaction, type VerifiedEvent } from './apple';
import { apps } from './config';
import { calculate, eligibility, exchangeRate, type Fx, type NetProceeds } from './money';
import { locked, record } from './ledger';
import { drain,type MoneyClient } from './payouts';
import { connectStripe } from '../team/connect-client';
import type { Queryable } from '../payments';
import {publishedProceeds} from './published-proceeds';

export async function accrue(q: Queryable, event:VerifiedEvent, fx=exchangeRate, published=publishedProceeds) {
  let reason=eligibility(event), calculation;
  if (!reason) {
    const t=event.transaction!;
    const row=(await q.query('select basis from appstore_verified_proceeds where transaction_id=$1',[t.transactionId])).rows[0];
    let basis=row?.basis as NetProceeds | undefined;
    if(!basis) {try {basis=await published(event);}catch{reason='proceeds_unavailable';}}
    if (!basis) reason='proceeds_unverified';
    else if (basis.transactionId!==t.transactionId || basis.app!==event.app.key || basis.productId!==t.productId || basis.storefront!==t.storefront || (basis.customerCurrency||basis.currency)!==t.currency || basis.priceMilliunits!==t.price || basis.purchaseDate!==t.purchaseDate || !basis.source || !Number.isFinite(Date.parse(basis.verifiedAt))) reason='proceeds_mismatch';
    else {
      let conversion:Fx|undefined;
      try { conversion=await fx(basis.currency,t.purchaseDate!); } catch { reason='fx_unavailable'; }
      if (conversion) calculation=calculate(basis,conversion);
    }
  }
  await record(q,event,reason,calculation);
}
export function transfersEnabled() {
  return process.env.APPSTORE_TRANSFERS_ENABLED==='true' && process.env.VERCEL_ENV==='production' && process.env.STRIPE_CONNECT_MODE==='live';
}
export async function refresh(q: Queryable, transactionIds?:string[]) {
  // Recheck held/unpaid charges before any delayed transfer. Never replay stale
  // cached entitlement data after onboarding, missing FX or a balance failure.
  const rows=(await q.query(`select t.* from appstore_transactions t where t.environment='Production' and t.affiliate_id='messiah' and not t.revoked and t.price_milliunits>0 and ($1::text[] is null or t.transaction_id=any($1::text[])) order by t.verified_at limit $2`,[transactionIds??null,transactionIds?transactionIds.length:25])).rows;
  const configured=apps();
  const verifiedIds=new Set<string>();
  for (const row of rows) {
    const app=configured.find(a=>a.key===row.app);
    if (!app || !app.offerIdentifiers.includes(row.offer_identifier)) throw Error('ATTRIBUTION_CONFIG_CHANGED');
    const {client,verifier}=services(app,Environment.PRODUCTION);
    const response=await client.getTransactionInfo(row.transaction_id);
    if (!response.signedTransactionInfo) throw Error('APPLE_TRANSACTION_UNAVAILABLE');
    const t=await verifier.verifyAndDecodeTransaction(response.signedTransactionInfo);
    assertTransaction(t,app,Environment.PRODUCTION);
    if (t.transactionId!==row.transaction_id || t.originalTransactionId!==row.original_id || t.productId!==row.product_id || t.price!==Number(row.price_milliunits) || t.currency!==row.currency) throw Error('TRANSACTION_CHANGED_REVIEW');
    await accrue(q,{uuid:'recheck-'+row.transaction_id+'-'+t.signedDate,type:t.revocationDate!=null?'REFUND':'RECHECK',app,environment:Environment.PRODUCTION,transaction:t,attribution:{offer:row.offer_identifier,transactionId:row.attribution_transaction_id},hash:'api-recheck'});
    if (!eligibility({uuid:'recheck',type:'RECHECK',app,environment:Environment.PRODUCTION,transaction:t,attribution:{offer:row.offer_identifier,transactionId:row.attribution_transaction_id},hash:'api-recheck'})) verifiedIds.add(row.transaction_id);
  }
  return verifiedIds;
}
export async function receive(signed:string,database:Pool,dependencies:{verify?:typeof verifyEvent;client?:()=>MoneyClient;fx?:typeof exchangeRate;published?:typeof publishedProceeds}={}) {
  const event=await (dependencies.verify||verifyEvent)(signed);
  await locked(database,async q=>{
    await accrue(q,event,dependencies.fx||exchangeRate,dependencies.published||publishedProceeds);
    // A sale records earned money only. Connecting Stripe never releases it.
    // Refund maintenance may recover/reverse existing transfers, never create one.
    if (['REFUND','REVOKE'].includes(event.type) && transfersEnabled())
      await drain(q,(dependencies.client||connectStripe)());
  });
}
export async function reconcile(database:Pool) {
  await locked(database,async q=>{
    await refresh(q);
    if (transfersEnabled()) await drain(q,connectStripe());
  });
}
