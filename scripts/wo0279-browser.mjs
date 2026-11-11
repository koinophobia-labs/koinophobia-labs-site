// Synthetic loopback-only acceptance; no production credentials or outbound requests.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {Pool} from 'pg';
import {chromium} from 'playwright';
const base=new URL(process.env.WO0279_BROWSER_BASE_URL),dburl=new URL(process.env.WO0279_BROWSER_DATABASE);
assert.equal(base.hostname,'127.0.0.1');assert.equal(dburl.hostname,'127.0.0.1');assert.equal(dburl.pathname,'/wo0279_fixture');
const root=mkdtempSync('/Volumes/KoiArchive/WO-0279/evidence/browser-');
const db=new Pool({connectionString:dburl.href});const hash=x=>createHash('sha256').update(x).digest('hex');
const measurement='Three fresh Chromium loads: median LCP 5275 ms; median load 9882 ms. Thresholds: LCP >4000 ms or load >8000 ms. Lab measurements, not field Core Web Vitals.';
const plain="Your site's main content takes about 5 seconds to appear (Google calls under 2.5 seconds good). People on phones may leave while they wait.";
const checks=[],errors=[];let browser;
try{
 for(const name of ['001_crm_leads','002_crm_proposals','006_stripe_payments','010_team_portal','011_team_connect','012_team_password','014_team_call'])await db.query(readFileSync('db/'+name+'.sql','utf8'));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 await context.route('**/*',r=>new URL(r.request().url()).origin===base.origin?r.continue():r.abort());
 const picture=await context.newPage();await picture.setContent('<main style="padding:40px;font:32px system-ui"><h1>FICTIONAL WEBSITE</h1><p>Synthetic speed finding — no client data.</p></main>');
 const bytes=await picture.screenshot({type:'jpeg'});await picture.close();
 const at=new Date().toISOString(),before=new Date(Date.now()-700000).toISOString();
 const proof={url:'https://fictional.example/',captured_at:at,viewport:{width:1440,height:1100},image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:hash(bytes)};
 const observation={check:'Slow page',key:'lcp',url:proof.url,measurement,proof,measured_at:at,run_id:'wo0279-b'};
 const finding={...observation,confidence:'confirmed',observations:[{...observation,measured_at:before,run_id:'wo0279-a',proof:{...proof,captured_at:before}},observation]};
 await db.query("insert into team_partners(id,name,email,role,password_prompt_dismissed) values('plain-partner','Fictional Partner','plain@example.test','partner',true)");
 await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,'plain-partner',now()+interval '1 hour')",[hash('fictional-wo0279-session')]);
 await db.query("insert into team_leads(id,partner_id,business,phone,website,data) values('plain-lead','plain-partner','FICTIONAL — Slow Site','3125550100',$1,$2)",[proof.url,{contact:'Fictional Owner',time_zone:'America/Chicago',evidence:[finding]}]);
 await db.query("insert into team_deals(id,partner_id,lead_id,services,price,approved,scope,stage) values('plain-deal','plain-partner','plain-lead','[\"fix\"]',29900,true,'FICTIONAL scope','Quote sent')");
 await db.query("insert into team_active_leads(partner_id,lead_id) values('plain-partner','plain-lead')");
 await db.query("insert into team_deal_pages(code,deal_id,problem,proof_image,proof_at,proof_reviewed_by,is_demo) values('pqrs234567','plain-deal',$1,$2,$3,'plain-partner',true)",[measurement,proof.image,at]);
 const original=JSON.stringify((await db.query("select data from team_leads where id='plain-lead'")).rows[0].data);
 await context.addCookies([{name:'team-session',value:'fictional-wo0279-session',url:base.origin}]);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const assertFinding=async section=>{
   await section.locator('.team-plain-finding').waitFor();assert.equal(await section.locator('.team-plain-finding').first().innerText(),plain);
   assert.ok(Number(await section.locator('.team-plain-finding').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)))>=19);
   const detail=section.locator('details').filter({has:page.getByText('Technical details',{exact:true})}).first();
   assert.equal(await detail.getAttribute('open'),null);assert.ok(!(await section.innerText()).includes('median LCP'));
   await detail.locator('summary').click();assert.ok((await detail.innerText()).includes(measurement));await detail.locator('summary').click();
 };
 for(const width of [1440,390]){
   await page.setViewportSize({width,height:width===390?844:1100});
   await page.goto(base.origin+'/team/leads');const brief=page.locator('.team-lead-detail');await assertFinding(brief);
   await brief.scrollIntoViewIfNeeded();await brief.screenshot({path:`${root}/lead-brief-crop-${width}.png`});await page.screenshot({path:`${root}/lead-brief-${width}.png`,fullPage:true});checks.push(`lead brief ${width}: plain first, large, measurement collapsed`);
   await page.goto(base.origin+'/team/call');const region=page.getByRole('region',{name:'Strongest confirmed finding'});await assertFinding(region);
   const sms=await page.getByRole('link',{name:'Text link',exact:true}).getAttribute('href');assert.ok(decodeURIComponent(sms).includes(plain));assert.doesNotMatch(decodeURIComponent(sms),/median LCP/);assert.match(await region.innerText(),/Say it like this/);assert.match(await region.innerText(),/about 5 seconds for the main content/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:`${root}/call-panel-${width}.png`,fullPage:true});checks.push(`call ${width}: spoken line, no overflow`);
 }
 await page.goto(base.origin+'/team/scripts');await page.getByRole('button',{name:'Slow site',exact:true}).click();
 assert.match(await page.locator('.team-script-body').innerText(),/about 5 seconds/);assert.match(await page.locator('.team-script-body').innerText(),/exact price before you decide/);
 await page.getByRole('button',{name:'Voicemail',exact:true}).click();const vm=await page.locator('.team-script-body').innerText();assert.match(vm,/We can fix it fast\. I'll text you/);assert.doesNotMatch(vm,/once Blake confirms scope|median LCP/);checks.push('scripts render and substitute selected measurement');
 await page.goto(base.origin+'/go/pqrs234567');await assertFinding(page.locator('.team-inset'));assert.equal(await page.locator('a[href^="/pay/"]').count(),0);await page.screenshot({path:`${root}/deal-mobile.png`,fullPage:true});checks.push('public fixture same line, payment disabled, details preserved');
 assert.equal(JSON.stringify((await db.query("select data from team_leads where id='plain-lead'")).rows[0].data),original);checks.push('lead evidence unchanged by display reads');assert.deepEqual(errors,[]);
 writeFileSync(root+'/results.json',JSON.stringify({passed:true,checks,pageErrors:errors,synthetic:true},null,2));console.log(JSON.stringify({passed:checks.length,evidence:root}));
} catch(e){writeFileSync(root+'/failure.json',JSON.stringify({error:String(e),checks,pageErrors:errors},null,2));throw e;}
finally{await browser?.close();await db.end();}
