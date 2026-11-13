import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {Pool} from 'pg';
import {Environment} from '@apple/app-store-server-library';
import {calculate,roundMonthlyAmounts,type NetProceeds} from '../lib/appstore/money';
import {chooseRule,parseRule,type EarningRule} from '../lib/appstore/earning-rules';
import {accrue,receive} from '../lib/appstore/service';
import {locked,totals} from '../lib/appstore/ledger';
import {markApplePaymentReceived} from '../lib/appstore/monthly';
import {drain,type MoneyClient} from '../lib/appstore/payouts';
import type {VerifiedEvent} from '../lib/appstore/apple';
import type {Partner} from '../lib/team/types';

const code: EarningRule={id:'messiah-code',partner:'messiah',earningType:'affiliate_commission',appIds:null,attributionType:'verified_code',partnerBasisPoints:2500,costDeduction:'0',active:true};
const share: EarningRule={...code,id:'messiah-saiikhotic',earningType:'revenue_share',appIds:[6831629900,6832131528],attributionType:'all_sales',partnerBasisPoints:6000};
const fx={currency:'USD',usdPerUnit:'1',date:'2026-08-12',source:'fictional USD identity'};
const owner:Partner={id:'owner',name:'Fictional owner',role:'owner',active:true,parent_partner_id:null,commission_rate:0,override_rate:0};
const ordinary={key:'fixture',bundleId:'test.fixture',appAppleId:123,offerIdentifiers:['affiliate']};
const sai={key:'saiikhotic-spades',bundleId:'com.koinophobialabs.saiikhotic',appAppleId:6831629900,offerIdentifiers:[],revenueShare:true};
function event(id:string,revenue=false,attributed=!revenue,type='ONE_TIME_CHARGE'):VerifiedEvent {
  const app=revenue?sai:ordinary;
  return {uuid:id+'-'+type,type,environment:Environment.PRODUCTION,app,hash:id+'-'+type,
    ...(attributed?{attribution:{offer:'affiliate',transactionId:id}}:{}),
    transaction:{transactionId:id,originalTransactionId:'original-'+id,bundleId:app.bundleId,environment:Environment.PRODUCTION,
      productId:'product',storefront:'USA',purchaseDate:Date.parse('2026-08-12T12:00:00Z'),price:10000,currency:'USD',inAppOwnershipType:'PURCHASED'}};
}
function basis(e:VerifiedEvent,amount='8.50'):NetProceeds{return {transactionId:e.transaction!.transactionId!,app:e.app.key,productId:'product',storefront:'USA',currency:'USD',priceMilliunits:e.transaction!.price!,purchaseDate:e.transaction!.purchaseDate!,amount,appleBasisPoints:null,source:'fictional transaction-matched Apple proceeds',verifiedAt:new Date().toISOString(),basis:'provisional_published_proceeds'};}
test('exact 25% and 60% shares use transaction proceeds, including price rises, FX and configurable costs',()=>{
  assert.equal(calculate(basis(event('a')),fx,code).exactUsd,'2.125');
  assert.equal(calculate(basis(event('b',true)),fx,share).exactUsd,'5.1');
  assert.equal(calculate(basis(event('b',true)),fx,share).ownerExactUsd,'3.4');
  assert.equal(calculate(basis(event('b',true),'17.33'),fx,share).exactUsd,'10.398');
  assert.equal(calculate(basis(event('b',true)),fx,{...share,costDeduction:'1.25'}).exactUsd,'4.35');
  assert.equal(calculate(basis(event('b',true)),fx,{...share,costDeduction:'99'}).exactUsd,'0');
  assert.equal(calculate({...basis(event('b',true)),currency:'EUR'},{...fx,currency:'EUR',usdPerUnit:'1.1234'},share).exactUsd,'5.72934');
  assert.throws(()=>calculate(basis(event('a')),fx,{...share,costDeduction:'-1'}));
  assert.throws(()=>parseRule({id:'bad',partner:'messiah',earning_type:'revenue_share',app_ids:[6831629900],attribution_type:'all_sales',partner_bps:10001,cost_deduction:'0',active:true}));
});
test('app ownership is exclusive, inactive app rules never fall through, and un-attributed ordinary apps earn nothing',()=>{
  assert.equal(chooseRule(event('a',true,true),[code,share])?.earningType,'revenue_share');
  assert.equal(chooseRule(event('a',true,false),[code,share])?.earningType,'revenue_share');
  assert.equal(chooseRule(event('a',false,false),[code,share]),undefined);
  assert.equal(chooseRule(event('a',true,true),[code,{...share,active:false}]),undefined);
  assert.throws(()=>chooseRule(event('a',true),[share,{...share,id:'duplicate'}]),/AMBIGUOUS/);
});
test('monthly rounding retains fractional cents and allocates the rounded combined total deterministically',()=>{
  const a=calculate(basis(event('a')),fx,code),b=calculate(basis(event('b')),fx,code),c=calculate(basis(event('c',true)),fx,share);
  const rounded=roundMonthlyAmounts([{id:'b',exactCents:b.exactCents},{id:'a',exactCents:a.exactCents},{id:'c',exactCents:c.exactCents}]);
  assert.equal(rounded.get('a'),213);assert.equal(rounded.get('b'),212);assert.equal(rounded.get('c'),510);
  assert.equal([...rounded.values()].reduce((n,v)=>n+v,0),935);
});

