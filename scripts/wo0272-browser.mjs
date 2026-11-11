/**
 * WO-0272 fictional local acceptance harness. No payments, sends, or live audits.
 * Run from the site worktree after building and starting the app against the SAME
 * dedicated PostgreSQL database. Required environment:
 * WO0272_BROWSER_BASE_URL=http://127.0.0.1:<app-port>
 * WO0272_BROWSER_DATABASE=postgresql://127.0.0.1:<db-port>/wo0272_fixture
 * Server: DATABASE_URL=<same>, VERCEL_ENV=development, RESEND_API_KEY='',
 * STRIPE_SECRET_KEY='', STRIPE_CONNECT_ENABLED=false. Do not load production env.
 * node scripts/wo0272-browser.mjs
 * Optional WO0272_CHROME executable; otherwise Playwright's installed Chromium.
 * The harness applies additive schema migrations, uses unique fixture IDs, and
 * preserves its fictional DB rows and evidence. It never starts/stops a server.
 */
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {Pool} from 'pg';
import {chromium} from 'playwright';

const root='/Volumes/KoiArchive/WO-0272';
const run='wo0272-'+randomUUID().slice(0,8);
const evidence=join(root,'evidence','browser-'+run);
const base=new URL(process.env.WO0272_BROWSER_BASE_URL || 'http://invalid.invalid');
const databaseURL=new URL(process.env.WO0272_BROWSER_DATABASE || 'postgresql://invalid.invalid/invalid');
assert.equal(base.protocol,'http:','Local HTTP app URL required');
assert.ok(['127.0.0.1','localhost'].includes(base.hostname),'Only loopback app URLs are allowed');
assert.ok(base.port && base.pathname==='/' && !base.search && !base.hash && !base.username && !base.password);
assert.ok(['postgres:','postgresql:'].includes(databaseURL.protocol));
assert.ok(['127.0.0.1','localhost'].includes(databaseURL.hostname),'Only loopback PostgreSQL is allowed');
assert.match(databaseURL.pathname,/^\/wo0272_fixture(?:_[a-z0-9_]+)?$/,'A dedicated wo0272_fixture database is required');
assert.equal(databaseURL.search,'','Database URL options are not accepted');
const origin=base.origin;
mkdirSync(evidence,{recursive:true});
process.env.TMPDIR=join(root,'tmp');mkdirSync(process.env.TMPDIR,{recursive:true});
const db=new Pool({connectionString:databaseURL.href,max:2});
const checks=[],errors=[];
let browser;
const ids={owner:run+'-owner',partner:run+'-partner',stranger:run+'-stranger',lead:run+'-lead',deal:run+'-deal'};
const website=`https://${run}.example.test/`;
const hash=b=>createHash('sha256').update(b).digest('hex');
const initial=Date.now()-30_000;
const at=offset=>new Date(initial+offset).toISOString();
const preserved={notes:'FICTIONAL unrelated notes retained',channel:'Online',time_zone:'America/Chicago',city:'FICTIONAL CITY',custom_fixture:{nested:['keep',27]},attribution:{source:'fictional-local-only'}};
async function responseJSON(response,status=200){assert.equal(response.status(),status,'Unexpected local API status');return response.json();}
async function post(context,action,data,status=200){return responseJSON(await context.request.post(`${origin}/team/api/${action}`,{headers:{origin},data,maxRedirects:0}),status);}
async function storedLead(){return (await db.query('select data from team_leads where id=$1',[ids.lead])).rows[0].data;}
async function assertPreserved(){const data=await storedLead();for(const [k,v]of Object.entries(preserved))assert.deepEqual(data[k],v,`Unrelated ${k} changed`);}
function audit(findings,offset,label){return {version:'2.1.0',run_id:run+'-'+label,url:website,final_url:website,measured_at:at(offset),findings,observations:findings.flatMap(f=>f.observations),notes:[{name:'FICTIONAL nonqualifying note',detail:'Do not promote this note.'}],samples:[]};}
async function context(actor){
  const c=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  // No external browser traffic; verification links are inspected, never followed.
  await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort('blockedbyclient'));
  if(actor)await c.addCookies([{name:'team-session',value:run+'-token-'+actor,url:origin}]);
  return c;
}
async function picture(label,color){
  const c=await browser.newContext({viewport:{width:600,height:400}});
  await c.route('**/*',r=>r.abort('blockedbyclient'));
  const p=await c.newPage();
  await p.setContent(`<main style="padding:35px;font:24px system-ui;background:${color}"><h1>FICTIONAL LOCAL FIXTURE</h1><p>${label}</p><p>No real prospect data.</p></main>`);
  const bytes=await p.screenshot({type:'jpeg',quality:75,path:join(evidence,label+'.jpg')});await c.close();return bytes;
}
function finding(check,key,measurement,impact,bytes,offset=0){
  const url=website+(check.startsWith('Dead')?'booking':'');
  const proof=t=>({url,captured_at:t,viewport:{width:600,height:400},image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:hash(bytes)});
  const previous={run_id:run+'-before-'+key,check,key,url,measurement,impact,verify_url:url,measured_at:at(offset-660_000),proof:proof(at(offset-660_000))};
  const current={...previous,run_id:run+'-after-'+key,measured_at:at(offset),proof:proof(at(offset))};
  return {...current,confidence:'confirmed',observations:[previous,current]};
}
async function proofEquals(c,path,bytes){const r=await c.request.get(origin+path,{maxRedirects:0});assert.equal(r.status(),200);assert.equal(r.headers()['content-type'],'image/jpeg');assert.match(r.headers()['cache-control'],/no-store/);assert.equal(hash(await r.body()),hash(bytes));}

