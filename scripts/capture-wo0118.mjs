import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.WO0118_BASE_URL || 'http://127.0.0.1:3118';
const output = 'Evidence/WO-0118/release-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const checks = [];
try {
 for (const colorScheme of ['light', 'dark']) {
  for (const [device, width, height] of [['desktop',1440,1000],['phone',390,844]]) {
   const context = await browser.newContext({ viewport:{width,height}, colorScheme, reducedMotion:'reduce', deviceScaleFactor:1 });
   const page = await context.newPage();
   for (const [name, route] of [['work-with-us','/work-with-us?src=chamber'],['audit','/audit?src=chamber'],['home','/']]) {
    const response = await page.goto(base+route, {waitUntil:'networkidle'});
    assert.equal(response.status(),200,route);
    await page.evaluate(()=>document.fonts.ready);
    // Load lazy product screens and the founder portrait before full-page captures.
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = "eager";
      for (let y=0; y<document.documentElement.scrollHeight; y+=600) {
        window.scrollTo(0,y); await new Promise(resolve=>setTimeout(resolve,80));
      }
      await Promise.race([Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))), new Promise(resolve=>setTimeout(resolve,5000))]);
      window.scrollTo(0,0);
    });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`${name} ${device} overflow`);
    if (name !== 'home') {
     const links = await page.getByRole('link',{name:'Book a Revenue Leak Audit',exact:true}).evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
     assert.ok(links.length);
     for (const href of links) { const url=new URL(href,base);assert.equal(url.pathname,'/start');assert.equal(url.searchParams.get('src'),'chamber');assert.equal(url.searchParams.get('offer'),'audit'); }
     assert.equal(await page.getByRole('link',{name:'Pay $250',exact:true}).count(),0);
     assert.doesNotMatch(await page.locator('body').innerText(),/gmail\.com|refund|credited toward/i);
    }
    await page.screenshot({path:`${output}/${name}-${device}-${colorScheme}.png`,fullPage:true});
    checks.push({route,device,colorScheme,status:response.status(),overflow:false});
   }
   await context.close();
  }
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base+'/audit?src=chamber');
 await page.getByRole('link',{name:'Book a Revenue Leak Audit',exact:true}).first().click();
 await page.getByLabel('Company',{exact:true}).fill('Synthetic Business');
 await page.getByLabel('Your role').fill('Owner');
 await page.getByLabel('The problem in one line').fill('Quotes wait too long for a follow-up.');
 await page.getByLabel('Email',{exact:true}).fill('synthetic@example.com');
 await page.getByLabel('Name',{exact:true}).fill('Synthetic Person');
 let body='';
 await page.route('**/api/intake', async route=>{body=route.request().postData()||'';await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
 await page.getByRole('button',{name:'Request an audit',exact:true}).click();
 await page.getByRole('heading',{name:'Got it.',exact:true}).waitFor();
 for(const value of ['chamber','audit','$250 audit','Synthetic Business','Owner']) assert.ok(body.includes(value),value);
 checks.push({test:'QR → audit intake → intercepted synthetic submission',passed:true,networkWrite:false});
 await page.goto(base+'/start?src=referral%2Bfriend&offer=readiness');
 await page.getByLabel('What are we building?').waitFor();
 assert.equal(await page.getByLabel('Company',{exact:true}).count(),0);
 checks.push({test:'Founder readiness branch remains reachable',passed:true});
 await page.goto(base+'/crm/quick-add');
 await page.waitForURL('**/crm/login**');
 checks.push({test:'Private quick add redirects anonymous browser to login',passed:true});
 await writeFile(`${output}/browser-checks.json`,JSON.stringify(checks,null,2));
 await context.close();
} finally { await browser.close(); }
