import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {Pool} from 'pg';
import {chromium} from 'playwright';
const out=process.env.WO0276_EVIDENCE || '/Volumes/KoiArchive/WO-0276/evidence';
const base=process.env.WO0276_BASE || 'http://localhost:3276';
const fixtureFile=out+'/browser-fixture.json';
const fakeToken='wo0276-isolated-fake-session';
const save=(n,v)=>fs.writeFileSync(out+'/'+n+'.json',JSON.stringify(v,null,2)+'\n');
if(process.argv[2]==='seed'){
 const dir=fs.mkdtempSync('/Volumes/KoiArchive/WO-0276/tmp/browser-postgres-');
 const net=createServer();await new Promise(r=>net.listen(0,'127.0.0.1',r));const port=net.address().port;await new Promise(r=>net.close(r));
 execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});
 execFileSync('pg_ctl',['-D',dir,'-l',dir+'/server.log','-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
 const db=new Pool({host:'127.0.0.1',port,database:'postgres'});
 try{
 for(const f of ['001_crm_leads.sql','002_crm_proposals.sql','006_stripe_payments.sql','010_team_portal.sql','012_team_password.sql','014_team_call.sql'])await db.query(fs.readFileSync('db/'+f,'utf8'));
 await db.query("insert into team_partners(id,name,email,role,password_prompt_dismissed) values('wo0276-fake','Fake Partner','fake@example.test','partner',true)");
 const proof={confidence:'confirmed',measurement:'The FAKE booking link returns a missing page.',proof:{image:'data:image/png;base64,YQ==',captured_at:new Date().toISOString()}};
 for(const id of ['fix','tune','failed'])await db.query('insert into team_leads(id,partner_id,business,website,phone,data) values($1,$2,$3,$4,$5,$6)',[id,'wo0276-fake','WO-0276 '+id+' · FAKE','https://'+id+'.example.test','2025550100',{contact:'',notes:'Synthetic only',channel:'Test',city:'Fictional City',time_zone:'America/Chicago',evidence:[proof],suggested_offer:{id:id==='tune'?'tune':'fix',price:id==='tune'?75000:29900},...(id==='failed'?{recheck:{status:'re-check failed'}}:{})}]);
 await db.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,'wo0276-fake',now()+interval '2 hours')",[createHash('sha256').update(fakeToken).digest('hex')]);
 save('browser-fixture',{dir,port,synthetic:true});console.log('Isolated fake browser database ready.');
 }finally{await db.end()}
}else{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const fixture=JSON.parse(fs.readFileSync(fixtureFile));
 const db=new Pool({host:'127.0.0.1',port:fixture.port,database:'postgres'});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const errors=[];const checks=[];const run=Date.now().toString(36);
 for(const offer of ['fix','tune']){await db.query("insert into team_leads(id,partner_id,business,website,phone,data) select $1,partner_id,business,$2,phone,data from team_leads where id=$3",[offer+'-'+run,'https://'+offer+'-'+run+'.example.test',offer]);}
 try{
 for(const [platform,ua] of [['ios','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'],['android','Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36']]){
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua});
 await c.addCookies([{name:'team-session',value:fakeToken,url:base,httpOnly:true,sameSite:'Lax'}]);
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/team/call');
 await p.getByLabel('Current call lead').selectOption((platform==='ios'?'fix':'tune')+'-'+run);
 const text=p.getByRole('link',{name:'Text link',exact:true});await text.waitFor();
 await p.waitForFunction(delimiter=>document.querySelector('a[href^="sms:"]')?.getAttribute('href')?.startsWith('sms:'+delimiter+'body='),platform==='ios'?'&':'?');
 assert.match(decodeURIComponent(await text.getAttribute('href')),platform==='ios'?/\$299/:/\$750/);
 assert.equal(await p.getByLabel('Current call lead').locator('option[value=failed]').count(),0);
 await p.getByRole('button',{name:'Care Plan · $99/mo',exact:true}).click();
 await p.waitForFunction(()=>decodeURIComponent(document.querySelector('a[href^="sms:"]')?.getAttribute('href')||'').includes('$99/month'));
 await p.getByLabel('Client’s cell',{exact:true}).fill('2025550188');await p.getByRole('button',{name:'Save cell',exact:true}).click();
 await p.waitForFunction(delimiter=>document.querySelector('a[href^="sms:"]')?.getAttribute('href')?.startsWith('sms:+12025550188'+delimiter+'body='),platform==='ios'?'&':'?');
 const link=await p.locator('.call-link a').getAttribute('href');const code=link.split('/').pop();
 assert.equal(await p.getByLabel('Client’s cell',{exact:true}).count(),1);
 await p.screenshot({path:out+'/call-'+platform+'.png',fullPage:true});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const client=await c.newPage();await client.goto(base+'/go/'+code);
 assert.match(await client.locator('body').innerText(),/Care Plan · \$99/);
 assert.match(await client.locator('meta[name=robots]').getAttribute('content'),/noindex/);
 assert.equal(await client.locator('.deal-proof').count(),0);
 assert.equal((await c.request.get(base+'/go/'+code+'/proof')).status(),404);
 assert.ok(await client.locator('a[href^="/pay/care?"]').count());
 await client.screenshot({path:out+'/deal-'+platform+'.png',fullPage:true});
 await p.reload();await text.waitFor();assert.equal(await p.locator('.call-link a').getAttribute('href'),link);
 checks.push({platform,emptyRecipient:true,savedCell:true,switchOffer:true,stablePage:true,privateProof:true});await c.close();
 }
 assert.deepEqual(errors,[]);
 assert.equal((await db.query("select count(*)::int n from team_deals where lead_id='failed'")).rows[0].n,0);
 save('browser-verification',{passed:true,checks,pageErrors:errors,realAccountLogins:0,sends:0,stripeCalls:0});console.log('PASS iOS/Android links, auto pages, offer switches, persistence, private proof, no sends.');
 }finally{await browser.close();await db.end()}
}
