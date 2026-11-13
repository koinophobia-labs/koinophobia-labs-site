// Fictional local acceptance only. No real accounts, external requests or sends.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {Pool} from 'pg';
import {chromium} from 'playwright';
import axe from 'axe-core';
const base=new URL(process.env.WO0285_BASE),database=new URL(process.env.WO0285_DATABASE);
assert.equal(base.hostname,'127.0.0.1');assert.equal(database.hostname,'127.0.0.1');assert.equal(database.pathname,'/wo0285_fixture');
const dir=mkdtempSync((process.env.WO0285_ROOT || '/Volumes/KoiArchive/WO-0285')+'/evidence/call-browser-'),db=new Pool({connectionString:database.href});
const hash=s=>createHash('sha256').update(s).digest('hex'),checks=[],errors=[];let browser;
try{
 for(const name of ['001_crm_leads','002_crm_proposals','006_stripe_payments','010_team_portal','011_team_connect','012_team_password','014_team_call','015_team_fulfillment'])await db.query(readFileSync('db/'+name+'.sql','utf8'));
 for(const id of ['fixture-a','fixture-b']){
  await db.query("insert into team_partners(id,name,email,role,password_prompt_dismissed) values($1,'Fictional Partner',$2,'partner',true)",[id,id+'@example.test']);
  await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 hour')",[hash(id),id]);
 }
 const zones=['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix'];
 const names=['Juniper Workshop','Paper Moon Salon','Mountain Studio','Pacific Workshop','Desert Studio'];
 for(let i=0;i<10;i++){
  const data={time_zone:zones[i%5],vertical:i===0?'restaurant':'salon',contact:'Fictional owner'};
  if(i===2||i===3)data.business_hours={source_url:'https://example.test/hours',checked_at:'2026-11-01T12:00:00Z',weekly:[{day:3,open:540,close:1140}]};
  if(i===7)data.recheck={status:'re-check failed',confirmed_count:0,checked_at:'2026-11-11T10:00:00Z'};
  if(i===8)data.call_outcome="Don't call";
  await db.query('insert into team_leads(id,partner_id,business,phone,website,data) values($1,$2,$3,$4,$5,$6)',['call-'+i,i===9?'fixture-b':'fixture-a',(i<5?names[i]:i===5?'Contact Form Studio':'HIDDEN RECORD '+i)+' · FICTIONAL',i===5?'':`202555${String(100+i).padStart(4,'0')}`,`https://fictional-${i}.example.test`,data]);
 }
 await db.query("insert into team_opt_outs(key,recorded_by) values('phone:2025550106','fixture-a')");
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 for(const [label,width,path]of [['desktop',1440,'/team/leads'],['phone',390,'/team/call']]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1100},isMobile:width===390,hasTouch:width===390,timezoneId:'America/New_York'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base.origin?r.continue():r.abort());
  await context.addCookies([{name:'team-session',value:'fixture-a',url:base.origin}]);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const [hour,stamp,header]of [['8am','2026-11-11T13:00:00Z',/8:00 AM your time: Nobody’s open now/],['8pm','2026-11-12T01:00:00Z',/8:00 PM your time: 2 MT, PT businesses open now/]]){
   await page.clock.setFixedTime(new Date(stamp));await page.goto(base.origin+path);
   const queue=page.getByRole('region',{name:'Call now queue'});await queue.waitFor();assert.match(await queue.innerText(),header);
   assert.equal(await page.getByText(/HIDDEN RECORD/).count(),0);assert.equal(await page.getByRole('region',{name:'Email & form only · email on hold'}).count(),0);assert.equal(await page.getByText('Contact Form Studio',{exact:false}).count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await queue.screenshot({path:dir+'/'+label+'-'+hour+'.png'});
   await page.addScriptTag({content:axe.source});const a=await page.evaluate(()=>window.axe.run('.call-queue'));assert.deepEqual(a.violations.map(v=>({id:v.id,impact:v.impact})),[]);
   checks.push(label+' '+hour+' local-time grouping, hidden-lead exclusion, phone-only visibility, no overflow and accessibility');
  }
  await context.close();
 }
 const context=await browser.newContext({timezoneId:'America/New_York'});await context.route('**/*',r=>new URL(r.request().url()).origin===base.origin?r.continue():r.abort());await context.addCookies([{name:'team-session',value:'fixture-a',url:base.origin}]);const page=await context.newPage();
 await page.goto(base.origin+'/team');await page.waitForURL('**/team/leads');
 await page.goto(base.origin+'/team/account');await page.getByLabel('Your time zone',{exact:true}).selectOption('America/Los_Angeles');await page.getByRole('button',{name:'Save time zone'}).click();await page.getByText('Time zone saved for your account.').waitFor();
 assert.equal((await db.query("select value from team_settings where key='partner-time-zone:fixture-a'")).rows[0].value,'America/Los_Angeles');
 await page.goto(base.origin+'/team/call');await page.getByText('Your time zone: America/Los Angeles',{exact:false}).waitFor();
 const b=await browser.newContext();await b.addCookies([{name:'team-session',value:'fixture-b',url:base.origin}]);
 assert.equal((await b.request.post(base.origin+'/team/api/time-zone',{headers:{origin:base.origin},data:{timeZone:'invalid',partner_id:'fixture-a'}})).status(),400);
 assert.equal((await page.request.post(base.origin+'/team/api/time-zone',{headers:{origin:'https://foreign.example'},data:{timeZone:'America/Chicago'}})).status(),403);
 assert.equal((await db.query("select count(*) n from team_settings where key='partner-time-zone:fixture-b'")).rows[0].n,'0');
 checks.push('default partner landing, persistent account override on phone, invalid zone and foreign-origin rejection, account isolation');
 assert.deepEqual(errors,[]);writeFileSync(dir+'/results.json',JSON.stringify({passed:true,checks,pageErrors:errors,synthetic:true},null,2));console.log(JSON.stringify({passed:checks.length,evidence:dir}));
}catch(e){writeFileSync(dir+'/failure.json',JSON.stringify({error:String(e),checks,pageErrors:errors},null,2));throw e;}
finally{await browser?.close();await db.end();}
