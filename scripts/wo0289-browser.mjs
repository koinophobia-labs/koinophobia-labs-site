// Fictional loopback-only acceptance; never uses a real account or database.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {Pool} from 'pg';
import {chromium} from 'playwright';
import {snapshot,visibleLead} from '../lib/team/store.ts';
import {callState} from '../lib/team/call-store.ts';
import {partner} from '../lib/team/seed.ts';
import {STAGES} from '../lib/team/types.ts';
const base=process.env.WO0288_BASE, database=process.env.DATABASE_URL;
assert.equal(new URL(base).hostname,'127.0.0.1');assert.equal(new URL(database).hostname,'127.0.0.1');
const db=new Pool({connectionString:database}),a=partner('fixture-visibility','Fictional visibility caller'),owner=partner('owner','Owner','owner');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const hidden=['failed','optout','declined','no-phone','no-zone','bad-zone','lost'].map(x=>'visibility-'+x);
const kept=['visibility-eligible',...STAGES.filter(s=>s!=='Lost').map((_,i)=>'visibility-deal-'+i)];
try {
  await db.query("insert into team_partners(id,name,email,role) values($1,$2,'visibility@example.test','partner')",[a.id,a.name]);
  const make=async(id,extra={},phone='3125550111')=>db.query("insert into team_leads(id,partner_id,business,phone,website,data) values($1,$2,$3,$4,$5,$6)",[id,a.id,'Fictional '+id,phone,'https://'+id+'.example.test',{contact:'',notes:'',channel:'Synthetic',time_zone:'America/Chicago',...extra}]);
  const failed={recheck:{status:'re-check failed',checked_at:new Date().toISOString(),confirmed_count:0}};
  await make('visibility-eligible');await make(hidden[0],failed);await make(hidden[1],{},'3125550199');
  await db.query("insert into team_opt_outs(key,recorded_by) values('phone:3125550199','owner')");
  await make(hidden[2],{call_outcome:'Not interested'});await make(hidden[3],{},'');
  await make(hidden[4],{time_zone:null});await make(hidden[5],{time_zone:'invalid'});await make(hidden[6]);
  const deal=async(id,stage)=>db.query("insert into team_deals(id,lead_id,partner_id,services,price,scope,stage) values($1,$2,$3,'[\"fix\"]',29900,'Synthetic quote',$4)",['deal-'+id,id,a.id,stage]);
  await deal(hidden[6],'Lost');
  let i=0;for(const stage of STAGES.filter(s=>s!=='Lost')){const id='visibility-deal-'+i++;await make(id,failed,stage==='Client paid'?'3125550199':'3125550111');await deal(id,stage);}
  await db.query('insert into team_active_leads(partner_id,lead_id) values($1,$2)',[a.id,hidden[0]]);
  for(const [id,token] of [[a.id,'visibility-partner-session'],['owner','visibility-owner-session']])await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 day')",[createHash('sha256').update(token).digest('hex'),id]);
  // A refunded payment on a lost deal must also remain visible.
  const historyId='visibility-payment-history';await make(historyId,failed);await deal(historyId,'Lost');
  const paid=(await db.query("insert into crm_payments(id,proposal_id,lead_id,kind,status,amount) select gen_random_uuid(),proposal_id,lead_id,kind,'refunded',amount from crm_payments limit 1 returning id")).rows[0];
  assert.ok(paid);await db.query('insert into team_payment_attributions(payment_id,deal_id) values($1,$2)',[paid.id,'deal-'+historyId]);kept.push(historyId);
  const before=(await db.query("select md5(string_agg(row_to_json(l)::text,'' order by id)) digest,count(*)::int n from team_leads l")).rows[0];
  const client=await db.connect();
  try {
    await client.query('begin read only');
    const q={query:(sql,values)=>{assert.match(sql,/^select\b/i);return client.query(sql,values)}};
    const data=await snapshot(q,a),all=await snapshot(q,owner);
    assert.deepEqual(data.leads.map(l=>l.id).sort(),kept.slice().sort());
    assert.equal(data.deals.length,8);assert.equal(all.leads.length,before.n);assert.equal(all.deals.filter(d=>d.partner_id===a.id).length,9);
    for(const id of hidden){await assert.rejects(visibleLead(q,a,id),{status:404});await assert.rejects(callState(q,a,id),{status:404});assert.equal((await visibleLead(q,owner,id)).id,id);}
    assert.equal((await callState(q,a)).lead,null);
    for(const id of kept.slice(1)){const state=await callState(q,a,id);assert.equal(state.lead.id,id);assert.equal(state.lead.recheck.status,'re-check failed');assert.equal(state.problem,null);assert.equal(state.proof_available,false);}
    await client.query('rollback');
  } finally {client.release();}
  const context=await browser.newContext();await context.addCookies([{name:'team-session',value:'visibility-partner-session',url:base}]);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/team/leads');assert.equal(await page.locator('.team-lead-row').count(),kept.length);
  assert.match(await page.getByRole('heading',{name:/Lead desk/}).innerText(),/9/);
  const html=await page.content();for(const id of hidden)assert.ok(!html.includes(id),'hidden identity excluded from HTML and hydration');
  await page.getByLabel('Search leads').fill('visibility-failed');assert.equal(await page.locator('.team-lead-row').count(),0);
  await page.getByLabel('Search leads').fill('visibility-deal');assert.equal(await page.locator('.team-lead-row').count(),7);
  for(const id of hidden)for(const path of ['/team/api/call-state?lead='+id,'/team/api/call-proof?lead='+id,'/team/lead-proof/'+id+'/0'])assert.equal((await context.request.get(base+path)).status(),404);
  await page.getByLabel('Search leads').fill('');
  const desktopInspectionPosts=[];
  const captureInspection=r=>{if(r.method()==='POST' && r.url().includes('/team/api/'))desktopInspectionPosts.push(r.url());};
  page.on('request',captureInspection);
  const inspectDesktop=async id=>{await page.locator('.team-lead-row').filter({hasText:'Fictional '+id}).click();await page.locator('.call-panel h2').filter({hasText:'Fictional '+id}).waitFor();};
  await inspectDesktop('visibility-deal-0');
  await page.getByLabel('Current call lead').selectOption('visibility-deal-1');
  await page.locator('.call-panel h2').filter({hasText:'Fictional visibility-deal-1'}).waitFor();
  await inspectDesktop('visibility-deal-0');
  assert.deepEqual(desktopInspectionPosts,[],'retained desktop selection stays read-only, including repeated queue selections');
  page.off('request',captureInspection);
  await page.goto(base+'/team/pipeline');for(const id of hidden)assert.ok(!(await page.content()).includes(id));
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/team/call');
  assert.equal(await page.getByLabel('Current call lead').locator('option').count(),kept.length+1);
  assert.equal((await (await context.request.get(base+'/team/api/call-state')).json()).lead,null);
  const inspectionPosts=[];page.on('request',r=>{if(r.method()==='POST' && r.url().includes('/team/api/'))inspectionPosts.push(r.url());});
  for(const id of kept.slice(1)){await page.getByLabel('Current call lead').selectOption(id);await page.getByRole('heading',{name:'Fictional '+id,exact:true}).waitFor();assert.equal(await page.getByRole('alert').filter({hasText:'Don’t call — re-check failed.'}).count(),1);assert.equal(await page.locator('a[href^="tel:"]').count(),0);}
  assert.equal(inspectionPosts.length,0);
  await page.screenshot({path:process.env.WO0288_EVIDENCE+'/visibility-phone.png',fullPage:true});
  const own=await browser.newContext();await own.addCookies([{name:'team-session',value:'visibility-owner-session',url:base}]);const op=await own.newPage();
  await op.goto(base+'/team/leads');assert.equal(await op.locator('.team-lead-row').count(),before.n);
  await op.getByLabel('Search leads').fill('visibility-failed');assert.equal(await op.locator('.team-lead-row').count(),1);assert.match(await op.locator('.team-lead-row').innerText(),/Don't call/);
  assert.equal((await own.request.get(base+'/team/api/call-state?lead='+hidden[0])).status(),200);
  const after=(await db.query("select md5(string_agg(row_to_json(l)::text,'' order by id)) digest,count(*)::int n from team_leads l")).rows[0];assert.deepEqual(after,before);assert.deepEqual(errors,[]);
  const result={passed:true,hidden:7,visible:9,retainedInFlight:7,retainedPaymentHistory:1,ownerLeads:before.n,directHiddenReads:21,hiddenRememberedLeadCleared:true,countsCorrect:true,searchIsolated:true,readOnlyQueries:true,leadRowsUnchanged:true,pageErrors:0};
  writeFileSync(process.env.WO0288_EVIDENCE+'/visibility.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();await db.end();}
