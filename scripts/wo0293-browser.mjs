// Fictional loopback acceptance. Never run against a hosted database or site.
import {chromium} from 'playwright';
import {Pool} from 'pg';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
const base=process.env.WO0293_BASE, evidence=process.env.WO0293_EVIDENCE;
assert.equal(new URL(base).hostname,'127.0.0.1');
assert.equal(new URL(process.env.DATABASE_URL).hostname,'127.0.0.1');
const db=new Pool({connectionString:process.env.DATABASE_URL});
const hash=s=>createHash('sha256').update(s).digest('hex');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  for(const f of ['011_team_connect.sql','020_appstore_affiliates.sql','021_appstore_monthly.sql','023_affiliate_portal.sql'])await db.query(readFileSync('db/'+f,'utf8'));
  for(const id of ['affiliate-a','affiliate-b']){
    await db.query("insert into team_partners(id,name,email,role) values($1,$2,$3,'affiliate')",[id,id==='affiliate-a'?'Demo Affiliate · fake data':'Other fictional affiliate',id+'@example.test']);
    await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 day')",[hash('fictional-'+id),id]);
  }
  await db.query("update appstore_affiliates set partner_id='affiliate-a' where id='messiah'; insert into appstore_affiliates(id,display_name,partner_id) values('other-fixture','Other fictional affiliate','affiliate-b')");
  const add=async(id,app,cents,date,paid=false,refund=false)=>{
    const own=id!=='other-secret';
    await db.query("insert into appstore_transactions(transaction_id,original_id,app,environment,product_id,purchase_ms,affiliate_id,revoked,verified_at) values($1,$2,$3,'Production','monthly',$4,$5,$6,$7)",[id,'original-private-'+id,app,Date.parse(date),own?'messiah':'other-fixture',refund,new Date('2026-11-12T15:00:00Z')]);
    await db.query("insert into appstore_commissions(transaction_id,affiliate_id,usd_cents,calculation,revoked) values($1,$2,$3,'{}',$4)",[id,own?'messiah':'other-fixture',cents,refund]);
    if(paid)await db.query("insert into appstore_payouts(transaction_id,operation_key,destination,usd_cents,withheld_cents,status) values($1,$2,'acct_fictional', $3,0,'done')",[id,'fake-paid-'+id,cents]);
  };
  await add('trendi-earned','trendi',620,'2026-11-11T12:00:00Z');
  await add('old-dog-paid','old-dog',450,'2026-11-10T12:00:00Z',true);
  await add('teachers-refunded','teachers-pet',1250,'2026-11-09T12:00:00Z',true,true);
  await add('other-secret','trendi',99000,'2026-11-12T12:00:00Z');
  await db.query("insert into appstore_financial_reports(report_hash,fiscal_month,source,row_count) values('fake-month','2026-11','fictional report',1)");
  await db.query("insert into appstore_adjustments(transaction_id,report_hash,fiscal_month,usd_cents,previous_cents,final_cents,calculation,basis,sources,created_at) values('old-dog-paid','fake-month','2026-11',-80,450,370,'{}','trued_up_financial_report','[]','2026-11-12T14:00:00Z')");
  await db.query("insert into appstore_financial_matches(transaction_id,fiscal_month,report_hash,group_key,sources) values('trendi-earned','2026-11','fake-month','fictional','[]')");
  await db.query("insert into appstore_financial_matches(transaction_id,fiscal_month,report_hash,group_key,sources) values('old-dog-paid','2026-11','fake-month','fictional','[]')");
  await db.query("insert into appstore_monthly_runs(fiscal_month,received_by,operation_key) values('2026-11','owner','fake-monthly')");
  await db.query("insert into appstore_monthly_authorizations(fiscal_month,report_hash,transaction_id,authorized_cents,confirmed_by) values('2026-11','fake-month','old-dog-paid',370,'owner')");
  const desktop=await browser.newContext({viewport:{width:1440,height:1050},permissions:['clipboard-read','clipboard-write']});
  const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  for(const c of [desktop,phone]){
    await c.addCookies([{name:'team-session',value:'fictional-affiliate-a',url:base}]);
    await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  }
  const page=await desktop.newPage(),mobile=await phone.newPage(),errors=[],apiStatuses=[];
  for(const p of [page,mobile]){
    p.on('pageerror',e=>errors.push(e.message));
    p.on('response',r=>{if(r.url().includes('/team/api/'))apiStatuses.push(r.status());});
    await p.goto(base+'/team');await p.waitForURL(base+'/team/affiliate');
    await p.getByRole('heading',{name:'Demo Affiliate · fake data, your share.'}).waitFor();
    assert.equal(await p.getByRole('link',{name:/leads|pipeline|call mode|scripts/i}).count(),0);
    for(const status of ["Earned (awaiting Apple's payment)",'Paid','Adjusted (monthly true-up)','Refunded'])assert.ok(await p.getByText(status,{exact:true}).count());
    assert.ok(await p.getByRole('heading',{name:'Owed back',exact:true}).count());
    assert.equal(await p.locator('body').evaluate(el=>el.scrollWidth<=window.innerWidth),true);
    assert.doesNotMatch(await p.locator('main').innerText(),/other-secret|Other fictional|original-private|\$990\.00/);
  }
  await page.screenshot({path:evidence+'/affiliate-desktop.png',fullPage:true});
  await mobile.screenshot({path:evidence+'/affiliate-phone.png',fullPage:true});
  const deniedRoutes=['leads','call','check','quote','pipeline','commissions','scripts','admin','account','affiliates','jobs/fake','proof/fake/0','lead-proof/fake/0','api/call-state','api/call-proof?lead=lead-0'];
  for(const route of deniedRoutes)assert.equal((await desktop.request.get(base+'/team/'+route)).status(),404,route);
  const actions=['prepare-call','active-lead','call-cell','call-outcome','call-offer','deal-page','check','recheck-import','quote','deal','payout','invite','import','optout','settings','deactivate','connect-retry','connect-refresh','commission'];
  for(const action of actions)assert.equal((await desktop.request.post(base+'/team/api/'+action,{headers:{origin:base},data:{id:'lead-0',partner_id:'affiliate-b',affiliate_id:'other-fixture'}})).status(),404,action);
  assert.equal((await desktop.request.post(base+'/team/api/jobs',{headers:{origin:base},data:{id:'guessed',action:'deliver'}})).status(),403);
  const own=await desktop.request.get(base+'/team/api/affiliate?affiliate_id=other-fixture&partner_id=affiliate-b');assert.equal(own.status(),200);
  const data=await own.json();assert.equal(data.earned,990);assert.equal(data.owedBack,1330);assert.equal(data.links.length,7);
  assert.doesNotMatch(JSON.stringify(data),/original-private|other-secret|transaction_id|affiliate-b|stripe_account_id|email/);
  // Recovery plus a fictional bank receipt permits future earnings to offset debt.
  // Verify the requested fiscal-month payout headline as a separate real page state.
  await db.query("insert into appstore_reversals(transaction_id,payout_key,operation_key,transfer_id,usd_cents,status) values('teachers-refunded','fake-paid-teachers-refunded','fake-refund-recovery','tr_fictional_refund',1000,'done')");
  // Before the receipt, future provisional earnings must not conceal $3.30 debt.
  const beforeReceipt=await (await desktop.request.get(base+'/team/api/affiliate')).json();assert.equal(beforeReceipt.owedBack,330);
  await db.query("insert into appstore_monthly_authorizations(fiscal_month,report_hash,transaction_id,authorized_cents,confirmed_by) values('2026-11','fake-month','trendi-earned',620,'owner')");
  for(const p of [page,mobile]){
    await p.reload();await p.getByRole('heading',{name:'after Apple pays for November 2026',exact:true}).waitFor();
    assert.equal(await p.getByRole('heading',{name:'Owed back',exact:true}).count(),0);
  }
  const recovered=await (await desktop.request.get(base+'/team/api/affiliate')).json();
  assert.equal(recovered.owed,290);assert.equal(recovered.owedBack,0);assert.equal(recovered.nextFiscalMonth,'2026-11');
  await page.screenshot({path:evidence+'/affiliate-desktop-payout.png',fullPage:true});
  await mobile.screenshot({path:evidence+'/affiliate-phone-payout.png',fullPage:true});
  // Both real sign-in branches must land on the affiliate page, including the
  // one-use link that the authorized invitation will use in production.
  const auth=await browser.newContext();
  await db.query("update team_partners set password_hash=(select password_hash from team_partners where id='demo-a') where id='affiliate-a'");
  const passwordLogin=await auth.request.post(base+'/team/api/login',{headers:{origin:base},data:{email:'affiliate-a@example.test',password:'fake-portal-test-password'}});
  assert.equal(passwordLogin.status(),200);assert.equal((await passwordLogin.json()).next,'/team/affiliate');
  const magicToken='fictional-wo0293-one-use-link';
  await db.query("insert into team_login_tokens(token_hash,partner_id,expires_at) values($1,'affiliate-a',now()+interval '15 minutes')",[hash(magicToken)]);
  const magicLogin=await auth.request.post(base+'/team/api/consume',{headers:{origin:base},data:{token:magicToken}});
  assert.equal(magicLogin.status(),200);assert.equal((await magicLogin.json()).next,'/team/affiliate');
  assert.equal((await auth.request.post(base+'/team/api/consume',{headers:{origin:base},data:{token:magicToken}})).status(),401);
  await auth.close();
  await page.bringToFront();
  await page.getByRole('button',{name:'Copy Trendi: Content Coach redemption link'}).click();
  assert.equal(await page.evaluate(()=>Promise.race([navigator.clipboard.readText(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Clipboard read timed out')),3000))])),data.links[0].url);
  let onboardingCalls=0;
  await page.route('**/team/api/connect-onboard',async r=>{onboardingCalls++;assert.deepEqual(r.request().postDataJSON(),{});await new Promise(resolve=>setTimeout(resolve,250));await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({url:'https://connect.stripe.com/setup/fictional'})});});
  await page.route('https://connect.stripe.com/**',r=>r.fulfill({status:200,body:'Fictional Stripe destination; no payment or external call.'}));
  await page.getByRole('button',{name:'Connect Stripe to get paid'}).click();
  await page.waitForURL('https://connect.stripe.com/setup/fictional');assert.equal(onboardingCalls,1);
  await page.unroute('**/team/api/connect-onboard');await page.goto(base+'/team/affiliate');
  const idleRequests=[],idleResponses=[];
  await page.waitForLoadState('networkidle');await mobile.waitForLoadState('networkidle');
  for(const p of [page,mobile]){
    p.on('request',r=>idleRequests.push({at:Date.now(),path:new URL(r.url()).pathname}));
    p.on('response',r=>idleResponses.push(r.status()));
  }
  const idleStart=Date.now(),seconds=Number(process.env.WO0293_IDLE_SECONDS||600);
  for(let elapsed=0;elapsed<seconds;elapsed+=30){
    await new Promise(resolve=>setTimeout(resolve,Math.min(30,seconds-elapsed)*1000));
    if((elapsed+30)%60===0)console.log(JSON.stringify({idleSeconds:Math.round((Date.now()-idleStart)/1000),requests:idleRequests.length,http429:idleResponses.filter(s=>s===429).length}));
  }
  assert.equal(idleRequests.length,0,'An idle affiliate page must not generate requests');
  assert.equal(idleResponses.filter(s=>s===429).length,0);assert.deepEqual(errors,[]);
  assert.equal(await page.getByRole('button',{name:'Connect Stripe to get paid'}).isEnabled(),true);
  const result={passed:true,synthetic:true,desktop:true,phone:true,deniedRoutes:deniedRoutes.length,deniedActions:actions.length+1,ownLedgerOnly:true,owedBackAndPositivePayoutStates:true,fiscalMonthHeadline:true,passwordLogin:true,oneUseSignInLink:true,copyVerified:true,onboardingCalls,liveStripeCalls:0,idleSeconds:Math.round((Date.now()-idleStart)/1000),idleRequests:idleRequests.length,http429:0,consoleErrors:errors.length};
  writeFileSync(evidence+'/affiliate-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await db.end();}