test('mixed earnings use one real PostgreSQL ledger and one owner-confirmed monthly payout, with mocked money only',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'wo0294-pg-')),net=createServer();await new Promise<void>(r=>net.listen(0,'127.0.0.1',r));
  const port=(net.address() as {port:number}).port;await new Promise<void>(r=>net.close(()=>r()));
  execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
  execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
  const db=new Pool({host:'127.0.0.1',port,database:'postgres'}),saved=process.env.APPSTORE_APPS_JSON;
  let sent:number[]=[],reversed:number[]=[];
  const client={accounts:{retrieve:async()=>({id:'acct_fake',details_submitted:true,payouts_enabled:true,capabilities:{transfers:'active'}})},transfers:{
    create:async(o:{amount:number;destination:string;metadata:object})=>{sent.push(o.amount);return {id:'tr_fake',...o,currency:'usd'};},
    list:async()=>({data:[],has_more:false}),createReversal:async(_id:string,o:{amount:number})=>{reversed.push(o.amount);return {id:'trr_fake',amount:o.amount};}
  }} as unknown as MoneyClient;
  const add=(e:VerifiedEvent,net='8.50')=>locked(db,q=>accrue(q,e,async()=>fx,async()=>basis(e,net)));
  const report=()=>Buffer.from(['Apple Identifier\tVendor Identifier\tCountry of Sale\tCustomer Price\tCustomer Currency\tPartner Share\tPartner Share Currency\tQuantity\tStart Date\tEnd Date\tSale or Return\tOrder Type',
    ...[123,6831629900].map(id=>[id,'product','US','10.00','USD','8.50','USD',100,'08/01/2026','08/31/2026','S',''].join('\t'))].join('\n')+'\n');
  const run=()=>markApplePaymentReceived(db,owner,{month:'2026-08',received:true},{report:async()=>({raw:report(),source:'fictional Apple Finance'}),refresh:async(_q,ids)=>new Set(ids),fx:async()=>fx,enabled:()=>true,client:()=>client});
  const reset=async()=>{await db.query('truncate appstore_monthly_rounding,appstore_earning_attributions,appstore_monthly_allocations,appstore_monthly_attempts,appstore_monthly_authorizations,appstore_monthly_runs,appstore_reversals,appstore_payouts,appstore_adjustments,appstore_financial_matches,appstore_financial_reports,appstore_verified_proceeds,appstore_notifications,appstore_commissions,appstore_transactions');sent=[];reversed=[];};
  try {
    process.env.APPSTORE_APPS_JSON=JSON.stringify([ordinary,sai]);
    await db.query('create table team_partners(id text primary key,active boolean,role text);create table team_connect_accounts(partner_id text primary key references team_partners(id),stripe_account_id text)');
    for(let n=0;n<2;n++)for(const f of ['020_appstore_affiliates.sql','021_appstore_monthly.sql','024_appstore_earning_rules.sql'])await db.query(readFileSync('db/'+f,'utf8'));
    await db.query("insert into team_partners values('owner',true,'owner'),('affiliate',true,'partner');insert into team_connect_accounts values('affiliate','acct_fake');update appstore_affiliates set partner_id='affiliate' where id='messiah'");
    await t.test('duplicates and a code on a Saiikhotic sale create one 60% earning; unrelated sales and sandbox do not earn',async()=>{
      await reset();const e=event('sai',true,true);await Promise.all(Array.from({length:8},()=>add(e)));
      await add(event('ordinary-no-code',false,false));await add({...event('sandbox',true),environment:Environment.SANDBOX});
      const rows=(await db.query('select * from appstore_commissions')).rows;assert.equal(rows.length,1);assert.equal(rows[0].usd_cents,510);
      assert.equal(rows[0].calculation.earningRule.earningType,'revenue_share');assert.equal((await db.query('select count(*)::int n from appstore_earning_attributions')).rows[0].n,1);
      assert.equal(sent.length,0);
    });
    await t.test('verified renewals remain distinct charges within a single app/original attribution',async()=>{
      await reset();const first=event('first',true),renewal=event('renewal',true);renewal.transaction!.originalTransactionId=first.transaction!.originalTransactionId;
      await add(first);await add(renewal);await add(renewal);
      assert.equal((await db.query('select count(*)::int n from appstore_commissions')).rows[0].n,2);
      assert.equal((await db.query('select count(*)::int n from appstore_earning_attributions')).rows[0].n,1);
    });
    await t.test('a saved code lineage never replaces verified product-specific code attribution',async()=>{
      await reset();await add(event('code-origin'));
      const unproved=event('other-product',false,false);unproved.transaction!.originalTransactionId='original-code-origin';unproved.transaction!.productId='other-product';
      await add(unproved);assert.equal((await db.query("select count(*)::int n from appstore_commissions where transaction_id='other-product'")).rows[0].n,0);
    });
    await t.test('configuration applies to new charges while existing charge terms stay immutable',async()=>{
      await reset();await add(event('original',true));
      await db.query("update appstore_earning_rules set cost_deduction=1.25 where id='messiah-saiikhotic'");
      try {
        const next=event('cost',true);next.transaction!.originalTransactionId='original-original';await add(next);
        assert.equal((await db.query("select usd_cents from appstore_commissions where transaction_id='cost'")).rows[0].usd_cents,435);
        await add(event('original',true));assert.equal((await db.query("select usd_cents from appstore_commissions where transaction_id='original'")).rows[0].usd_cents,510);
        await db.query("update appstore_earning_rules set active=false where id='messiah-saiikhotic'");
        const disabled=event('disabled',true,true);disabled.transaction!.originalTransactionId='original-original';await add(disabled);
        assert.equal((await db.query("select count(*)::int n from appstore_commissions where transaction_id='disabled'")).rows[0].n,0);
      } finally {await db.query("update appstore_earning_rules set cost_deduction=0,active=true where id='messiah-saiikhotic'");}
    });
    await t.test('both earning types total $9.35 once, then the exact refunded allocation is reversed once',async()=>{
      await reset();await add(event('code-a'));await add(event('code-b'));await add(event('share',true));
      assert.equal(sent.length,0);await Promise.all([run(),run()]);assert.deepEqual(sent,[935]);
      assert.equal((await totals(db)).commission,935);assert.equal((await totals(db)).paid,935);
      const allocation=(await db.query("select usd_cents from appstore_monthly_allocations where transaction_id='code-b'")).rows[0].usd_cents;
      assert.equal(Number(allocation),212);await add(event('code-b',false,true,'REFUND'));await locked(db,q=>drain(q,client));await locked(db,q=>drain(q,client));
      assert.deepEqual(reversed,[212]);assert.equal((await totals(db)).paid,723);
    });
    await t.test('a fresh owner confirmation updates an unpaid rounding cap after Connect hold and refund',async()=>{
      await reset();await add(event('code-a'));await add(event('code-b'));
      await db.query("update appstore_affiliates set partner_id=null where id='messiah'");
      try {
        assert.equal((await run()).error_code,'connect_not_ready');assert.equal(sent.length,0);
        await add(event('code-a',false,true,'REFUND'));
        await db.query("update appstore_affiliates set partner_id='affiliate' where id='messiah'");
        await run();assert.deepEqual(sent,[213]);
      } finally {await db.query("update appstore_affiliates set partner_id='affiliate' where id='messiah'");}
    });
    await t.test('a corrected paid report cannot retain a stale rounding residue or create negative earned money',async()=>{
      await reset();await add(event('code-a'));await add(event('code-b'));await run();assert.deepEqual(sent,[425]);
      const {reconcileFinancial}=await import('../lib/appstore/financial-reports');
      const corrected=Buffer.from(report().toString().replaceAll('8.50','0.00'));
      await locked(db,q=>reconcileFinancial(q,corrected,'2026-08','fictional corrected report',async()=>fx));
      assert.equal((await totals(db)).commission,0);assert.equal((await totals(db)).owedBack,425);
      const paid=(await db.query("select usd_cents from appstore_monthly_allocations where transaction_id='code-b'")).rows[0].usd_cents;assert.equal(Number(paid),212);
    });
    await t.test('corrected paid fractional earnings still round once per fiscal month without rewriting paid allocations',async()=>{
      await reset();await add(event('code-a'));await add(event('code-b'));await run();assert.deepEqual(sent,[425]);
      const {reconcileFinancial}=await import('../lib/appstore/financial-reports');
      const corrected=Buffer.from(report().toString().replaceAll('8.50','4.50'));
      await locked(db,q=>reconcileFinancial(q,corrected,'2026-08','fictional fractional correction',async()=>fx));
      assert.equal((await totals(db)).commission,225);assert.equal((await totals(db)).owedBack,200);
      assert.deepEqual((await db.query('select usd_cents from appstore_monthly_allocations order by transaction_id')).rows.map(r=>Number(r.usd_cents)),[213,212]);
    });
    await t.test('refund tombstone wins over late sale delivery and pre-payout refund re-rounds only unpaid earnings',async()=>{
      await reset();await add(event('refund-first',true,false,'REFUND'));await add(event('refund-first',true));
      assert.equal((await db.query('select count(*)::int n from appstore_commissions')).rows[0].n,0);
      await add(event('code-a'));await add(event('code-b'));await add(event('code-b',false,true,'REFUND'));await run();assert.deepEqual(sent,[213]);
    });
    await t.test('sale receive never creates a transfer, even when production transfer switches are on',async()=>{
      await reset();const prior={...process.env};process.env.APPSTORE_TRANSFERS_ENABLED='true';process.env.VERCEL_ENV='production';process.env.STRIPE_CONNECT_MODE='live';
      try{const e=event('receive',true);await receive('fictional',db,{verify:async()=>e,client:()=>client,fx:async()=>fx,published:async()=>basis(e)});assert.equal(sent.length,0);}
      finally{for(const k of ['APPSTORE_TRANSFERS_ENABLED','VERCEL_ENV','STRIPE_CONNECT_MODE'])if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}
    });
  } finally {if(saved===undefined)delete process.env.APPSTORE_APPS_JSON;else process.env.APPSTORE_APPS_JSON=saved;await db.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}
});
