import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {Pool} from 'pg';
import {Environment} from '@apple/app-store-server-library';
import {locked,record,totals} from '../lib/appstore/ledger';
import {accrue,receive} from '../lib/appstore/service';
import {drain,type MoneyClient} from '../lib/appstore/payouts';
import {calculate,type NetProceeds} from '../lib/appstore/money';
import {applyTrueUp,reconcileFinancial} from '../lib/appstore/financial-reports';
import type {VerifiedEvent} from '../lib/appstore/apple';
const purchaseDate=1794520000000;
function event(id:string,type='SUBSCRIBED'):VerifiedEvent{return {uuid:id+'-'+type,type,environment:Environment.PRODUCTION,app:{key:'fixture',bundleId:'test.fixture',appAppleId:123,offerIdentifiers:['affiliate']},hash:id+'-'+type,attribution:{offer:'affiliate',transactionId:id},transaction:{transactionId:id,originalTransactionId:'origin-'+id,bundleId:'test.fixture',environment:Environment.PRODUCTION,productId:'monthly',storefront:'USA',purchaseDate,price:7290,currency:'USD',inAppOwnershipType:'PURCHASED'}};}
function basis(id:string):NetProceeds{return {transactionId:id,app:'fixture',productId:'monthly',storefront:'USA',currency:'USD',priceMilliunits:7290,purchaseDate,amount:'6.20',appleBasisPoints:1500,source:'synthetic matched report',verifiedAt:new Date().toISOString()};}
const fx={currency:'USD',usdPerUnit:'1',date:'2026-11-12',source:'USD identity'};
test('real PostgreSQL money ledger: concurrency, crash recovery, refund ordering and owed balances',async(t)=>{
 const dir=mkdtempSync(join(tmpdir(),'appstore-pg-'));const net=createServer();await new Promise<void>(r=>net.listen(0,'127.0.0.1',r));const port=(net.address() as {port:number}).port;await new Promise<void>(r=>net.close(()=>r()));
 execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
 const db=new Pool({host:'127.0.0.1',port,database:'postgres'});let creates=0,reversals=0;let mode='ok',receipts:object[]=[];
 const client={accounts:{retrieve:async()=>({id:'acct_fixture',details_submitted:true,payouts_enabled:true,capabilities:{transfers:'active'}})},transfers:{list:async()=>({data:receipts,has_more:false}),create:async(o:{amount:number;destination:string;metadata:object})=>{creates++;if(mode==='insufficient')throw Object.assign(Error('fixture'),{code:'balance_insufficient'});return{id:'tr_fixture_'+creates,amount:o.amount,currency:'usd',destination:o.destination,metadata:o.metadata};},createReversal:async(_id:string,o:{amount:number})=>{reversals++;if(mode==='reversal_insufficient')throw Object.assign(Error('fixture'),{code:'balance_insufficient'});return{id:'trr_fixture_'+reversals,amount:o.amount};}}} as unknown as MoneyClient;
 const reset=async()=>{await db.query('truncate appstore_monthly_rounding,appstore_earning_attributions,appstore_monthly_allocations,appstore_monthly_attempts,appstore_monthly_authorizations,appstore_monthly_runs,appstore_adjustments,appstore_financial_matches,appstore_financial_reports,appstore_notifications,appstore_verified_proceeds,appstore_reversals,appstore_payouts,appstore_commissions,appstore_transactions');creates=0;reversals=0;mode='ok';receipts=[];};
 const add=async(id:string)=>record(db,event(id),null,calculate(basis(id),fx));
 const pending=async(id:string,error:string|null=null)=>{await db.query("insert into appstore_payouts(transaction_id,operation_key,destination,usd_cents,withheld_cents,status,error_code) values($1,$2,'acct_fixture',155,0,'pending',$3)",[id,'operation-'+id,error]);};
 try{
  // Minimal pre-existing production contract: no WO-0280/0286 earnings/tier schema.
  await db.query('create table team_partners(id text primary key,active boolean,role text);create table team_connect_accounts(partner_id text primary key references team_partners(id),stripe_account_id text)');
  const migration=readFileSync('db/020_appstore_affiliates.sql','utf8');await db.query(migration);await db.query(migration);await db.query(readFileSync('db/021_appstore_monthly.sql','utf8'));await db.query(readFileSync('db/021_appstore_monthly.sql','utf8'));await db.query(readFileSync('db/024_appstore_earning_rules.sql','utf8'));
  await t.test('duplicate delivery and transaction concurrency create exactly one commission',async()=>{await reset();await Promise.all(Array.from({length:20},()=>locked(db,q=>record(q,event('duplicate'),null,calculate(basis('duplicate'),fx)))));assert.equal((await db.query('select count(*)::int n from appstore_commissions')).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from appstore_notifications')).rows[0].n,1);await assert.rejects(locked(db,q=>record(q,{...event('duplicate'),hash:'collision'},null)),/UUID_COLLISION/);});
  await t.test('unverified proceeds hold; matched net proceeds accrue owed without a Stripe account',async()=>{await reset();await accrue(db,event('held'));assert.equal((await db.query('select reason from appstore_transactions')).rows[0].reason,'proceeds_unverified');assert.equal((await totals(db)).owed,0);await db.query('insert into appstore_verified_proceeds values($1,$2,now())',['held',JSON.stringify(basis('held'))]);await accrue(db,event('held'));await drain(db,client);assert.equal((await totals(db)).owed,155);assert.equal(creates,0);});
  await t.test('proceeds for a different storefront cannot release a hold',async()=>{await reset();await accrue(db,event('mismatch'));await db.query('insert into appstore_verified_proceeds values($1,$2,now())',['mismatch',JSON.stringify({...basis('mismatch'),storefront:'GBR'})]);await accrue(db,event('mismatch'));assert.equal((await totals(db)).owed,0);assert.equal((await db.query('select reason from appstore_transactions')).rows[0].reason,'proceeds_mismatch');});
  await t.test('refund before purchase remains a tombstone across older deliveries',async()=>{await reset();await record(db,event('out-of-order','REFUND'),'revoked');await add('out-of-order');assert.equal((await totals(db)).owed,0);assert.equal((await db.query('select revoked from appstore_transactions')).rows[0].revoked,true);});
  await t.test('a definitive unsent insufficient-balance transfer is cancelled after refund',async()=>{await reset();await add('failed');await pending('failed');mode='insufficient';await drain(db,client);assert.equal(creates,0);await record(db,event('failed','REFUND'),'revoked');mode='ok';await drain(db,client);assert.equal(creates,0);assert.equal((await db.query('select status from appstore_payouts')).rows[0].status,'cancelled');});
  await t.test('ambiguous crash cannot create a new transfer after revocation',async()=>{await reset();await add('ambiguous');await pending('ambiguous','attempt_started');await record(db,event('ambiguous','REVOKE'),'revoked');await drain(db,client);assert.equal(creates,0);assert.equal((await db.query('select status from appstore_payouts')).rows[0].status,'review');});
  await t.test('recover a successful transfer after crash by provider read, then reverse the refund',async()=>{await reset();await add('recovered');await pending('recovered','attempt_started');await record(db,event('recovered','REFUND'),'revoked');receipts=[{id:'tr_recovered',amount:155,currency:'usd',destination:'acct_fixture',metadata:{appstore_operation:'operation-recovered'}}];await drain(db,client);assert.equal(creates,0);assert.equal(reversals,1);assert.equal((await totals(db)).owedBack,0);await drain(db,client);assert.equal(reversals,1);});
  await t.test('insufficient reversal is visibly owed back and offsets future commission',async()=>{await reset();await add('paid');await pending('paid');await db.query("update appstore_payouts set status='done',stripe_id='tr_fixture_paid' where transaction_id='paid'");await record(db,event('paid','REFUND'),'revoked');mode='reversal_insufficient';await drain(db,client);assert.equal((await totals(db)).owedBack,155);await add('next');mode='ok';await drain(db,client);assert.equal(creates,0);assert.equal((await totals(db)).owed,0);assert.equal((await db.query("select count(*)::int n from appstore_payouts where transaction_id='next'")).rows[0].n,0);assert.equal((await totals(db)).owedBack,155);});
  await t.test('new pending transfer needs a fresh Apple verification before sending',async()=>{await reset();await add('stale');await pending('stale');await drain(db,client);assert.equal(creates,0);});
  await t.test('published proceeds accrue immediately; missing price is held and Finance resolves it idempotently',async()=>{
   await reset();await accrue(db,event('provisional'),async()=>fx,async()=>({...basis('provisional'),basis:'provisional_published_proceeds'}));assert.equal((await totals(db)).owed,155);
   assert.equal((await db.query('select calculation from appstore_commissions')).rows[0].calculation.basis,'provisional_published_proceeds');
   await reset();await accrue(db,event('financial'));assert.equal((await totals(db)).owed,0);
   const saved=process.env.APPSTORE_APPS_JSON;process.env.APPSTORE_APPS_JSON=JSON.stringify([event('financial').app]);
   const header=['Apple Identifier','Vendor Identifier','Country of Sale','Customer Price','Customer Currency','Partner Share','Partner Share Currency','Quantity','Start Date','End Date','Transaction Date','Sale or Return','Order Type'];
   const report=(net:string)=>Buffer.from(header.join('\t')+'\n'+['123','monthly','US','7.29','USD',net,'USD','1','11/01/2026','11/30/2026','11/12/2026','S',''].join('\t')+'\n');
   try{
    assert.equal((await reconcileFinancial(db,report('6.40'),'2026-11','synthetic financial report',async()=>fx)).matched,1);assert.equal((await totals(db)).owed,160);
    await reconcileFinancial(db,report('6.40'),'2026-11','synthetic financial report',async()=>fx);assert.equal((await totals(db)).owed,160);
    await reconcileFinancial(db,report('6.00'),'2026-11','synthetic corrected report',async()=>fx);assert.equal((await totals(db)).owed,150);
    await reconcileFinancial(db,report('6.40'),'2026-11','synthetic old replay',async()=>fx);assert.equal((await totals(db)).owed,150);
    await reset();await accrue(db,event('ambiguous-a'));await accrue(db,event('ambiguous-b'));
    const ambiguous=await reconcileFinancial(db,report('6.40'),'2026-11','synthetic quantity ambiguity',async()=>fx);assert.equal(ambiguous.matched,0);assert.equal(ambiguous.held,2);assert.equal((await totals(db)).owed,0);
   }finally{if(saved===undefined)delete process.env.APPSTORE_APPS_JSON;else process.env.APPSTORE_APPS_JSON=saved;}
  });
  await t.test('positive and negative true-ups accrue idempotently without an owner receipt',async()=>{
   await reset();await add('adjusted');
   const tx=(await db.query("select * from appstore_transactions where transaction_id='adjusted'")).rows[0];
   const adjust=async(hash:string,amount:string)=>{await db.query("insert into appstore_financial_reports(report_hash,fiscal_month,source,row_count) values($1,'2026-11','synthetic finance',1) on conflict do nothing",[hash]);await applyTrueUp(db,tx,calculate({...basis('adjusted'),amount,basis:'trued_up_financial_report'},fx),hash,'2026-11','group');};
   await adjust('report-positive','8.00');await adjust('report-positive','8.00');assert.equal((await totals(db)).owed,200);
   assert.equal((await db.query('select count(*)::int n from appstore_adjustments')).rows[0].n,1);
   await adjust('report-negative','4.00');await drain(db,client);assert.equal(creates,0);assert.equal((await totals(db)).owed,100);
  });
  await t.test('a verified purchase accrues immediately without a transfer despite live Stripe and a connected account',async()=>{
   await reset();await db.query("insert into team_partners values('fixture-partner',true,'partner') on conflict do nothing");await db.query("insert into team_connect_accounts values('fixture-partner','acct_fixture') on conflict do nothing");await db.query("update appstore_affiliates set partner_id='fixture-partner' where id='messiah'");for(let i=0;i<30;i++)await add('old-'+i);
   const prior={enabled:process.env.APPSTORE_TRANSFERS_ENABLED,env:process.env.VERCEL_ENV,mode:process.env.STRIPE_CONNECT_MODE};
   process.env.APPSTORE_TRANSFERS_ENABLED='true';process.env.VERCEL_ENV='production';process.env.STRIPE_CONNECT_MODE='live';
   try{await receive('synthetic-only',db,{verify:async()=>event('instant'),client:()=>client,fx:async()=>fx,published:async()=>({...basis('instant'),basis:'provisional_published_proceeds'})});assert.equal(creates,0);assert.equal((await db.query('select count(*)::int n from appstore_payouts')).rows[0].n,0);assert.equal((await totals(db)).owed,31*155);}
   finally{for(const [k,v] of Object.entries({APPSTORE_TRANSFERS_ENABLED:prior.enabled,VERCEL_ENV:prior.env,STRIPE_CONNECT_MODE:prior.mode})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
  });
 }finally{await db.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
});
