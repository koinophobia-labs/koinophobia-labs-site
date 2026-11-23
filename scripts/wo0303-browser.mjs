import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.WO0303_BASE||'http://localhost:3033';
const out=process.env.WO0303_EVIDENCE||'/Volumes/KoiArchive/WO-0303/evidence/browser-local';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try{
 for(const [name,device] of [['desktop',{viewport:{width:1440,height:1000}}],['iphone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'}],['android',{viewport:{width:412,height:915},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}]]){
  const context=await browser.newContext(device),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'){const u=new URL(r.url());requests.push({origin:u.origin,path:u.pathname});}});
  await page.goto(base+'/team');
  const response=await context.request.post(base+'/team/api/demo',{data:{role:'partner'},headers:{origin:base}});assert.equal(response.status(),200);
  await page.goto(base+(name==='desktop'?'/team/leads':'/team/call'));
  const panel=page.locator('.call-panel');await panel.getByRole('heading',{name:'Fictional Studio · demo',exact:true}).waitFor();
  const script=panel.locator('details').filter({has:page.locator('summary',{hasText:'Call script'})});if((await script.getAttribute('open'))===null)await script.locator('summary').click();
  assert.match(await panel.innerText(),/Tier A/);assert.match(await panel.innerText(),/Ask them to check:/);assert.match(await panel.innerText(),/refunds you/);
  assert.equal(await panel.getByRole('link',{name:'Text link',exact:true}).count(),0);
  assert.equal(await panel.getByRole('button',{name:'Text link',exact:true}).isDisabled(),true);
  const consent=panel.getByRole('checkbox',{name:/Consent to text: yes/});await consent.check();
  const sms=await panel.getByRole('link',{name:'Text link',exact:true}).getAttribute('href');
  assert.ok(sms.startsWith('sms:+12025550100'+(name==='iphone'?'&':'?')+'body='));
  const body=decodeURIComponent(sms.split('body=')[1]);assert.match(body,/Reply STOP and we won't text again/);assert.ok(body.includes(base+'/go/wo0303demo'));
  assert.equal(await panel.locator('a[href*="pagespeed.web.dev"]').count(),0);
  await consent.uncheck();assert.equal(await panel.getByRole('link',{name:'Text link',exact:true}).count(),0);
  await consent.check();
  await panel.getByRole('combobox',{name:'Current call lead'}).selectOption('wo0303-hold');
  assert.equal(await panel.getByRole('link',{name:'Text link',exact:true}).count(),0);
  assert.equal(await panel.getByRole('link',{name:'Call',exact:true}).count(),0);
  await panel.getByRole('combobox',{name:'Current call lead'}).selectOption('wo0303-break');
  assert.equal(await consent.isChecked(),false);
  assert.equal(await panel.getByRole('link',{name:'Text link',exact:true}).count(),0);
  if(name!=='android'){
   await page.screenshot({path:out+'/'+name+'-call-mode.png',fullPage:true});
   const hold=page.getByRole('region',{name:'Speed only, not a call',exact:true});await hold.waitFor();await hold.screenshot({path:out+'/'+name+'-hold.png'});
  }
  await page.goto(base+'/go/wo0303demo');
  assert.match(await page.locator('main').innerText(),/What a visitor saw when tapping 'Book Now'/);assert.match(await page.locator('main').innerText(),/What fixed means/);assert.match(await page.locator('main').innerText(),/refunds you/);
  assert.ok(await page.getByRole('button',{name:'Preview · payments disabled'}).isDisabled());
  await page.locator('img.deal-proof').waitFor();assert.ok(await page.locator('img.deal-proof').evaluate(e=>e.complete&&e.naturalWidth>0));
  if(name!=='android')await page.screenshot({path:out+'/'+name+'-deal-page.png',fullPage:true});
  assert.deepEqual(errors,[]);
  // Vercel's injected preview toolbar validates its own session; permit only that
  // observed platform request, and fail on every application or other POST.
  assert.ok(requests.every(r=>r.origin==='https://vercel.live'&&r.path==='/login/validate'),JSON.stringify(requests));
  results.push({device:name,consentGate:true,stopLine:true,delimiter:name==='iphone'?'&':'?',dealPage:true,noSends:true,consoleErrors:errors.length,platformAuthPosts:requests.length});await context.close();
 }
 writeFileSync(out+'/results.json',JSON.stringify({base,results,physicalDevice:false,at:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:true,results,out}));
}finally{await browser.close();}
