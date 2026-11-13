import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {Pool} from 'pg';
import {Environment} from '@apple/app-store-server-library';
import {apps} from '../lib/appstore/config';
import {codeProof,verifyEvent,type AppleServices,type VerifiedEvent} from '../lib/appstore/apple';
import {publishedProceeds} from '../lib/appstore/published-proceeds';
import {accrue} from '../lib/appstore/service';
import type {Document} from '../lib/appstore/connect-api';

const app=apps().find(a=>a.key==='forget-about-it')!;
const product=app.products![0],legacyId='5b249c86-5fdd-4eca-9e02-d62c5af541d4';
const newId='00000000-0000-4000-8000-000000000295';
const newReference='SAIIKHOTIC FAI monthly 3.99 first month';
const settingKey='appstore-offer:forget-about-it:monthly-399';
const purchaseDate=Date.parse('2026-11-20T12:00:00Z');
const oldTx={bundleId:app.bundleId,environment:Environment.PRODUCTION,transactionId:'fictional-old',originalTransactionId:'fictional-old-lineage',productId:product.id,purchaseDate,price:2790,currency:'USD',storefront:'USA',inAppOwnershipType:'PURCHASED',type:'Auto-Renewable Subscription',offerType:3,offerIdentifier:'SAIIKHOTIC 10 percent first month',offerDiscountType:'PAY_AS_YOU_GO'};
const newTx={...oldTx,transactionId:'fictional-new',originalTransactionId:'fictional-new-lineage',price:3690,offerIdentifier:newReference};
const event=(transaction=oldTx):VerifiedEvent=>({uuid:'fixture-'+transaction.transactionId,type:'SUBSCRIBED',environment:Environment.PRODUCTION,app,transaction,attribution:{offer:transaction.offerIdentifier,transactionId:transaction.transactionId},hash:'fixture-'+transaction.transactionId});
const doc=(prices:[string,string][]):Document=>({data:prices.map(([price])=>({type:'subscriptionPrices',id:'fixture-price-'+price,relationships:{territory:{data:{type:'territories',id:'USA'}},subscriptionPricePoint:{data:{type:'subscriptionPricePoints',id:'fixture-point-'+price}}}})),included:[{type:'territories',id:'USA',attributes:{currency:'USD'}},...prices.map(([price,proceeds])=>({type:'subscriptionPricePoints',id:'fixture-point-'+price,attributes:{customerPrice:price,proceeds}}))]});
function reader() {
  const paths:string[]=[];
  const read=async(path:string):Promise<Document>=>{
    paths.push(path);
    if(path.startsWith('/v1/subscriptionOfferCodes/'+legacyId+'/prices'))return doc([['2.79','2.37']]);
    if(path.startsWith('/v1/subscriptionOfferCodes/'+newId+'/prices'))return doc([['3.69','3.14']]);
    if(path.startsWith('/v1/subscriptions/6814286474/prices'))return doc([['2.99','2.54'],['3.99','3.39']]);
    throw Error('Unexpected fixture path '+path);
  };
  return {paths,read};
}

