import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:net';import {join} from 'node:path';import {createHash} from 'node:crypto';import {Pool} from 'pg';import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
async function main(){
const root='/Volumes/KoiArchive/WO-0267';const dir=mkdtempSync(root+'/tmp/browser-db-');const evidence=join(root,'site/reports/WO-0267/browser-'+Date.now());mkdirSync(evidence,{recursive:true});
async function port(){const server=createServer();await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const p=(server.address() as {port:number}).port;await new Promise<void>(r=>server.close(()=>r()));return p;}
const dbport=await port(),webport=await port();execFileSync('initdb',['-D',dir,'-A','trust','--no-locale','-E','UTF8'],{stdio:'ignore'});execFileSync('pg_ctl',['-D',dir,'-l',join(dir,'log'),'-o',`-F -p ${dbport} -h 127.0.0.1 -k ${dir}`,'-w','start'],{stdio:'ignore'});
const database=new Pool({host:'127.0.0.1',port:dbport,database:'postgres'});let server:ReturnType<typeof spawn>|undefined;
try {
 for(const f of ['001_crm_leads.sql','002_crm_proposals.sql','006_stripe_payments.sql','010_team_portal.sql','012_team_password.sql'])await database.query(readFileSync('db/'+f,'utf8'));
 await database.query("insert into team_partners(id,name,email,role,password_prompt_dismissed) values ('fixture-owner','FICTIONAL Owner','owner@example.test','owner',true),('fixture-partner','FICTIONAL Partner','partner@example.test','partner',true)");
 for(const actor of ['owner','partner'])await database.query("insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '1 hour')",[createHash('sha256').update('fictional-'+actor).digest('hex'),'fixture-'+actor]);
 const audit=JSON.parse(readFileSync(root+'/leadgen/reports/WO-0267/smoke/cert-final2.json','utf8'));
 const result={...audit,duration_ms:0,notes:[{name:'Meta description',detail:'FICTIONAL note only'}],findings:audit.findings.map((f:Record<string,unknown>)=>({...f,name:f.check,status:'review',detail:f.measurement}))};
 assert.equal(result.findings[0].confidence,'confirmed');
 await database.query('insert into team_site_checks(id,partner_id,data) values($1,$2,$3)',['public-cert','fixture-owner',result]);
 await database.query("insert into team_leads(id,partner_id,business,website,data) values('fictional-lead','fixture-partner','FICTIONAL SALON','https://example.test',$1)",[{contact:'',phone:'',email:'',channel:'Online',notes:'Old unverified opener',recheck:{status:'re-check failed',checked_at:new Date().toISOString(),confirmed_count:0}}]);
 const env={...process.env,DATABASE_URL:`postgresql://127.0.0.1:${dbport}/postgres`,TMPDIR:root+'/tmp',VERCEL_ENV:'development',PORT:String(webport),RESEND_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_CONNECT_ENABLED:'false'};
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(webport)],{env,stdio:'ignore'});
 const origin=`http://127.0.0.1:${webport}`;for(let n=0;n<60;n++){try{if((await fetch(origin+'/team')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const browser=await chromium.launch({headless:true,channel:'chromium'});const checks=[];
 try{
  const anon=await browser.newContext();assert.equal((await anon.request.get(origin+'/team/proof/public-cert/0')).status(),401);await anon.close();checks.push('proof denies anonymous');
  const owner=await browser.newContext({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});await owner.addCookies([{name:'team-session',value:'fictional-owner',url:origin}]);const page=await owner.newPage();
  await page.goto(origin+'/team/check');await page.getByRole('heading',{name:'What’s broken'}).waitFor();assert.equal(await page.getByAltText('Screenshot evidence: HTTPS failure').count(),1);await page.getByAltText('Screenshot evidence: HTTPS failure').scrollIntoViewIfNeeded();await page.getByAltText('Screenshot evidence: HTTPS failure').evaluate((img:HTMLImageElement)=>img.decode());await page.screenshot({path:join(evidence,'check-desktop.png')});
  const proof=await owner.request.get(origin+'/team/proof/public-cert/0');assert.equal(proof.status(),200);assert.equal(proof.headers()['content-type'],'image/jpeg');checks.push('confirmed inline proof');
  await page.getByRole('button',{name:'Copy findings'}).click();const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(copied.includes('HTTPS failure'));assert.ok(!copied.includes('FICTIONAL note'));checks.push('copy includes confirmed only');
  await page.setViewportSize({width:390,height:844});await page.getByAltText('Screenshot evidence: HTTPS failure').scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,'check-mobile.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('390px layout');
  await page.goto(origin+'/team/admin');assert.ok((await page.locator('body').innerText()).includes('1 re-check failed'));checks.push('owner failed count');await page.screenshot({path:join(evidence,'owner-failed.png'),fullPage:true});
  await page.goto(origin+'/team/leads');assert.ok((await page.locator('body').innerText()).includes('Re-check failed'));assert.ok(!(await page.locator('body').innerText()).includes('Old unverified opener'));checks.push('stale opener hidden');
  const partner=await browser.newContext();await partner.addCookies([{name:'team-session',value:'fictional-partner',url:origin}]);assert.equal((await partner.request.get(origin+'/team/proof/public-cert/0')).status(),404);checks.push('proof scoped to partner');await partner.close();
  await page.goto(origin+'/team/check');await page.getByLabel('Website URL').fill('https://example.com/');const response=page.waitForResponse(r=>r.url().endsWith('/team/api/check'));await page.getByRole('button',{name:'Run site check'}).click();assert.equal((await response).status(),200);
  const stored=(await database.query("select data from team_site_checks where data->>'url'='https://example.com/'")).rows[0]?.data;assert.ok(stored?.version);assert.ok(!stored.findings.some((f:{confidence:string})=>f.confidence==='confirmed'));checks.push('UI to real browser checker to database');await owner.close();
 }finally{await browser.close();}
 writeFileSync(join(evidence,'results.json'),JSON.stringify({passed:checks},null,2));console.log(JSON.stringify({passed:checks,evidence}));
}finally{server?.kill('SIGTERM');await database.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'});}

}
main().catch(()=>{console.error('Browser verification failed; fixture evidence retained.');process.exitCode=1;});
