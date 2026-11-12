import type { Pool } from 'pg';
import { Environment } from '@apple/app-store-server-library';
import { verifyEvent, services, assertTransaction, type VerifiedEvent } from './apple';
import { apps } from './config';
import { calculate, eligibility, exchangeRate, type Fx, type NetProceeds } from './money';
import { locked, record } from './ledger';
import { drain } from './payouts';
import { connectStripe } from '../team/connect-client';
import type { Queryable } from '../payments';

export async function accrue(q: Queryable, event:VerifiedEvent, fx=exchangeRate) {
  let reason=eligibility(event), calculation;
  if (!reason) {
    const t=event.transaction!;
    const row=(await q.query('select basis from appstore_verified_proceeds where transaction_id=$1',[t.transactionId])).rows[0];
    const basis=row?.basis as NetProceeds | undefined;
    if (!basis) reason='proceeds_unverified';
    else if (basis.transactionId!==t.transactionId || basis.app!==event.app.key || basis.productId!==t.productId || basis.storefront!==t.storefront || basis.currency!==t.currency || basis.priceMilliunits!==t.price || basis.purchaseDate!==t.purchaseDate || !basis.source || !Number.isFinite(Date.parse(basis.verifiedAt))) reason='proceeds_mismatch';
    else {
      let conversion:Fx|undefined;
      try { conversion=await fx(t.currency!,t.purchaseDate!); } catch { reason='fx_unavailable'; }
      if (conversion) calculation=calculate(basis,conversion);
    }
  }
  await record(q,event,reason,calculation);
}
export function transfersEnabled() {
  return process.env.APPSTORE_TRANSFERS_ENABLED==='true' && process.env.VERCEL_ENV==='production' && process.env.STRIPE_CONNECT_MODE==='live';
}
async function refresh(q: Queryable) {
  // Recheck held/unpaid charges before any delayed transfer. Never replay stale
  // cached entitlement data after onboarding, missing FX or a balance failure.
  const rows=(await q.query(`select t.* from appstore_transactions t left join appstore_payouts p using(transaction_id) where t.environment='Production' and t.affiliate_id='messiah' and not t.revoked and (p.transaction_id is null or p.status='pending') and (t.price_milliunits>0) order by t.verified_at limit 25`)).rows;
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
export async function receive(signed:string,database:Pool) {
  const event=await verifyEvent(signed);
  await locked(database,async q=>{
    await accrue(q,event);
    if (transfersEnabled()) { const ids=await refresh(q); await drain(q,connectStripe(),Date.now(),ids); }
  });
}
export async function reconcile(database:Pool) {
  await locked(database,async q=>{
    const ids=await refresh(q);
    if (transfersEnabled()) await drain(q,connectStripe(),Date.now(),ids);
  });
}
