import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {Pool} from 'pg';
import {NextRequest} from 'next/server';
import {Environment} from '@apple/app-store-server-library';
import {markApplePaymentReceived} from '../lib/appstore/monthly';
import {receiptHandler} from '../lib/appstore/monthly-route';
import {locked,record,totals,ownerSnapshot} from '../lib/appstore/ledger';
import {drain,type MoneyClient} from '../lib/appstore/payouts';
import {calculate,type NetProceeds} from '../lib/appstore/money';
import type {VerifiedEvent} from '../lib/appstore/apple';
import type {Partner} from '../lib/team/types';

const owner:Partner={id:'owner-fixture',name:'Fictional owner',role:'owner',active:true,parent_partner_id:null,commission_rate:0,override_rate:0};
const partner={...owner,id:'partner-fixture',role:'partner' as const};
const app={key:'fixture',bundleId:'test.fixture',appAppleId:123,offerIdentifiers:['affiliate']};
const fx={currency:'USD',usdPerUnit:'1',date:'2026-08-12',source:'synthetic identity'};
function event(id:string,month='2026-08',type='SUBSCRIBED'):VerifiedEvent {
  return {uuid:id+'-'+type,type,environment:Environment.PRODUCTION,app,hash:id+'-'+type,attribution:{offer:'affiliate',transactionId:id},transaction:{transactionId:id,originalTransactionId:'origin-'+id,bundleId:app.bundleId,environment:Environment.PRODUCTION,productId:'monthly',storefront:'USA',purchaseDate:Date.parse(month+'-12T12:00:00Z'),price:7290,currency:'USD',inAppOwnershipType:'PURCHASED'}};
}
function basis(id:string,month='2026-08'):NetProceeds{return {transactionId:id,app:'fixture',productId:'monthly',storefront:'USA',currency:'USD',priceMilliunits:7290,purchaseDate:event(id,month).transaction!.purchaseDate!,amount:'6.20',appleBasisPoints:1500,source:'synthetic published quote',verifiedAt:new Date().toISOString(),basis:'provisional_published_proceeds'};}
function report(month:string,net='6.40',quantity=100){
  const [year,m]=month.split('-'),end=m==='08'?'31':'30';
  const header=['Apple Identifier','Vendor Identifier','Country of Sale','Customer Price','Customer Currency','Partner Share','Partner Share Currency','Quantity','Start Date','End Date','Sale or Return','Order Type'];
  return Buffer.from(header.join('\t')+'\n'+['123','monthly','US','7.29','USD',net,'USD',quantity,`${m}/01/${year}`,`${m}/${end}/${year}`,'S',''].join('\t')+'\n');
}

test('owner payout HTTP boundary rejects unauthorized, inactive, cross-origin and malformed requests before execution',async()=>{
  let actor:Partner|null=null,calls=0;
  const handler=receiptHandler({actor:async()=>actor,available:()=>true,execute:async()=>{calls++;return {status:'received'};}});
  const send=(body:unknown={month:'2026-08',received:true},origin='https://example.test')=>handler(new NextRequest('https://example.test/team/api/apple-payment-received',{method:'POST',headers:{origin},body:JSON.stringify(body)}));
  assert.equal((await send()).status,401);actor=partner;assert.equal((await send()).status,403);
  actor={...owner,active:false};assert.equal((await send()).status,403);
  actor=owner;assert.equal((await send({},'https://evil.test')).status,403);
  assert.equal((await send(null)).status,400);assert.equal((await send('x'.repeat(2050))).status,413);
  assert.equal(calls,0);assert.equal((await send()).status,200);assert.equal(calls,1);
});

