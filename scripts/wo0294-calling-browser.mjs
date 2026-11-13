import {chromium} from 'playwright';
import {Pool} from 'pg';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const base=process.env.WO0288_BASE, database=process.env.DATABASE_URL;
const realtime=process.env.WO0288_REALTIME==='1', started=Date.now();
assert.equal(new URL(base).hostname,'127.0.0.1');assert.equal(new URL(database).hostname,'127.0.0.1');
const db=new Pool({connectionString:database});
const browser=await chromium.launch({executablePath:'/Volumes/KoiArchive/WO-0267/cache/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const hash=s=>createHash('sha256').update(s).digest('hex');
try{
 const partner='fixture-call-lockout';
 await db.query("insert into team_partners(id,name,email,role) values($1,'Fictional caller','fixture-call@example.test','partner')",[partner]);
 for(let i=0;i<46;i++)await db.query("insert into team_leads(id,partner_id,business,website,phone,data) values($1,$2,$3,$4,'3125550100',$5)",['fixture-'+i,partner,'Fictional lead '+i,'https://fixture-'+i+'.example.test',{contact:'',notes:'',channel:'Synthetic',time_zone:'America/Chicago',suggested_offer:{id:'fix',price:29900},evidence:[{confidence:'confirmed',measurement:'Confirmed missing booking link.'}]}]);
 await db.query(`create function fixture_prepare_failure() returns trigger as $$ begin
 if exists(select 1 from team_deals where id=new.deal_id and lead_id in ('fixture-5','fixture-25')) then raise exception 'Synthetic preparation failure'; end if; return new; end; $$ language plpgsql;
 create trigger fixture_prepare_failure before insert on team_deal_pages for each row execute function fixture_prepare_failure();`);
 const token='wo0288-fictional-session';
 await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 day')",[hash(token),partner]);
 const context=await browser.newContext();await context.addCookies([{name:'team-session',value:token,url:base}]);
 const page=await context.newPage(),errors=[],statuses=[],preparations=new Map();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/team/api/'))statuses.push(r.status())});
 page.on('request',r=>{if(r.url().endsWith('/prepare-call')){const id=r.postDataJSON().id;preparations.set(id,(preparations.get(id)||0)+1)}});
 await page.clock.install({time:Date.now()});
 await page.goto(base+'/team/call');
 const select=page.getByLabel('Current call lead');
 async function choose(i){const response=page.waitForResponse(r=>r.url().endsWith('/active-lead'));const prep=page.waitForResponse(r=>r.url().endsWith('/prepare-call')&&r.request().postDataJSON().id==='fixture-'+i);await select.selectOption('fixture-'+i);assert.equal((await response).status(),200);await page.getByRole('heading',{name:'Fictional lead '+i,exact:true}).waitFor();await prep;await select.waitFor({state:'visible'});assert.ok(await select.isEnabled());}
 let seconds=0;
 async function tick(){const response=page.waitForResponse(r=>r.url().endsWith('/call-state'));if(realtime)await new Promise(r=>setTimeout(r,1500));else await page.clock.runFor(1500);assert.equal((await response).status(),200);seconds+=1.5;if(realtime && seconds%60===0)console.log(JSON.stringify({callingSeconds:seconds,wallSeconds:Math.round((Date.now()-started)/1000),calling429s:statuses.filter(x=>x===429).length}));assert.equal(await page.getByText('RECONNECTING',{exact:true}).count(),0);}
 for(let i=0;i<44;i++){
  await choose(i);
  if([5,25].includes(i)){
   await page.getByText("Payment link isn't available for this lead.",{exact:true}).waitFor();
   for(let n=0;n<88;n++)await tick();
   assert.equal(preparations.get('fixture-'+i),2);
  }else{await tick();await tick();}
  const outcome=page.waitForResponse(r=>r.url().endsWith('/call-outcome'));
  await page.getByRole('button',{name:'No answer',exact:true}).click();assert.equal((await outcome).status(),200);
 }
 assert.ok(seconds>=300);assert.equal(statuses.filter(x=>x===429).length,0);assert.deepEqual(errors,[]);
 const before=(await db.query('select count(*)::int n from team_rate_limits where key=$1',[hash('action:'+partner)])).rows[0].n;
 for(const action of ['removed-action','earnings-celebration'])for(let i=0;i<120;i++)assert.equal((await page.request.post(base+'/team/api/'+action,{headers:{origin:base},data:{}})).status(),404);
 assert.equal((await db.query('select count(*)::int n from team_rate_limits where key=$1',[hash('action:'+partner)])).rows[0].n,before);
 // Exhaust only the unrelated action bucket. Navigation and outcomes remain live.
 await db.query("insert into team_rate_limits(key,attempts,reset_at) values($1,600,now()+interval '37 seconds') on conflict(key) do update set attempts=600,reset_at=excluded.reset_at",[hash('action:'+partner)]);
 const attemptsBefore=(await db.query('select attempts from team_rate_limits where key=$1',[hash('action:'+partner)])).rows[0].attempts;
 for(const action of ['removed-action','earnings-celebration'])assert.equal((await page.request.post(base+'/team/api/'+action,{headers:{origin:base},data:{}})).status(),404);
 assert.equal((await db.query('select attempts from team_rate_limits where key=$1',[hash('action:'+partner)])).rows[0].attempts,attemptsBefore);
 await page.getByLabel('Client’s cell').fill('3125550188');
 const limited=page.waitForResponse(r=>r.url().endsWith('/call-cell'));await page.getByRole('button',{name:'Save cell',exact:true}).click();const r=await limited;assert.equal(r.status(),429);assert.ok(Number(r.headers()['retry-after'])>0);
 await page.getByText(/Slow down for a moment\. Try again in \d+ seconds\./).waitFor();
 await choose(44);
 const outcome=page.waitForResponse(r=>r.url().endsWith('/call-outcome'));await page.getByRole('button',{name:'Voicemail',exact:true}).click();assert.equal((await outcome).status(),200);
 await db.query("insert into team_rate_limits(key,attempts,reset_at) values($1,300,now()+interval '15 minutes') on conflict(key) do update set attempts=300,reset_at=excluded.reset_at",[hash('prepare-call:'+partner)]);
 await choose(45);await page.getByText("Payment link isn't available for this lead.",{exact:true}).waitFor();assert.equal(await page.getByText('RECONNECTING',{exact:true}).count(),0);
 const away=page.waitForResponse(r=>r.url().endsWith('/active-lead'));await select.selectOption('fixture-0');assert.equal((await away).status(),200);
 await page.screenshot({path:process.env.WO0288_EVIDENCE+'/call-mode.png',fullPage:true});
 const result={passed:true,quickLeadSelections:44,simulatedSeconds:realtime?0:seconds,callingSeconds:seconds,wallSeconds:Math.round((Date.now()-started)/1000),realtime,failedPreparationLeads:2,attemptsPerFailedLead:2,calling429s:0,unsupported404s:242,unsupportedBucketWrites:0,stuckReconnecting:0,navigationAfterGeneral429:true,outcomeAfterGeneral429:true,navigationAfterPrepare429:true,consoleErrors:errors.length};
 writeFileSync(process.env.WO0288_EVIDENCE+'/call-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{console.log('Closing local browser');await browser.close();console.log('Local browser closed');await db.end();console.log('Local database connections closed')}