try{
  // The database name and loopback restriction above are mandatory, not opt-outs.
  const identity=await db.query('select current_database() name');assert.match(identity.rows[0].name,/^wo0272_fixture(?:_[a-z0-9_]+)?$/);
  for(const file of ['001_crm_leads.sql','002_crm_proposals.sql','006_stripe_payments.sql','010_team_portal.sql','011_team_connect.sql','012_team_password.sql','014_team_call.sql'])await db.query(readFileSync(resolve('db',file),'utf8'));
  for(const actor of ['owner','partner','stranger']){
    await db.query('insert into team_partners(id,name,email,role,password_prompt_dismissed) values($1,$2,$3,$4,true)',[ids[actor],'FICTIONAL '+actor,`${ids[actor]}@example.test`,actor==='owner'?'owner':'partner']);
    await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 hour')",[hash(run+'-token-'+actor),ids[actor]]);
  }
  await db.query('insert into team_leads(id,partner_id,business,website,data) values($1,$2,$3,$4,$5)',[ids.lead,ids.partner,'FICTIONAL WO-0272 ACCEPTANCE',website,preserved]);
  await db.query("insert into team_deals(id,partner_id,lead_id,services,price,approved,scope,stage) values($1,$2,$3,'[\"fix\"]',29900,true,'FICTIONAL local quote only','Quote sent')",[ids.deal,ids.partner,ids.lead]);
  browser=await chromium.launch({headless:true,...(process.env.WO0272_CHROME?{executablePath:process.env.WO0272_CHROME}:{})});
  const strongBytes=await picture('strong-booking-proof','#fee'),weakBytes=await picture('secondary-layout-proof','#eef'),replacementBytes=await picture('later-proof','#efe');
  const strong=finding('Dead contact / booking / order link','booking-404','FICTIONAL booking route returns HTTP 404.','FICTIONAL visitors cannot finish the published booking route.',strongBytes);
  const weak=finding('Mobile layout','overflow','FICTIONAL content extends beyond the tested viewport.','FICTIONAL visitors must scroll horizontally.',weakBytes);
  const unverified={...strong,key:'unverified',measurement:'FICTIONAL UNVERIFIED MUST NOT DISPLAY',confidence:"couldn't verify",observations:[strong.observations[1]]};
  const first=audit([weak,unverified,strong],0,'first');
  const owner=await context('owner'),partner=await context('partner'),stranger=await context('stranger'),anon=await context();
  await post(partner,'recheck-import',{id:ids.lead,audit:first},403);
  const imported=await post(owner,'recheck-import',{id:ids.lead,audit:first});assert.equal(imported.updated,1);assert.equal(imported.confirmed,true);
  await assertPreserved();let data=await storedLead();assert.deepEqual(data.evidence.map(f=>f.check),[strong.check,weak.check]);assert.equal(data.recheck.confirmed_count,2);assert.ok(data.opener.startsWith(strong.measurement));assert.ok(data.opener.includes(strong.impact));assert.ok(data.opener.includes(strong.verify_url));
  checks.push('owner import preserves unrelated fields; confirmed ranking drives opener');
  const replay=await post(owner,'recheck-import',{id:ids.lead,audit:first});assert.equal(replay.replayed,true);
  assert.equal((await db.query("select count(*)::int n from team_site_checks where data->>'run_id'=$1",[first.run_id])).rows[0].n,1);
  await post(owner,'recheck-import',{id:ids.lead,audit:{...first,run_id:run+'-wrong-site',url:'https://different.example.test/'}},400);
  checks.push('replay is idempotent; website mismatch rejected; partner import denied');
  const leadProof=`/team/lead-proof/${ids.lead}/0`;
  assert.equal((await anon.request.get(origin+leadProof)).status(),401);assert.equal((await stranger.request.get(origin+leadProof)).status(),404);
  await proofEquals(partner,leadProof,strongBytes);await proofEquals(partner,`/team/lead-proof/${ids.lead}/1`,weakBytes);assert.equal((await partner.request.get(`${origin}/team/lead-proof/${ids.lead}/2`)).status(),404);
  checks.push('ranked lead proof bytes match; anonymous/cross-partner access denied');
  const page=await partner.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/team/leads');
  await page.locator('.team-lead-row').filter({hasText:'FICTIONAL WO-0272 ACCEPTANCE'}).click();
  const brief=page.locator('.team-lead-detail');await brief.getByText('STRONGEST CONFIRMED FINDING',{exact:true}).waitFor();
  assert.deepEqual(await brief.locator('.team-inset > div > strong').allTextContents(),[strong.check+':',weak.check+':']);
  const text=await brief.innerText();assert.ok(text.includes(strong.impact)&&text.includes(weak.impact));assert.ok(!text.includes(unverified.measurement));
  assert.deepEqual(await brief.getByRole('link',{name:'Check it yourself ↗'}).evaluateAll(links=>links.map(a=>a.href)),[strong.verify_url,weak.verify_url]);
  for(const img of await brief.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());}
  await page.screenshot({path:join(evidence,'ranked-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await brief.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(evidence,'ranked-mobile.png'),fullPage:true});
  checks.push('browser renders confirmed order, impact, verification links, decoded proof, mobile layout');
  await post(partner,'active-lead',{id:ids.lead});
  const state=await responseJSON(await partner.request.get(`${origin}/team/api/call-state?lead=${ids.lead}`));assert.equal(state.problem,strong.measurement);assert.equal(state.impact,strong.impact);assert.equal(state.verify_url,strong.verify_url);assert.equal(state.proof_available,true);
  assert.ok(state.page?.code);assert.equal((await anon.request.get(`${origin}/go/${state.page.code}/proof`)).status(),404);
  await page.goto(origin+'/team/call');
  const callFinding=page.getByRole('region',{name:'Strongest confirmed finding'});
  await callFinding.locator('img').evaluate(e=>e.decode());assert.ok((await callFinding.innerText()).includes(strong.impact));
  await page.screenshot({path:join(evidence,'call-strongest-mobile.png'),fullPage:true});
  checks.push('merged call preparation keeps public proof private while displaying strongest private proof');
  await proofEquals(partner,`/team/api/call-proof?lead=${ids.lead}`,strongBytes);
  const published=await post(partner,'deal-page',{id:ids.deal,proofReviewed:true});assert.match(published.code,/^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/);
  const code=published.code;assert.equal(code,state.page.code);const snapshot=(await db.query('select problem,proof_image from team_deal_pages where code=$1',[code])).rows[0];assert.equal(snapshot.problem,strong.measurement);assert.equal(hash(Buffer.from(snapshot.proof_image.split(',')[1],'base64')),hash(strongBytes));
  data=await storedLead();assert.deepEqual(data.deal_proof[code],{impact:strong.impact,verify_url:strong.verify_url,proof_sha256:hash(strongBytes)});
  const client=await anon.newPage();client.on('pageerror',e=>errors.push(e.message));await client.goto(`${origin}/go/${code}`);await client.locator('.deal-proof').evaluate(e=>e.decode());
  assert.ok((await client.locator('body').innerText()).includes(strong.impact));assert.equal(await client.getByRole('link',{name:'Check it yourself ↗'}).getAttribute('href'),strong.verify_url);await proofEquals(anon,`/go/${code}/proof`,strongBytes);
  await client.screenshot({path:join(evidence,'deal-snapshot.png'),fullPage:true});
  checks.push('call and deal use strongest proof; deal metadata bound to screenshot hash');
  const newer=finding('Mobile layout','new-overflow','FICTIONAL later measurement differs.','FICTIONAL later impact differs.',replacementBytes,10_000);
  await post(owner,'recheck-import',{id:ids.lead,audit:audit([newer],10_000,'newer')});await assertPreserved();await proofEquals(partner,leadProof,replacementBytes);
  await client.reload();const laterBody=await client.locator('body').innerText();assert.ok(laterBody.includes(strong.measurement)&&laterBody.includes(strong.impact));assert.ok(!laterBody.includes(newer.measurement)&&!laterBody.includes(newer.impact));await proofEquals(anon,`/go/${code}/proof`,strongBytes);
  await post(owner,'recheck-import',{id:ids.lead,audit:{...first,run_id:run+'-stale'}},409);
  checks.push('later audit changes current proof but preserves deal snapshot; stale import rejected');
  // Corrupt only fictional metadata to prove that unmatched claims are withheld.
  await db.query("update team_leads set data=jsonb_set(data,$2::text[],to_jsonb($3::text)) where id=$1",[ids.lead,['deal_proof',code,'proof_sha256'],'0'.repeat(64)]);
  await client.reload();assert.equal(await client.getByRole('link',{name:'Check it yourself ↗'}).count(),0);assert.ok(!(await client.locator('body').innerText()).includes(strong.impact));await proofEquals(anon,`/go/${code}/proof`,strongBytes);
  checks.push('mismatched snapshot hash hides impact and verification metadata');
  await post(owner,'recheck-import',{id:ids.lead,audit:audit([],20_000,'failed')});await assertPreserved();data=await storedLead();assert.equal(data.recheck.status,'re-check failed');assert.equal(data.recheck.confirmed_count,0);assert.equal(data.evidence[0].measurement,newer.measurement,'Historic evidence must remain retained');
  for(const path of [leadProof,`/team/api/call-proof?lead=${ids.lead}`,`/go/${code}/proof`])assert.equal((await partner.request.get(origin+path)).status(),404);
  const failedState=await responseJSON(await partner.request.get(`${origin}/team/api/call-state?lead=${ids.lead}`));assert.equal(failedState.problem,null);assert.equal(failedState.impact,null);assert.equal(failedState.verify_url,null);
  await page.goto(origin+'/team/leads');await page.locator('.team-lead-row').filter({hasText:'FICTIONAL WO-0272 ACCEPTANCE'}).click();await brief.getByText('DON’T CALL — RE-CHECK FAILED',{exact:true}).waitFor();assert.equal(await brief.locator('img').count(),0);assert.ok(!(await brief.innerText()).includes(newer.measurement));await page.screenshot({path:join(evidence,'failed-recheck.png'),fullPage:true});
  await client.reload();await client.getByRole('heading',{name:'This page is no longer available.'}).waitFor();
  checks.push('failed recheck retains raw evidence but hides proof/opener/call claim and deactivates deal');
  const textId=run+'-text-only';
  await db.query('insert into team_leads(id,partner_id,business,website,data) values($1,$2,$3,$4,$5)',[textId,ids.partner,'FICTIONAL TEXT-ONLY MERGE',`https://${textId}.example.test/`,{...preserved,evidence:[{confidence:'confirmed',measurement:'FICTIONAL legacy text-only problem.'}],suggested_offer:{id:'fix',price:29900}}]);
  await post(partner,'active-lead',{id:textId});await page.goto(origin+'/team/call');
  const textFinding=page.getByRole('region',{name:'Strongest confirmed finding'});await textFinding.getByText('FICTIONAL legacy text-only problem.',{exact:true}).waitFor();
  assert.equal(await textFinding.locator('img').count(),0);
  const textState=await responseJSON(await partner.request.get(`${origin}/team/api/call-state?lead=${textId}`));assert.equal(textState.proof_available,false);assert.ok(textState.page?.code);
  await client.goto(`${origin}/go/${textState.page.code}`);assert.equal(await client.locator('.deal-proof').count(),0);assert.equal(await client.getByRole('link',{name:'Check it yourself ↗'}).count(),0);
  await page.screenshot({path:join(evidence,'call-text-only-mobile.png'),fullPage:true});
  checks.push('merged legacy text-only calls and automatic pages contain no broken screenshot or invented proof metadata');
  assert.deepEqual(errors,[]);
  writeFileSync(join(evidence,'results.json'),JSON.stringify({passed:checks,pageErrors:errors,fictionalOnly:true},null,2));
  console.log(JSON.stringify({passed:checks.length,evidence}));
}catch(error){
  writeFileSync(join(evidence,'failure.json'),JSON.stringify({passed:checks,error:String(error),pageErrors:errors,fictionalOnly:true},null,2));
  console.error('WO-0272 fictional browser acceptance failed; retained evidence: '+evidence);process.exitCode=1;
}finally{await browser?.close();await db.end();}
