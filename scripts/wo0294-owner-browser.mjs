// Fictional local owner/partner sessions. No Apple/Stripe credentials or network payments.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {Pool} from 'pg';
import {calculate} from '../lib/appstore/money.ts';
import {chromium} from 'playwright';
const base=process.env.WO0288_BASE,dir=process.env.WO0288_EVIDENCE;
assert.equal(new URL(base).hostname,'127.0.0.1');assert.equal(new URL(process.env.DATABASE_URL).hostname,'127.0.0.1');
const db=new Pool({connectionString:process.env.DATABASE_URL});
const browser=await chromium.launch({executablePath:'/Volumes/KoiArchive/WO-0267/cache/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const hash=s=>createHash('sha256').update(s).digest('hex');
try{
  for(const file of ['020_appstore_affiliates.sql','021_appstore_monthly.sql','024_appstore_earning_rules.sql'])await db.query(readFileSync('db/'+file,'utf8'));
  await db.query("insert into team_partners(id,name,email,role) values('monthly-owner','Fictional owner','monthly-owner@example.test','owner'),('monthly-partner','Fictional partner','monthly-partner@example.test','partner') on conflict(id) do nothing");
  for(const role of ['owner','partner'])await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 hour') on conflict(token_hash) do nothing",[hash('monthly-'+role+'-token'),'monthly-'+role]);
  await db.query("insert into appstore_transactions(transaction_id,original_id,app,environment,product_id,purchase_ms,price_milliunits,currency,affiliate_id,storefront) values('monthly-synthetic-sale','monthly-synthetic-original','fixture','Production','monthly',1786536000000,7290,'USD','messiah','USA') on conflict(transaction_id) do nothing");
  await db.query("insert into appstore_commissions(transaction_id,affiliate_id,usd_cents,calculation) values('monthly-synthetic-sale','messiah',155,$1) on conflict(transaction_id) do nothing",[JSON.stringify({basis:'provisional_published_proceeds',formula:'Synthetic: round(6.20 × 25% × 100)',proceeds:{amount:'6.20',source:'Synthetic quote'},currency:'USD',fx:{usdPerUnit:'1',date:'2026-08-12'}})]);
  // Complete older fictional rows for the owner source/details display.
  for(const row of (await db.query("select transaction_id,usd_cents from appstore_commissions where calculation->'proceeds' is null or calculation->'proceeds'->>'currency' is null")).rows){
    const amount=(Number(row.usd_cents)*4/100).toFixed(2);
    const calc=calculate({amount,currency:'USD',transactionId:row.transaction_id,app:'fixture',productId:'monthly',storefront:'USA',priceMilliunits:Number(row.usd_cents)*40,purchaseDate:Date.parse('2026-08-12'),appleBasisPoints:null,source:'Fictional Apple proceeds',verifiedAt:new Date().toISOString()},{currency:'USD',usdPerUnit:'1',date:'2026-08-12',source:'Fictional USD identity'});
    await db.query('update appstore_commissions set calculation=$1 where transaction_id=$2',[JSON.stringify(calc),row.transaction_id]);
  }
  await db.query("update appstore_adjustments a set calculation=c.calculation from appstore_commissions c where a.transaction_id=c.transaction_id and a.calculation='{}'::jsonb");
  await db.query("update appstore_transactions t set price_milliunits=coalesce(t.price_milliunits,(c.calculation->'proceeds'->>'priceMilliunits')::bigint),currency=coalesce(t.currency,c.calculation->>'currency') from appstore_commissions c where t.transaction_id=c.transaction_id");
  const receiptExists=Number((await db.query("select count(*)::int n from appstore_monthly_runs where fiscal_month='2026-08'")).rows[0].n)>0;
  const before=(await db.query("select (select count(*)::int from appstore_monthly_runs) receipts,(select count(*)::int from appstore_payouts) legacy_transfers,(select count(*)::int from appstore_monthly_runs where status='paid') monthly_paid")).rows[0];
  await db.query("insert into appstore_transactions(transaction_id,original_id,app,environment,product_id,purchase_ms,price_milliunits,currency,affiliate_id,earning_rule,reason) select 'held-sai','held-sai','saiikhotic-network','Production','future-product',1794484800000,10000,'USD','messiah',jsonb_build_object('earningType',earning_type,'partnerBasisPoints',partner_bps),'proceeds_unverified' from appstore_earning_rules where id='messiah-saiikhotic' on conflict(transaction_id) do nothing");
  const owner=await browser.newContext({viewport:{width:1440,height:1000}});await owner.addCookies([{name:'team-session',value:'monthly-owner-token',url:base}]);
  const page=await owner.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/team/affiliates');await page.getByRole('heading',{name:'Messiah · App Store earnings'}).waitFor();
  assert.match(await page.getByRole('row').filter({hasText:'fixture'}).innerText(),/\$1\.55/);
  await page.getByRole('heading',{name:'Code sales: 25%',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Your apps: 60%',exact:true}).waitFor();
  assert.ok(await page.getByText('$3.4',{exact:true}).count());
  const held=page.getByRole('row').filter({hasText:'saiikhotic-network'});assert.match(await held.innerText(),/Your apps · 60%/);assert.match(await held.innerText(),/Held/);assert.doesNotMatch(await held.innerText(),/Code sales/);
  await page.getByLabel('Apple fiscal month',{exact:true}).fill('2026-08');
  const button=page.getByRole('button',{name:'Mark Apple payment received for 2026-08'});assert.equal(await button.isEnabled(),false);
  await page.getByRole('checkbox').check();assert.equal(await button.isEnabled(),true);
  const result=page.waitForResponse(r=>r.url().endsWith('/team/api/apple-payment-received'));
  await button.click();assert.equal((await result).status(),200);await page.getByRole('status').filter({hasText:'Awaiting Apple’s final financial report.'}).waitFor();
  await page.screenshot({path:dir+'/monthly-owner-held.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/monthly-owner-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.setViewportSize({width:1280,height:900});
  await button.click();await page.getByRole('status').filter({hasText:'Awaiting Apple’s final financial report.'}).waitFor();
  const partner=await browser.newContext();await partner.addCookies([{name:'team-session',value:'monthly-partner-token',url:base}]);
  assert.equal((await partner.request.post(base+'/team/api/apple-payment-received',{headers:{origin:base},data:{month:'2026-08',received:true}})).status(),403);
  assert.equal((await partner.request.get(base+'/team/affiliates')).status(),404);
  const anonymous=await browser.newContext();assert.equal((await anonymous.request.post(base+'/team/api/apple-payment-received',{headers:{origin:base},data:{month:'2026-08',received:true}})).status(),401);
  assert.equal((await owner.request.post(base+'/team/api/apple-payment-received',{headers:{origin:'https://evil.test'},data:{month:'2026-08',received:true}})).status(),403);
  const state=(await db.query("select (select count(*)::int from appstore_monthly_runs) receipts,(select count(*)::int from appstore_payouts) legacy_transfers,(select count(*)::int from appstore_monthly_runs where status='paid') monthly_paid")).rows[0];
  assert.deepEqual(state,{...before,receipts:before.receipts+(receiptExists?0:1)});assert.deepEqual(errors,[]);
  writeFileSync(dir+'/monthly-browser.json',JSON.stringify({passed:true,localSynthetic:true,ownerPage:true,bothRuleLabels:true,blakesShare:true,bankReceiptRequired:true,financeHold:true,duplicateReceiptIdempotent:true,partnerRejected:true,anonymousRejected:true,crossOriginRejected:true,noTransfer:true,consoleErrors:0},null,2));
  console.log(JSON.stringify({monthlyOwnerFlow:'passed',noTransfers:true}));
}finally{console.log('Closing local browser');await browser.close();console.log('Local browser closed');await db.end();console.log('Local database connections closed');}