test('monthly money ledger uses real PostgreSQL and mocked Stripe only',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'appstore-monthly-pg-')),net=createServer();
  await new Promise<void>(r=>net.listen(0,'127.0.0.1',r));const port=(net.address() as {port:number}).port;await new Promise<void>(r=>net.close(()=>r()));
  execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
  execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
  const db=new Pool({host:'127.0.0.1',port,database:'postgres'}),saved=process.env.APPSTORE_APPS_JSON;
  let creates=0,reversals=0,mode='ok',receipts:Record<string,unknown>[]=[],sent:number[]=[];
  const client={accounts:{retrieve:async()=>({id:'acct_fixture',details_submitted:true,payouts_enabled:true,capabilities:{transfers:'active'}})},transfers:{
    list:async()=>({data:receipts,has_more:false}),
    create:async(o:{amount:number;destination:string;metadata:object})=>{creates++;sent.push(o.amount);if(mode==='insufficient')throw Object.assign(Error('synthetic'),{code:'balance_insufficient'});const receipt={id:'tr_fixture_'+creates,...o,currency:'usd'};receipts.push(receipt);if(mode==='ambiguous'){receipts=[];throw Error('synthetic timeout');}return receipt;},
    createReversal:async(_id:string,o:{amount:number})=>{reversals++;if(mode==='reversal_insufficient')throw Object.assign(Error('synthetic'),{code:'balance_insufficient'});return {id:'trr_fixture_'+reversals,amount:o.amount};}
  }} as unknown as MoneyClient;
  const dependencies={report:async(month:string)=>({raw:report(month),source:'synthetic Apple Finance'}),refresh:async(_q:unknown,ids?:string[])=>new Set(ids),fx:async()=>fx,enabled:()=>true,client:()=>client};
  const run=(month='2026-08',extra={})=>markApplePaymentReceived(db,owner,{month,received:true},{...dependencies,...extra});
  const add=(id:string,month='2026-08')=>locked(db,q=>record(q,event(id,month),null,calculate(basis(id,month),fx)));
  const refund=(id:string,month='2026-08')=>locked(db,q=>record(q,event(id,month,'REFUND'),'revoked'));
  const maintain=()=>locked(db,q=>drain(q,client));
  const reset=async()=>{await db.query('truncate appstore_monthly_allocations,appstore_monthly_attempts,appstore_monthly_authorizations,appstore_monthly_runs,appstore_reversals,appstore_payouts,appstore_adjustments,appstore_financial_matches,appstore_financial_reports,appstore_verified_proceeds,appstore_notifications,appstore_commissions,appstore_transactions');await db.query("update appstore_affiliates set partner_id='partner-fixture'");creates=0;reversals=0;mode='ok';receipts=[];sent=[];};
  try{
    process.env.APPSTORE_APPS_JSON=JSON.stringify([app]);
    await db.query('create table team_partners(id text primary key,active boolean,role text);create table team_connect_accounts(partner_id text primary key references team_partners(id),stripe_account_id text)');
    for(let n=0;n<2;n++)for(const f of ['020_appstore_affiliates.sql','021_appstore_monthly.sql'])await db.query(readFileSync('db/'+f,'utf8'));
    await db.query("insert into team_partners values('owner-fixture',true,'owner'),('partner-fixture',true,'partner');insert into team_connect_accounts values('partner-fixture','acct_fixture')");
    await t.test('all sale/cron maintenance remains accrual-only even with Connect; concurrent owner clicks send one trued-up monthly total',async()=>{
      await reset();await add('a');await add('b');await maintain();assert.equal(creates,0);assert.equal((await totals(db)).awaitingApple,310);
      const results=await Promise.all(Array.from({length:8},()=>run()));assert.ok(results.every(r=>r.status==='paid'));
      assert.equal(creates,1);assert.deepEqual(sent,[320]);assert.equal((await totals(db)).paid,320);assert.equal((await totals(db)).awaitingApple,0);
      assert.equal((await db.query('select count(*)::int n from appstore_adjustments')).rows[0].n,2);
      assert.equal((await db.query('select count(*)::int n from appstore_monthly_allocations')).rows[0].n,2);
      await run();await maintain();assert.equal(creates,1);await ownerSnapshot(db,owner);
    });
    await t.test('a pre-payout refund reduces the monthly total, including a refund found during fresh Apple verification',async()=>{
      await reset();await add('a');await add('b');await refund('a');
      await run();assert.deepEqual(sent,[160]);assert.equal(reversals,0);
      await reset();await add('a');await run('2026-08',{refresh:async(q:Parameters<typeof record>[0])=>{await record(q,event('a','2026-08','REFUND'),'revoked');return new Set<string>();}});
      assert.equal(creates,0);assert.equal((await totals(db)).commission,0);
    });
    await t.test('a refund after aggregate payout reverses only its allocation, once',async()=>{
      await reset();await add('a');await add('b');await run();await refund('a');await maintain();await maintain();
      assert.equal(reversals,1);assert.equal((await totals(db)).paid,160);assert.equal((await totals(db)).owedBack,0);
    });
    await t.test('owed back stays visible despite future provisional earnings; next receipt-confirmed month offsets debt',async()=>{
      await reset();await add('old');await run();await refund('old');mode='reversal_insufficient';await maintain();
      await add('next','2026-09');await add('unpaid-future','2026-11');assert.equal((await totals(db)).owedBack,160);
      await maintain();assert.equal(creates,1);mode='ok';const settled=await run('2026-09');assert.equal(settled.status,'paid');assert.equal(Number(settled.usd_cents),0);
      assert.equal(Number(settled.withheld_cents),160);assert.equal(creates,1);assert.equal((await totals(db)).owedBack,0);assert.equal((await totals(db)).awaitingApple,155);
    });
    await t.test('absence of Connect holds after receipt; connecting or maintenance alone cannot pay; explicit owner retry can',async()=>{
      await reset();await add('a');await db.query('update appstore_affiliates set partner_id=null');
      assert.equal((await run()).error_code,'connect_not_ready');assert.equal(creates,0);
      await db.query("update appstore_affiliates set partner_id='partner-fixture'");await maintain();assert.equal(creates,0);await run();assert.equal(creates,1);
    });
    await t.test('unavailable or ambiguous Finance and missing fresh verification hold without transfers',async()=>{
      await reset();await add('a');assert.equal((await run('2026-08',{report:async()=>{throw Error('not available');}})).error_code,'financial_report_unavailable');
      await add('b');assert.equal((await run('2026-08',{report:async()=>({raw:report('2026-08','6.40',1),source:'synthetic ambiguous'})})).error_code,'financial_matching_incomplete');
      assert.equal((await run('2026-08',{refresh:async()=>new Set<string>()})).error_code,'financial_matching_incomplete');assert.equal(creates,0);
    });
    await t.test('ambiguous transfer is recovered by receipt after 24h, never recreated, then refunded correctly',async()=>{
      await reset();await add('a');mode='ambiguous';const result=await run();assert.equal(result.status,'review');assert.equal(creates,1);
      await db.query("update appstore_monthly_runs set started_at=now()-interval '3 days'");await refund('a');await maintain();assert.equal(creates,1);
      const savedRun=(await db.query('select * from appstore_monthly_runs')).rows[0];receipts=[{id:'tr_recovered',amount:160,currency:'usd',destination:'acct_fixture',metadata:{appstore_operation:savedRun.operation_key}}];mode='ok';
      await run();await maintain();assert.equal(creates,1);assert.equal(reversals,1);assert.equal((await totals(db)).paid,0);
    });
    await t.test('prepared-but-never-attempted snapshot cannot be sent blindly on retry',async()=>{
      await reset();await add('a');await db.query("insert into appstore_monthly_runs(fiscal_month,received_by,operation_key,status,error_code) values('2026-08','owner-fixture','synthetic-prepared','pending','request_prepared')");
      await refund('a');assert.equal((await run()).status,'paid');assert.equal(creates,0);
    });
    await t.test('late charge cannot reopen a paid month; a later received month can settle its final carryover',async()=>{
      await reset();await add('a');await run();await add('late');await run();await maintain();assert.equal(creates,1);
      // Scheduled reconciliation can finalize late evidence without transferring.
      const {reconcileFinancial}=await import('../lib/appstore/financial-reports');
      await locked(db,q=>reconcileFinancial(q,report('2026-08'),'2026-08','synthetic Apple Finance',async()=>fx));
      await add('next','2026-09');await run('2026-09');assert.deepEqual(sent,[160,320]);
    });
    await t.test('later positive Finance correction cannot borrow an earlier receipt; owner reconfirms it before a later month settles it',async()=>{
      await reset();await add('a');await run();
      const {reconcileFinancial}=await import('../lib/appstore/financial-reports');
      await locked(db,q=>reconcileFinancial(q,report('2026-08','8.00'),'2026-08','synthetic corrected Finance',async()=>fx));
      await add('b','2026-09');await run('2026-09');assert.deepEqual(sent,[160,160]);assert.equal((await totals(db)).awaitingApple,40);
      await run('2026-08',{report:async()=>({raw:report('2026-08','8.00'),source:'synthetic corrected Finance'})});assert.equal(creates,2);
      await add('c','2026-10');await run('2026-10');assert.deepEqual(sent,[160,160,200]);assert.equal((await totals(db)).owed,0);
    });
    await t.test('negative correction offsets a later payout immediately without counting unreceived future commissions',async()=>{
      await reset();await add('a');await run();
      const {reconcileFinancial}=await import('../lib/appstore/financial-reports');
      await locked(db,q=>reconcileFinancial(q,report('2026-08','4.00'),'2026-08','synthetic downward correction',async()=>fx));
      await add('b','2026-09');await add('future','2026-11');assert.equal((await totals(db)).owedBack,60);
      await run('2026-09');assert.deepEqual(sent,[160,100]);assert.equal((await totals(db)).owedBack,0);
    });
    await t.test('definitively rejected transfer is retried only by owner, revalidated after refund, retaining old attempt evidence',async()=>{
      await reset();await add('a');await add('b');mode='insufficient';assert.equal((await run()).error_code,'platform_balance_insufficient');assert.equal(creates,1);
      await refund('a');await maintain();assert.equal(creates,1);mode='ok';await run();assert.deepEqual(sent,[320,160]);
      assert.equal((await db.query('select count(*)::int n from appstore_monthly_attempts')).rows[0].n,2);
      assert.equal((await db.query('select count(*)::int n from appstore_monthly_allocations')).rows[0].n,3);
      assert.equal((await totals(db)).paid,160);await run();assert.equal(creates,2);
    });
    await t.test('service requires an active persisted owner and explicit bank receipt, not a partner-supplied role',async()=>{
      await reset();await add('a');await assert.rejects(markApplePaymentReceived(db,partner,{month:'2026-08',received:true},dependencies));
      await assert.rejects(markApplePaymentReceived(db,{...owner,id:partner.id},{month:'2026-08',received:true},dependencies));
      await db.query("update team_partners set active=false where id='owner-fixture'");await assert.rejects(run());await db.query("update team_partners set active=true where id='owner-fixture'");
      await assert.rejects(markApplePaymentReceived(db,owner,{month:'2026-08',received:false},dependencies));
      await assert.rejects(run('2026-13'));assert.equal(creates,0);assert.equal((await db.query('select count(*)::int n from appstore_monthly_runs')).rows[0].n,0);
    });
  }finally{if(saved===undefined)delete process.env.APPSTORE_APPS_JSON;else process.env.APPSTORE_APPS_JSON=saved;await db.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
});