test('staging keeps the old FAI offer and adds one exact reference with a configuration slot',()=>{
  assert.equal(product.offerId,legacyId);
  assert.deepEqual(product.additionalOffers,[{identifier:newReference,settingKey}]);
  for(const t of [oldTx,newTx])assert.equal(codeProof(t,t,app),true);
  assert.equal(codeProof({...newTx,offerIdentifier:'unrelated'},newTx,app),false);
  assert.equal(codeProof({...oldTx,originalTransactionId:'foreign'},oldTx,app),false);
});
test('old code quotes remain available without reading the future setting',async()=>{
  const r=reader();const quote=await publishedProceeds(event(),r.read,async()=>{throw Error('Old offer must not read the future slot');});
  assert.equal(quote?.amount,'2.37');assert.ok(quote?.source.includes(legacyId));
});
test('new code uses only its configured UUID, and an empty slot holds proceeds',async()=>{
  const r=reader();assert.equal(await publishedProceeds(event(newTx),r.read),undefined);
  assert.equal(r.paths.length,1);assert.ok(r.paths[0].startsWith('/v1/subscriptions/'));
  const quote=await publishedProceeds(event(newTx),r.read,async key=>{assert.equal(key,settingKey);return newId;});
  assert.equal(quote?.amount,'3.14');assert.ok(quote?.source.includes(newId));
  assert.ok(!r.paths.some(path=>path.includes(legacyId)));
});
test('malformed dynamic offer IDs cannot enter an Apple request path',async()=>{
  const r=reader();await assert.rejects(publishedProceeds(event(newTx),r.read,async()=> '../other-app/prices'),/APPSTORE_OFFER_ID_INVALID/);assert.deepEqual(r.paths,[]);
});
test('both offer references recover verified renewals with their regular-price quotes',async()=>{
  for(const [prior,price,amount] of [[oldTx,2990,'2.54'],[newTx,3990,'3.39']] as const) {
    const current={...prior,transactionId:'renewal-'+price,purchaseDate:purchaseDate+31*86400000,price,offerType:undefined,offerIdentifier:undefined,offerDiscountType:undefined};
    const n={notificationUUID:'renewal-'+price,notificationType:'DID_RENEW',data:{bundleId:app.bundleId,appAppleId:app.appAppleId,environment:'Production',signedTransactionInfo:'embedded'}};
    const service={verifier:{verifyAndDecodeNotification:async()=>n,verifyAndDecodeTransaction:async(s:string)=>s==='prior'?prior:current},client:{getTransactionInfo:async()=>({signedTransactionInfo:'lookup'}),getTransactionHistory:async()=>({signedTransactions:['prior'],hasMore:false})}} as unknown as AppleServices;
    const e=await verifyEvent('header.'+Buffer.from(JSON.stringify(n)).toString('base64url')+'.signature',[app],()=>service);
    assert.equal(e.attribution?.offer,prior.offerIdentifier);
    const r=reader();assert.equal((await publishedProceeds(e,r.read,async()=>{throw Error('Renewal must not query the offer slot');}))?.amount,amount);
    assert.equal(r.paths.length,1);
  }
});
test('additional offer configuration rejects duplicate references and unrelated settings',()=>{
  const saved=process.env.APPSTORE_APPS_JSON;
  try {
    const config=structuredClone(app);
    config.products![0].additionalOffers![0].settingKey='unrelated-secret';
    process.env.APPSTORE_APPS_JSON=JSON.stringify([config]);assert.throws(()=>apps(),/APPSTORE_CONFIG_INVALID/);
    config.products![0].additionalOffers![0].settingKey=settingKey;
    config.products![0].additionalOffers!.push({...config.products![0].additionalOffers![0]});
    process.env.APPSTORE_APPS_JSON=JSON.stringify([config]);assert.throws(()=>apps(),/APPSTORE_CONFIG_INVALID/);
  } finally {if(saved===undefined)delete process.env.APPSTORE_APPS_JSON;else process.env.APPSTORE_APPS_JSON=saved;}
});
test('a held new-offer charge stays attributed and resolves after a data-only slot update',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'wo0295-offer-pg-')),net=createServer();
  await new Promise<void>(resolve=>net.listen(0,'127.0.0.1',resolve));const port=(net.address() as {port:number}).port;await new Promise<void>(resolve=>net.close(()=>resolve()));
  execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
  execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
  const db=new Pool({host:'127.0.0.1',port,database:'postgres'});
  try {
    await db.query('create table team_partners(id text primary key,active boolean,role text);create table team_connect_accounts(partner_id text primary key references team_partners(id),stripe_account_id text);create table team_settings(key text primary key,value text not null)');
    for(const file of ['020_appstore_affiliates.sql','021_appstore_monthly.sql','024_appstore_earning_rules.sql'])await db.query(readFileSync('db/'+file,'utf8'));
    const fx=async()=>({currency:'USD',usdPerUnit:'1',date:'2026-11-20',source:'fictional USD identity'});
    const r=reader();
    const quote:typeof publishedProceeds=(e,_read,setting)=>publishedProceeds(e,r.read,setting);
    await accrue(db,event(newTx),fx,quote);
    let row=(await db.query('select affiliate_id,offer_identifier,reason from appstore_transactions')).rows[0];
    assert.deepEqual(row,{affiliate_id:'messiah',offer_identifier:newReference,reason:'proceeds_unverified'});
    assert.equal((await db.query('select count(*)::int n from appstore_commissions')).rows[0].n,0);
    await db.query('insert into team_settings(key,value) values($1,$2)',[settingKey,newId]);
    await accrue(db,event(newTx),fx,quote);await accrue(db,event(newTx),fx,quote);
    row=(await db.query('select affiliate_id,offer_identifier,reason from appstore_transactions')).rows[0];
    assert.deepEqual(row,{affiliate_id:'messiah',offer_identifier:newReference,reason:null});
    assert.equal((await db.query('select count(*)::int n from appstore_commissions')).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int n from appstore_payouts')).rows[0].n,0);
  } finally {await db.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
});
