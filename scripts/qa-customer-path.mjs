import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3100';
const output=path.resolve(process.env.QA_OUTPUT||'artifacts/customer-path');await fs.mkdir(output,{recursive:true});
const browser=process.env.QA_CDP?await chromium.connectOverCDP(process.env.QA_CDP):await chromium.launch({channel:'chrome',headless:true});
const report={paths:[],screenshots:[],inquiry:'',errors:[]};
const entries=[{slug:'trendi',story:'trendi',id:'6776299336',link:'Explore Trendi'},{slug:'forget-about-it',story:'forget-about-it',id:'6804360983',link:'Explore Forget About It'},{slug:'way-in',story:'career-forge',id:'6807942376',link:'Explore Way In & the web app'}];
for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
 const c=await browser.newContext({viewport,reducedMotion:'reduce'});
 // Real host rewrites and cross-domain links, served only in this browser from the local build.
 // Analytics is blocked in this regression pass; separately labeled QA delivery has its own receipts.
 await c.route(/^https:\/\/(koinophobialabs\.com|koinophobia\.dev)\//,async route=>{
  const q=route.request(),u=new URL(q.url());
  if(u.pathname.startsWith('/_vercel/insights/'))return route.fulfill({status:204,body:''});
  const response=await c.request.fetch(base+u.pathname+u.search,{headers:{...q.headers(),host:u.hostname},method:q.method(),data:q.postDataBuffer(),maxRedirects:0});return route.fulfill({response});
 });
 const p=await c.newPage();p.setDefaultTimeout(20000);p.setDefaultNavigationTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));
 const ready=async()=>{await p.locator('.brand-intro').waitFor({state:'detached'});await p.evaluate(()=>document.fonts.ready);};
 const snap=async name=>{const f=`${name}-${size}.png`;await p.waitForFunction(()=>[...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0).every(i=>i.complete&&i.naturalWidth>0));if(await p.locator('video[preload=metadata]').count())await p.waitForFunction(()=>document.querySelector('video').readyState>=1);await p.screenshot({path:path.join(output,f)});report.screenshots.push(f);};
 for(const e of entries){console.log(size,e.slug);
  await p.goto('https://koinophobialabs.com/products');await ready();
  await p.getByRole('link',{name:e.link,exact:true}).click();await p.waitForURL('https://koinophobialabs.com/'+e.slug);await ready();
  assert.equal(new URL(p.url()).pathname,'/'+e.slug);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,e.slug+' horizontal overflow');
  await snap(e.slug);
  const download=p.getByRole('link',{name:'Download on the App Store'}).first();await p.keyboard.press('Tab');await download.focus();
  assert.equal(await download.evaluate(el=>el===document.activeElement&&getComputedStyle(el).outlineStyle!=='none'),true);
  await download.press('Enter',{noWaitAfter:true});await p.waitForURL(/apps\.apple\.com/,{waitUntil:'domcontentloaded'});assert.ok(p.url().includes(e.id));
  report.paths.push({size,path:`Labs products → ${e.slug} → App Store ${e.id}`,result:'pass'});
  console.log('store verified',p.url());await p.goto('https://koinophobia.dev/products');await ready();
  await p.locator(`a[href="/products/${e.story}"]`).first().click();await p.waitForURL('https://koinophobia.dev/products/'+e.story);await ready();
  const appPage=p.locator(`a[href="https://koinophobialabs.com/${e.slug}"]`).first();assert.ok(await appPage.isVisible());
  const pop=await Promise.all([p.waitForEvent('popup'),appPage.click()]);await pop[0].waitForLoadState();assert.equal(new URL(pop[0].url()).pathname,'/'+e.slug);await pop[0].close();
  report.paths.push({size,path:`Founder products → ${e.story} story → ${e.slug} page`,result:'pass'});
 }
 await p.goto('https://koinophobialabs.com/trendi');await ready();
 await p.locator('.trendiPage_screens').scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.trendiPage_screens img')].every(i=>i.complete&&i.naturalWidth>0));
 await p.locator('.trendiPage_archiveDemo summary').click();await p.locator('video').scrollIntoViewIfNeeded();await p.locator('video').evaluate(v=>v.play());await p.waitForFunction(()=>document.querySelector('video').currentTime>1);await p.locator('video').evaluate(v=>v.pause());
 for(const slug of ['trendi','forget-about-it'])for(const help of ['support','privacy']){await p.goto(`https://koinophobialabs.com/${slug}/${help}`);await ready();assert.equal(await p.locator('.legal-back').getAttribute('href'),'/'+slug);report.paths.push({size,path:`${slug} → ${help} → product back link`,result:'pass'});}
 await p.goto('https://koinophobialabs.com/forget-about-it');await ready();await p.locator('video').scrollIntoViewIfNeeded();await p.locator('video').evaluate(v=>v.play());await p.waitForFunction(()=>document.querySelector('video').currentTime>1);assert.equal(await p.locator('video').evaluate(v=>v.muted),false);await p.locator('video').evaluate(v=>v.pause());
 report.paths.push({size,path:'Trendi dated demo and Forget About It commercial: play, time advances, pause',result:'pass'});
 await p.goto('https://koinophobialabs.com/#products');await ready();await p.locator('#products .dest__inner').scrollIntoViewIfNeeded();await snap('labs-products');assert.equal(await p.locator('.kw__node').count(),5);assert.equal(await p.evaluate(()=>[...document.querySelectorAll('.dest')].slice(0,-1).every(el=>el.getBoundingClientRect().bottom<=el.nextElementSibling.getBoundingClientRect().top+1)),true,'reduced-motion chapters must not overlap');report.paths.push({size,path:'Koi product chapter: five cards, no section overlap in reduced motion',result:'pass'});
 await p.goto('https://koinophobia.dev/');await ready();await snap('founder-home');assert.ok((await p.locator('body').innerText()).includes('Forget About It'));
 await p.goto('https://koinophobialabs.com/services');await ready();await p.getByRole('link',{name:'Start With an Audit',exact:true}).first().click();await p.waitForURL('https://koinophobialabs.com/audit');await ready();assert.equal(new URL(p.url()).pathname,'/audit');
 await p.goto('https://koinophobialabs.com/intake');await ready();await p.getByRole('button',{name:'Submit intake'}).click();assert.equal(await p.locator('input[name="name"]').evaluate(el=>el.validity.valueMissing),true);
 for(const [name,value] of Object.entries({name:'Website QA',businessName:'QA fixture',email:'qa@example.com',websiteOrSocial:'https://example.com',industry:'Testing',biggestProblem:'A synthetic website inquiry used only for browser verification.',desiredOutcome:'Verify the existing form can be completed without writing a lead.'}))await p.locator(`[name="${name}"]`).fill(value);
 for(const select of await p.locator('select[required]').all()){const options=await select.locator('option').evaluateAll(els=>els.map(e=>e.value).filter(Boolean));await select.selectOption(options[0]);}
 // UI success and failure states are contract-tested with fixture responses; no message or production lead is sent.
 await p.route('**/api/intake',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,message:'QA fixture: service unavailable',mailto:'mailto:koinophobia999@gmail.com'})}));await p.getByRole('button',{name:'Submit intake'}).click();await p.locator('.error-state').waitFor();await p.getByRole('link',{name:'Open email fallback'}).waitFor();assert.ok(await p.getByRole('link',{name:'Open email fallback'}).isVisible());await p.locator('.error-state').scrollIntoViewIfNeeded();await snap('inquiry-fallback');
 await p.route('**/api/intake',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,message:'QA fixture: no lead was created.'})}));await p.getByRole('button',{name:'Submit intake'}).click();await p.locator('.success-state').waitFor();
 report.paths.push({size,path:'Services → audit; inquiry required-field validation, recoverable failure and success UI',result:'pass',boundary:'Fixture API responses; actual server route behavior covered by repository tests. No production submission.'});
 await c.close();
}
report.inquiry='No production lead, email, payment, or app data was created.';assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(output,'visitor-paths.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({paths:report.paths.length,screenshots:report.screenshots.length,errors:report.errors}));await browser.close();
